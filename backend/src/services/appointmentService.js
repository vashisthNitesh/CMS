const db = require('../database/connection');
const patientService = require('./patientService');
const notificationService = require('./notificationService');

class AppointmentService {
    /**
     * Book a new appointment
     */
    async bookAppointment(appointmentData) {
        const {
            clinic_id, patient_id, doctor_id, slot_id,
            visit_type, reason_for_visit, source, notes, booked_by,
        } = appointmentData;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify and lock the slot
            const slotResult = await client.query(
                'SELECT * FROM appointment_slots WHERE slot_id = $1 AND clinic_id = $2 FOR UPDATE',
                [slot_id, clinic_id]
            );
            if (slotResult.rows.length === 0) throw new Error('Slot not found');
            if (slotResult.rows[0].status !== 'AVAILABLE') throw new Error('Slot is not available');

            const slot = slotResult.rows[0];

            // Check if first visit
            const isFirstVisit = await patientService.isFirstVisit(patient_id, clinic_id);

            // Create appointment
            const result = await client.query(`
        INSERT INTO appointments (
          clinic_id, patient_id, doctor_id, slot_id,
          appointment_date, appointment_time, estimated_end_time,
          visit_type, reason_for_visit, source, is_first_visit,
          status, booked_by, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SCHEDULED',$12,$13)
        RETURNING *
      `, [
                clinic_id, patient_id, doctor_id, slot_id,
                slot.slot_date, slot.slot_start_time, slot.slot_end_time,
                visit_type, reason_for_visit, source || 'WALK_IN', isFirstVisit,
                booked_by, notes,
            ]);

            // Mark slot as booked
            await client.query(
                'UPDATE appointment_slots SET status = \'BOOKED\' WHERE slot_id = $1',
                [slot_id]
            );

            await client.query('COMMIT');

            const appointment = result.rows[0];

            // Queue booking confirmation notification (async, don't block)
            this.queueBookingNotification(appointment).catch(err =>
                console.error('Failed to queue notification:', err)
            );

            return appointment;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Walk-in shortcut: immediately CHECKED_IN
     */
    async walkInAppointment(appointmentData) {
        const appointment = await this.bookAppointment({
            ...appointmentData,
            source: 'WALK_IN',
        });

        // Immediately check in
        return await this.checkIn(appointment.appointment_id, appointment.clinic_id);
    }

    /**
     * Check in a patient
     */
    async checkIn(appointment_id, clinic_id) {
        const result = await db.query(`
      UPDATE appointments
      SET status = 'CHECKED_IN', check_in_time = NOW()
      WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'SCHEDULED'
      RETURNING *
    `, [appointment_id, clinic_id]);

        if (result.rows.length === 0) throw new Error('Appointment not found or already checked in');

        const appointment = result.rows[0];

        // Trigger visit context generation (async)
        this.generateVisitContext(appointment).catch(err =>
            console.error('Failed to generate visit context:', err)
        );

        return appointment;
    }

    /**
     * Start consultation (doctor calls patient)
     */
    async startConsultation(appointment_id, clinic_id) {
        const result = await db.query(`
      UPDATE appointments
      SET status = 'IN_CONSULTATION',
          consultation_start = NOW(),
          actual_start_time = NOW()::TIME,
          wait_time_minutes = EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60
      WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'CHECKED_IN'
      RETURNING *
    `, [appointment_id, clinic_id]);

        if (result.rows.length === 0) throw new Error('Patient not checked in');
        return result.rows[0];
    }

    /**
     * Complete appointment
     */
    async completeAppointment(appointment_id, clinic_id) {
        const result = await db.query(`
      UPDATE appointments
      SET status = 'COMPLETED',
          consultation_end = NOW(),
          actual_end_time = NOW()::TIME
      WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'IN_CONSULTATION'
      RETURNING *
    `, [appointment_id, clinic_id]);

        if (result.rows.length === 0) throw new Error('Appointment not in consultation');

        // Mark slot as COMPLETED
        await db.query(
            'UPDATE appointment_slots SET status = \'COMPLETED\' WHERE slot_id = $1',
            [result.rows[0].slot_id]
        );

        return result.rows[0];
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(appointment_id, clinic_id, cancelData) {
        const { cancellation_reason, cancellation_type, cancelled_by, notify_patient } = cancelData;

        const result = await db.query(`
      UPDATE appointments
      SET status = $3,
          cancelled_at = NOW(),
          cancelled_by = $4,
          cancellation_reason = $5,
          cancellation_type = $3
      WHERE appointment_id = $1 AND clinic_id = $2
        AND status NOT IN ('COMPLETED','CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC','CANCELLED_BY_SYSTEM')
      RETURNING *
    `, [appointment_id, clinic_id, cancellation_type || 'CANCELLED_BY_PATIENT', cancelled_by, cancellation_reason]);

        if (result.rows.length === 0) throw new Error('Cannot cancel this appointment');

        // Release the slot
        await db.query(
            'UPDATE appointment_slots SET status = \'AVAILABLE\' WHERE slot_id = $1',
            [result.rows[0].slot_id]
        );

        // Send cancellation notification
        if (notify_patient !== false) {
            this.queueCancellationNotification(result.rows[0]).catch(err =>
                console.error('Failed to queue cancellation notification:', err)
            );
        }

        return result.rows[0];
    }

    /**
     * Reschedule appointment
     */
    async rescheduleAppointment(appointment_id, clinic_id, rescheduleData) {
        const { new_slot_id, rescheduled_reason, updated_by } = rescheduleData;

        // Get old appointment
        const oldAppt = await db.query(
            'SELECT * FROM appointments WHERE appointment_id = $1 AND clinic_id = $2',
            [appointment_id, clinic_id]
        );
        if (oldAppt.rows.length === 0) throw new Error('Appointment not found');

        const old = oldAppt.rows[0];
        if (old.rescheduled_count >= 3) throw new Error('Maximum reschedules (3) reached');
        if (['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'CANCELLED_BY_SYSTEM'].includes(old.status)) {
            throw new Error('Cannot reschedule this appointment');
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify new slot
            const newSlot = await client.query(
                'SELECT * FROM appointment_slots WHERE slot_id = $1 AND clinic_id = $2 FOR UPDATE',
                [new_slot_id, clinic_id]
            );
            if (newSlot.rows.length === 0) throw new Error('New slot not found');
            if (newSlot.rows[0].status !== 'AVAILABLE') throw new Error('New slot is not available');

            const slot = newSlot.rows[0];

            // Update appointment
            await client.query(`
        UPDATE appointments
        SET slot_id = $3, appointment_date = $4, appointment_time = $5,
            estimated_end_time = $6, rescheduled_count = rescheduled_count + 1,
            updated_by = $7, notes = COALESCE(notes, '') || E'\\nRescheduled: ' || $8
        WHERE appointment_id = $1 AND clinic_id = $2
      `, [appointment_id, clinic_id, new_slot_id, slot.slot_date, slot.slot_start_time, slot.slot_end_time, updated_by, rescheduled_reason || 'No reason given']);

            // Release old slot
            await client.query('UPDATE appointment_slots SET status = \'AVAILABLE\' WHERE slot_id = $1', [old.slot_id]);

            // Book new slot
            await client.query('UPDATE appointment_slots SET status = \'BOOKED\' WHERE slot_id = $1', [new_slot_id]);

            await client.query('COMMIT');

            // Fetch updated appointment
            const updated = await db.query('SELECT * FROM appointments WHERE appointment_id = $1', [appointment_id]);
            return updated.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Mark as no-show
     */
    async markNoShow(appointment_id, clinic_id) {
        const result = await db.query(`
      UPDATE appointments
      SET status = 'NO_SHOW'
      WHERE appointment_id = $1 AND clinic_id = $2 AND status IN ('SCHEDULED','CHECKED_IN')
      RETURNING *
    `, [appointment_id, clinic_id]);

        if (result.rows.length === 0) throw new Error('Cannot mark as no-show');

        await db.query(
            'UPDATE appointment_slots SET status = \'NO_SHOW\' WHERE slot_id = $1',
            [result.rows[0].slot_id]
        );

        return result.rows[0];
    }

    /**
     * Get appointment by ID
     */
    async getAppointment(appointment_id, clinic_id) {
        const result = await db.query(`
      SELECT a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.age, p.gender, p.phone as patient_phone,
        u.first_name || ' ' || u.last_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON a.doctor_id = u.user_id
      WHERE a.appointment_id = $1 AND a.clinic_id = $2
    `, [appointment_id, clinic_id]);
        if (result.rows.length === 0) throw new Error('Appointment not found');
        return result.rows[0];
    }

    /**
     * Get appointments for a date
     */
    async getAppointmentsByDate(clinic_id, date, doctor_id) {
        let query = `
      SELECT a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.age, p.gender, p.phone as patient_phone,
        u.first_name || ' ' || u.last_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON a.doctor_id = u.user_id
      WHERE a.clinic_id = $1 AND a.appointment_date = $2
    `;
        const params = [clinic_id, date];

        if (doctor_id) {
            query += ' AND a.doctor_id = $3';
            params.push(doctor_id);
        }
        query += ' ORDER BY a.appointment_time';

        const result = await db.query(query, params);
        return result.rows;
    }

    // --- Async helpers (fire-and-forget) ---

    async queueBookingNotification(appointment) {
        try {
            const patient = await db.query('SELECT phone FROM patients WHERE patient_id = $1', [appointment.patient_id]);
            if (patient.rows.length === 0) return;
            await notificationService.queueNotification({
                appointment_id: appointment.appointment_id,
                patient_id: appointment.patient_id,
                notification_type: 'BOOKING_CONFIRMATION',
                recipient_phone: patient.rows[0].phone,
                appointment,
            });
        } catch (e) { /* swallow */ }
    }

    async queueCancellationNotification(appointment) {
        try {
            const patient = await db.query('SELECT phone FROM patients WHERE patient_id = $1', [appointment.patient_id]);
            if (patient.rows.length === 0) return;
            await notificationService.queueNotification({
                appointment_id: appointment.appointment_id,
                patient_id: appointment.patient_id,
                notification_type: 'CANCELLATION',
                recipient_phone: patient.rows[0].phone,
                appointment,
            });
        } catch (e) { /* swallow */ }
    }

    async generateVisitContext(appointment) {
        // Stub: will be implemented by visitContextService
        const visitContextService = require('./visitContextService');
        await visitContextService.generateContext(appointment.appointment_id, appointment.patient_id);
    }
}

module.exports = new AppointmentService();

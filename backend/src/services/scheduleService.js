const db = require('../database/connection');

class ScheduleService {
    /**
     * Set weekly working hours for a doctor
     */
    async setWorkingHours(scheduleData) {
        const {
            clinic_id, doctor_id, day_of_week, is_working_day,
            start_time, end_time, slot_duration_min,
            break_start, break_end, max_patients, effective_from, effective_to, created_by,
        } = scheduleData;

        // Upsert: if a schedule for this doctor+day+effective_from exists, update it
        const result = await db.query(`
      INSERT INTO doctor_working_hours (
        clinic_id, doctor_id, day_of_week, is_working_day,
        start_time, end_time, slot_duration_min,
        break_start, break_end, max_patients,
        effective_from, effective_to, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
            clinic_id, doctor_id, day_of_week, is_working_day,
            start_time, end_time, slot_duration_min || 15,
            break_start, break_end, max_patients,
            effective_from, effective_to, created_by,
        ]);

        return result.rows[0];
    }

    /**
     * Set working hours for multiple days at once
     */
    async setBulkWorkingHours(clinic_id, doctor_id, schedules, created_by) {
        const results = [];
        for (const schedule of schedules) {
            const result = await this.setWorkingHours({
                clinic_id, doctor_id, created_by,
                ...schedule,
            });
            results.push(result);
        }
        return results;
    }

    /**
     * Get working hours for a doctor
     */
    async getWorkingHours(doctor_id, clinic_id) {
        const result = await db.query(`
      SELECT * FROM doctor_working_hours
      WHERE doctor_id = $1 AND clinic_id = $2
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      ORDER BY CASE day_of_week
        WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3
        WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 WHEN 'SAT' THEN 6 WHEN 'SUN' THEN 7
      END
    `, [doctor_id, clinic_id]);
        return result.rows;
    }

    /**
     * Add doctor leave
     */
    async addLeave(leaveData) {
        const {
            clinic_id, doctor_id, leave_date_from, leave_date_to,
            leave_type, reason, notify_patients, created_by,
        } = leaveData;

        const result = await db.query(`
      INSERT INTO doctor_leaves (
        clinic_id, doctor_id, leave_date_from, leave_date_to,
        leave_type, reason, notify_patients, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [clinic_id, doctor_id, leave_date_from, leave_date_to, leave_type, reason, notify_patients, created_by]);

        // Block all existing slots in the leave period
        if (doctor_id) {
            await db.query(`
        UPDATE appointment_slots
        SET status = 'BLOCKED', blocked_reason = $4
        WHERE doctor_id = $1 AND slot_date >= $2 AND slot_date <= $3 AND status = 'AVAILABLE'
      `, [doctor_id, leave_date_from, leave_date_to, `Leave: ${leave_type}`]);
        }

        return result.rows[0];
    }

    /**
     * Get leaves for a doctor or clinic
     */
    async getLeaves(clinic_id, doctor_id, dateFrom, dateTo) {
        let query = `
      SELECT * FROM doctor_leaves
      WHERE clinic_id = $1 AND leave_date_to >= $2 AND leave_date_from <= $3
    `;
        const params = [clinic_id, dateFrom || new Date(), dateTo || new Date(Date.now() + 90 * 24 * 3600 * 1000)];

        if (doctor_id) {
            query += ' AND (doctor_id = $4 OR doctor_id IS NULL)';
            params.push(doctor_id);
        }
        query += ' ORDER BY leave_date_from';

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Generate appointment slots for a doctor on a specific date
     */
    async generateSlotsForDate(doctor_id, clinic_id, date) {
        // Get working hours for this day of week
        const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dateObj = new Date(date);
        const dayOfWeek = dayMap[dateObj.getUTCDay()];

        const scheduleResult = await db.query(`
      SELECT * FROM doctor_working_hours
      WHERE doctor_id = $1 AND clinic_id = $2 AND day_of_week = $3
        AND is_working_day = true
        AND effective_from <= $4
        AND (effective_to IS NULL OR effective_to >= $4)
      ORDER BY effective_from DESC LIMIT 1
    `, [doctor_id, clinic_id, dayOfWeek, date]);

        if (scheduleResult.rows.length === 0) return [];

        const schedule = scheduleResult.rows[0];

        // Check for leave on this date
        const leaveResult = await db.query(`
      SELECT leave_id FROM doctor_leaves
      WHERE (doctor_id = $1 OR doctor_id IS NULL) AND clinic_id = $2
        AND leave_date_from <= $3 AND leave_date_to >= $3
    `, [doctor_id, clinic_id, date]);

        const isOnLeave = leaveResult.rows.length > 0;

        // Generate time slots
        const slots = [];
        const startMinutes = this.timeToMinutes(schedule.start_time);
        const endMinutes = this.timeToMinutes(schedule.end_time);
        const breakStartMinutes = schedule.break_start ? this.timeToMinutes(schedule.break_start) : null;
        const breakEndMinutes = schedule.break_end ? this.timeToMinutes(schedule.break_end) : null;
        const duration = schedule.slot_duration_min;

        for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
            // Skip break period
            if (breakStartMinutes !== null && breakEndMinutes !== null) {
                if (m >= breakStartMinutes && m < breakEndMinutes) continue;
            }

            const startTime = this.minutesToTime(m);
            const endTime = this.minutesToTime(m + duration);

            const status = isOnLeave ? 'BLOCKED' : 'AVAILABLE';
            const blockedReason = isOnLeave ? 'Doctor on leave' : null;

            slots.push({ clinic_id, doctor_id, slot_date: date, slot_start_time: startTime, slot_end_time: endTime, slot_duration_min: duration, status, blocked_reason: blockedReason });
        }

        // Insert slots (skip duplicates)
        for (const slot of slots) {
            await db.query(`
        INSERT INTO appointment_slots (
          clinic_id, doctor_id, slot_date, slot_start_time, slot_end_time,
          slot_duration_min, status, blocked_reason
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (doctor_id, slot_date, slot_start_time) DO NOTHING
      `, [
                slot.clinic_id, slot.doctor_id, slot.slot_date,
                slot.slot_start_time, slot.slot_end_time,
                slot.slot_duration_min, slot.status, slot.blocked_reason,
            ]);
        }

        return slots;
    }

    /**
     * Generate slots for a date range (e.g., next 90 days)
     */
    async generateSlotsForRange(doctor_id, clinic_id, startDate, days = 90) {
        const start = new Date(startDate);
        let totalSlots = 0;
        for (let i = 0; i < days; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const slots = await this.generateSlotsForDate(doctor_id, clinic_id, dateStr);
            totalSlots += slots.length;
        }
        return { totalSlots, days };
    }

    /**
     * Get available slots for a doctor on a date
     */
    async getAvailableSlots(doctor_id, clinic_id, date) {
        // Generate slots if they don't exist
        const existingResult = await db.query(
            'SELECT COUNT(*) as cnt FROM appointment_slots WHERE doctor_id = $1 AND slot_date = $2',
            [doctor_id, date]
        );
        if (parseInt(existingResult.rows[0].cnt) === 0) {
            await this.generateSlotsForDate(doctor_id, clinic_id, date);
        }

        const result = await db.query(`
      SELECT s.*, 
        a.patient_id,
        p.first_name || ' ' || p.last_name as patient_name
      FROM appointment_slots s
      LEFT JOIN appointments a ON s.slot_id = a.slot_id AND a.status NOT IN ('CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC','CANCELLED_BY_SYSTEM')
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      WHERE s.doctor_id = $1 AND s.slot_date = $2 AND s.clinic_id = $3
      ORDER BY s.slot_start_time
    `, [doctor_id, date, clinic_id]);

        return result.rows;
    }

    // Helper: convert TIME string "HH:MM:SS" to minutes
    timeToMinutes(timeStr) {
        const parts = String(timeStr).split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Helper: convert minutes to "HH:MM" time string
    minutesToTime(minutes) {
        const h = String(Math.floor(minutes / 60)).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        return `${h}:${m}`;
    }
}

module.exports = new ScheduleService();

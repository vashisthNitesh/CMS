const db = require('../database/connection');

class QueueService {
    /**
     * Get today's queue for a doctor
     */
    async getDoctorQueue(doctor_id, clinic_id, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        const result = await db.query(`
      SELECT a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.age, p.gender, p.phone as patient_phone,
        vc.generation_status as context_status,
        vc.context_confidence
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN visit_context vc ON a.appointment_id = vc.appointment_id
      WHERE a.doctor_id = $1 AND a.clinic_id = $2 AND a.appointment_date = $3
        AND a.status NOT IN ('CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC','CANCELLED_BY_SYSTEM')
      ORDER BY
        CASE a.status
          WHEN 'IN_CONSULTATION' THEN 1
          WHEN 'CHECKED_IN' THEN 2
          WHEN 'SCHEDULED' THEN 3
          WHEN 'COMPLETED' THEN 4
          WHEN 'NO_SHOW' THEN 5
        END,
        a.appointment_time
    `, [doctor_id, clinic_id, targetDate]);

        const appointments = result.rows;

        // Group by status
        const inConsultation = appointments.find(a => a.status === 'IN_CONSULTATION') || null;
        const waiting = appointments.filter(a => a.status === 'CHECKED_IN');
        const upcoming = appointments.filter(a => a.status === 'SCHEDULED');
        const completed = appointments.filter(a => a.status === 'COMPLETED');
        const noShows = appointments.filter(a => a.status === 'NO_SHOW');

        // Calculate wait times for waiting patients
        const now = new Date();
        for (const w of waiting) {
            if (w.check_in_time) {
                w.wait_minutes = Math.round((now - new Date(w.check_in_time)) / 60000);
            }
        }

        // Duration for in-consultation
        if (inConsultation && inConsultation.consultation_start) {
            inConsultation.duration_minutes = Math.round(
                (now - new Date(inConsultation.consultation_start)) / 60000
            );
        }

        return {
            in_consultation: inConsultation,
            waiting,
            upcoming,
            summary: {
                completed_today: completed.length,
                cancelled_today: 0, // Not fetched in this query
                no_shows_today: noShows.length,
                total_waiting: waiting.length,
                total_upcoming: upcoming.length,
            },
        };
    }

    /**
     * Get daily summary counts
     */
    async getDailySummary(clinic_id, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        const result = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      WHERE clinic_id = $1 AND appointment_date = $2
      GROUP BY status
    `, [clinic_id, targetDate]);

        const summary = {
            date: targetDate,
            scheduled: 0,
            checked_in: 0,
            in_consultation: 0,
            completed: 0,
            cancelled: 0,
            no_show: 0,
            total: 0,
        };

        for (const row of result.rows) {
            const count = parseInt(row.count);
            summary.total += count;
            switch (row.status) {
                case 'SCHEDULED': summary.scheduled = count; break;
                case 'CHECKED_IN': summary.checked_in = count; break;
                case 'IN_CONSULTATION': summary.in_consultation = count; break;
                case 'COMPLETED': summary.completed = count; break;
                case 'NO_SHOW': summary.no_show = count; break;
                default:
                    if (row.status.startsWith('CANCELLED')) summary.cancelled += count;
            }
        }

        return summary;
    }
}

module.exports = new QueueService();

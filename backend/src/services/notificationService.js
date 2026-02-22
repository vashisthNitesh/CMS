const db = require('../database/connection');

class NotificationService {
    /**
     * Queue a notification for sending
     * In dev mode, this just logs to DB without actually sending SMS
     */
    async queueNotification(notifData) {
        const { appointment_id, patient_id, notification_type, recipient_phone, appointment } = notifData;

        const message = this.buildMessage(notification_type, appointment);

        const result = await db.query(`
      INSERT INTO appointment_notifications (
        appointment_id, patient_id, notification_type,
        channel, recipient_phone, message_content,
        status, scheduled_at
      ) VALUES ($1,$2,$3,'SMS',$4,$5,'QUEUED',NOW())
      RETURNING *
    `, [appointment_id, patient_id, notification_type, recipient_phone, message]);

        console.log(`📱 [NOTIFICATION STUB] ${notification_type} → ${recipient_phone}: ${message.substring(0, 80)}...`);

        // In production, this would call Twilio/MSG91/etc.
        // For now, mark as "SENT" immediately
        await db.query(
            'UPDATE appointment_notifications SET status = \'SENT\', sent_at = NOW() WHERE notification_id = $1',
            [result.rows[0].notification_id]
        );

        return result.rows[0];
    }

    /**
     * Build SMS message from template
     */
    buildMessage(type, appointment) {
        const date = appointment.appointment_date;
        const time = appointment.appointment_time;

        switch (type) {
            case 'BOOKING_CONFIRMATION':
                return `Your appointment is confirmed for ${date} at ${time}. Please arrive 10 minutes early.`;

            case 'REMINDER_24H':
                return `Reminder: You have an appointment tomorrow (${date}) at ${time}. Please carry your previous reports.`;

            case 'REMINDER_2H':
                return `Your appointment is in 2 hours at ${time}. See you soon!`;

            case 'CANCELLATION':
                return `Your appointment on ${date} at ${time} has been cancelled. Please call us to reschedule.`;

            case 'RESCHEDULE':
                return `Your appointment has been rescheduled to ${date} at ${time}.`;

            case 'NO_SHOW_FOLLOWUP':
                return `We missed you at your appointment on ${date}. Would you like to reschedule? Please call us.`;

            default:
                return `Appointment update for ${date} at ${time}.`;
        }
    }

    /**
     * Get notifications for an appointment
     */
    async getNotifications(appointment_id) {
        const result = await db.query(
            'SELECT * FROM appointment_notifications WHERE appointment_id = $1 ORDER BY created_at DESC',
            [appointment_id]
        );
        return result.rows;
    }
}

module.exports = new NotificationService();

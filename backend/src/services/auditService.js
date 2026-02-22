const db = require('../database/connection');

class AuditService {
    async log(auditData) {
        const {
            user_id, user_email, user_role, clinic_id,
            table_name, record_id, action,
            old_values, new_values, ip_address, user_agent, notes,
        } = auditData;

        const changes = this.calculateChanges(old_values, new_values);

        const result = await db.query(`
      INSERT INTO audit_logs (
        user_id, user_email, user_role, clinic_id,
        table_name, record_id, action,
        old_values, new_values, changes,
        ip_address, user_agent, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING log_id
    `, [
            user_id, user_email, user_role, clinic_id,
            table_name, record_id, action,
            old_values ? JSON.stringify(old_values) : null,
            new_values ? JSON.stringify(new_values) : null,
            changes ? JSON.stringify(changes) : null,
            ip_address, user_agent, notes,
        ]);

        return result.rows[0].log_id;
    }

    calculateChanges(oldValues, newValues) {
        if (!oldValues || !newValues) return null;
        const changes = {};
        for (const key in newValues) {
            if (oldValues[key] !== newValues[key]) {
                changes[key] = { old: oldValues[key], new: newValues[key] };
            }
        }
        return Object.keys(changes).length > 0 ? changes : null;
    }

    async logLogin(loginData) {
        const { user_id, email, success, failure_reason, ip_address, user_agent } = loginData;
        await db.query(`
      INSERT INTO login_history (user_id, email, success, failure_reason, ip_address, user_agent)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [user_id, email, success, failure_reason, ip_address, user_agent]);
    }

    async logDataAccess(accessData) {
        const { user_id, clinic_id, resource_type, resource_id, access_type, ip_address, reason } = accessData;
        await db.query(`
      INSERT INTO data_access_logs (user_id, clinic_id, resource_type, resource_id, access_type, ip_address, reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [user_id, clinic_id, resource_type, resource_id, access_type, ip_address, reason]);
    }

    async getAuditTrail(tableName, recordId, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const result = await db.query(`
      SELECT log_id, user_email, user_role, action, changes, timestamp, notes
      FROM audit_logs
      WHERE table_name = $1 AND record_id = $2
      ORDER BY timestamp DESC
      LIMIT $3 OFFSET $4
    `, [tableName, recordId, limit, offset]);
        return result.rows;
    }

    async getUserActivity(userId, dateFrom, dateTo) {
        const result = await db.query(`
      SELECT DATE(timestamp) as date, action, table_name, COUNT(*) as count
      FROM audit_logs
      WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      GROUP BY DATE(timestamp), action, table_name
      ORDER BY date DESC, count DESC
    `, [userId, dateFrom, dateTo]);
        return result.rows;
    }
}

module.exports = new AuditService();

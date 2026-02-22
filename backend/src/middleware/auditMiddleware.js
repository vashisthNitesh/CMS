const auditService = require('../services/auditService');

function auditRequest(action, tableName) {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            originalSend.call(this, data);
            if (req.user) {
                auditService.log({
                    user_id: req.user.user_id,
                    user_email: req.user.email,
                    user_role: req.user.role,
                    clinic_id: req.user.clinic_id,
                    table_name: tableName,
                    record_id: req.params.id || req.body.id,
                    action,
                    old_values: req.oldData,
                    new_values: req.body,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                }).catch(err => console.error('Audit logging failed:', err));
            }
        };
        next();
    };
}

module.exports = { auditRequest };

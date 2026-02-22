const authService = require('../services/authService');

function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        req.user = authService.verifyToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

function authorize(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        const userPermissions = req.user.permissions || [];
        const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                required: requiredPermissions,
            });
        }
        next();
    };
}

function ensureClinicAccess(req, res, next) {
    const requestedClinicId = req.params.clinicId || req.body.clinic_id;
    if (req.user.role === 'super_admin') return next();
    if (requestedClinicId && requestedClinicId !== req.user.clinic_id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied: You can only access your own clinic data',
        });
    }
    next();
}

module.exports = { authenticate, authorize, ensureClinicAccess };

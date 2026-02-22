const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ success: true, message: 'User registered successfully', data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        const result = await authService.login(email, password);

        // Log successful login
        auditService.logLogin({
            user_id: result.user.user_id,
            email: result.user.email,
            success: true,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        }).catch(err => console.error('Login audit failed:', err));

        res.json({ success: true, message: 'Login successful', data: result });
    } catch (error) {
        // Log failed login
        auditService.logLogin({
            user_id: null,
            email: req.body.email,
            success: false,
            failure_reason: error.message,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        }).catch(err => console.error('Login audit failed:', err));

        res.status(401).json({ success: false, error: error.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    res.json({ success: true, data: req.user });
});

router.post('/logout', authenticate, async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const scheduleService = require('../services/scheduleService');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * POST /api/v1/schedules/working-hours
 * Set working hours for a doctor (single day)
 */
router.post('/working-hours', authenticate, authorize('appointments:update', 'config:update'), async (req, res) => {
    try {
        const schedule = await scheduleService.setWorkingHours({
            ...req.body,
            clinic_id: req.user.clinic_id,
            created_by: req.user.user_id,
        });
        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/schedules/working-hours/bulk
 * Set working hours for multiple days
 */
router.post('/working-hours/bulk', authenticate, authorize('appointments:update', 'config:update'), async (req, res) => {
    try {
        const { doctor_id, schedules } = req.body;
        const results = await scheduleService.setBulkWorkingHours(
            req.user.clinic_id, doctor_id, schedules, req.user.user_id
        );
        res.status(201).json({ success: true, data: results });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/schedules/working-hours/:doctorId
 * Get working hours for a doctor
 */
router.get('/working-hours/:doctorId', authenticate, async (req, res) => {
    try {
        const schedules = await scheduleService.getWorkingHours(req.params.doctorId, req.user.clinic_id);
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/schedules/leaves
 * Add doctor leave
 */
router.post('/leaves', authenticate, authorize('appointments:update', 'config:update'), async (req, res) => {
    try {
        const leave = await scheduleService.addLeave({
            ...req.body,
            clinic_id: req.user.clinic_id,
            created_by: req.user.user_id,
        });
        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/schedules/leaves
 * Get leaves
 */
router.get('/leaves', authenticate, async (req, res) => {
    try {
        const { doctor_id, date_from, date_to } = req.query;
        const leaves = await scheduleService.getLeaves(req.user.clinic_id, doctor_id, date_from, date_to);
        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/schedules/slots/generate
 * Generate slots for a doctor
 */
router.post('/slots/generate', authenticate, authorize('appointments:update', 'config:update'), async (req, res) => {
    try {
        const { doctor_id, start_date, days } = req.body;
        const result = await scheduleService.generateSlotsForRange(
            doctor_id, req.user.clinic_id, start_date, days || 90
        );
        res.json({ success: true, message: `Generated ${result.totalSlots} slots over ${result.days} days`, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/schedules/slots
 * Get available slots for a doctor on a date
 */
router.get('/slots', authenticate, async (req, res) => {
    try {
        const { doctor_id, date } = req.query;
        if (!doctor_id || !date) {
            return res.status(400).json({ success: false, error: 'doctor_id and date are required' });
        }
        const slots = await scheduleService.getAvailableSlots(doctor_id, req.user.clinic_id, date);

        const summary = {
            total_slots: slots.length,
            available: slots.filter(s => s.status === 'AVAILABLE').length,
            booked: slots.filter(s => s.status === 'BOOKED').length,
            blocked: slots.filter(s => s.status === 'BLOCKED').length,
        };

        res.json({ success: true, data: { doctor_id, date, slots, summary } });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

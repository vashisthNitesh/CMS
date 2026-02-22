const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');
const queueService = require('../services/queueService');
const visitContextService = require('../services/visitContextService');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { auditRequest } = require('../middleware/auditMiddleware');

/**
 * POST /api/v1/appointments
 * Book new appointment
 */
router.post('/', authenticate, authorize('appointments:create'), auditRequest('INSERT', 'appointments'), async (req, res) => {
    try {
        const appointment = await appointmentService.bookAppointment({
            ...req.body,
            clinic_id: req.user.clinic_id,
            booked_by: req.user.user_id,
        });
        res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/appointments/walk-in
 * Walk-in appointment (immediate check-in)
 */
router.post('/walk-in', authenticate, authorize('appointments:create'), async (req, res) => {
    try {
        const appointment = await appointmentService.walkInAppointment({
            ...req.body,
            clinic_id: req.user.clinic_id,
            booked_by: req.user.user_id,
        });
        res.status(201).json({ success: true, message: 'Walk-in registered and checked in', data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/appointments/queue
 * Get today's queue for a doctor
 */
router.get('/queue', authenticate, async (req, res) => {
    try {
        const { doctor_id, date } = req.query;
        const doctorId = doctor_id || req.user.user_id;
        const queue = await queueService.getDoctorQueue(doctorId, req.user.clinic_id, date);
        res.json({ success: true, data: queue });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/appointments/daily-summary
 * Get daily appointment summary
 */
router.get('/daily-summary', authenticate, async (req, res) => {
    try {
        const { date } = req.query;
        const summary = await queueService.getDailySummary(req.user.clinic_id, date);
        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/appointments/by-date
 * Get appointments for a date
 */
router.get('/by-date', authenticate, authorize('appointments:read'), async (req, res) => {
    try {
        const { date, doctor_id } = req.query;
        if (!date) return res.status(400).json({ success: false, error: 'date is required' });
        const appointments = await appointmentService.getAppointmentsByDate(req.user.clinic_id, date, doctor_id);
        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/appointments/:appointmentId
 * Get appointment details
 */
router.get('/:appointmentId', authenticate, authorize('appointments:read'), async (req, res) => {
    try {
        const appointment = await appointmentService.getAppointment(req.params.appointmentId, req.user.clinic_id);
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/check-in
 * Check in patient
 */
router.patch('/:appointmentId/check-in', authenticate, authorize('appointments:update'), async (req, res) => {
    try {
        const appointment = await appointmentService.checkIn(req.params.appointmentId, req.user.clinic_id);
        res.json({
            success: true, data: {
                ...appointment,
                context_generation: 'started',
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/start
 * Start consultation
 */
router.patch('/:appointmentId/start', authenticate, authorize('visits:create'), async (req, res) => {
    try {
        const appointment = await appointmentService.startConsultation(req.params.appointmentId, req.user.clinic_id);
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/complete
 * Complete appointment
 */
router.patch('/:appointmentId/complete', authenticate, authorize('visits:update'), async (req, res) => {
    try {
        const appointment = await appointmentService.completeAppointment(req.params.appointmentId, req.user.clinic_id);
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/cancel
 * Cancel appointment
 */
router.patch('/:appointmentId/cancel', authenticate, authorize('appointments:cancel', 'appointments:delete'), async (req, res) => {
    try {
        const appointment = await appointmentService.cancelAppointment(
            req.params.appointmentId,
            req.user.clinic_id,
            { ...req.body, cancelled_by: req.user.user_id }
        );
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/reschedule
 * Reschedule appointment
 */
router.patch('/:appointmentId/reschedule', authenticate, authorize('appointments:update'), async (req, res) => {
    try {
        const appointment = await appointmentService.rescheduleAppointment(
            req.params.appointmentId,
            req.user.clinic_id,
            { ...req.body, updated_by: req.user.user_id }
        );
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/no-show
 * Mark as no-show
 */
router.patch('/:appointmentId/no-show', authenticate, authorize('appointments:update'), async (req, res) => {
    try {
        const appointment = await appointmentService.markNoShow(req.params.appointmentId, req.user.clinic_id);
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/appointments/:appointmentId/context
 * Get visit context (AI-generated)
 */
router.get('/:appointmentId/context', authenticate, authorize('visits:read'), async (req, res) => {
    try {
        const context = await visitContextService.getContext(req.params.appointmentId);
        if (!context) {
            return res.status(404).json({ success: false, error: 'Visit context not yet generated' });
        }
        res.json({ success: true, data: context });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

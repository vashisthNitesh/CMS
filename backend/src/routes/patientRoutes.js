const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * GET /api/v1/patients/search?q=...
 * Search patients
 */
router.get('/search', authenticate, authorize('patients:read'), async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ success: false, error: 'Search term must be at least 2 characters' });
        }
        const patients = await patientService.searchPatients(req.user.clinic_id, q);
        res.json({ success: true, data: patients });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/patients
 * Create lightweight patient (during booking)
 */
router.post('/', authenticate, authorize('patients:create'), async (req, res) => {
    try {
        const result = await patientService.createPatient({
            ...req.body,
            clinic_id: req.user.clinic_id,
            created_by: req.user.user_id,
        });

        if (result.duplicate) {
            return res.status(409).json({
                success: false,
                error: 'Patient with this phone number already exists',
                existing_patient: result.existing_patient,
            });
        }

        res.status(201).json({ success: true, data: result.patient });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/patients/:patientId
 * Get patient details
 */
router.get('/:patientId', authenticate, authorize('patients:read'), async (req, res) => {
    try {
        const patient = await patientService.getPatient(req.params.patientId, req.user.clinic_id);
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/patients/:patientId
 * Update patient profile
 */
router.patch('/:patientId', authenticate, authorize('patients:update'), async (req, res) => {
    try {
        const patient = await patientService.updatePatient(req.params.patientId, req.user.clinic_id, req.body);
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

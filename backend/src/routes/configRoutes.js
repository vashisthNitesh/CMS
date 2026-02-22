const express = require('express');
const router = express.Router();
const configService = require('../services/configService');

router.get('/:clinicId', async (req, res) => {
    try {
        const config = await configService.getClinicConfig(req.params.clinicId);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

router.post('/clinic', async (req, res) => {
    try {
        const clinic = await configService.createClinic(req.body);
        res.status(201).json({ success: true, message: 'Clinic created successfully', data: clinic });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch('/:clinicId/ai', async (req, res) => {
    try {
        const updated = await configService.updateAIConfig(req.params.clinicId, req.body);
        res.json({ success: true, message: 'AI configuration updated', data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

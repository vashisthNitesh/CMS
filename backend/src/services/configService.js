const db = require('../database/connection');

class ConfigService {
    async getClinicConfig(clinicId) {
        const query = `
      SELECT 
        o.*,
        c.visit_types, c.diagnosis_style, c.measurement_system,
        c.prescription_rules, c.required_fields,
        a.enable_summarization, a.enable_suggestions,
        a.enable_risk_flagging, a.enable_prescription_assist,
        a.suggestion_confidence_threshold, a.explainability_level
      FROM organization_config o
      LEFT JOIN clinical_config c ON o.clinic_id = c.clinic_id
      LEFT JOIN ai_behavior_config a ON o.clinic_id = a.clinic_id
      WHERE o.clinic_id = $1 AND o.status = 'active'
    `;
        const result = await db.query(query, [clinicId]);
        if (result.rows.length === 0) {
            throw new Error('Clinic not found or inactive');
        }
        return result.rows[0];
    }

    async createClinic(clinicData) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const orgResult = await client.query(`
        INSERT INTO organization_config (
          clinic_name, country_code, timezone, currency_code, language_code, specialty_type
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING clinic_id
      `, [
                clinicData.clinic_name, clinicData.country_code, clinicData.timezone,
                clinicData.currency_code, clinicData.language_code, clinicData.specialty_type,
            ]);

            const clinicId = orgResult.rows[0].clinic_id;
            await client.query('INSERT INTO clinical_config (clinic_id) VALUES ($1)', [clinicId]);
            await client.query('INSERT INTO ai_behavior_config (clinic_id) VALUES ($1)', [clinicId]);

            await client.query('COMMIT');
            console.log(`✅ Created clinic: ${clinicData.clinic_name} (${clinicId})`);
            return await this.getClinicConfig(clinicId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updateAIConfig(clinicId, aiSettings) {
        const result = await db.query(`
      UPDATE ai_behavior_config
      SET 
        enable_summarization = COALESCE($2, enable_summarization),
        enable_suggestions = COALESCE($3, enable_suggestions),
        enable_risk_flagging = COALESCE($4, enable_risk_flagging),
        suggestion_confidence_threshold = COALESCE($5, suggestion_confidence_threshold)
      WHERE clinic_id = $1
      RETURNING *
    `, [
            clinicId, aiSettings.enable_summarization, aiSettings.enable_suggestions,
            aiSettings.enable_risk_flagging, aiSettings.suggestion_confidence_threshold,
        ]);
        return result.rows[0];
    }

    async isFeatureEnabled(clinicId, featureName) {
        const config = await this.getClinicConfig(clinicId);
        const featureMap = {
            'ai_summary': config.enable_summarization,
            'ai_suggestions': config.enable_suggestions,
            'risk_flags': config.enable_risk_flagging,
            'prescription_assist': config.enable_prescription_assist,
        };
        return featureMap[featureName] || false;
    }
}

module.exports = new ConfigService();

const db = require('../database/connection');

class VisitContextService {
    /**
     * Generate visit context for a patient (stub AI implementation)
     */
    async generateContext(appointment_id, patient_id) {
        // Create pending context record
        await db.query(`
      INSERT INTO visit_context (appointment_id, patient_id, generation_status, generation_started_at)
      VALUES ($1, $2, 'IN_PROGRESS', NOW())
      ON CONFLICT (appointment_id) DO UPDATE SET generation_status = 'IN_PROGRESS', generation_started_at = NOW()
    `, [appointment_id, patient_id]);

        try {
            // Get patient info
            const patientResult = await db.query('SELECT * FROM patients WHERE patient_id = $1', [patient_id]);
            if (patientResult.rows.length === 0) {
                throw new Error('Patient not found');
            }
            const patient = patientResult.rows[0];

            // Get past appointments for this patient
            const pastVisits = await db.query(`
        SELECT a.*, u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.patient_id = $1 AND a.status = 'COMPLETED'
        ORDER BY a.appointment_date DESC
        LIMIT 5
      `, [patient_id]);

            const visitCount = pastVisits.rows.length;
            const isNewPatient = visitCount === 0;

            let summary, visitPrediction, confidence;
            const pendingItems = [];
            const riskFlags = [];
            const dataSources = pastVisits.rows.map(v => v.appointment_id);

            if (isNewPatient) {
                summary = `New patient: ${patient.first_name} ${patient.last_name}, ${patient.age || 'age unknown'}, ${patient.gender || 'gender unknown'}. No visit history available. This is the patient's first visit. Collect chief complaint, past medical history, family history, current medications, and allergies.`;
                visitPrediction = 'First visit — initial assessment';
                confidence = 0.40;
            } else {
                const lastVisit = pastVisits.rows[0];
                const visitDates = pastVisits.rows.map(v => v.appointment_date).join(', ');

                summary = `Returning patient with ${visitCount} previous visit(s). Last visit on ${lastVisit.appointment_date} with ${lastVisit.doctor_name}.${lastVisit.reason_for_visit ? ` Previous reason: ${lastVisit.reason_for_visit}.` : ''} Patient has been visiting since their records began.`;

                visitPrediction = lastVisit.visit_type === 'FOLLOW_UP'
                    ? `Likely follow-up on previous visit (${lastVisit.reason_for_visit || 'unspecified'})`
                    : 'Returning patient visit';

                confidence = Math.min(0.60 + visitCount * 0.05, 0.95);

                // Check visit frequency for risk flags
                if (visitCount >= 3) {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    const recentVisits = pastVisits.rows.filter(v =>
                        new Date(v.appointment_date) >= threeMonthsAgo
                    ).length;
                    if (recentVisits >= 3) {
                        riskFlags.push({
                            flag: 'Frequent visits detected',
                            suggestion: 'Patient has visited 3+ times in the last 3 months — review for recurring condition',
                            confidence: 0.70,
                        });
                    }
                }
            }

            // Update context with generated data
            await db.query(`
        UPDATE visit_context
        SET summary = $3, visit_prediction = $4,
            pending_items = $5, allergies = $6, ongoing_medications = $7,
            risk_flags = $8, context_confidence = $9,
            data_sources = $10, ai_model_version = 'stub-v1.0',
            generation_status = 'COMPLETED', generated_at = NOW()
        WHERE appointment_id = $1 AND patient_id = $2
      `, [
                appointment_id, patient_id, summary, visitPrediction,
                JSON.stringify(pendingItems), JSON.stringify([]),
                JSON.stringify([]), JSON.stringify(riskFlags),
                confidence, JSON.stringify(dataSources),
            ]);

            return { status: 'COMPLETED', confidence };
        } catch (error) {
            await db.query(`
        UPDATE visit_context
        SET generation_status = 'FAILED', generation_error = $3
        WHERE appointment_id = $1 AND patient_id = $2
      `, [appointment_id, patient_id, error.message]);
            throw error;
        }
    }

    /**
     * Get visit context for an appointment
     */
    async getContext(appointment_id) {
        const result = await db.query(
            'SELECT * FROM visit_context WHERE appointment_id = $1',
            [appointment_id]
        );
        if (result.rows.length === 0) return null;
        return result.rows[0];
    }
}

module.exports = new VisitContextService();

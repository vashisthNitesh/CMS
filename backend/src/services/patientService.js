const db = require('../database/connection');

class PatientService {
    /**
     * Search patients by name or phone within a clinic
     */
    async searchPatients(clinic_id, searchTerm) {
        const result = await db.query(`
      SELECT patient_id, first_name, last_name, phone, date_of_birth, age, gender, profile_complete
      FROM patients
      WHERE clinic_id = $1 AND status = 'ACTIVE'
        AND (
          first_name ILIKE $2 OR last_name ILIKE $2
          OR phone LIKE $3
          OR (first_name || ' ' || last_name) ILIKE $2
        )
      ORDER BY first_name, last_name
      LIMIT 20
    `, [clinic_id, `%${searchTerm}%`, `%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Lightweight patient creation (during appointment booking)
     */
    async createPatient(patientData) {
        const {
            clinic_id, first_name, last_name, phone,
            date_of_birth, age, gender, email, created_by,
        } = patientData;

        // Check for duplicate by phone in same clinic
        const existing = await db.query(
            'SELECT patient_id, first_name, last_name, phone FROM patients WHERE clinic_id = $1 AND phone = $2 AND status = \'ACTIVE\'',
            [clinic_id, phone]
        );

        if (existing.rows.length > 0) {
            return { duplicate: true, existing_patient: existing.rows[0] };
        }

        const result = await db.query(`
      INSERT INTO patients (
        clinic_id, first_name, last_name, phone,
        date_of_birth, age, gender, email,
        profile_complete, created_via, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,'APPOINTMENT_BOOKING',$9)
      RETURNING *
    `, [clinic_id, first_name, last_name, phone, date_of_birth, age, gender, email, created_by]);

        return { duplicate: false, patient: result.rows[0] };
    }

    /**
     * Get patient by ID
     */
    async getPatient(patient_id, clinic_id) {
        const result = await db.query(
            'SELECT * FROM patients WHERE patient_id = $1 AND clinic_id = $2',
            [patient_id, clinic_id]
        );
        if (result.rows.length === 0) throw new Error('Patient not found');
        return result.rows[0];
    }

    /**
     * Update patient profile
     */
    async updatePatient(patient_id, clinic_id, updateData) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'age', 'gender', 'email', 'blood_group', 'profile_complete'];
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                fields.push(`${field} = $${idx}`);
                values.push(updateData[field]);
                idx++;
            }
        }

        if (fields.length === 0) throw new Error('No fields to update');

        values.push(patient_id, clinic_id);
        const result = await db.query(
            `UPDATE patients SET ${fields.join(', ')} WHERE patient_id = $${idx} AND clinic_id = $${idx + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /**
     * Check if this is a patient's first visit at this clinic
     */
    async isFirstVisit(patient_id, clinic_id) {
        const result = await db.query(
            'SELECT COUNT(*) as cnt FROM appointments WHERE patient_id = $1 AND clinic_id = $2 AND status = \'COMPLETED\'',
            [patient_id, clinic_id]
        );
        return parseInt(result.rows[0].cnt) === 0;
    }
}

module.exports = new PatientService();

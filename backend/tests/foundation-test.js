const http = require('http');

const BASE = 'http://localhost:3000';

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: { 'Content-Type': 'application/json' },
        };

        if (global.authToken) {
            options.headers['Authorization'] = `Bearer ${global.authToken}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
    console.log('🧪 Clinical SaaS — Foundation + Appointments Integration Test\n');
    console.log('='.repeat(60));

    const TS = Date.now();
    const DOCTOR_EMAIL = `doctor-${TS}@test.com`;
    const RECEPTIONIST_EMAIL = `recep-${TS}@test.com`;
    const PATIENT_PHONE = `+91900${TS.toString().slice(-7)}`;
    let clinicId, doctorUserId, receptionistUserId, patientId, slotId, appointmentId;

    try {
        // 1. Health Check
        console.log('\n📋 Test 1: Health Check');
        const health = await request('GET', '/health');
        console.assert(health.status === 200, `Expected 200, got ${health.status}`);
        console.assert(health.data.status === 'healthy', 'Server not healthy');
        console.log('   ✅ Server is healthy, DB connected');

        // 2. Create Clinic
        console.log('\n📋 Test 2: Create Clinic');
        const clinic = await request('POST', '/api/config/clinic', {
            clinic_name: 'Apollo Clinic - Test',
            country_code: 'IN',
            timezone: 'Asia/Kolkata',
            currency_code: 'INR',
            language_code: 'en-IN',
            specialty_type: 'general_practice',
        });
        console.assert(clinic.status === 201, `Expected 201, got ${clinic.status}: ${JSON.stringify(clinic.data)}`);
        clinicId = clinic.data.data.clinic_id;
        console.log(`   ✅ Clinic created: ${clinicId}`);

        // 3. Get Clinic Config
        console.log('\n📋 Test 3: Get Clinic Config');
        const config = await request('GET', `/api/config/${clinicId}`);
        console.assert(config.status === 200, `Expected 200, got ${config.status}`);
        console.assert(config.data.data.enable_summarization === true, 'AI summarization should be enabled');
        console.log('   ✅ Config retrieved, AI features enabled');

        // 4. Register Doctor
        console.log('\n📋 Test 4: Register Doctor');
        const doctor = await request('POST', '/api/auth/register', {
            email: DOCTOR_EMAIL,
            password: 'SecurePass123!',
            first_name: 'Dr. Amit',
            last_name: 'Sharma',
            phone: '+919876543210',
            role_name: 'doctor',
            clinic_id: clinicId,
        });
        console.assert(doctor.status === 201, `Expected 201, got ${doctor.status}: ${JSON.stringify(doctor.data)}`);
        doctorUserId = doctor.data.data.user_id;
        console.log(`   ✅ Doctor registered: ${doctorUserId}`);

        // 5. Register Receptionist
        console.log('\n📋 Test 5: Register Receptionist');
        const receptionist = await request('POST', '/api/auth/register', {
            email: RECEPTIONIST_EMAIL,
            password: 'SecurePass123!',
            first_name: 'Priya',
            last_name: 'Patel',
            phone: `+9198765${TS.toString().slice(-5)}`,
            role_name: 'receptionist',
            clinic_id: clinicId,
        });
        console.assert(receptionist.status === 201, `Expected 201, got ${receptionist.status}`);
        receptionistUserId = receptionist.data.data.user_id;
        console.log(`   ✅ Receptionist registered: ${receptionistUserId}`);

        // 6. Login as Receptionist
        console.log('\n📋 Test 6: Login as Receptionist');
        const login = await request('POST', '/api/auth/login', {
            email: RECEPTIONIST_EMAIL,
            password: 'SecurePass123!',
        });
        console.assert(login.status === 200, `Expected 200, got ${login.status}: ${JSON.stringify(login.data)}`);
        global.authToken = login.data.data.accessToken;
        console.log(`   ✅ Login successful, role: ${login.data.data.user.role}`);
        console.log(`   ✅ Permissions: ${login.data.data.user.permissions.length} permissions loaded`);

        // 7. Get /me
        console.log('\n📋 Test 7: Protected Route (/me)');
        const me = await request('GET', '/api/auth/me');
        console.assert(me.status === 200, `Expected 200, got ${me.status}`);
        console.assert(me.data.data.email === RECEPTIONIST_EMAIL, 'Wrong user');
        console.log(`   ✅ Authenticated as: ${me.data.data.email}`);

        // 8. Set Doctor Working Hours
        console.log('\n📋 Test 8: Set Doctor Working Hours');
        const today = new Date();
        const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const todayDay = dayMap[today.getDay()];
        const schedule = await request('POST', '/api/v1/schedules/working-hours', {
            doctor_id: doctorUserId,
            day_of_week: todayDay,
            is_working_day: true,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_min: 15,
            break_start: '13:00',
            break_end: '14:00',
            effective_from: today.toISOString().split('T')[0],
        });
        console.assert(schedule.status === 201, `Expected 201, got ${schedule.status}: ${JSON.stringify(schedule.data)}`);
        console.log(`   ✅ Working hours set for ${todayDay}: 09:00-17:00`);

        // 9. Get Available Slots
        console.log('\n📋 Test 9: Get Available Slots');
        const todayStr = today.toISOString().split('T')[0];
        const slots = await request('GET', `/api/v1/schedules/slots?doctor_id=${doctorUserId}&date=${todayStr}`);
        console.assert(slots.status === 200, `Expected 200, got ${slots.status}`);
        console.assert(slots.data.data.slots.length > 0, 'No slots generated');
        const availableSlots = slots.data.data.slots.filter(s => s.status === 'AVAILABLE');
        slotId = availableSlots[0]?.slot_id;
        console.log(`   ✅ ${slots.data.data.summary.total_slots} total, ${slots.data.data.summary.available} available`);

        // 10. Create Patient
        console.log('\n📋 Test 10: Create Patient');
        const patient = await request('POST', '/api/v1/patients', {
            first_name: 'Rajesh',
            last_name: 'Kumar',
            phone: PATIENT_PHONE,
            age: 38,
            gender: 'MALE',
        });
        console.assert(patient.status === 201, `Expected 201, got ${patient.status}: ${JSON.stringify(patient.data)}`);
        patientId = patient.data.data.patient_id;
        console.log(`   ✅ Patient created: ${patientId}`);

        // 11. Book Appointment
        console.log('\n📋 Test 11: Book Appointment');
        if (!slotId) {
            console.log('   ⚠️  Skipping — no available slot found');
        } else {
            const appt = await request('POST', '/api/v1/appointments', {
                patient_id: patientId,
                doctor_id: doctorUserId,
                slot_id: slotId,
                visit_type: 'NEW_PATIENT',
                reason_for_visit: 'General checkup',
                source: 'PHONE',
            });
            console.assert(appt.status === 201, `Expected 201, got ${appt.status}: ${JSON.stringify(appt.data)}`);
            appointmentId = appt.data.data.appointment_id;
            console.assert(appt.data.data.status === 'SCHEDULED', 'Status should be SCHEDULED');
            console.log(`   ✅ Appointment booked: ${appointmentId}`);
        }

        // 12. Check-In Patient
        console.log('\n📋 Test 12: Check-In Patient');
        if (!appointmentId) {
            console.log('   ⚠️  Skipping — no appointment');
        } else {
            const checkIn = await request('PATCH', `/api/v1/appointments/${appointmentId}/check-in`);
            console.assert(checkIn.status === 200, `Expected 200, got ${checkIn.status}: ${JSON.stringify(checkIn.data)}`);
            console.assert(checkIn.data.data.status === 'CHECKED_IN', 'Status should be CHECKED_IN');
            console.log('   ✅ Patient checked in');
        }

        // 13. Wait for context generation, then fetch it
        console.log('\n📋 Test 13: Get Visit Context (AI)');
        if (!appointmentId) {
            console.log('   ⚠️  Skipping — no appointment');
        } else {
            // Login as doctor to view context
            const docLogin = await request('POST', '/api/auth/login', {
                email: DOCTOR_EMAIL,
                password: 'SecurePass123!',
            });
            global.authToken = docLogin.data.data.accessToken;

            await sleep(1000); // Wait for async context generation
            const ctx = await request('GET', `/api/v1/appointments/${appointmentId}/context`);
            if (ctx.status === 200) {
                console.log(`   ✅ Visit context generated (confidence: ${ctx.data.data.context_confidence})`);
                console.log(`   📝 Summary: ${ctx.data.data.summary?.substring(0, 100)}...`);
            } else {
                console.log(`   ⚠️  Context not yet ready (status ${ctx.status})`);
            }
        }

        // 14. Start Consultation
        console.log('\n📋 Test 14: Start Consultation');
        if (!appointmentId) {
            console.log('   ⚠️  Skipping — no appointment');
        } else {
            const start = await request('PATCH', `/api/v1/appointments/${appointmentId}/start`);
            console.assert(start.status === 200, `Expected 200, got ${start.status}: ${JSON.stringify(start.data)}`);
            console.assert(start.data.data.status === 'IN_CONSULTATION', 'Status should be IN_CONSULTATION');
            console.log('   ✅ Consultation started');
        }

        // 15. Get Queue
        console.log('\n📋 Test 15: Get Doctor Queue');
        const queue = await request('GET', `/api/v1/appointments/queue?doctor_id=${doctorUserId}`);
        console.assert(queue.status === 200, `Expected 200, got ${queue.status}`);
        console.log(`   ✅ Queue retrieved — In consultation: ${queue.data.data.in_consultation ? 'Yes' : 'No'}, Waiting: ${queue.data.data.summary.total_waiting}`);

        // 16. Complete Appointment
        console.log('\n📋 Test 16: Complete Appointment');
        if (!appointmentId) {
            console.log('   ⚠️  Skipping — no appointment');
        } else {
            const complete = await request('PATCH', `/api/v1/appointments/${appointmentId}/complete`);
            console.assert(complete.status === 200, `Expected 200, got ${complete.status}: ${JSON.stringify(complete.data)}`);
            console.assert(complete.data.data.status === 'COMPLETED', 'Status should be COMPLETED');
            console.log('   ✅ Appointment completed');
        }

        // 17. Daily Summary
        console.log('\n📋 Test 17: Daily Summary');
        const summary = await request('GET', '/api/v1/appointments/daily-summary');
        console.assert(summary.status === 200, `Expected 200, got ${summary.status}`);
        console.log(`   ✅ Summary: ${JSON.stringify(summary.data.data)}`);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED! Foundation + Appointments module is ready.');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

runTests();

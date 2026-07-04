# Defense Preparation — CareSync HMS

## "Why PostgreSQL over MongoDB for this domain?"

**Answer:** This system has deeply relational data. A patient → appointment → medical record → prescription → inventory transaction forms a chain that's naturally a join. Referrals link two departments, a doctor, a patient, and optionally a conversation — all interconnected. MongoDB would embed or manually reference these, leading to either data duplication or application-level joins that PostgreSQL handles natively with foreign keys, transactions, and indexed relations.

Additionally, we use PostgreSQL CHECK constraints (soft delete on medical_records, valid status transitions), unique partial indexes, and Prisma's type-safe queries — none of which MongoDB offers without a separate schema validator layer.

## "How do you prevent double-booking / race conditions?"

**Answer:** Two layers:
1. **Application-level:** When booking, we run `findFirst` for conflicting appointments in the same transaction as the `create`. If a conflicting slot exists, we throw before inserting.
2. **Transaction isolation:** Both checks and writes happen inside a Prisma `$transaction` with default read-committed isolation. PostgreSQL's internal locking on the row prevents two concurrent transactions from both seeing "no conflict" and inserting.

For **beds**, we use the same pattern: find an available bed → mark it occupied → create admission, all in one transaction.

## "How is the queue wait-time actually calculated?"

**Answer:**
1. Each doctor has a `consultDurationMin` field (default 15 min, configurable).
2. When a doctor completes an appointment, the frontend emits `appointment:complete` via Socket.io with the actual duration. The server maintains a rolling average of the last 10 completed durations per doctor.
3. Each patient's estimated wait = `position-in-queue × rolling-average-duration`. The queue position is the number of confirmed/pending appointments scheduled before theirs for that doctor on that day.
4. Updates are pushed via Socket.io — patients subscribed to `queue:{appointmentId}` receive live updates.

## "What happens if the SMS provider is down?"

**Answer:** The `NotificationProvider` interface has two implementations: `MockSmsProvider` (logs to console, always returns true) and `AfricasTalkingProvider`. The provider is selected via the `SMS_PROVIDER_MODE` env var (`mock`, `sandbox`, or `production`). If the real provider throws (network error, timeout), we catch it, log the error, and mark the notification as `failed` in the database — the appointment is still booked/applicable action still succeeds. SMS delivery is fire-and-forget, not a hard dependency. A background job could later retry failed notifications.

## "How do you know a patient can't view another patient's records?"

**Answer:** Every API endpoint that returns patient-specific data checks ownership:
- `GET /medical-records/my` resolves the patient profile from the authenticated user's JWT, then only queries records where `patientId` matches that profile. No parameter from the client specifies *which* patient.
- For `GET /medical-records/:id`, the patient role is checked server-side and only returns records belonging to that user.
- For doctor/admin endpoints, the JWT role is validated via `requireRoles()` middleware before the route handler runs.
- All of this is enforced server-side — the frontend never receives another patient's data regardless of what buttons are clicked.

## "How does a referral actually move a patient between departments — walk us through the data flow?"

**Answer:**
1. A doctor in Department A (e.g., General Medicine) creates a referral specifying the patient, target department, optional target doctor, and a clinical reason.
2. The system auto-creates a `Conversation` of type `case` linked to both the patient and the referral, with the referring and receiving doctors as participants.
3. The receiving department's staff/doctors see the referral in their referral inbox (filtered by `referredToDepartmentId`).
4. The receiving doctor can `accept` (updates status to `accepted`) or `decline` the referral.
5. Once the consultation is complete, they mark it `completed`.
6. The referring doctor sees status updates in real-time. The linked conversation persists so both sides can discuss the patient without leaving the system.

No actual patient row moves — the referral is a pointer linking patient → referring context → receiving context.

## "Why model messaging as generic conversations instead of a dedicated referral-comments table?"

**Answer:** Because messaging is used for more than referrals — direct messages between any two staff/doctors, department-wide broadcasts, and case discussions. A generic `Conversation` with a polymorphic `type` field (`direct`, `department`, `case`) and optional `relatedPatientId`/`relatedReferralId` lets us build one real-time messaging system with Socket.io that serves all use cases. A dedicated referral-comments table would duplicate the same infrastructure (participants, read receipts, attachments) and couldn't power the general internal chat feature.

## "How do you prevent double-booking a bed the way you prevent double-booking an appointment slot?"

**Answer:** Same pattern — a Prisma `$transaction`:
1. `findFirst` for an `available` bed in the selected ward.
2. Verify the patient has no existing `admitted` admission.
3. Update the bed status to `occupied`.
4. Create the admission record.

If two staff try to admit to the same ward simultaneously, only one will succeed because the `findFirst` → `update` on the bed row happens within a transaction; the second finds zero available beds and throws.

## "What's your testing strategy and coverage?"

**Answer:**
- **Unit tests (Vitest/Jest + Supertest):** Auth flows (register, login, refresh, duplicate email, invalid input), RBAC enforcement (patient hitting doctor-only route returns 403), appointment booking edge cases (past dates, invalid doctors), referral status transitions (can't skip from pending to completed).
- **Integration test:** The `test_api.py` script exercises every major API group end-to-end against a running instance with seeded data.
- **What's missing with more time:** Frontend component tests with React Testing Library, database-level stress tests for concurrent booking scenarios, and E2E tests with Playwright.

## "What would you change/add with more time?"

**Answer:**
1. **Real-time notifications** — push browser notifications via Service Workers + Web Push so clinicians get alerts even when the tab isn't open.
2. **HL7/FHIR interoperability** — expose a standards-compliant API layer so CareSync could integrate with Ghana's national health information exchanges.
3. **Mobile app** — React Native or a PWA with offline-first support for rural clinics with intermittent connectivity.
4. **NHIS live verification** — connect to the National Health Insurance Scheme API for real-time eligibility checks.
5. **Advanced queue prediction** — use ML on historical data (arrival patterns, seasonal disease trends) rather than a simple rolling average.
6. **Multi-language support** — i18n for Twi, Ga, Ewe, Hausa, etc.
7. **CI/CD pipeline** — GitHub Actions running tests, linting, and deploying to Render/Netlify on push.

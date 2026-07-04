-- ============================================================
-- Hospital Management System — Initial Schema Migration
-- Target: PostgreSQL 14+
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('mobile_money', 'card', 'cash', 'insurance');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('appointment_reminder', 'appointment_confirmation', 'record_update', 'system_alert');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');

-- ------------------------------------------------------------
-- USERS — shared authentication table for all roles
-- ------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);

-- ------------------------------------------------------------
-- PATIENTS — extends users where role = 'patient'
-- ------------------------------------------------------------
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth       DATE NOT NULL,
    gender              gender_type NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    address             TEXT,
    nhis_number         VARCHAR(30),
    emergency_contact   VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_nhis ON patients(nhis_number) WHERE nhis_number IS NOT NULL;

-- ------------------------------------------------------------
-- DOCTORS — extends users where role = 'doctor'
-- ------------------------------------------------------------
CREATE TABLE doctors (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization          VARCHAR(100) NOT NULL,
    license_number          VARCHAR(50) NOT NULL UNIQUE,
    bio                     TEXT,
    consult_duration_min    INTEGER NOT NULL DEFAULT 15 CHECK (consult_duration_min > 0),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- ------------------------------------------------------------
-- DOCTOR_AVAILABILITY — recurring weekly slots
-- ------------------------------------------------------------
CREATE TABLE doctor_availability (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    CONSTRAINT chk_availability_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id, day_of_week);

-- ------------------------------------------------------------
-- APPOINTMENTS
-- ------------------------------------------------------------
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    status          appointment_status NOT NULL DEFAULT 'pending',
    queue_position  INTEGER,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ------------------------------------------------------------
-- MEDICAL_RECORDS
-- ------------------------------------------------------------
CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id  UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    diagnosis       TEXT NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ -- soft delete for compliance/audit purposes
);

CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_doctor ON medical_records(doctor_id);

-- ------------------------------------------------------------
-- PRESCRIPTIONS
-- ------------------------------------------------------------
CREATE TABLE prescriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id   UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    medication          VARCHAR(150) NOT NULL,
    dosage              VARCHAR(100) NOT NULL,
    instructions        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_record ON prescriptions(medical_record_id);

-- ------------------------------------------------------------
-- DOCUMENTS — file attachments (lab results, scans, etc.)
-- ------------------------------------------------------------
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id   UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    file_url            TEXT NOT NULL,
    file_type           VARCHAR(50) NOT NULL,
    uploaded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_record ON documents(medical_record_id);

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id      UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    amount              DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    method              payment_method NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',
    transaction_ref     VARCHAR(100) UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_status ON payments(status);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    message         TEXT NOT NULL,
    status          notification_status NOT NULL DEFAULT 'queued',
    sent_at         TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ------------------------------------------------------------
-- AUDIT_LOGS — generic polymorphic audit trail
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,       -- e.g. 'VIEW', 'CREATE', 'UPDATE', 'DELETE'
    entity_type     VARCHAR(50) NOT NULL,       -- e.g. 'medical_records', 'appointments'
    entity_id       UUID NOT NULL,
    "timestamp"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- ------------------------------------------------------------
-- TRIGGER: auto-update `updated_at` columns
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- End of migration
-- ============================================================
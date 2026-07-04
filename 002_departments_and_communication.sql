-- ============================================================
-- Hospital Management System — Migration 002
-- Departments, Staff, Cross-Department Communication,
-- Admissions, Lab Workflow, Inventory
-- Target: PostgreSQL 14+   (run after 001_init_schema.sql)
-- ============================================================

-- ------------------------------------------------------------
-- ENUM ADDITIONS
-- ------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';

CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'completed', 'declined');
CREATE TYPE conversation_type AS ENUM ('direct', 'department', 'case');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE admission_status AS ENUM ('admitted', 'discharged');
CREATE TYPE lab_order_status AS ENUM ('ordered', 'in_progress', 'completed', 'cancelled');

-- ------------------------------------------------------------
-- DEPARTMENTS
-- ------------------------------------------------------------
CREATE TABLE departments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    head_doctor_id      UUID REFERENCES doctors(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link doctors to a department (nullable at first for backward compatibility)
ALTER TABLE doctors ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
CREATE INDEX idx_doctors_department ON doctors(department_id);

-- ------------------------------------------------------------
-- STAFF — nurses, lab techs, receptionists, pharmacists
-- ------------------------------------------------------------
CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    "position"      VARCHAR(100) NOT NULL, -- e.g. 'Nurse', 'Lab Technician', 'Pharmacist'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_department ON staff(department_id);

-- ------------------------------------------------------------
-- REFERRALS — structured cross-department patient handoff
-- ------------------------------------------------------------
CREATE TABLE referrals (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id                  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    referring_doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    referring_department_id     UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    referred_to_department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    referred_to_doctor_id       UUID REFERENCES doctors(id) ON DELETE SET NULL,
    reason                      TEXT NOT NULL,
    status                      referral_status NOT NULL DEFAULT 'pending',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_referral_departments_differ CHECK (referring_department_id <> referred_to_department_id)
);

CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_to_department ON referrals(referred_to_department_id);

-- ------------------------------------------------------------
-- CONVERSATIONS / MESSAGES — internal cross-department messaging
-- ------------------------------------------------------------
CREATE TABLE conversations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                    conversation_type NOT NULL DEFAULT 'direct',
    related_patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
    related_referral_id     UUID REFERENCES referrals(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    attachment_url      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

CREATE TABLE message_read_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (message_id, user_id)
);

-- ------------------------------------------------------------
-- WARDS / BEDS / ADMISSIONS — inpatient management
-- ------------------------------------------------------------
CREATE TABLE wards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    capacity        INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE beds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id         UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number      VARCHAR(20) NOT NULL,
    status          bed_status NOT NULL DEFAULT 'available',
    UNIQUE (ward_id, bed_number)
);

CREATE TABLE admissions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bed_id                  UUID NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    admitting_doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    admitted_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    discharged_at           TIMESTAMPTZ,
    reason                  TEXT NOT NULL,
    status                  admission_status NOT NULL DEFAULT 'admitted',
    CONSTRAINT chk_discharge_after_admission CHECK (discharged_at IS NULL OR discharged_at > admitted_at)
);

CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);

-- ------------------------------------------------------------
-- LAB ORDERS / RESULTS — diagnostics handoff between departments
-- ------------------------------------------------------------
CREATE TABLE lab_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ordering_doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id       UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT, -- typically "Laboratory" / "Radiology"
    test_name           VARCHAR(150) NOT NULL,
    status              lab_order_status NOT NULL DEFAULT 'ordered',
    ordered_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_department_status ON lab_orders(department_id, status);

CREATE TABLE lab_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id        UUID NOT NULL UNIQUE REFERENCES lab_orders(id) ON DELETE CASCADE,
    result_summary      TEXT NOT NULL,
    file_document_id    UUID REFERENCES documents(id) ON DELETE SET NULL,
    recorded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- INVENTORY — pharmacy/department stock, linked to prescriptions
-- ------------------------------------------------------------
CREATE TABLE inventory_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(150) NOT NULL,
    category                VARCHAR(50) NOT NULL, -- 'medication' | 'supply' | 'equipment'
    unit                    VARCHAR(20) NOT NULL, -- e.g. 'tablet', 'box', 'unit'
    quantity_in_stock       INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    reorder_level           INTEGER NOT NULL DEFAULT 10,
    department_id           UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE INDEX idx_inventory_department ON inventory_items(department_id);

CREATE TABLE inventory_transactions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id                     UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    change_quantity             INTEGER NOT NULL, -- positive = restock, negative = dispense
    reason                      VARCHAR(100) NOT NULL,
    related_prescription_id     UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    performed_by                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_txn_item ON inventory_transactions(item_id);

-- ------------------------------------------------------------
-- TRIGGERS for new updated_at columns
-- ------------------------------------------------------------
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- End of migration 002
-- ============================================================
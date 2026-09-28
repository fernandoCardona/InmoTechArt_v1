-- ============================================================
-- INMOTECHART v1 — Esquema PostgreSQL completo v2
-- Se ejecuta automáticamente la primera vez que arranca el contenedor.
-- ============================================================
-- ORDEN DE EJECUCIÓN:
--   1. Extensiones
--   2. Tipos ENUM
--   3. Función trigger updated_at
--   4. Tablas (en orden de dependencia FK)
--   5. Índices de rendimiento
--   6. Triggers updated_at
--   7. Schema para n8n
--   8. Seed: SuperAdmin inicial
-- ============================================================

-- ============================================================
-- 1. EXTENSIONES Y SCHEMAS LÓGICOS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS app_core;
CREATE SCHEMA IF NOT EXISTS assets;
CREATE SCHEMA IF NOT EXISTS n8n_flow;

-- ============================================================
-- 2. TIPOS ENUMERADOS (en app_core y assets)
-- ============================================================
CREATE TYPE app_core.user_role      AS ENUM ('SUPERADMIN', 'ADMIN', 'AGENT', 'READONLY');
CREATE TYPE app_core.device_status  AS ENUM ('PENDING', 'APPROVED', 'REVOKED');

CREATE TYPE assets.asset_cat_enum AS ENUM ('REO', 'WIP', 'SUELO', 'TERCIARIO', 'RESIDENCIAL');
CREATE TYPE assets.occupancy_enum AS ENUM (
    'LIBRE',
    'OKUPADO_CON_FECHA',
    'OKUPADO_SIN_FECHA',
    'LITIGIO_PENDIENTE',
    'DESCONOCIDO'
);
CREATE TYPE assets.batch_status   AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- ============================================================
-- 3. FUNCIÓN TRIGGER PARA updated_at AUTOMÁTICO
-- Sin esto, updated_at nunca se actualiza en PostgreSQL.
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABLAS
-- ============================================================

-- ----------------------------------------------------------
-- TABLA 1: USUARIOS (app_core)
-- Roles: SUPERADMIN > ADMIN > AGENT > READONLY
-- ----------------------------------------------------------
CREATE TABLE app_core.users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,              -- bcrypt con cost=12
    full_name     VARCHAR(150) NOT NULL,
    role          app_core.user_role    NOT NULL DEFAULT 'AGENT',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- TABLA 2: DISPOSITIVOS AUTORIZADOS (app_core)
-- ----------------------------------------------------------
CREATE TABLE app_core.authorized_devices (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID          NOT NULL REFERENCES app_core.users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(256)  NOT NULL,
    device_label       VARCHAR(100)  NOT NULL DEFAULT 'Dispositivo sin nombre',
    status             app_core.device_status NOT NULL DEFAULT 'PENDING',
    approved_by        UUID          REFERENCES app_core.users(id),
    approved_at        TIMESTAMPTZ,
    last_used_ip       VARCHAR(45),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device UNIQUE (user_id, device_fingerprint)
);

-- ----------------------------------------------------------
-- TABLA 3: SESIONES (app_core)
-- ----------------------------------------------------------
CREATE TABLE app_core.user_sessions (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES app_core.users(id) ON DELETE CASCADE,
    device_id     UUID         REFERENCES app_core.authorized_devices(id),
    session_token VARCHAR(512) UNIQUE NOT NULL,
    ip_address    VARCHAR(45)  NOT NULL,
    user_agent    TEXT         NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- TABLA 4: LOG DE AUDITORÍA (app_core)
-- ----------------------------------------------------------
CREATE TABLE app_core.access_audit_logs (
    id                 BIGSERIAL    PRIMARY KEY,
    user_id            UUID         REFERENCES app_core.users(id),
    ip_address         VARCHAR(45)  NOT NULL,
    device_fingerprint VARCHAR(256),
    action             VARCHAR(100) NOT NULL,
    endpoint           VARCHAR(512),
    http_method        VARCHAR(10),
    was_successful     BOOLEAN      NOT NULL,
    failure_reason     VARCHAR(512),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- TABLA 5: PROVEEDORES (assets)
-- ----------------------------------------------------------
CREATE TABLE assets.providers (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) UNIQUE NOT NULL,
    code          VARCHAR(50)  UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    notes         TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- TABLA 6: LOTES DE IMPORTACIÓN (assets)
-- ----------------------------------------------------------
CREATE TABLE assets.import_batches (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id      UUID         NOT NULL REFERENCES assets.providers(id),
    file_name        VARCHAR(512) NOT NULL,
    file_hash        VARCHAR(128),
    records_received INT          NOT NULL DEFAULT 0,
    records_inserted INT          NOT NULL DEFAULT 0,
    records_updated  INT          NOT NULL DEFAULT 0,
    records_purged   INT          NOT NULL DEFAULT 0,
    records_failed   INT          NOT NULL DEFAULT 0,
    status           assets.batch_status NOT NULL DEFAULT 'PROCESSING',
    error_log        TEXT,
    executed_by      UUID         REFERENCES app_core.users(id),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at      TIMESTAMPTZ
);

-- ----------------------------------------------------------
-- TABLA 7: INMUEBLES — Tabla maestra (assets)
-- ----------------------------------------------------------
CREATE TABLE assets.properties (
    id                           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id                  UUID           NOT NULL REFERENCES assets.providers(id),
    asset_code_provider          VARCHAR(100),
    cadastral_reference          VARCHAR(20),
    registry_code                VARCHAR(100),
    asset_category               assets.asset_cat_enum NOT NULL DEFAULT 'REO',
    asset_type                   VARCHAR(100)   NOT NULL,
    usage                        VARCHAR(100),
    autonomous_community         VARCHAR(100),
    province                     VARCHAR(100)   NOT NULL,
    municipality                 VARCHAR(100)   NOT NULL,
    postal_code                  VARCHAR(10)    NOT NULL,
    address                      TEXT           NOT NULL,
    floor_door                   VARCHAR(50),
    price_pvp                    NUMERIC(14,2)  NOT NULL,
    price_subject_approval       BOOLEAN        NOT NULL DEFAULT FALSE,
    commercial_channel           VARCHAR(100),
    occupancy_status             assets.occupancy_enum NOT NULL DEFAULT 'DESCONOCIDO',
    legal_phase_sae              TEXT,
    land_area_m2                 NUMERIC(12,2),
    buildability_above_ground_m2 NUMERIC(12,2),
    buildability_below_ground_m2 NUMERIC(12,2),
    units_count                  INT            NOT NULL DEFAULT 1,
    units_protected              INT            NOT NULL DEFAULT 0,
    detailed_buildability        JSONB          NOT NULL DEFAULT '{}'::jsonb,
    is_active                    BOOLEAN        NOT NULL DEFAULT TRUE,
    last_seen_in_batch_id        UUID           REFERENCES assets.import_batches(id),
    raw_metadata                 JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================
CREATE INDEX idx_sessions_user_active  ON app_core.user_sessions (user_id, is_active);
CREATE INDEX idx_sessions_token        ON app_core.user_sessions (session_token) WHERE is_active = TRUE;
CREATE INDEX idx_devices_fingerprint   ON app_core.authorized_devices (device_fingerprint);
CREATE INDEX idx_devices_user_status   ON app_core.authorized_devices (user_id, status);
CREATE INDEX idx_audit_user_date       ON app_core.access_audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_ip              ON app_core.access_audit_logs (ip_address, created_at DESC);

CREATE INDEX idx_prop_provider_active   ON assets.properties (provider_id, is_active);
CREATE INDEX idx_prop_municipality      ON assets.properties (LOWER(municipality));
CREATE INDEX idx_prop_postal_code       ON assets.properties (postal_code);
CREATE INDEX idx_prop_province          ON assets.properties (LOWER(province));
CREATE INDEX idx_prop_price             ON assets.properties (price_pvp);
CREATE INDEX idx_prop_category          ON assets.properties (asset_category, is_active);
CREATE INDEX idx_prop_occupancy         ON assets.properties (occupancy_status, is_active);
CREATE INDEX idx_prop_cadastral         ON assets.properties (cadastral_reference) WHERE cadastral_reference IS NOT NULL;
CREATE INDEX idx_prop_provider_code     ON assets.properties (provider_id, asset_code_provider) WHERE asset_code_provider IS NOT NULL;
CREATE INDEX idx_prop_active_main_filter ON assets.properties (is_active, province, municipality, price_pvp);
CREATE INDEX idx_batches_provider_status ON assets.import_batches (provider_id, status);

-- ============================================================
-- 6. TRIGGERS DE updated_at
-- ============================================================
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON app_core.users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_providers_updated_at
    BEFORE UPDATE ON assets.providers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_properties_updated_at
    BEFORE UPDATE ON assets.properties
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 7. SCHEMA PARA N8N
-- OBLIGATORIO: n8n necesita este schema para almacenar sus
-- tablas internas (workflows, executions, credentials).
-- Referenciado en docker-compose como DB_POSTGRESDB_SCHEMA=n8n_flow
-- ============================================================
CREATE SCHEMA IF NOT EXISTS n8n_flow;
-- El usuario de la BD ya tiene permisos sobre este schema al ser owner.

-- ============================================================
-- 8. SEED: SUPERADMIN INICIAL
-- ⚠️  SEGURIDAD CRÍTICA:
--   - El hash está comentado: debes generarlo tú con el comando de abajo.
--   - Cambia la contraseña en el PRIMER LOGIN.
--   - Comando para generar el hash:
--     node -e "const b=require('bcryptjs'); b.hash('ChangeMe123!',12).then(h=>console.log(h))"
--   - Reemplaza el placeholder con el hash real antes de arrancar.
-- ============================================================
INSERT INTO app_core.users (email, password_hash, full_name, role)
VALUES (
    'fernandocardonatoro@gmail.com',
    '$2b$12$HMdM5kequhAHbY/Xj2ZYM.6IVSsHsre3f9PhebQ4b8We9j/4CON66',
    'Fernando Cardona',
    'SUPERADMIN'
) ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
--
-- INSTRUCCIONES DE PRIMER ARRANQUE:
--   1. Genera el hash bcrypt con el comando de arriba.
--   2. Descomenta las 7 líneas del INSERT de arriba.
--   3. Reemplaza el placeholder con el hash real.
--   4. Levanta el contenedor: docker-compose ... up -d
--   5. Accede con email: admin@inmotechart.local
--   6. Cambia la contraseña INMEDIATAMENTE desde el panel de admin.
--   7. Vuelve a comentar el INSERT (o elimínalo) para evitar re-ejecuciones.

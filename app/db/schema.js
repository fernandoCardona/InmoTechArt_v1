import { pgSchema, uuid, varchar, text, boolean, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

export const appCore = pgSchema('app_core');
export const assetsSchema = pgSchema('assets');

// ============================================================
// APP CORE SCHEMA
// ============================================================

export const users = appCore.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('AGENT'),
  locale: varchar('locale', { length: 5 }).notNull().default('es'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authorizedDevices = appCore.table('authorized_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceFingerprint: varchar('device_fingerprint', { length: 256 }).notNull(),
  deviceLabel: varchar('device_label', { length: 100 }).notNull().default('Dispositivo sin nombre'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  lastUsedIp: varchar('last_used_ip', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = appCore.table('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid('device_id').references(() => authorizedDevices.id),
  sessionToken: varchar('session_token', { length: 512 }).unique().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(),
});

export const accessAuditLogs = appCore.table('access_audit_logs', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  deviceFingerprint: varchar('device_fingerprint', { length: 256 }),
  action: varchar('action', { length: 100 }).notNull(),
  endpoint: varchar('endpoint', { length: 512 }),
  httpMethod: varchar('http_method', { length: 10 }),
  wasSuccessful: boolean('was_successful').notNull(),
  failureReason: varchar('failure_reason', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// ASSETS SCHEMA
// ============================================================

export const searchHistory = appCore.table('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  searchQuery: varchar('search_query', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const providers = assetsSchema.table('providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).unique().notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const importBatches = assetsSchema.table('import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  fileName: varchar('file_name', { length: 512 }).notNull(),
  fileHash: varchar('file_hash', { length: 128 }),
  recordsReceived: integer('records_received').notNull().default(0),
  recordsInserted: integer('records_inserted').notNull().default(0),
  recordsUpdated: integer('records_updated').notNull().default(0),
  recordsPurged: integer('records_purged').notNull().default(0),
  recordsFailed: integer('records_failed').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('PROCESSING'),
  errorLog: text('error_log'),
  executedBy: uuid('executed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const properties = assetsSchema.table('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(), // Equivalente a 'proveedor' relacional
  
  // Identificadores
  referenciaProveedor: varchar('referencia_proveedor', { length: 100 }),
  referenciaCatastral: varchar('referencia_catastral', { length: 50 }),
  fincasRegistrales: varchar('fincas_registrales', { length: 100 }),
  
  // Ubicación y Geografía
  ccaa: varchar('ccaa', { length: 100 }),
  provincia: varchar('provincia', { length: 100 }).notNull(),
  municipio: varchar('municipio', { length: 150 }).notNull(),
  direccion: varchar('direccion', { length: 255 }),
  codigoPostal: varchar('codigo_postal', { length: 10 }),
  
  // Clasificación y Tipología
  tipoActivo: varchar('tipo_activo', { length: 100 }),
  subtipoTipologia: varchar('subtipo_tipologia', { length: 100 }),
  usoUrbanistico: varchar('uso_urbanistico', { length: 100 }),
  clasificacionSuelo: varchar('clasificacion_suelo', { length: 100 }),
  
  // Economía y Comercialización
  precioVenta: numeric('precio_venta', { precision: 12, scale: 2 }).notNull().default('0'),
  porcentajeParticipacion: varchar('porcentaje_participacion', { length: 50 }),
  modalidadComercial: varchar('modalidad_comercial', { length: 100 }),
  
  // Estado Legal / Posesorio
  faseJudicialOcupacion: varchar('fase_judicial_ocupacion', { length: 150 }),
  
  // Datos técnicos de Suelos y Obras
  superficieSueloM2: numeric('superficie_suelo_m2', { precision: 12, scale: 2 }),
  edificabilidadSobreRasanteM2: numeric('edificabilidad_sobre_rasante_m2', { precision: 12, scale: 2 }),
  edificabilidadBajoRasanteM2: numeric('edificabilidad_bajo_rasante_m2', { precision: 12, scale: 2 }),
  numViviendas: integer('num_viviendas'),
  
  // Metadata del sistema
  isActive: boolean('is_active').notNull().default(true),
  lastSeenInBatchId: uuid('last_seen_in_batch_id').references(() => importBatches.id),
  rawMetadata: jsonb('raw_metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


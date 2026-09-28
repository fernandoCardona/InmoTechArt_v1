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
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  assetCodeProvider: varchar('asset_code_provider', { length: 100 }),
  cadastralReference: varchar('cadastral_reference', { length: 20 }),
  registryCode: varchar('registry_code', { length: 100 }),
  assetCategory: varchar('asset_category', { length: 50 }).notNull().default('REO'),
  assetType: varchar('asset_type', { length: 100 }).notNull(),
  usage: varchar('usage', { length: 100 }),
  autonomousCommunity: varchar('autonomous_community', { length: 100 }),
  province: varchar('province', { length: 100 }).notNull(),
  municipality: varchar('municipality', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  address: text('address').notNull(),
  floorDoor: varchar('floor_door', { length: 50 }),
  pricePvp: numeric('price_pvp', { precision: 14, scale: 2 }).notNull(),
  priceSubjectApproval: boolean('price_subject_approval').notNull().default(false),
  commercialChannel: varchar('commercial_channel', { length: 100 }),
  occupancyStatus: varchar('occupancy_status', { length: 50 }).notNull().default('DESCONOCIDO'),
  legalPhaseSae: text('legal_phase_sae'),
  landAreaM2: numeric('land_area_m2', { precision: 12, scale: 2 }),
  buildabilityAboveGroundM2: numeric('buildability_above_ground_m2', { precision: 12, scale: 2 }),
  buildabilityBelowGroundM2: numeric('buildability_below_ground_m2', { precision: 12, scale: 2 }),
  unitsCount: integer('units_count').notNull().default(1),
  unitsProtected: integer('units_protected').notNull().default(0),
  detailedBuildability: jsonb('detailed_buildability').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  lastSeenInBatchId: uuid('last_seen_in_batch_id').references(() => importBatches.id),
  rawMetadata: jsonb('raw_metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

CREATE SCHEMA "app_core";
--> statement-breakpoint
CREATE SCHEMA "assets";
--> statement-breakpoint
CREATE TABLE "app_core"."access_audit_logs" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"ip_address" varchar(45) NOT NULL,
	"device_fingerprint" varchar(256),
	"action" varchar(100) NOT NULL,
	"endpoint" varchar(512),
	"http_method" varchar(10),
	"was_successful" boolean NOT NULL,
	"failure_reason" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_core"."authorized_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_fingerprint" varchar(256) NOT NULL,
	"device_label" varchar(100) DEFAULT 'Dispositivo sin nombre' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"last_used_ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets"."import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"file_hash" varchar(128),
	"records_received" integer DEFAULT 0 NOT NULL,
	"records_inserted" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"records_purged" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'PROCESSING' NOT NULL,
	"error_log" text,
	"executed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assets"."properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"referencia_proveedor" varchar(100),
	"referencia_catastral" varchar(50),
	"fincas_registrales" varchar(100),
	"ccaa" varchar(100),
	"provincia" varchar(100) NOT NULL,
	"municipio" varchar(150) NOT NULL,
	"direccion" varchar(255),
	"codigo_postal" varchar(10),
	"tipo_activo" varchar(100),
	"subtipo_tipologia" varchar(100),
	"uso_urbanistico" varchar(100),
	"clasificacion_suelo" varchar(100),
	"precio_venta" numeric(12, 2) DEFAULT '0' NOT NULL,
	"porcentaje_participacion" varchar(50),
	"modalidad_comercial" varchar(100),
	"fase_judicial_ocupacion" varchar(150),
	"superficie_suelo_m2" numeric(12, 2),
	"edificabilidad_sobre_rasante_m2" numeric(12, 2),
	"edificabilidad_bajo_rasante_m2" numeric(12, 2),
	"num_viviendas" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_in_batch_id" uuid,
	"raw_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets"."providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"contact_email" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_name_unique" UNIQUE("name"),
	CONSTRAINT "providers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "app_core"."search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"search_query" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_core"."user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" uuid,
	"session_token" varchar(512) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "app_core"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"role" varchar(50) DEFAULT 'AGENT' NOT NULL,
	"locale" varchar(5) DEFAULT 'es' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "app_core"."access_audit_logs" ADD CONSTRAINT "access_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_core"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."authorized_devices" ADD CONSTRAINT "authorized_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."authorized_devices" ADD CONSTRAINT "authorized_devices_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "app_core"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets"."import_batches" ADD CONSTRAINT "import_batches_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "assets"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets"."import_batches" ADD CONSTRAINT "import_batches_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "app_core"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets"."properties" ADD CONSTRAINT "properties_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "assets"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets"."properties" ADD CONSTRAINT "properties_last_seen_in_batch_id_import_batches_id_fk" FOREIGN KEY ("last_seen_in_batch_id") REFERENCES "assets"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."user_sessions" ADD CONSTRAINT "user_sessions_device_id_authorized_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "app_core"."authorized_devices"("id") ON DELETE no action ON UPDATE no action;
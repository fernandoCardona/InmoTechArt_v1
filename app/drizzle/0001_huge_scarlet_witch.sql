CREATE TABLE "app_core"."asset_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"match_score" integer,
	"match_reason" text,
	"status" varchar(50) DEFAULT 'SUGGESTED',
	"is_new" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_core"."client_search_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"provincia" varchar(100),
	"tipo_activo" varchar(100),
	"presupuesto_maximo" numeric(12, 2),
	"descripcion_ia" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_core"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_core"."asset_matches" ADD CONSTRAINT "asset_matches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "app_core"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."asset_matches" ADD CONSTRAINT "asset_matches_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "assets"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."client_search_profiles" ADD CONSTRAINT "client_search_profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "app_core"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_core"."clients" ADD CONSTRAINT "clients_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "app_core"."users"("id") ON DELETE no action ON UPDATE no action;
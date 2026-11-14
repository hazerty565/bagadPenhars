CREATE TYPE "public"."notification_audience" AS ENUM('all', 'pupitre', 'profiles');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"association_name" varchar(200) DEFAULT 'Bagad Penhars' NOT NULL,
	"contact_email" varchar(255) DEFAULT '' NOT NULL,
	"contact_address" text DEFAULT '' NOT NULL,
	"website" varchar(255) DEFAULT '' NOT NULL,
	"notify_on_event_create" boolean DEFAULT true NOT NULL,
	"notify_reminder_days" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_pupitres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"pupitre_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"audience" "notification_audience" DEFAULT 'all' NOT NULL,
	"sent_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"onesignal_player_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_onesignal_player_id_unique" UNIQUE("onesignal_player_id")
);
--> statement-breakpoint
DROP INDEX "profiles_email_idx";--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "album_date" date DEFAULT current_date NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "excerpt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_name" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location" varchar(200) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "first_name" varchar(100) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "last_name" varchar(100) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "last_sent_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "public_url" varchar(500);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "alt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "caption" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "global_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_profiles" ADD CONSTRAINT "notification_profiles_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_profiles" ADD CONSTRAINT "notification_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_pupitres" ADD CONSTRAINT "notification_pupitres_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_pupitres" ADD CONSTRAINT "notification_pupitres_pupitre_id_pupitres_id_fk" FOREIGN KEY ("pupitre_id") REFERENCES "public"."pupitres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_by_profiles_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_profiles_notification_id_idx" ON "notification_profiles" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_profiles_profile_id_idx" ON "notification_profiles" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_profiles_notification_profile_unique" ON "notification_profiles" USING btree ("notification_id","profile_id");--> statement-breakpoint
CREATE INDEX "notification_pupitres_notification_id_idx" ON "notification_pupitres" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_pupitres_pupitre_id_idx" ON "notification_pupitres" USING btree ("pupitre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_pupitres_notification_pupitre_unique" ON "notification_pupitres" USING btree ("notification_id","pupitre_id");--> statement-breakpoint
CREATE INDEX "notification_reads_notification_id_idx" ON "notification_reads" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_reads_profile_id_idx" ON "notification_reads" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_reads_notification_profile_unique" ON "notification_reads" USING btree ("notification_id","profile_id");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_sent_by_idx" ON "notifications" USING btree ("sent_by");--> statement-breakpoint
CREATE INDEX "notifications_audience_idx" ON "notifications" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "push_subscriptions_profile_id_idx" ON "push_subscriptions" USING btree ("profile_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_bureau_position_id_bureau_positions_id_fk" FOREIGN KEY ("bureau_position_id") REFERENCES "public"."bureau_positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_pupitres_event_id_pupitre_id_unique" ON "event_pupitres" USING btree ("event_id","pupitre_id");--> statement-breakpoint
CREATE INDEX "events_cancelled_at_idx" ON "events" USING btree ("cancelled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pupitres_invitation_id_pupitre_id_unique" ON "invitation_pupitres" USING btree ("invitation_id","pupitre_id");--> statement-breakpoint
CREATE INDEX "invitations_pending_email_idx" ON "invitations" USING btree ("email") WHERE "invitations"."accepted_at" is null and "invitations"."cancelled_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_pupitres_profile_id_pupitre_id_unique" ON "profile_pupitres" USING btree ("profile_id","pupitre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_unique" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "profiles_bureau_position_id_idx" ON "profiles" USING btree ("bureau_position_id");
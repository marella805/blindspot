CREATE TYPE "public"."category" AS ENUM('career', 'financial', 'relationship', 'health', 'education', 'housing', 'business', 'personal_growth', 'other');--> statement-breakpoint
CREATE TYPE "public"."coaching_style" AS ENUM('advisor', 'supporter', 'critic');--> statement-breakpoint
CREATE TYPE "public"."interval_label" AS ENUM('1mo', '3mo', '6mo', '9mo', '12mo', '18mo', '24mo', '36mo');--> statement-breakpoint
CREATE TYPE "public"."interval_type" AS ENUM('standard', 'custom');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "decision_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"label" text NOT NULL,
	"pros" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"category" "category" NOT NULL,
	"interrogation_count" integer DEFAULT 0 NOT NULL,
	"chosen_option_id" uuid,
	"reasoning" text,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interrogation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"coaching_style" "coaching_style" NOT NULL,
	"appeal_note" text,
	"profile_snapshot" jsonb,
	"turns" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pattern_alert_decisions" (
	"pattern_alert_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	CONSTRAINT "pattern_alert_decisions_pattern_alert_id_decision_id_pk" PRIMARY KEY("pattern_alert_id","decision_id")
);
--> statement-breakpoint
CREATE TABLE "pattern_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pattern_type_id" uuid NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"dismissed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pattern_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"detection_threshold" integer DEFAULT 3 NOT NULL,
	CONSTRAINT "pattern_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"interrogation_session_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"rationale" text NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"scheduled_for" date NOT NULL,
	"interval_type" interval_type NOT NULL,
	"interval_label" interval_label,
	"custom_interval_days" integer,
	"completed_at" timestamp,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"name" text,
	"image" text,
	"initials" text,
	"role" text,
	"decision_context" text,
	"profile_answers" jsonb,
	"onboarding_completed_at" timestamp,
	"calibration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_options" ADD CONSTRAINT "decision_options_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interrogation_sessions" ADD CONSTRAINT "interrogation_sessions_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_alert_decisions" ADD CONSTRAINT "pattern_alert_decisions_pattern_alert_id_pattern_alerts_id_fk" FOREIGN KEY ("pattern_alert_id") REFERENCES "public"."pattern_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_alert_decisions" ADD CONSTRAINT "pattern_alert_decisions_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_alerts" ADD CONSTRAINT "pattern_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_alerts" ADD CONSTRAINT "pattern_alerts_pattern_type_id_pattern_types_id_fk" FOREIGN KEY ("pattern_type_id") REFERENCES "public"."pattern_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_interrogation_session_id_interrogation_sessions_id_fk" FOREIGN KEY ("interrogation_session_id") REFERENCES "public"."interrogation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;
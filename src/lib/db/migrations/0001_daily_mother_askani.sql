CREATE TABLE "token_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" text NOT NULL,
	"route" text NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"estimated_cost_usd" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

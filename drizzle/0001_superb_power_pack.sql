CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt" timestamp DEFAULT now(),
	"blocked_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "verification_tokens" ALTER COLUMN "token" SET DATA TYPE varchar(6);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "email" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "used" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification_tokens" DROP COLUMN "identifier";--> statement-breakpoint
ALTER TABLE "verification_tokens" DROP COLUMN "expires";
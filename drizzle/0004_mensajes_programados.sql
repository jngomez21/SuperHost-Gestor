CREATE TYPE "public"."message_trigger" AS ENUM('booked', 'check_in', 'check_out');--> statement-breakpoint
CREATE TABLE "message_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" text NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"trigger" "message_trigger" NOT NULL,
	"day_offset" integer DEFAULT 0 NOT NULL,
	"send_time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_template_timing" CHECK (("message_template"."trigger" = 'booked' and "message_template"."send_time" is null and "message_template"."day_offset" = 0)
        or ("message_template"."trigger" <> 'booked' and "message_template"."send_time" is not null)),
	CONSTRAINT "message_template_day_offset_range" CHECK ("message_template"."day_offset" between -30 and 30)
);
--> statement-breakpoint
CREATE TABLE "reservation_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"template_id" uuid,
	"name" text NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"body" text,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"reminded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_message_sent_keeps_body" CHECK ("reservation_message"."sent_at" is null or "reservation_message"."body" is not null),
	CONSTRAINT "reservation_message_has_text" CHECK ("reservation_message"."template_id" is not null or "reservation_message"."body" is not null)
);
--> statement-breakpoint
ALTER TABLE "reservation" ALTER COLUMN "guest_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_template" ADD CONSTRAINT "message_template_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_message" ADD CONSTRAINT "reservation_message_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_message" ADD CONSTRAINT "reservation_message_template_id_message_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_template"("id") ON DELETE set null ON UPDATE no action;
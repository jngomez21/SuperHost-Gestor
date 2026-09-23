CREATE TABLE "preparation_check" (
	"reservation_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preparation_check_reservation_id_task_id_pk" PRIMARY KEY("reservation_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "property_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preparation_check" ADD CONSTRAINT "preparation_check_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preparation_check" ADD CONSTRAINT "preparation_check_task_id_property_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."property_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_task" ADD CONSTRAINT "property_task_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;
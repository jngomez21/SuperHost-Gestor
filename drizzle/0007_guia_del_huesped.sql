CREATE TABLE "property_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"distance" text,
	"note" text,
	"maps_query" text,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "arrival_info" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "tv_info" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "house_rules" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "house_guide" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "amenities" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "trash_info" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "checkout_list" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "emergency_info" text;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "transport_info" text;--> statement-breakpoint
ALTER TABLE "property_photo" ADD CONSTRAINT "property_photo_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_place" ADD CONSTRAINT "property_place_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;
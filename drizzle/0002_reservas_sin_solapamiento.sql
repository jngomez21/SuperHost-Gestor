-- Dos reservas activas del mismo piso no pueden cruzarse. El rango es [llegada, salida):
-- un huésped puede llegar el mismo día en que sale el anterior. Las canceladas no bloquean.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_no_overlap"
  EXCLUDE USING gist (
    "property_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
  ) WHERE ("cancelled_at" IS NULL);

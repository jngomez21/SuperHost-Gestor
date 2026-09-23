import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, primaryKey, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./auth-schema";

export const propertyTable = pgTable("property", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: text("host_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  wifiName: text("wifi_name"),
  wifiPassword: text("wifi_password"),
  accessInstructions: text("access_instructions"),
  checkInTime: time("check_in_time").notNull().default("15:00"),
  checkOutTime: time("check_out_time").notNull().default("11:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// El bloqueo de solapamientos (EXCLUDE ... USING gist) vive en la migración 0002:
// Drizzle no sabe expresar restricciones EXCLUDE en el esquema.
export const reservationTable = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => propertyTable.id, { onDelete: "restrict" }),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone"),
    guestCount: integer("guest_count").notNull().default(1),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("reservation_dates_ordered", sql`${t.checkOut} > ${t.checkIn}`),
    check("reservation_guest_count_positive", sql`${t.guestCount} > 0`),
  ]
);

export const reservationNoteTable = pgTable("reservation_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservationTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const propertyTaskTable = pgTable("property_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => propertyTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preparationCheckTable = pgTable(
  "preparation_check",
  {
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservationTable.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => propertyTaskTable.id, { onDelete: "cascade" }),
    doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.reservationId, t.taskId] })]
);

import { sql } from "drizzle-orm";
import { check, date, integer, pgEnum, pgTable, primaryKey, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
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
    // Opcional: Airbnb no comparte el email del huésped (ADR-006).
    guestEmail: text("guest_email"),
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

export const messageTriggerEnum = pgEnum("message_trigger", ["booked", "check_in", "check_out"]);

// "booked" toca al registrar la reserva, sin hora. El resto, `day_offset` días
// respecto a la llegada o la salida, a `send_time` en hora de Colombia.
export const messageTemplateTable = pgTable(
  "message_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: text("host_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    body: text("body").notNull(),
    trigger: messageTriggerEnum("trigger").notNull(),
    dayOffset: integer("day_offset").notNull().default(0),
    sendTime: time("send_time"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "message_template_timing",
      sql`(${t.trigger} = 'booked' and ${t.sendTime} is null and ${t.dayOffset} = 0)
        or (${t.trigger} <> 'booked' and ${t.sendTime} is not null)`
    ),
    check("message_template_day_offset_range", sql`${t.dayOffset} between -30 and 30`),
  ]
);

// Un mensaje por plantilla, programado al registrar la reserva: nombre y hora se fijan
// entonces. `body` es el texto final (editado por el host o el que se marcó enviado);
// mientras sea null, el texto se rellena desde la plantilla al mostrarlo.
export const reservationMessageTable = pgTable(
  "reservation_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservationTable.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => messageTemplateTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    body: text("body"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("reservation_message_sent_keeps_body", sql`${t.sentAt} is null or ${t.body} is not null`),
    // Borrar una plantilla falla si deja mensajes sin texto que mostrar: antes hay que quitarlos.
    check("reservation_message_has_text", sql`${t.templateId} is not null or ${t.body} is not null`),
  ]
);

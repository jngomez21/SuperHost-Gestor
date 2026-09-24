// Tarea 5.15: borra los pisos de prueba del host (y con ellos sus reservas, mensajes, notas y
// preparaciones) y crea "Bosque apartment" con su guía. Todo en una transacción: o todo o nada.
// Lugares cercanos reales de OpenStreetMap (distancias en línea recta desde el edificio). Wifi,
// TV, normas y demás son datos de ejemplo: se corrigen desde "Guía" en la app.
import { neon } from "@neondatabase/serverless";
import { STANDARD_TASKS } from "../src/domain/housekeeping/checklist.ts";

const sql = neon(process.env.DATABASE_URL);

const [host] = await sql`select id from "user" where email = ${process.env.HOST_EMAIL}`;
if (!host) throw new Error(`No hay usuario con HOST_EMAIL (${process.env.HOST_EMAIL}). Entra una vez en la app antes.`);
const [column] = await sql`select 1 from information_schema.columns where table_name = 'property' and column_name = 'tv_info'`;
if (!column) throw new Error("Falta la migración 0007: ejecuta antes npm run db:migrate.");

const lines = (...items) => items.join("\n");
const id = crypto.randomUUID();

const property = {
  name: "Bosque apartment",
  address: "Cra. 23 #25-06, Bosque Central, piso 1, apto 111, El Bosque, Floridablanca, Santander",
  latitude: 7.0726714,
  longitude: -73.1112428,
  wifiName: "BosqueApto111",
  wifiPassword: "Bosque2026*",
  tvInfo: lines(
    'Smart TV de 50" en la sala con Netflix, YouTube y Prime Video: entra con tu cuenta y cierra sesión al salir.',
    "TV por cable: Caracol, RCN, Canal TRO, ESPN y Discovery, entre otros.",
    "El control negro enciende el TV; el gris, el decodificador."
  ),
  arrivalInfo: lines(
    "Bosque Central queda en la Carrera 23 con Calle 25, en El Bosque (Floridablanca), justo al lado de la Clínica Foscal.",
    "En la portería (24 horas) di tu nombre y que vienes al apartamento 111, en el piso 1.",
    "Si llegas en carro, pregunta en portería por el parqueadero de visitantes."
  ),
  accessInstructions: "La llave está en la caja de seguridad junto a la puerta del 111. Código: 4821.",
  houseRules: lines(
    "No se fuma dentro del apartamento ni en el balcón.",
    "Silencio de 10:00 p. m. a 7:00 a. m.: es un conjunto residencial.",
    "Sin fiestas ni eventos, y solo los huéspedes de la reserva.",
    "No se admiten mascotas.",
    "Las visitas se registran en portería."
  ),
  houseGuide: lines(
    "Agua caliente: el calentador es a gas; abre el grifo hacia la izquierda y espera unos segundos.",
    "Ventiladores: hay uno en cada habitación.",
    'Lavadora: en la zona de ropas, programa "Rápido" (30 min). El detergente está en el mueble de arriba.',
    "Cocina: estufa a gas; cierra la llave de paso al salir."
  ),
  amenities: lines(
    "Toallas y ropa de cama", "Secador de pelo", "Plancha y tabla", "Utensilios de cocina y vajilla",
    "Nevera y microondas", "Cafetera y café", "Lavadora", "Wifi de fibra", "Smart TV", "Escritorio para trabajar"
  ),
  trashInfo: lines(
    "Separa la basura: bolsa blanca para lo aprovechable (plástico, cartón, vidrio) y bolsa negra para lo demás.",
    "El cuarto de basuras está en el sótano, junto a los ascensores."
  ),
  checkoutList: lines(
    "Deja la llave en la caja de seguridad.",
    "Apaga luces, ventiladores y el TV.",
    "Cierra las ventanas y la puerta del balcón.",
    "Saca la basura al cuarto de basuras.",
    "Deja las toallas usadas en el baño.",
    "Revisa que no olvidas nada: cargadores, documentos."
  ),
  transportInfo: lines(
    "Metrolínea: la estación Molinos está a unos 430 m (5 min a pie), sobre la Autopista Floridablanca; la estación Cañaveral, a unos 650 m.",
    "Taxis y apps (Uber, DiDi, InDrive) funcionan bien en la zona.",
    "Desde el aeropuerto Palonegro, entre 40 y 50 minutos en taxi según el tráfico."
  ),
  emergencyInfo: lines(
    "Clínica Foscal: urgencias 24 horas, al lado del conjunto (unos 150 m).",
    "Fundación Cardiovascular de Colombia (FCV): a unos 140 m.",
    "Emergencias: 123. Bomberos: 119. Cruz Roja: 132."
  ),
};

// [nombre, tipo, distancia, nota, coordenadas para "Cómo llegar"]
const places = [
  ["Clínica Foscal", "Salud", "150 m · 2 min a pie", "Urgencias 24 horas.", "7.0733049,-73.1100252"],
  ["Fundación Cardiovascular de Colombia (FCV)", "Salud", "140 m · 2 min a pie", "Clínica especializada en corazón.", "7.0726775,-73.1100005"],
  ["Jumbo", "Supermercado", "310 m · 4 min a pie", "Mercado completo.", "7.0744132,-73.1090935"],
  ["D1", "Supermercado", "570 m · 7 min a pie", "Para lo básico, a buen precio.", "7.0695096,-73.1071305"],
  ["Farmatodo", "Farmacia", "470 m · 6 min a pie", null, "7.0695971,-73.1141365"],
  ["Cruz Verde", "Farmacia", "490 m · 6 min a pie", null, "7.0706076,-73.1072839"],
  ["Centro Comercial Cañaveral", "Compras", "530 m · 7 min a pie", "Tiendas, bancos y restaurantes.", "7.0707909,-73.1068095"],
  ["Centro Comercial Parque Caracolí", "Compras", "690 m · 9 min a pie", "Centro comercial grande sobre la Autopista.", "7.0717437,-73.1050966"],
  ["Estación Metrolínea Molinos", "Transporte", "430 m · 5 min a pie", "Transporte masivo hacia Bucaramanga.", "7.0750845,-73.1082492"],
  ["Aeropuerto Internacional Palonegro", "Transporte", "40-50 min en carro", null, "7.1266514,-73.1829853"],
  ["Parque de La Salud", "Parque", "280 m · 4 min a pie", null, "7.0721896,-73.1087169"],
  ["Jardín Botánico Eloy Valenzuela", "Turismo", "2,6 km · unos 10 min en carro", "Senderos y naturaleza en Floridablanca.", "7.0671471,-73.0880570"],
  ["Parque principal de Floridablanca", "Turismo", "3 km · unos 12 min en carro", "El centro histórico, famoso por sus obleas.", "7.0625949,-73.0858929"],
  ["Ecoparque Cerro del Santísimo", "Turismo", "4 km · unos 20 min en carro", "Mirador con la gran estatua del Santísimo y vista del área metropolitana.", "7.0674476,-73.0746261"],
];

const p = property;
const results = await sql.transaction([
  sql`delete from reservation where property_id in (select id from property where host_id = ${host.id}) returning id`,
  sql`delete from property where host_id = ${host.id} returning id`,
  sql`insert into property (id, host_id, name, address, latitude, longitude, wifi_name, wifi_password, access_instructions,
        check_in_time, check_out_time, arrival_info, tv_info, house_rules, house_guide, amenities, trash_info,
        checkout_list, emergency_info, transport_info)
      values (${id}, ${host.id}, ${p.name}, ${p.address}, ${p.latitude}, ${p.longitude}, ${p.wifiName}, ${p.wifiPassword},
        ${p.accessInstructions}, '15:00', '11:00', ${p.arrivalInfo}, ${p.tvInfo}, ${p.houseRules}, ${p.houseGuide},
        ${p.amenities}, ${p.trashInfo}, ${p.checkoutList}, ${p.emergencyInfo}, ${p.transportInfo})`,
  ...STANDARD_TASKS.map((label, i) => sql`insert into property_task (property_id, label, position) values (${id}, ${label}, ${i + 1})`),
  ...places.map(([name, category, distance, note, query], i) =>
    sql`insert into property_place (property_id, name, category, distance, note, maps_query, position)
        values (${id}, ${name}, ${category}, ${distance}, ${note}, ${query}, ${i + 1})`
  ),
]);

console.log(`Borradas ${results[0].length} reservas y ${results[1].length} pisos de prueba.`);
console.log(`Creado "${p.name}" con ${STANDARD_TASKS.length} tareas de preparación y ${places.length} lugares cercanos.`);

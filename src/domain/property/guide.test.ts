import { test } from "node:test";
import assert from "node:assert/strict";
import { directionsUrl, lines, mapEmbedUrl, parseLocation, validateGuide, validatePlace } from "./guide.ts";

test("ubicación: coordenadas escritas a mano", () => {
  assert.deepEqual(parseLocation("7.0726714, -73.1112428"), { lat: 7.0726714, lng: -73.1112428 });
  assert.deepEqual(parseLocation(" 7.07,-73.11 "), { lat: 7.07, lng: -73.11 });
});

test("ubicación: enlaces de Google Maps", () => {
  assert.deepEqual(parseLocation("https://www.google.com/maps/@7.0726,-73.1112,17z"), { lat: 7.0726, lng: -73.1112 });
  assert.deepEqual(parseLocation("https://maps.google.com/?q=7.0726,-73.1112"), { lat: 7.0726, lng: -73.1112 });
  assert.deepEqual(parseLocation("https://www.google.com/maps/search/?api=1&query=7.0726%2C-73.1112"), { lat: 7.0726, lng: -73.1112 });
});

test("ubicación: el pin (!3d!4d) manda sobre el centro del mapa (@)", () => {
  const url = "https://www.google.com/maps/place/Foscal/@7.0700,-73.1200,15z/data=!3m1!4b1!4m6!3m5!3d7.0733049!4d-73.1100252";
  assert.deepEqual(parseLocation(url), { lat: 7.0733049, lng: -73.1100252 });
});

test("ubicación: rechaza lo que no es una ubicación", () => {
  assert.equal(parseLocation("Floridablanca"), null);
  assert.equal(parseLocation("https://maps.app.goo.gl/abc123"), null);
  assert.equal(parseLocation("95, -73"), null);
});

test("listas: una por línea, sin viñetas ni líneas vacías", () => {
  assert.deepEqual(lines("- Toallas\n\n• Secador\n  Plancha  \n"), ["Toallas", "Secador", "Plancha"]);
  assert.deepEqual(lines(null), []);
});

test("mapas: enlaces de cómo llegar e incrustado", () => {
  assert.equal(
    directionsUrl("Jumbo El Bosque, Floridablanca", { lat: 7.07, lng: -73.11 }),
    "https://www.google.com/maps/dir/?api=1&origin=7.07,-73.11&destination=Jumbo%20El%20Bosque%2C%20Floridablanca"
  );
  assert.match(mapEmbedUrl({ lat: 7.07, lng: -73.11 }), /marker=7\.07,-73\.11$/);
});

test("guía: textos opcionales, ubicación convertida a coordenadas", () => {
  const result = validateGuide({ wifiName: " Red ", tvInfo: "", location: "7.07, -73.11" });
  assert.ok(result.ok);
  assert.equal(result.value.wifiName, "Red");
  assert.equal(result.value.tvInfo, null);
  assert.equal(result.value.latitude, 7.07);
});

test("guía: ubicación ilegible y textos demasiado largos dan error", () => {
  const result = validateGuide({ location: "por ahí", houseRules: "x".repeat(2001) });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["houseRules", "location"]);
});

test("lugar: exige nombre y un tipo de la lista", () => {
  assert.ok(validatePlace({ name: "Jumbo", category: "Supermercado", distance: "300 m" }).ok);
  const result = validatePlace({ name: "", category: "Bar" });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["category", "name"]);
});

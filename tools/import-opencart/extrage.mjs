#!/usr/bin/env node
/**
 * Pasul 1 din 3: extrage datele din baza OpenCart LOCALĂ într-un fișier JSON.
 *
 *   node extrage.mjs [--container=solarone-db] [--baza=solarone]
 *
 * Scrie date/opencart-AAAA-LL-ZZ.json. Doar SELECT-uri, prin `docker exec`, pe
 * copia locală din C:\Users\Sony\Desktop\Solarone.ro. Nu se conectează la
 * producție și nu scrie nimic în baza sursă.
 *
 * Fiecare rând iese ca un singur JSON_OBJECT pe linie: textul descrierilor are
 * tab-uri și rânduri noi, iar formatul tabular al clientului mysql le-ar
 * amesteca cu separatorii. În JSON sunt deja escapate.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const opt = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const CONTAINER = opt.container ?? "solarone-db";
const BAZA = opt.baza ?? "solarone";

function interogare(sql) {
  const iesire = execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "mysql", `-u${BAZA}`, `-p${BAZA}`, "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names", BAZA],
    { input: sql, maxBuffer: 256 * 1024 * 1024, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
  );
  return iesire.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const obiect = (coloane) => `JSON_OBJECT(${coloane.map((c) => `'${c.split(".").pop()}', ${c}`).join(", ")})`;

const tabele = {
  produse: `SELECT ${obiect([
    "p.product_id", "p.model", "p.sku", "p.upc", "p.ean", "p.jan", "p.mpn", "p.quantity", "p.stock_status_id",
    "p.image", "p.manufacturer_id", "p.price", "p.status", "p.weight", "p.length", "p.width", "p.height",
    "p.date_added", "p.date_modified", "p.sort_order", "p.minimum",
    "d.name", "d.description", "d.meta_title", "d.meta_description", "d.tag",
  ])} FROM product p JOIN product_description d ON d.product_id = p.product_id AND d.language_id = 1`,

  produsCategorie: `SELECT ${obiect(["product_id", "category_id"])} FROM product_to_category`,

  categorii: `SELECT ${obiect(["c.category_id", "c.parent_id", "c.status", "c.sort_order", "d.name", "d.description", "d.meta_title"])}
    FROM category c JOIN category_description d ON d.category_id = c.category_id AND d.language_id = 1`,

  producatori: `SELECT ${obiect(["manufacturer_id", "name"])} FROM manufacturer`,

  imagini: `SELECT ${obiect(["product_id", "image", "sort_order"])} FROM product_image`,

  oferteSpeciale: `SELECT ${obiect(["product_id", "customer_group_id", "price", "date_start", "date_end", "priority"])} FROM product_special`,

  reduceriCantitate: `SELECT ${obiect(["product_id", "customer_group_id", "quantity", "price", "date_start", "date_end"])} FROM product_discount`,

  seoUrl: `SELECT ${obiect(["query", "keyword"])} FROM seo_url WHERE store_id = 0 AND language_id = 1`,

  statusuriStoc: `SELECT ${obiect(["stock_status_id", "name"])} FROM stock_status WHERE language_id = 1`,
};

const date = { extrasLa: new Date().toISOString(), sursa: `${CONTAINER}/${BAZA}` };
for (const [nume, sql] of Object.entries(tabele)) {
  date[nume] = interogare(sql);
  console.log(`${nume.padEnd(18)} ${date[nume].length}`);
}

const fisier = join(aici, "date", `opencart-${date.extrasLa.slice(0, 10)}.json`);
mkdirSync(dirname(fisier), { recursive: true });
writeFileSync(fisier, JSON.stringify(date));
console.log(`\nscris: ${fisier}`);

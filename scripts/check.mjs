
import { readFileSync, existsSync } from "node:fs";
import { join, isAbsolute } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function load(name) {
  try {
    return JSON.parse(readFileSync(join(root, "src/data", name), "utf8"));
  } catch (e) {
    err(`${name}: cannot read or parse (${e.message})`);
    return null;
  }
}

function isExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function localPublicPath(value) {
  return join(root, "public", value.replace(/^\/+/, ""));
}

const site = load("site.json");
const catalogue = load("products.json");

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => strings(v, out));
  }
  return out;
}

if (site) {
  const need = (path, v) => {
    if (v === undefined || v === null || v === "") {
      err(`site.json: missing ${path}`);
    }
  };

  need("status", site.status);
  if (site.status && !["demo", "draft", "live"].includes(site.status)) {
    err("site.json: status must be demo, draft or live");
  }

  need("business.name", site.business?.name);
  need("business.tagline", site.business?.tagline);
  need("business.description", site.business?.description);
  if (site.status === "live") need("contact.whatsapp", site.contact?.whatsapp);
  need("brand.accent", site.brand?.accent);
  need("brand.fontsUrl", site.brand?.fontsUrl);
  need("seo.domain", site.seo?.domain);
  need("hero.headline", site.hero?.headline);

  const digits = String(site.contact?.whatsapp ?? "");
  if (site.status === "live" && !/^\d{8,15}$/.test(digits)) {
    err("LIVE BLOCKED: contact.whatsapp must contain a verified number with country code, like 263771234567");
  } else if (site.status !== "live" && digits && !/^\d{8,15}$/.test(digits)) {
    err("site.json: contact.whatsapp must be blank or digits only with country code");
  }

  if (site.brand?.accent && !/^#[0-9a-fA-F]{6}$/.test(site.brand.accent)) {
    err("site.json: brand.accent must be a 6-digit hex colour");
  }

  const d = site.business?.description ?? "";
  if (d.length < 50 || d.length > 170) {
    warn(`site.json: business.description is ${d.length} characters. 70 to 160 reads best in Google results.`);
  }

  for (const key of ["hero.image", "seo.ogImage", "brand.logo"]) {
    const value = key.split(".").reduce((o, k) => o?.[k], site);
    if (!value) continue;

    if (isExternalUrl(value)) continue;

    if (typeof value !== "string" || (isAbsolute(value) && !value.startsWith("/")) || !existsSync(localPublicPath(value))) {
      err(`site.json: ${key} must be a valid HTTP/HTTPS URL or an existing file in public/; received "${value}"`);
    }
  }

  const live = site.status === "live";
  const all = strings(site).concat(catalogue ? strings(catalogue) : []);
  const placeholders = all.filter((s) => /\[[A-Z][A-Z0-9 ,'/&.-]{2,}\]/.test(s));

  if (placeholders.length) {
    const msg = `${placeholders.length} placeholder text(s) still in the data, for example: ${placeholders[0].slice(0, 70)}`;
    live ? err(`LIVE BLOCKED: ${msg}`) : warn(msg);
  }

  if (/^2637700000/.test(digits)) {
    live ? err("LIVE BLOCKED: contact.whatsapp is the demo number") : warn("contact.whatsapp is still the demo number");
  } else if (!digits) {
    live ? err("LIVE BLOCKED: a verified WhatsApp number is required") : warn("WhatsApp number is not set; contact buttons route to the contact section until configured");
  }

  if (/example\.(com|org)$|pages\.dev$/.test(site.seo?.domain ?? "")) {
    live ? err("LIVE BLOCKED: seo.domain is not the client's real domain") : warn("seo.domain is a placeholder");
  }

  if (!site.hero?.image) {
    live ? err("LIVE BLOCKED: hero.image is missing") : warn("hero.image not set");
  }

  if (!site.seo?.ogImage) {
    live ? err("LIVE BLOCKED: seo.ogImage is missing") : warn("seo.ogImage not set; shared links will have no preview picture");
  }
}

if (catalogue) {
  const items = catalogue.items;

  if (!Array.isArray(items) || items.length === 0) {
    err("products.json: needs a non-empty items array");
  } else {
    const seen = new Set();
    let noImage = 0;

    for (const p of items) {
      const where = `products.json: ${p.id ?? p.name ?? "(item without id)"}`;

      if (!p.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) {
        err(`${where}: id must be a lowercase-hyphen slug`);
      }

      if (seen.has(p.id)) err(`${where}: duplicate id`);
      seen.add(p.id);

      if (!p.name) err(`${where}: missing name`);

      if (p.price !== null && p.price !== undefined && (typeof p.price !== "number" || p.price < 0)) {
        err(`${where}: price must be a number or null`);
      }

      if (p.image) {
        if (!isExternalUrl(p.image) && (
          typeof p.image !== "string" ||
          (isAbsolute(p.image) && !p.image.startsWith("/")) ||
          !existsSync(localPublicPath(p.image))
        )) {
          err(`${where}: image must be a valid HTTP/HTTPS URL or an existing file in public/; received "${p.image}"`);
        }
      } else {
        noImage++;
      }
    }

    if (noImage) {
      warn(`${noImage} of ${items.length} products have no photo yet and show a colour tile`);
    }

    for (const p of items) {
      for (const r of p.related ?? []) {
        if (!seen.has(r)) {
          err(`products.json: ${p.id} lists related id "${r}" which does not exist`);
        }
      }
    }
  }
}

for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);

console.log(`\ncheck: ${errors.length} error(s), ${warnings.length} warning(s)${site ? ` (status: ${site.status})` : ""}`);
process.exit(errors.length ? 1 : 0);

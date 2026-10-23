# Archie Electronics website

React + Vite + Tailwind catalogue configured for Cloudflare Pages. Product photographs supplied for this catalogue are bundled locally in `public/images/products/`.

## Local build

```bash
npm install
npm run check
npm run build
npm run dev
```

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 22 (or Node >=20.19)

## Before making the website public

Open `src/data/site.json` and confirm the real WhatsApp number, shop address, opening hours, domain, product availability and warranty terms. The current status is `draft`; the WhatsApp number is deliberately an unverified placeholder because a reliable number/address could not be read from the supplied screenshot. Do not switch status to `live` until those details and the social preview image/domain are confirmed.

Some phone models and accessory specifications are marked for confirmation because the photo labels do not establish them clearly. Prices are those transcribed from the supplied screenshot and should be reconfirmed before publication.

import React, { useMemo, useState } from "react";
import site from "./data/site.json";
import catalogue from "./data/products.json";
import Hero from "./components/Hero";
import GlassNav from "./components/GlassNav";
import Reveal from "./components/Reveal";
import Modal from "./components/Modal";
import ProductPhoto from "./components/ProductPhoto";
import Blobs from "./components/Blobs";
import { waLink, money } from "./lib/whatsapp";

const products = catalogue.items;
const byId = (id) => products.find((p) => p.id === id);
const MAX_COMPARE = 3;

export default function App() {
  const { business, contact, hero, nav, shop, availability, highlights, visit, footer } = site;
  const [cat, setCat] = useState(shop.allLabel);
  const [brand, setBrand] = useState(shop.allLabel);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [cmp, setCmp] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const price = (p) => {
    const t = money(p.price, business.currencySymbol, shop.noPrice);
    return p.price === null || p.price === undefined ? t : t + shop.priceSuffix;
  };
  const avLabel = (p) => availability[p.availability] || availability.enq;
  const avClass = (p) => `pill-av av-${availability[p.availability] ? p.availability : "enq"}`;

  const base = useMemo(() => products.filter((p) => cat === shop.allLabel || p.category === cat), [cat, shop.allLabel]);
  const brands = useMemo(() => [shop.allLabel, ...Array.from(new Set(base.map((p) => p.brand)))], [base, shop.allLabel]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return base.filter(
      (p) =>
        (brand === shop.allLabel || p.brand === brand) &&
        (!term || `${p.name} ${p.brand} ${p.model} ${p.category}`.toLowerCase().includes(term))
    );
  }, [base, brand, q, shop.allLabel]);

  const cur = sel ? byId(sel) : null;
  const cmpItems = cmp.map(byId).filter(Boolean);
  const cartItems = cart.map((entry) => ({ ...entry, product: byId(entry.id) })).filter((entry) => entry.product);
  const cartCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = cartItems.reduce((sum, entry) => {
    const value = Number(entry.product.price);
    return entry.product.price !== null && entry.product.price !== undefined && Number.isFinite(value)
      ? sum + value * entry.quantity
      : sum;
  }, 0);
  const hasUnpricedItems = cartItems.some(({ product }) => product.price === null || product.price === undefined);
  const cmpKeys = [];
  cmpItems.forEach((p) => p.specs.forEach((s) => { if (!cmpKeys.includes(s.label)) cmpKeys.push(s.label); }));

  const toggle = (id) =>
    setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));

  const addToCart = (id) => {
    setCart((current) => {
      const found = current.find((item) => item.id === id);
      return found
        ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { id, quantity: 1 }];
    });
  };

  const changeQuantity = (id, change) => {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + change } : item)
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (id) => setCart((current) => current.filter((item) => item.id !== id));
  const quantityInCart = (id) => cart.find((item) => item.id === id)?.quantity ?? 0;

  const orderText = (p) =>
    shop.orderMessage
      .replace("{shop}", business.name)
      .replace("{name}", p.name)
      .replace("{model}", p.model)
      .replace("{price}", price(p));

  const checkoutMessage = () => {
    const lines = cartItems.map(({ product, quantity }, index) => {
      const lineTotal = product.price === null || product.price === undefined
        ? shop.noPrice
        : money(Number(product.price) * quantity, business.currencySymbol, shop.noPrice) + shop.priceSuffix;
      return `${index + 1}. ${product.name} (${product.model})\n   Quantity: ${quantity}\n   Unit price: ${price(product)}\n   Line total: ${lineTotal}\n   Availability: ${avLabel(product)}`;
    });

    const totalText = cartItems.some(({ product }) => product.price !== null && product.price !== undefined)
      ? money(cartTotal, business.currencySymbol, shop.noPrice) + shop.priceSuffix
      : shop.noPrice;

    return `Hello ${business.name}, I would like to place an order / confirm availability.\n\n${lines.join("\n\n")}\n\nEstimated total for priced items: ${totalText}${hasUnpricedItems ? `\nSome items need a confirmed price: ${shop.noPrice}.` : ""}\n\nPlease confirm final availability, pricing, delivery or collection options, and payment methods. Thank you.`;
  };

  const pickCat = (c) => { setCat(c); setBrand(shop.allLabel); };
  const closeModal = () => setSel(null);
  const closeCompare = () => setShowCompare(false);
  const closeCart = () => setShowCart(false);
  const displayedCartTotal = cartItems.some(({ product }) => product.price !== null && product.price !== undefined)
    ? money(cartTotal, business.currencySymbol, shop.noPrice) + shop.priceSuffix
    : shop.noPrice;

  return (
    <>
      <Blobs />
      <GlassNav site={site} links={nav.links} cta={nav.cta} message={nav.message} />
      <Hero site={site}>
        <a className="btn" href="#shop">{hero.primaryCta}</a>
        <a className="btn glass" style={{ color: "#fff" }} href="#why">{hero.secondaryCta}</a>
      </Hero>

      <main className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal as="section" id="shop" className="pt-16 pb-14 flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{shop.heading}</h2>
          <div className="glass rounded-[28px] p-3.5 flex flex-col gap-3">
            <label htmlFor="q" className="sr-only">{shop.searchLabel}</label>
            <input id="q" type="search" className="field" placeholder={shop.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {[shop.allLabel, ...shop.categories].map((c) => (
                <button key={c} type="button" className="chip min-h-[44px] px-[18px] font-semibold" aria-pressed={cat === c} onClick={() => pickCat(c)}>{c}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-muted">{shop.brandLabel}</span>
              {brands.map((b) => (
                <button key={b} type="button" className="chip min-h-[40px] px-3.5" aria-pressed={brand === b} onClick={() => setBrand(b)}>{b}</button>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? shop.countOne : shop.countMany}</div>

          <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60} className="card glass flex min-w-0 flex-col gap-2.5 rounded-3xl p-3">
                <button type="button" onClick={() => setSel(p.id)} aria-label={`${p.name}, ${price(p)}`} className="block overflow-hidden rounded-2xl p-0 border-0 bg-transparent text-inherit text-left">
                  <ProductPhoto product={p} />
                </button>
                <div className="mono px-1 text-muted normal-case">{p.brand} / {p.model}</div>
                <button type="button" onClick={() => setSel(p.id)} className="px-1 text-left font-display text-base font-bold leading-snug bg-transparent border-0 text-inherit p-0">{p.name}</button>
                <div className="px-1 text-[13px] leading-normal" style={{ color: "#B8C8D7" }}>{p.specs.slice(0, 3).map((s) => s.value).join(" / ")}</div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-display text-xl font-bold">{price(p)}</span>
                  <span className={avClass(p)}>{avLabel(p)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(p.id)}
                  className="btn min-h-[44px] w-full"
                  style={{ padding: "10px 16px", fontSize: 14 }}
                  aria-label={`Add ${p.name} to cart`}
                >
                  {quantityInCart(p.id) > 0 ? `Add another · ${quantityInCart(p.id)} in cart` : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={cmp.includes(p.id)}
                  className="min-h-[44px] rounded-2xl text-sm font-semibold"
                  style={{
                    border: `1px solid ${cmp.includes(p.id) ? "var(--accent)" : "rgba(255,255,255,.25)"}`,
                    background: cmp.includes(p.id) ? "rgba(255,138,0,.18)" : "rgba(255,255,255,.05)",
                    color: "var(--ink)",
                  }}
                >
                  {cmp.includes(p.id) ? shop.addedCompare : shop.addCompare}
                </button>
              </Reveal>
            ))}
          </div>
          {list.length === 0 ? <div className="glass rounded-3xl p-10 text-center" style={{ color: "#B8C8D7" }}>{shop.empty}</div> : null}
        </Reveal>

        <Reveal as="section" id="why" className="pb-10 grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {highlights.map((h) => (
            <div key={h.title} className="glass flex flex-col gap-2 rounded-[28px] p-7">
              <h3 className="text-xl font-bold">{h.title}</h3>
              <p className="leading-relaxed" style={{ color: "#B8C8D7" }}>{h.text}</p>
            </div>
          ))}
        </Reveal>

        <Reveal as="section" id="visit" className="glass mb-6 flex flex-wrap gap-7 rounded-[36px] px-7 py-11">
          <div className="min-w-0 flex-1 basis-72">
            <h2 className="mb-2.5 text-3xl font-extrabold">{visit.heading}</h2>
            <p className="leading-relaxed" style={{ color: "#B8C8D7" }}>{contact.address}</p>
          </div>
          <div className="grid min-w-0 flex-1 basis-72 grid-cols-2 gap-4 text-[15px]">
            <div><div className="mono mb-1.5 text-muted">{visit.hoursLabel}</div>{contact.hours}</div>
            <div><div className="mono mb-1.5 text-muted">{visit.whatsappLabel}</div>{contact.displayNumber}</div>
          </div>
        </Reveal>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 px-6 pb-28 pt-4 text-[13px] text-muted">
        <span>{business.name}. {business.sampleNote}</span>
        <span>{footer.credit}</span>
      </footer>

      {cartCount > 0 ? (
        <div
          className={`glass fixed inset-x-4 ${cmp.length > 0 && !showCompare ? "bottom-24" : "bottom-4"} z-40 mx-auto flex max-w-[560px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-3xl px-4 py-3 sm:rounded-full sm:pl-6 sm:pr-3`}
          style={{ background: "rgba(10,30,46,.94)" }}
        >
          <div className="min-w-0">
            <div className="text-sm font-bold">Your cart · {cartCount} {cartCount === 1 ? "item" : "items"}</div>
            <div className="text-xs text-muted">Estimated total: {displayedCartTotal}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost min-h-[44px]" style={{ padding: "0 16px" }} onClick={() => setShowCart(true)}>View cart</button>
            <a className="btn min-h-[44px]" style={{ padding: "0 16px", fontSize: 14 }} href={waLink(contact.whatsapp, checkoutMessage())} target="_blank" rel="noopener noreferrer">Checkout on WhatsApp</a>
          </div>
        </div>
      ) : null}

      {cmp.length > 0 && !showCompare ? (
        <div className="glass fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[560px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-full py-2.5 pl-6 pr-3" style={{ background: "rgba(10,30,46,.75)" }}>
          <span className="text-sm">{cmp.length} {shop.compareSelected}</span>
          <span className="flex gap-2">
            <button type="button" className="btn min-h-[44px]" style={{ padding: "0 20px" }} onClick={() => setShowCompare(true)}>{shop.compareNow}</button>
            <button type="button" className="btn btn-ghost min-h-[44px]" style={{ padding: "0 16px" }} onClick={() => { setCmp([]); setShowCompare(false); }}>{shop.clear}</button>
          </span>
        </div>
      ) : null}

      <Modal open={showCart} onClose={closeCart} label="Shopping cart">
        <h3 className="mb-2 text-2xl font-bold">Your shopping cart</h3>
        <p className="mb-5 text-sm text-muted">Review your items and quantities before sending the order to the shop on WhatsApp.</p>
        {cartItems.length ? (
          <div className="flex flex-col gap-3">
            {cartItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 rounded-2xl border p-3" style={{ borderColor: "var(--glass-border)", background: "rgba(255,255,255,.035)" }}>
                <div className="w-20 shrink-0 overflow-hidden rounded-xl">
                  <ProductPhoto product={product} ratio="1 / 1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-snug">{product.name}</div>
                  <div className="mt-1 text-sm text-muted">{product.model} · {price(product)}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" className="chip h-9 w-9 px-0" aria-label={`Decrease quantity of ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button>
                    <span className="min-w-6 text-center font-bold" aria-live="polite">{quantity}</span>
                    <button type="button" className="chip h-9 w-9 px-0" aria-label={`Increase quantity of ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button>
                    <button type="button" className="ml-1 text-sm underline text-muted" onClick={() => removeFromCart(product.id)}>Remove</button>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm font-bold">
                  {product.price === null || product.price === undefined
                    ? shop.noPrice
                    : money(Number(product.price) * quantity, business.currencySymbol, shop.noPrice) + shop.priceSuffix}
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-2xl p-4" style={{ background: "rgba(255,255,255,.05)" }}>
              <div className="flex items-center justify-between gap-4 text-lg font-extrabold">
                <span>Estimated total</span>
                <span>{displayedCartTotal}</span>
              </div>
              {hasUnpricedItems ? <p className="mt-2 text-sm text-muted">Some items need a confirmed price. The shop will confirm the final total on WhatsApp.</p> : null}
              <p className="mt-2 text-sm text-muted">Prices and stock will be confirmed by the shop. No payment is taken on this website.</p>
              <a className="btn mt-4 min-h-[48px] w-full" href={waLink(contact.whatsapp, checkoutMessage())} target="_blank" rel="noopener noreferrer">Checkout on WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center text-muted" style={{ background: "rgba(255,255,255,.04)" }}>
            Your cart is empty.
            <button type="button" className="btn mt-4" onClick={closeCart}>Continue shopping</button>
          </div>
        )}
      </Modal>

      <Modal open={showCompare && cmpItems.length > 0} onClose={closeCompare} label={shop.compareTitle}>
        <h3 className="mb-4 text-2xl font-bold">{shop.compareTitle}</h3>
        <div className="overflow-x-auto">
          <table className="spec w-full border-collapse text-sm" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th />
                {cmpItems.map((p) => (
                  <th key={p.id} className="font-display">
                    {p.name}
                    <div className="text-[13px] font-medium text-muted">{price(p)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono text-muted">{shop.specAvailability}</td>
                {cmpItems.map((p) => <td key={p.id}>{avLabel(p)}</td>)}
              </tr>
              <tr>
                <td className="mono text-muted">{shop.specWarranty}</td>
                {cmpItems.map((p) => <td key={p.id}>{p.warranty}</td>)}
              </tr>
              {cmpKeys.map((k) => (
                <tr key={k}>
                  <td className="mono text-muted">{k}</td>
                  {cmpItems.map((p) => {
                    const f = p.specs.find((s) => s.label === k);
                    return <td key={p.id}>{f ? f.value : "-"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal open={!!cur} onClose={closeModal} label={cur ? cur.name : "Product details"}>
        {cur ? (
          <div className="flex flex-wrap gap-6">
            <div className="min-w-0 flex-1 basis-64">
              <ProductPhoto product={cur} className="rounded-2xl" />
            </div>
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-3.5">
              <span className="mono text-muted normal-case">{cur.brand} / {cur.model}</span>
              <h3 className="text-[28px] font-extrabold leading-tight tracking-tight">{cur.name}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-2xl font-bold">{price(cur)}</span>
                <span className={avClass(cur)}>{avLabel(cur)}</span>
              </div>
              <table className="spec w-full border-collapse text-sm">
                <tbody>
                  {cur.specs.map((s) => (
                    <tr key={s.label}><td className="mono w-2/5 text-muted">{s.label}</td><td>{s.value}</td></tr>
                  ))}
                  <tr><td className="mono w-2/5 text-muted">{shop.specWarranty}</td><td>{cur.warranty}</td></tr>
                </tbody>
              </table>
              <button type="button" className="btn min-h-[48px] w-full" onClick={() => addToCart(cur.id)}>
                {quantityInCart(cur.id) > 0 ? `Add another to cart · ${quantityInCart(cur.id)} in cart` : "Add to cart"}
              </button>
              <a className="btn btn-ghost min-h-[44px] w-full" href={waLink(contact.whatsapp, orderText(cur))} target="_blank" rel="noopener noreferrer">{shop.orderCta}</a>
              {cur.related && cur.related.length ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">{shop.relatedLabel}</span>
                  <div className="flex flex-wrap gap-2">
                    {cur.related.map(byId).filter(Boolean).map((r) => (
                      <button key={r.id} type="button" className="chip min-h-[44px] px-3.5" onClick={() => setSel(r.id)}>{r.name}</button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

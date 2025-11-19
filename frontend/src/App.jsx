import React, { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Stat({ label, value, prefix = '', suffix = '' }) {
  return (
    <div className="rounded-xl bg-neutral-900/60 border border-white/10 p-4">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1">
        {prefix}{value}{suffix}
      </div>
    </div>
  )
}

function AddItemForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    variant: '',
    category: 'Sneaker',
    purchase_price: '',
    purchase_date: '',
    status: 'In Stock',
    image_url: '',
  })

  const breakeven = useMemo(() => {
    const fees = 0.12 // assume 12% platform fee for preview
    const ship = 8
    const buy = parseFloat(form.purchase_price || '0')
    const result = (buy + ship) / (1 - fees)
    return isFinite(result) ? result.toFixed(2) : '0.00'
  }, [form.purchase_price])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      purchase_price: parseFloat(form.purchase_price || '0'),
      purchase_date: form.purchase_date ? new Date(form.purchase_date).toISOString() : new Date().toISOString(),
      image_url: form.image_url || undefined,
      sku: form.sku || undefined,
      variant: form.variant || undefined,
    }
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setForm({
        name: '', sku: '', variant: '', category: 'Sneaker', purchase_price: '', purchase_date: '', status: 'In Stock', image_url: ''
      })
      onCreated && onCreated()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input className="input" placeholder="Produktname" name="name" value={form.name} onChange={handleChange} required />
      <input className="input" placeholder="SKU" name="sku" value={form.sku} onChange={handleChange} />
      <input className="input" placeholder="Variante/Größe" name="variant" value={form.variant} onChange={handleChange} />
      <select className="input" name="category" value={form.category} onChange={handleChange}>
        <option>Sneaker</option>
        <option>TCG</option>
        <option>Streetwear</option>
      </select>
      <input className="input" placeholder="Kaufpreis" name="purchase_price" value={form.purchase_price} onChange={handleChange} type="number" step="0.01" />
      <input className="input" placeholder="Kaufdatum" name="purchase_date" value={form.purchase_date} onChange={handleChange} type="date" />
      <select className="input" name="status" value={form.status} onChange={handleChange}>
        <option>In Stock</option>
        <option>Listed</option>
        <option>Sold</option>
      </select>
      <input className="input md:col-span-2" placeholder="Bild-URL" name="image_url" value={form.image_url} onChange={handleChange} />
      <div className="rounded-xl bg-neutral-900/60 border border-white/10 p-4 text-neutral-300">Break-even: ~€{breakeven}</div>
      <button className="btn md:col-span-3">Item hinzufügen</button>
    </form>
  )
}

function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [products, setProducts] = useState([])

  const refresh = async () => {
    const [k, p] = await Promise.all([
      fetch(`${API_BASE}/analytics/kpis`).then(r=>r.json()),
      fetch(`${API_BASE}/products`).then(r=>r.json()),
    ])
    setKpis(k)
    setProducts(p)
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Gesamtinvestition" value={kpis ? kpis.total_investment.toFixed(2) : '0.00'} prefix="€" />
        <Stat label="Gesamtwert" value={kpis ? kpis.total_value.toFixed(2) : '0.00'} prefix="€" />
        <Stat label="Real. Gewinn" value={kpis ? kpis.realized_profit.toFixed(2) : '0.00'} prefix="€" />
        <Stat label="ROI" value={kpis ? kpis.roi.toFixed(2) : '0.00'} suffix="%" />
        <Stat label="Verkauft" value={kpis ? kpis.sold_count : 0} />
      </div>

      <div className="rounded-2xl overflow-hidden relative h-72 border border-white/10 bg-neutral-900/40">
        <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      </div>

      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Neues Item</h2>
        <AddItemForm onCreated={refresh} />
      </section>

      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Inventar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="rounded-xl bg-neutral-900/60 border border-white/10 p-4 flex gap-4">
              <img src={p.image_url || 'https://placehold.co/96x96?text=Item'} alt={p.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="text-neutral-300">
                <div className="text-white font-medium">{p.name}</div>
                <div className="text-sm">{p.category} • {p.variant || '-'} • {p.status}</div>
                <div className="text-sm">Gekauft: €{p.purchase_price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-white/10 sticky top-0 z-10 bg-neutral-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-white font-semibold tracking-tight">Reseller Dashboard</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <Dashboard />
      </main>
      <style>{`
        .input{ @apply w-full rounded-lg bg-neutral-900/60 border border-white/10 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20; }
        .btn{ @apply inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200 transition; }
      `}</style>
    </div>
  )
}

# GUDANGKU UI/UX DESIGN SYSTEM - Implementasi React

## 1. WARNA & VISUAL IDENTITY (Warehouse Professional Theme)

### Dark Mode (Default) - Untuk Warehouse Workers Morning Use
```
🔵 Primary Background: #0f1117 (var(--color-bg-primary))
🔶 Secondary Background: #1a1d23 (var(--color-bg-secondary))
🟤 Card Background: #25272f (var(--color-bg-card))
⚫ Hover Background: #2f3139 (var(--color-bg-tertiary))

📝 Text Primary: #ffffff
📝 Text Secondary: #d1d5db
📝 Text Muted: #9ca3af

🟦 Border Color: #3f4450
```

### Status Colors - Universally Recognized
```
🔴 CRITICAL (Urgent Action): #ef4444
🟡 WARNING (Plan Ahead): #f59e0b
🟢 SAFE (Monitor): #10b981
🔵 INFO (Forecast/Data): #06b6d4
⚪ PRIMARY ACCENT: #3b82f6 (Buttons, highlights)
```

## 2. HALAMAN & LAYOUT

### Landing Page (`Landing.tsx`) ✅
**Purpose:** Convince UMKM owner ini painkiller bukan vitamin
**Key Sections:**
- Hero: Inventory yang Pintar + Prediksi Akurat (gradient teal-cyan)
- Features Grid: 8 cards (Prophet, Chat, Tracking, Privacy, Reorder, Analytics, Telegram, Security)
- CTA: "Mulai Gratis" button dengan gradient accent
- Status: IMPLEMENTED + styled with design system colors

**Mobile:** Responsive, sidebar hidden, stacked cards
**Desktop:** 4-column grid, full header nav

---

### Login Page (`Login.tsx`) ✅
**Purpose:** Fast Google OAuth with trust signals
**Layout:**
- Split screen (50-50 desktop, full mobile)
- Left: Testimonial + security badge + gradient bg
- Right: Login form with Google button
- Status: IMPLEMENTED + testimonial localized (Indonesian)

**Elements:**
- Google Sign-in button (white background with rounded corners)
- Testimonial from real UMKM owner
- Back to Home link (text-based)

---

### Dashboard - Home (`DashboardHome_NEW.tsx`) ✅
**Purpose:** Central hub showing actionable alerts
**Sections:**
1. **Top Stats (4 cards):**
   - Total Stok (teal accent)
   - Produk Kritis (red)
   - Produk Warning (amber)
   - AI Accuracy (safe green)

2. **Stock Alerts (Alert Cards):**
   - 🔴 CRITICAL - with "PESAN SEKARANG" button (red)
   - 🟡 WARNING - with "Rencana Order" button (amber)
   - 🟢 SAFE - just info (green)
   - Each card shows: product name, qty, days remaining

3. **Forecast Chart:**
   - Line chart with gradient fill (cyan)
   - 30-day forecast
   - Interactive hover tooltips

4. **Top Products Table:**
   - Ranked #1-5 by sales
   - Shows qty sold + current stock
   - Numbered badges (different colors per rank)

5. **Telegram Bot Section:**
   - "Link ke @KangSupplyBot" card
   - Shows code in copyable format
   - Status indicator (✅ if linked)

**Empty State:** If no data yet, show upload prompt

---

### Upload CSV (`UploadCSV_NEW.tsx`) ✅
**Purpose:** Frictionless data import
**3-Step Flow:**

**Step 1: Upload Zone**
- Large drag-drop area with dashed border
- "📤 Drag file CSV ke sini" text
- Fallback: Click to browse
- Shows format example at bottom

**Step 2: Column Mapping**
- Auto-detects common column names
- Dropdowns for: Tanggal, Penjualan, Produk, Stok
- All 4 required (marked with *)
- Verify button

**Step 3: Processing**
- Spinner animation (pulsing circle)
- "Memproses data... AI sedang menganalisis data Anda"

**Step 4: Success**
- Green checkmark icon (large)
- "Forecast Berhasil!"
- "Lihat Dashboard" button

---

### Chat Page (`ChatPage_NEW.tsx`) ✅
**Purpose:** Q&A on inventory with credit tracking
**Layout:**
1. **Credit Badge (Top):**
   - Shows: Sisa Kredit = X
   - Info: "3 kredit/pertanyaan, +10 kredit/hari"
   - Blue accent

2. **Chat Area (Main):**
   - Message bubbles (left=bot teal, right=user blue)
   - Each message has timestamp
   - Copy button on bot responses
   - Auto-scroll to new messages

3. **Input Box (Bottom):**
   - Text input + Send button
   - Disabled if credits < 3
   - Enter key to send

4. **Suggested Questions (If empty):**
   - "Produk mana yang paling laku?"
   - "Kapan stok habis?"
   - "Rekomendasi reorder point?"
   - "Trend penjualan bulan ini?"

---

### Forecaster Page (`Forecaster_NEW.tsx`) ✅
**Purpose:** Deep dive into demand predictions
**Sections:**

1. **Period Selector (Top):**
   - 3 buttons: 7 hari | 30 hari | 90 hari
   - Active has blue bg, others have card bg

2. **Key Stats (3 cards):**
   - Rata-rata Harian
   - Peak Demand (with day info)
   - Low Demand

3. **Main Chart:**
   - Large line chart (400px height)
   - X-axis: dates
   - Y-axis: quantity
   - Gradient fill below line (cyan)
   - Interactive tooltips

4. **Product Filter:**
   - Pills for top 6 products
   - Click to select/deselect
   - Selected has blue bg

5. **Insights Box (Bottom):**
   - 4 bullet points with insights
   - Friendly tone ("💡 Insights & Rekomendasi")
   - Shows: peak day, avg daily, recommended ROP, days left

---

## 3. DASHBOARD SIDEBAR LAYOUT

All dashboard pages use `DashboardLayout` component:

```
┌─────────────────────────────────────┐
│ 📦 Gudangku   [Menu≡] [⚙]           │ ← Top bar
├─────────────────────────────────────┤
│ 📊 Dashboard       │                │
│ 📤 Upload CSV      │                │
│ 📈 Forecaster      │  Main Content  │
│ 💬 AI Chat         │  Area          │
│ 📄 Doc Assistant   │                │
│ 📜 History         │                │
├─────────────────────────────────────┤
│ User: email@...   Logout [🚪]       │ ← Footer
└─────────────────────────────────────┘
```

**Responsive:**
- **Mobile:** Sidebar hidden by default, hamburger toggle (fixed width 256px)
- **Tablet+:** Sidebar always visible (fixed width 256px)
- **Content:** Full width minus sidebar

---

## 4. COMPONENT LIBRARY

### StatCard
```tsx
<StatCard
  label="Total Stok"
  value={12847}
  icon="📦"
  color="var(--color-accent)"
  trend="+5.2%"
/>
```
Displays: Icon | Label | Big Number | Optional Trend

### AlertCard
```tsx
<AlertCard
  status="critical" | "warning" | "safe"
  title="Beras Premium"
  quantity={120}
  days={2}
  action="PESAN SEKARANG"
/>
```
Displays: Status emoji + Title | Qty + Days Left | Optional Action Button

### Button States
```tsx
// Primary
<Button style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
  Action
</Button>

// Dangerous (Delete/Logout)
<Button style={{ backgroundColor: 'var(--color-critical)', color: 'white' }}>
  Delete
</Button>

// Outline
<Button style={{ borderColor: 'var(--color-border)' }}>
  Cancel
</Button>
```

---

## 5. ANIMATIONS & MICRO-INTERACTIONS

### Defined in CSS:
```
✅ pulse-glow: opacity pulse (2s loop) - for active indicators
✅ slide-up: fade + translate in (0.3s) - for appearing cards  
✅ fade-in: opacity in (0.2s) - for quick fades
✅ hover-lift: translateY(-2px) + shadow - for all cards/buttons
✅ spin: rotation 360° (1s) - for loading spinners
```

**Usage:**
- Buttons: hover-lift on hover
- Badges: pulse-glow for "active" status
- Cards: slide-up on load
- Loaders: spin animation

---

## 6. RESPONSIVE GRID SYSTEM

```
Mobile (< 640px):
- 1 column for most content
- Full-width cards
- Stacked buttons
- Sidebar hidden

Tablet (640px - 1024px):
- 2 columns for cards
- Sidebar visible (fixed)
- Horizontal buttons

Desktop (> 1024px):
- 3-4 columns for cards
- Sidebar always visible
- Side-by-side layouts
```

---

## 7. ICONOGRAPHY

Using Lucide React icons + Emojis for warmth:

```
Dashboard Navigation:
📊 Dashboard
📤 Upload CSV
📈 Forecaster
💬 AI Chat
📄 Doc Assistant
📜 History
⚙ Settings
🚪 Logout

Status Indicators:
🔴 Critical/Red
🟡 Warning/Amber
🟢 Safe/Green
🔵 Info/Blue

Action Icons:
✨ Success/Excellence
📦 Warehouse/Items
📊 Analytics/Data
🤖 Bot/AI
🔒 Security/Locked
🧮 Calculation
📈 Growth/Trend
⚡ Energy/Speed
```

---

## 8. TYPOGRAPHY SCALE

```
Heading 1: 32px, 700 weight, -0.02em letter-spacing
Heading 2: 24px, 700 weight, -0.01em
Heading 3: 20px, 600 weight
Body Large: 16px, 400 weight, 1.6 line-height
Body: 14px, 400 weight, 1.5 line-height
Body Small: 12px, 400 weight, 1.4 line-height
```

---

## 9. SPACING (8px Grid)
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
```

---

## 10. BORDER RADIUS
```
sm: 6px (small elements)
md: 8px (buttons, inputs)
lg: 12px (cards)
xl: 16px (large cards, modals)
```

---

## 11. SHADOW SYSTEM
```
sm: 0 1px 2px rgba(0,0,0,0.25)
md: 0 4px 6px rgba(0,0,0,0.3)
lg: 0 10px 15px rgba(0,0,0,0.4)
xl: 0 20px 25px rgba(0,0,0,0.5)
```

---

## 12. STATE EXAMPLES

### Empty State
```
Large icon (5xl) + heading + description + CTA button
Example: "📦 Belum ada data - Upload CSV Sekarang"
```

### Loading State
```
Spinner (pulsing circle) + text
Example: "Memproses data..."
```

### Error State
```
🔴 Red border-left + icon + error text
Example: "File harus berformat CSV"
```

### Success State
```
✅ Green checkmark + heading + CTA
Example: "Forecast Berhasil - Lihat Dashboard"
```

---

## 13. COLOR ACCESSIBILITY

✅ All text meets WCAG AA standards:
- Critical red (#ef4444) on white: ✓ OK
- Text on dark backgrounds: ✓ 4.5:1 ratio
- Buttons with icons: ✓ Color + shape differentiation

---

## 14. IMPLEMENTATION CHECKLIST

- ✅ Design system CSS (design-system.css) imported in main
- ✅ Landing page responsive + styled
- ✅ Login page split-screen + testimonial
- ✅ Dashboard layout sidebar component
- ✅ Home dashboard with stats + alerts + charts
- ✅ Upload CSV 4-step flow
- ✅ Chat page with credits + messages
- ✅ Forecaster with charts + insights
- ✅ All colors use CSS variables
- ✅ Mobile responsive (tested 320px+)
- ⏳ **Next:** Figma mockups from these specs for visual reference
- ⏳ **Next:** Polish animations + transitions
- ⏳ **Next:** Dark/Light mode toggle (optional)

---

**Status:** Design system ready. All React components styled & responsive. Ready for Figma mockups or Fiverr designer brief.

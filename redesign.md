# Global UI Theme — Applied from Reference Design

Style and component language extracted from the reference landing page (Nicepay-style fintech layout), re-applied to the AI Data Analyst app's actual content across all screens. Copy the *style*, not the copy — every section below is re-written for this product.

---

## 1. Design Tokens (replaces current `:root` in `frontend/src/index.css`)

### Color
* `--color-bg`: `#FFFFFF`
* `--color-bg-tint`: `#F6F4FF` (soft lavender section backgrounds, replaces flat `#FAFAFA`)
* `--color-surface`: `#FFFFFF`
* `--color-border`: `#ECE9F7`
* `--color-text`: `#0F0B1F` (near-black with a violet undertone, not pure gray-black)
* `--color-text-secondary`: `#6B6785`
* `--color-accent`: `#7C5CFC` (primary violet — replaces `#6366F1`)
* `--color-accent-hover`: `#6845F0`
* `--color-accent-light`: `#EFE9FF`
* `--color-accent-gradient`: `linear-gradient(135deg, #A78BFA 0%, #7C5CFC 50%, #C4B5FD 100%)`
* Keep existing `--color-success` / `--color-warning` / `--color-error` — those are functional, not thematic, and don't need to match the marketing palette.

### Typography
* `--font-display`: `'Plus Jakarta Sans', 'Manrope', var(--font-sans)` — a rounded geometric sans for headlines, matching the reference's soft, confident display type. Body copy stays on the existing `Inter` — don't switch the whole app, only headline-weight text.
* Headline weight: 700–800, tight letter-spacing (`-0.02em`).
* Accent-word pattern: one word per headline in `--color-accent`, rest in `--color-text` — this is the reference's signature typographic move, use it consistently on every section heading.

### Shape & Elevation
* `--radius-lg`: `20px` (cards)
* `--radius-full`: pill buttons and badges — replace current rounded-`md` buttons with full-pill CTAs to match reference.
* `--shadow-float`: `0 20px 60px rgba(124, 92, 252, 0.15)` — soft, colored, diffused shadow for floating cards and hero visuals (the reference never uses a neutral gray shadow on hero elements — shadows pick up the accent color).

### Signature motif: floating cards + gradient blob
The reference's core visual device is: a central 3D object (the phone) surrounded by smaller UI cards that appear to float around it, on top of a soft radial gradient blob. Reuse this device but replace the phone/finance-app content with **this product's actual UI** — see §2.

---

## 2. Landing Page — full re-layout

```
┌──────────────────────────────────────────────────────────┐
│ Nav: wordmark left · Home/Features/Pricing/Docs · pill CTA│
├──────────────────────────────────────────────────────────┤
│              [pill badge: "AI-Powered Analytics"]          │
│         Understand your data                               │
│         with  [Nicepay-style accent-colored "AI Agents"]   │
│    Upload a CSV. Ask a question. Watch four agents reason   │
│         through it in real time.                            │
│              [pill CTA: "Try it free"]                       │
│                                                                │
│    Floating hero visual (gradient blob background):          │
│    - Center: a stylized chat bubble / answer card             │
│    - Floating around it: small cards showing —                 │
│      a live SQL snippet, a mini bar chart, an "Anomaly          │
│      detected" tag, an agent-node icon                          │
│    (same layered floating-card device as the reference,          │
│     content swapped to this product)                              │
├──────────────────────────────────────────────────────────┤
│ "Trusted by" logo strip → replace with a stat strip since        │
│ there's no customer logos yet: "1,000+ rows analyzed in demo ·    │
│ 6 specialized agents · sub-5s query time"                          │
├──────────────────────────────────────────────────────────┤
│ [pill: "Our workflow"]                                             │
│ How Data Analyst makes sense of your data, easier                  │
│                                                                       │
│ 2×2 card grid (reference's exact pattern — icon badge, title,        │
│ description, mini live-preview mockup inside each card):              │
│  ┌─────────────────────┐  ┌─────────────────────┐                     │
│  │ ① Upload your data   │  │ ② Ask in plain      │                     │
│  │   mini: dropzone      │  │    English           │                     │
│  │   preview              │  │   mini: chat bubble  │                     │
│  └─────────────────────┘  └─────────────────────┘                     │
│  ┌─────────────────────┐  ┌─────────────────────┐                     │
│  │ ③ Agents reason        │  │ ④ Get answers +      │                     │
│  │   through it            │  │    charts             │                     │
│  │   mini: agent trace      │  │   mini: bar chart      │                     │
│  │   nodes lighting up       │  │   preview               │                     │
│  └─────────────────────┘  └─────────────────────┘                     │
├──────────────────────────────────────────────────────────┤
│ [pill: "Key Features"]                                             │
│ Boost your analysis with Data Analyst                              │
│  2-col icon list (Anomaly Detective / Forecasting / Agent           │
│  Trace / Secure by Design) + a phone/device mockup on the right      │
│  showing the actual chat UI mid-conversation                          │
├──────────────────────────────────────────────────────────┤
│ CTA banner — reference's concentric-circle device:                   │
│  center icon = product mark, floating cards around it = mini          │
│  chart / mini agent-step / "Success: 1,000 rows imported"              │
│  [pill CTA: "Start analyzing free"]                                     │
├──────────────────────────────────────────────────────────┤
│ [pill: "Pricing"] — Simple, transparent pricing                       │
│  3-col cards, middle plan highlighted with accent border/button        │
│  (Free / Pro / Team — adapt to real pricing if any exists)             │
├──────────────────────────────────────────────────────────┤
│ [pill: "Testimonials"] — swap for "What early users are saying"       │
│  or omit entirely if none exist yet — don't fabricate quotes           │
├──────────────────────────────────────────────────────────┤
│ [pill: "From the blog"] — 3-card grid, or omit if no blog exists       │
├──────────────────────────────────────────────────────────┤
│ Footer — wordmark, link columns, newsletter signup (optional)          │
└──────────────────────────────────────────────────────────┘
```

**Content note:** the reference has testimonials and a blog section — only include those on your landing page if they're real. Fabricated quotes/posts read worse than omitting the section. For an internship assignment, cutting both and going straight from pricing (or CTA banner) to footer is the more credible choice.

---

## 3. Login Page — theme pass only, structure stays

The current card-centered login layout is already close to reference-compatible. Apply theme only:
- Card background stays white, but background-page becomes `--color-bg-tint` (soft lavender) instead of flat `#FAFAFA`, with a subtle radial gradient blob behind the card (reuse the hero's gradient device at low opacity) instead of the current SVG grid pattern.
- Buttons become full-pill (`--radius-full`) instead of `--radius-md`.
- Tab switcher (Sign In / Register) gets a pill-shaped active-state indicator instead of the current rectangular one.
- Everything else — form structure, validation, demo login — unchanged.

---

## 4. Workspace — theme pass, structure per the earlier redesign

Apply the same token swap (violet accent, pill buttons, `--radius-lg` cards, soft colored shadows) to the three-column workbench structure from the previous breakdown:
- `Button.jsx` → full-pill shape, violet gradient background on primary actions (Send, Get Started-equivalent) instead of flat indigo.
- `StatCard.jsx` → adopt the reference's card style: soft `--color-bg-tint` background, icon in a small violet circular badge top-left (matches reference's "Total Users" card icon treatment) rather than the current plain icon-over-number stack.
- `AgentTraceTimeline.jsx` (promoted to right rail per previous doc) → this is where the floating-card motif pays off again: render each agent node as a small floating pill/card with a soft colored shadow, connected by a thin line, echoing the hero visual's device — creates visual continuity between landing page and product.
- `MessageBubble.jsx` code blocks keep the existing monospace/dark treatment — don't theme code blocks with violet, code should stay neutral for readability.

---

## 5. Explicit Change List (action items against current build)

| # | File | Change |
|---|---|---|
| 1 | `frontend/src/index.css` | Replace color tokens per §1; add `--font-display`; add `--radius-full` usage; add `--shadow-float` |
| 2 | `components/common/Button.jsx` | Switch default radius from `--radius-md` to `--radius-full`; primary variant uses `--color-accent-gradient` background |
| 3 | `pages/Landing.jsx` | Full rebuild per §2 — replace icon-card feature grid with 2×2 workflow cards containing live mini-previews; replace static badge+gradient hero with floating-card hero visual; add CTA banner with concentric-circle device |
| 4 | `pages/Login.jsx` | Theme-only pass per §3 — background tint + blob, pill buttons/tabs, structure unchanged |
| 5 | `components/dashboard/StatCard.jsx` | Restyle per §4 — circular icon badge, tinted background, remove current inconsistent success-color borders (flagged in previous review) |
| 6 | `components/trace/AgentTraceTimeline.jsx` | Restyle nodes as floating pill-cards with colored shadow, in addition to the earlier structural change (promote to persistent right rail) |
| 7 | `components/chat/MessageBubble.jsx` | Keep code blocks neutral/dark — do not apply violet theme here, only to chrome around it |
| 8 | New: hero illustration | Build a static/animated composite of chat-bubble + SQL snippet card + mini chart + anomaly tag, arranged like the reference's floating phone scene — this is the one genuinely new asset needed, everything else is a token/component reskin |
| 9 | Font loading | Add Plus Jakarta Sans (or Manrope) via existing font-loading method, scoped to headline elements only |

Everything in this list reuses components that already exist in the codebase (per the structural breakdown) — the only new build is item 8, the hero visual composite.
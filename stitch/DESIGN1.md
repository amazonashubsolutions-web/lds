# Design System Document

## 1. Overview & Creative North Star: "Chromatic Architecturalism"
This design system rejects the "commodity UI" look of generic SaaS templates. Our Creative North Star is **Chromatic Architecturalism**. We treat the screen not as a flat canvas, but as a structural environment defined by light, depth, and intentional voids. 

By leveraging the high-contrast relationship between pure white, deep emerald, and black, we create a digital experience that feels like a premium editorial publication. We break the rigid, predictable grid through intentional asymmetry—using large-scale typography and overlapping surface layers to guide the eye. This system is designed to feel authoritative yet breathing, professional yet avant-garde.

---

## 2. Colors & Tonal Logic
The palette is strictly curated from the brand's core identity. We use the depth of emerald and turquoise to create a sophisticated, monochromatic range, punctuated by the absolute clarity of black and white.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to define sections or containers. 
Traditional lines create visual clutter. Instead, define boundaries through:
- **Tonal Shifts:** Placing a `surface-container-low` (#f3f3f4) section against a `surface` (#f9f9f9) background.
- **Negative Space:** Using the Spacing Scale (specifically scales 12 through 20) to create "islands" of content.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
- **Base Layer:** `surface` (#f9f9f9).
- **Secondary Content:** `surface-container` (#eeeeee).
- **Floating Prominence:** `surface-container-lowest` (#ffffff) for high-impact cards.
- **Nesting:** When nesting elements, always move one step up or down the hierarchy to ensure legibility without outlines.

### The "Glass & Gradient" Rule
To inject "soul" into the interface:
- **CTAs:** Use a subtle linear gradient from `primary` (#004f51) to `primary_container` (#00696b). 
- **Overlays:** For navigation bars or floating menus, use `surface_container_lowest` at 80% opacity with a 12px `backdrop-blur`. This ensures the Emerald Horizon essence bleeds through the interface.

---

## 3. Typography: Editorial Authority
We utilize **Plus Jakarta Sans** for its modern, geometric clarity. The hierarchy is designed to be "Top-Heavy," using large display scales to command attention.

- **Display Scales (lg/md/sm):** These are your "Anchors." Use `on_surface` (#1a1c1c) for these. They should often be placed with generous leading and asymmetrical alignment to break the grid.
- **Headline & Title Scales:** Used for structural grouping. 
- **Body Scales:** `body-lg` is your workhorse. Use `on_surface_variant` (#3e4949) for long-form reading to reduce eye strain, reserving pure black for titles.
- **Labels:** Use `label-md` in all-caps with 0.05em letter-spacing for a technical, high-end feel.

---

## 4. Elevation & Depth
In this design system, depth is a functional tool, not a decorative one. We move away from "drop shadows" toward **Ambient Occlusion**.

- **Tonal Layering:** Achieve lift by stacking. A `surface-container-lowest` (#ffffff) card sitting on a `surface-container-high` (#e8e8e8) section provides a crisp, natural distinction.
- **Ambient Shadows:** When a floating state is required (e.g., a primary modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 79, 81, 0.06)`. Note the tint—the shadow uses a transparent version of our `primary` emerald, not grey.
- **The "Ghost Border":** If a boundary is required for accessibility (e.g., an input field), use the `outline_variant` (#bec9c8) at 20% opacity. 100% opaque borders are forbidden.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), white text, `md` (0.75rem) roundedness. 
- **Secondary:** `surface-container-highest` (#e2e2e2) with `on_surface` text. No border.
- **Tertiary:** Purely typographic using `primary` color, with a subtle underline appearing only on hover.

### Input Fields
- **Styling:** Use `surface-container-low` (#f3f3f4) as the fill. 
- **State:** On focus, transition the background to `surface-container-lowest` (#ffffff) and apply a 1px "Ghost Border" of `primary` (#004f51) at 30% opacity.

### Cards & Lists
- **The "No-Divider" Mandate:** Dividers are a sign of weak layout. Separate list items using the spacing scale (e.g., `spacing-4`) and subtle background hover states (`surface-container-high`).
- **Card Geometry:** Use `lg` (1rem) roundedness for containers. Content should have a minimum internal padding of `spacing-6` (1.5rem) to maintain the premium, "breathable" feel.

### Tooltips & Chips
- **Chips:** Selection chips should use the turquoise/petrol derived from `secondary_container` (#7ef1f4). 
- **Tooltips:** High-contrast editorial style. `on_surface` (#1a1c1c) background with `surface` (#f9f9f9) text.

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Place a large `display-lg` headline on the left with a column of `body-md` text offset to the right.
- **Embrace White Space:** Use the `20` and `24` spacing tokens to separate major sections.
- **Color as Logic:** Use `primary` (#004f51) strictly for action and `tertiary` (#464646) for metadata.

### Don't:
- **Don't use 1px solid dividers.** Use background color shifts.
- **Don't use standard Grey (#888888) shadows.** Use tinted ambient shadows.
- **Don't crowd the interface.** If a layout feels busy, increase the spacing tokens and reduce the number of visible containers.
- **Don't use center-alignment for everything.** Editorial layouts thrive on left-aligned anchors and intentional "off-center" elements.
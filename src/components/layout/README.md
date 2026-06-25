# Layout components — design system reference

Visual identity: **Maison Noir**, a premium men's fashion retailer.
Monochrome by brief (black / white / charcoal), one restrained accent.

## Palette

Defined as CSS variables in `src/app/globals.css`, mapped onto
Shadcn's standard token names (`--background`, `--primary`, etc.) so
every Shadcn UI component inherits the palette automatically.

| Token       | Light mode | Role                                          |
| ----------- | ---------- | ---------------------------------------------- |
| Ink         | `#0A0A0A`  | Primary text / dark-mode surface. Warm near-black, not pure `#000` — pure black reads digital/cheap; a touch of warmth reads like ink or worsted wool. |
| Paper       | `#FAFAF8`  | Primary surface / dark-mode text. Warm off-white, not stark white. |
| Charcoal    | `#3A3A38`  | Secondary text (`muted-foreground`).            |
| Smoke       | `#E8E6E1`  | Hairlines, dividers, subtle fills (`secondary`, `border`). |
| Gold-ash    | `#9C8F7C`  | The single accent — desaturated brass, evoking tailoring hardware (buttons, buckles). Used only for focus rings and the nav hover underline. Never a fill color, never used for large areas. |

Dark mode inverts surface/text roles (Ink becomes the background) but
keeps Gold-ash constant — the one element that doesn't flip.

## Typography

Two roles, used with discipline:

- **`font-display`** (Playfair Display, italic-leaning) — the
  wordmark and large editorial headings (`h1`–`h4`) only. This is the
  signature type treatment; using it anywhere else would dilute it.
- **`font-sans`** (Inter) — all body copy and UI chrome.
- **`.text-label`** utility — `font-sans`, uppercase, `0.18em`
  tracking, `text-xs`. The recurring "garment tag" motif used for nav
  links, footer column headers, and eyebrows. This is the structural
  device that replaces generic pill/badge/chip treatments throughout.

## Layout signature

The header uses a centered wordmark flanked by navigation (left) and
action icons (right) — not a conventional left-aligned-logo bar. Hover
states are a hairline underline that grows from center (`Navigation`),
never a background fill. Border radius is intentionally near-zero
(`--radius: 0.125rem`) — luxury menswear reads as tailored hairlines
and sharp edges, not rounded SaaS chrome.

The footer mirrors this: thin rules divide every region, no card
backgrounds or shadows anywhere in the layout chrome.

## Files

| File                                  | Purpose                              |
| -------------------------------------- | ------------------------------------- |
| `src/app/globals.css`                  | CSS variables (light/dark), `.text-label` utility |
| `src/config/nav.ts`                    | Shared nav link data (desktop + mobile read from here) |
| `src/components/layout/header.tsx`     | Utility bar + main bar (server component) |
| `src/components/layout/navigation.tsx` | Desktop inline nav, `lg:` and up      |
| `src/components/layout/mobile-nav.tsx` | Drawer nav, below `lg` (client component — holds open state) |
| `src/components/layout/footer.tsx`     | Footer columns + newsletter form      |
| `src/components/ui/sheet.tsx`          | Shadcn UI Sheet primitive (built on Radix Dialog), powers the mobile drawer |

Nav data is static for now — no pages or category data fetching exist
yet. Once the `Category` model is wired to live navigation, update
`src/config/nav.ts`'s shape or replace it with a data-fetching
equivalent; `Header`/`Footer`/`MobileNav` should keep reading from a
single shared source rather than duplicating links.

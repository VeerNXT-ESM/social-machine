# VeerNXT Social - Corporate UI Redesign Plan (v2)

**Direction (from the client):** grey and white only, no rounded corners, a professional dashboard look in the style of Buffer / Meta Business Suite.

**Status:** the layout redesign is done (restyle of every screen, new Calendar, Content Library table, two-column composer, responsive shell). The shared component set is built and applied; remaining items are in section 5.

---

## 1. Design rules

1. **Grey and white only.** No accent colours anywhere: no blue, green, amber, pink or gradients. Meaning comes from wording, icons and weight, not colour.
2. **Square corners.** No border radius on anything (buttons, inputs, cards, avatars, status dots).
3. **Flat.** No glass, glow, blur or gradient text. One light shadow on modals and floating cards only.
4. **Content first.** Compact page headers, dense cards and tables, no hero banners.
5. **Sentence case, no emoji** in the interface. Small uppercase labels only for KPI and section labels.
6. **Accessible.** Dark grey text on white or light grey; visible focus ring; body text 14 px.

## 2. Visual system (as built)

| Token | Value | Use |
|---|---|---|
| Canvas | `#F5F5F5` (neutral-100) | Page background |
| Surface | `#FFFFFF` | Sidebar, top bar, cards, modals |
| Inset | `neutral-50` / `neutral-100` | Inputs, table headers, selected items |
| Border | `neutral-200` (`neutral-300` for controls) | 1 px lines |
| Text | `neutral-900` / `700` / `600` / `500` | Primary to muted |
| Primary action | `neutral-800`, hover `neutral-700`, white text | The one dark button per view |
| Secondary action | White, `neutral-300` border, dark text | Everything else |

- **Font:** Inter (`next/font`), 14 px body. **Icons:** Lucide.
- **Status** is shown as a small bordered label with an icon (check for approved, clock for scheduled, layers for reviewing), all in grey.
- **Enforcement:** `globals.css` sets all radius tokens to 0 and adds a `border-radius: 0 !important` safety net, so nothing can be rounded by accident.

## 3. Layout

- **Sidebar:** white, 256 px, right border. Sections: Dashboard, Create, Content Library, Calendar, Media Library, Campaigns, Analytics, Settings.
- **Top bar:** page title, a discreet "Sandbox mode" indicator with a switch, and a Create button.
- **Dashboard:** compact "Overview" header with two actions, a five-card KPI row, recent content cards.
- **Editor:** content header with Approve All, message and visual-concept panels, platform tabs, editor / preview toggle, action panel.
- **Previews:** LinkedIn, X, Instagram and Facebook mockups on white cards with a neutral border, so they read as previews rather than a themed UI.
- **Developer tools:** the test campaign moved from the sidebar and top bar to Settings > Developer tools.

## 4. Done

| Item | State |
|---|---|
| Tokens, Inter font, square-corner rule, page title (`VeerNXT Social`) | Done |
| Every screen converted to grey and white; gradients, glow, glass, blur, rounded classes and emoji removed | Done |
| Dashboard: compact Overview header replaces the hero banner | Done |
| **Calendar rebuilt.** Real week, month and list views (the old month grid ignored the month), previous/next/today, channel and status filters, post chips with time and status, "+n more" overflow, and a "Ready to schedule" panel where approved posts get a date and time and move onto the calendar | Done |
| **Content Library** is now a table (it used to show the dashboard): search, status and channel filters, checkboxes, bulk "Approve posts", channel icons, approval progress, updated date | Done |
| **Composer** is two columns: source material with tabs on the left; details, channels and the Generate button on the right | Done |
| Test campaign moved to Settings > Developer tools; Sandbox mode indicator; page titles cleaned up | Done |
| Responsive: 1440 px, 1024 px (panels stack, calendar scrolls sideways) and 390 px (mobile menu, header no longer overflows) | Reviewed in screenshots |
| Modals: Test Campaign (empty state) and Manual Publish reviewed; copy fixed | Reviewed |
| **Shared component set** in `src/components/ui/`: `Button` (primary, secondary, ghost; sm, md, lg), `Card`/`CardHeader`/`CardBody`, `PageHeader`, `Field`/`Input`/`Select`/`Textarea`, `Modal` (Escape and click-outside to close), `Tabs`, `SegmentedControl`, `StatCard`, `EmptyState`, `StatusLabel`, plus a `cn()` class helper. All screens and both modals now use them | Done |
| Editor rebuilt on the components. **Bug fixed:** Publish now and Schedule called the API without the post, so they failed with "Post not found"; they now send the post, save the status in the browser, and show inline messages instead of `alert()` popups. Publish and Schedule are disabled once a post is published | Done, tested in the browser |
| Settings, Campaigns, Media, Analytics, Dashboard, Composer, Library, Calendar, Header and Sidebar migrated; internal ticket numbers such as "(#27)" removed from labels; media delete icon contrast fixed | Done |

## 5. Remaining work

1. **Calendar extras:** drag to reschedule, day view with time slots, and rescheduling a post that is already scheduled.
2. **Sample data.** Seeded items use the green logo image and emoji in sample post copy. Existing browser data keeps old content until regenerated.
3. **PlatformPreviews** still has its own per-platform class strings (they are faithful platform mockups, so deliberately separate from the kit).
4. **Test Campaign modal after a real generation** has not been re-run since the migration (costs about Rs 7-8).
5. **Lint.** `npm run lint` reports 9 errors, all outside `src/components` (older `any` types in `lib/` and the API routes, and one React hook rule in `page.tsx`).
6. **Optional:** dark grey theme via the same tokens; accessibility pass; unit tests for the components.

## 6. Acceptance checks

- Search of `src/` for `emerald|amber|blue|pink|purple|rose|slate|gradient|glass|glow|rounded` in components and page: none (currently passes).
- Screenshots of every screen at 1440, 1024 and 390 px reviewed.
- `tsc --noEmit` and `npm run build` pass (both currently do). `npm run lint` is clean inside `src/components`; 9 older errors remain elsewhere.
- Existing flows work: generate, review, approve, mock publish, manual publish.

## 7. Risks and notes

- **Brand.** The VeerNXT logo is green and gold; it now appears only as the logo. Confirm the client accepts an otherwise fully monochrome interface.
- **Status without colour.** Status must stay distinguishable by icon and label; check this in review.
- **Platform previews** are approximations of each platform's look and can drift; keep them labelled as previews.
- **Generated images** are still full colour by nature; only the interface chrome is monochrome.

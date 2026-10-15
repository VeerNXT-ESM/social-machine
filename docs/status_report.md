# VeerNXT Social (socialmachine) - Status Report

**Date:** 30 September 2026
**Branch:** `master` (nothing committed this session; all work is uncommitted in the working tree)
**Latest:** corporate UI redesign done (grey and white, square corners, new Calendar, Content Library table, two-column composer, responsive); see [UI_REDESIGN_PLAN.md](UI_REDESIGN_PLAN.md). Shared component set built and applied
**Note:** `npm run lint` reports 9 errors, none in `src/components`; `npm run build` passes; `tsc --noEmit` is clean

---

## 1. What the project is

A Next.js 16 (App Router, Tailwind 4) app that turns one idea or article into platform-specific posts for LinkedIn, X, Instagram and Facebook, lets a person review and edit them, then schedules or publishes.

- **AI:** OpenAI (`gpt-4o` for text, `gpt-image-2.5-flare` for images).
- **Storage today:** the browser's `localStorage` through `mockRepo` ([mockStore.ts](../src/lib/mockStore.ts)). A Supabase schema exists in `supabase/migrations/`, but the flows I worked on do not use it.
- **Publishing today:** Mock and Manual providers only. The LinkedIn, X, Meta and Buffer providers are skeletons.
- **Brand rules** (from README and system prompt): no "Agniveer"; use "Ex-Service Men (ESM)"; no invented facts, statistics, dates or URLs; India audience.

## 2. Done this session

| # | Item | State |
|---|---|---|
| 1 | **Project analysis** and a mock-content test plan | Done |
| 2 | **Two posts per channel test.** The Test Campaign now generates two content items (launch, and skills for civilian careers), each with LinkedIn, X, Instagram and Facebook posts: 8 posts | Done, typechecks. Not clicked through in a browser by me end to end |
| 3 | **AI images.** One image per content item using `gpt-image-2.5-flare`, `quality: 'medium'`. Saved to `public/generated/` (gitignored). Falls back to `/logo.png` if there is no key or a failure. Code: [imageGen.ts](../src/lib/imageGen.ts) | Verified with real API calls |
| 4 | **India fix for images.** First images showed a Western soldier in US-style camouflage. Added India guidelines to every image prompt and a rule to the text system prompt | Verified with one new test image (Indian professionals, Indian office). Only one sample checked |
| 5 | **Platform-style previews in the test modal.** Reuses `PlatformPreviews` for the four channels | Done. Screenshot reviewed by the user |
| 6 | **Removed the Instagram "Visual Concept" overlay** that was printed over the image in the mockup | Done |
| 7 | **Two existing bugs fixed:** the generate route saved to `localStorage` on the server (a no-op), and the publish route could not find new items (404). The modal now saves in the browser and sends the post to the publish route | Done |
| 8 | **Cost analysis.** About $0.03-0.04 (about Rs 3-4) per content item; about Rs 7-8 for a full test run | Estimates from third-party price pages |
| 9 | **Campaign workbook** ([VeerNXT_Campaign_Schedule_and_Costing.xlsx](VeerNXT_Campaign_Schedule_and_Costing.xlsx)): 8 weeks, 16 themes, 9 pillars, 64 posts, costing in USD and INR (about Rs 78 expected, Rs 49-165 range) | Recalculated in LibreOffice, 0 formula errors. Not opened in Excel |
| 10 | **Themes from the main site** (`veernxt-web`): umbrella "Your Second Mission", journey from awareness to joining | Done, needs client approval |
| 11 | **Corporate UI restyle.** Grey and white only, no rounded corners, no gradients, glow, glass or emoji. Inter font, page title fixed, compact dashboard header, test campaign moved to Settings > Developer tools. A converter script remapped about 60 colour patterns; a bug in its first run (side borders lost) was found and fixed | Done, reviewed in 1440 px screenshots. Media Library, Campaigns, both modals and smaller widths not yet reviewed |
| 13 | **Layout redesign.** Calendar rebuilt with real week/month/list views, filters and a schedule panel; Content Library is now a filterable table with bulk approve; composer is two columns; responsive shell checked at 1440, 1024 and 390 px | Done, reviewed in screenshots. Test modal after real generation not re-run |
| 15 | **Server-side storage (Supabase).** Content items, platform posts and campaigns now live in the database. New server layer (`src/lib/db/`), API routes (`/api/items`, `/api/items/[id]`, `.../posts/[platform]`, `.../approve`), and generate and publish routes that read and write the database. Browser client in `src/lib/api.ts`; every screen and modal moved over. Editor autosaves (debounced, flushed on leave). Until sign-in exists, rows belong to one workspace-owner account created through the admin API. Schema applied with tightened row level security (no open policies). Verified: 26 API checks, a full browser run with a fresh profile (content survives a reload and a new browser), and rows confirmed in the database | Done |
| 17 | **Content sources scraper.** Finds article links on defence and strategy sites to inspire posts. Safe fetcher (blocks internal addresses, size and time limits, robots.txt, per-site rate limit), RSS and web-page readers, spam and off-site filters, and a transparent keyword relevance score. Sources screen (scan, filter, save, dismiss, create content from a link), source and link storage with tables in `02_content_sources.sql`. The page-reader route was hardened against internal-address (SSRF) requests and now extracts proper article text. **Verified:** all 6 sources against the live sites (IMR 42 real links with 11 casino-spam links blocked; IDSA 35; CLAWS 25; NMF 10; IDR 50 with filler scored 0; USI 16 journal articles) and the SSRF checks. **Also verified after the project was restored:** storage of 178 links (re-scan adds 0 duplicates, scores refresh when rules change) and the Sources screen in a real browser, including create-content-from-link. A spam false positive (the word "kumar" matched a real author) was found and fixed | Done |
| 16 | **Images to Supabase Storage.** New `src/lib/db/media.ts` (public `media` bucket, records each upload in the `media` table) and `imageGen.ts` now uploads instead of writing to disk. The 2 existing images were migrated (URLs verified to serve from storage) and new generations upload to storage | Done |
| 18 | **Industry Insights batch for the Colonel.** 11 articles from the sources turned into 44 posts (4 channels each), saved in the database in review status, with images in storage. First generation was rejected on reading: posts forced unsupported career claims. Added a guardrail (`src/lib/insightRules.ts`, `contentGuard.ts`, `POST /api/items/[id]/guard`) that checks every post (source credited, no jobs or opportunity claims, only figures from the article, X length, no placeholders) and rewrites failures; it now runs automatically when content is made from a source link. 29 of 48 posts failed and were fixed (3 by hand). One article was dropped because it concerned police conduct at political protests and the posts invented an Ex-Service Men angle. Workbook `docs/VeerNXT_Industry_Insights_Schedule.xlsx`: 44 posts over 6 weeks (26 Oct to 3 Dec 2026), decision dropdown, source articles with previews, review notes | Done, awaiting approval |
| 14 | **Shared UI component set** (`src/components/ui/`: Button, Card, PageHeader, Field, Modal, Tabs, SegmentedControl, StatCard, EmptyState, StatusLabel, `cn()` helper) applied to every screen and modal. **Bug fixed:** Publish now and Schedule in the editor failed because the post was not sent to the API; both now work (tested in the browser) | Done |
| 12 | **Test modal check made real.** It logged "Verified... no Agniveer" without checking. It now counts the posts and scans them for the prohibited term | Done, not run against live generation |

## 3. Cost reference

| | Low | Expected | High |
|---|---|---|---|
| Per content item | Rs 3 | Rs 5 | Rs 10 |
| Full campaign (16 items) | Rs 49 | Rs 78 | Rs 165 |

Assumes about Rs 96.5 per USD (from a web search, not a live rate). Excludes ad spend, staff time, hosting, GST and bank fees. Check the OpenAI usage dashboard for real spend.

## 4. Known issues and risks

00. **LibreOffice on this machine looks half-installed** (a few program files and two installer packages in `C:\Program Files\LibreOffice`). Formula recalculation of workbooks was not possible, so the Colonel's workbook uses fixed values for dates and counts.
0. **Supabase project was paused** (restored 15 Oct 2026). The free plan pauses projects after about a week of inactivity (it happened between 1 and 15 Oct 2026). Restore it from the dashboard (Restore project). To prevent a repeat, upgrade the plan or schedule a regular request to the project. Until then, storage, images and Sources cannot be tested.

1. **Images are still files on disk (next step).** Posts store only the image path. `imageGen.ts` writes to `public/generated/` on disk. That works locally but not on Vercel (read-only filesystem). Before deploying, upload to Supabase Storage (the `media` bucket already planned in the README) or similar and store the URL.
2. **Data lives in the browser only.** Clearing site data loses all content. `localStorage` also has a ~5 MB limit; images are stored as file paths so this is fine for now.
3. **Old images in the browser.** Content generated before the India fix still shows the Western images until the test campaign is run again.
4. **Real OpenAI key in `.env`.** Every test run spends real money (about Rs 7-8). I never printed the key. For offline runs set it to `your_openai_api_key_here`.
5. **Page metadata is still "Create Next App"** ([layout.tsx](../src/app/layout.tsx)).
6. **Nothing is committed.** Working tree has modified and untracked files (see section 6). `package.json` changes came from before this session.
7. **Lint not run.** `tsc --noEmit` is clean; `npm run lint` was not run.
8. **Windows tooling gap.** The xlsx skill's `recalc.py` needs Unix sockets and fails on Windows. I recalculated by converting through LibreOffice directly.
9. **Publishing is not real.** Live publishing to any platform needs the provider skeletons built and credentials added.

## 5. Open decisions for the client

1. **Audience wording.** The VeerNXT website is written largely for Agniveers; the social brand rules exclude the word. Confirm posts stay ESM/veteran-only.
2. **Claims to verify before posting:** "Government of India Approved" vs "Aligned"; SEBI-compliant and NISM-certified planners; "500+ exams"; veteran and community counts.
3. **Features not ready to promote:** Legal Aid Cell (page says "demonstration"), WhatsApp alerts (simulated), Rewards (empty catalogue), app-store listings ("coming soon").
4. **Employer wording:** the site says employers contact candidates directly; the Private Sector module is deliberately HR-mediated.
5. **Approve the 16 themes, start date (12 Oct 2026 is a placeholder), posting days and times.**

## 6. Files changed or added (uncommitted)

**New:** `src/lib/imageGen.ts`, `src/lib/cn.ts`, `src/components/ui/*` (Button, Card, PageHeader, Field, Modal, Tabs, StatCard, EmptyState, index), `src/components/ContentLibraryView.tsx`, `src/components/ui/StatusLabel.tsx`, `docs/status_report.md`, `docs/UI_REDESIGN_PLAN.md`, `docs/VeerNXT_Campaign_Schedule_and_Costing.xlsx`
**Edited this session:** `src/app/api/content/generate/route.ts`, `src/app/api/publish/route.ts`, `src/components/TestCampaignModal.tsx`, `src/components/PlatformPreviews.tsx`, `src/components/CalendarView.tsx` (rewritten), `src/components/CreateContentView.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`, `src/components/DashboardView.tsx`, `src/components/SettingsView.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/openai.ts`, `.gitignore`
**Already modified/untracked before this session:** `README.md`, `package.json`, `package-lock.json`, `src/app/globals.css`, `src/app/page.tsx`, `public/logo.png`, `src/app/api/`, `src/components/`, `src/lib/`, `src/types/`, `supabase/`

## 7. Suggested next steps

1. Colonel reviews the Industry Insights workbook; approved posts can then be approved and scheduled in the app.
2. Campaigns, media library and brand settings into the database, then sign-in. Daily automatic scans (cron). Support for reading PDF articles (USI).
2. Remaining UI items: calendar drag-to-reschedule and day view, replace sample data and images ([plan](UI_REDESIGN_PLAN.md), section 5).
2. Client review of the campaign workbook; resolve the open decisions in section 5.
3. Before any deployment: move images to Supabase Storage and move persistence off `localStorage`.
4. Build live publishing (start with one platform) once credentials exist.
5. Commit the work in logical pieces once the redesign direction is agreed.

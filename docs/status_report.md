# VeerNXT Social (socialmachine) - Status Report

**Date:** 19 October 2026
**Branch:** `main`, pushed to GitHub (`VeerNXT-ESM/social-machine`). Vercel redeploys on every push.
**Live site:** https://veernxt-social.vercel.app (sign-in required)
**Checks:** `tsc --noEmit` clean; `npm run build` passes; `npm run lint` 0 errors, 37 warnings (unused variables in the unfinished publishing skeletons)

---

## 1. What the app is

A Next.js 16 app (App Router, Tailwind 4) for the VeerNXT team. It turns one idea or article into posts for LinkedIn, X, Instagram and Facebook, lets a person review and edit them, then schedules or publishes. It is for Indian Ex-Service Men (ESM) content.

| Part | How it works today |
|---|---|
| **AI** | OpenAI: `gpt-4o` writes text; `gpt-image-2.5-flare` makes images (medium quality). If OpenAI fails or has no key, the app shows an error. It no longer saves sample content. |
| **Data** | Supabase (Sydney region): content, posts, campaigns, sources, links, media records and brand voice, with owner-only row security. Images in a public `media` bucket. |
| **Sign-in** | Supabase email and password. Required on the online site, off for local development (`npm run dev`). A proxy (`src/proxy.ts`) blocks every page and data request without a session. |
| **Publishing** | **LinkedIn and X are live through Buffer.** Sandbox mode (the default on every page load) only rehearses. Facebook and Instagram are not connected. |
| **Hosting** | Vercel, built from `main`. |

**Brand rules that always apply:** never the word "Agniveer"; use "Ex-Service Men (ESM)"; never invent facts, figures or links; India audience.

## 2. Done since the last report (30 Sep)

### Storage, sources and content
- **Server-side storage.** Content, posts and campaigns moved out of the browser into the database; a server data layer and API routes; the editor autosaves.
- **Content sources scraper.** Finds article links on defence and strategy sites, with a safe fetcher (blocks internal addresses, robots.txt, rate limit), spam filter and relevance score. Sources screen to scan, save, dismiss and create content from a link. 178 links stored from 6 sites.
- **Insight guardrails.** Posts made from outside articles are checked (source credited, no invented career claims, only figures from the article, X length) and rewritten if they fail.
- **Industry Insights workbook** for the Colonel: 44 posts, 26 Oct to 3 Dec 2026, with a decision column. **Awaiting his feedback.**

### Pictures
- **Own pictures.** Upload PNG, JPEG or WebP (10 MB max, type checked from the file contents, SVG refused) on a post, on the Create screen (skips the AI image) or in the Media Library; reuse from the library.
- **WebP compression.** Every upload and AI image is converted to WebP with `sharp`: longest side 2048 px, quality stepped down to about 600 KB, camera and location data removed, plus a 480 px WebP thumbnail. A 4000x3000 JPEG of 957 KB became 166 KB.
- **Images removed.** All earlier images were deleted; only `logo.png` remains in `public/`.
- **Article picture.** When an article is read from its web address, its own picture is offered with a "Use the article picture" button (saved as WebP). A copyright caution is shown.
- **JPEG at publish time.** A JPEG copy is made when a post is sent to Buffer, because LinkedIn and Instagram do not reliably accept WebP.

### Publishing through Buffer
- **Publish now and Schedule** create real posts in Buffer for LinkedIn and X (text, call to action and hashtags; an X post counts a link as 23 characters).
- **Status sync.** Once each time the app opens, it asks Buffer whether scheduled posts went out (sent, failed, or deleted in Buffer).
- **Cancel schedule** removes a scheduled post from Buffer.
- **Sandbox / Live switch** in the header. Live asks for confirmation before Publish now. Posts scheduled in Sandbox are labelled "sandbox only, not in Buffer".
- **Tested live:** a test post was scheduled and then cancelled and deleted in Buffer, with the image arriving as JPEG.

### Sign-in and hosting
- Sign-in added (above). Verified with 11 checks. Your user is `veernxt.esm@gmail.com`.
- **Vercel fixes.** The image tool was missing from the deployed server code; fixed in two steps (`next.config.ts` now includes `sharp`, `detect-libc` and `semver`). A health page at `/api/diagnostics` (sign-in required) reports which settings are present and whether the image tool, storage and Buffer work.

### Real data only
- **Analytics** reads real figures from Buffer (published posts, impressions, likes, comments, shares, clicks, saves). A tile appears only once a platform has reported it. Nothing has been published through Buffer yet, so it shows no figures.
- **Campaigns** lists the real campaigns in the database.
- Removed: sample analytics, sample campaigns, invented preview numbers and handles, "Run test campaign", "Load example", the fake "2-week campaign" button, and the built-in sample content the AI used when it failed.
- The 8 fake "Published" posts from the first sandbox test were deleted.

### Content tools
- **Delete content** (single or several, from the library or inside an item). Posts waiting in Buffer are cancelled first. Posts already published stay on the networks. The source article is made available again.
- **Article link added to posts** made from an article: LinkedIn and Facebook end with "Read the full article: <link>"; X gets the link within 280 characters; Instagram gets none (not tappable).
- **Website address** is now `https://veernxt.in` everywhere (58 saved posts corrected). **Assumed from "veernt.in", please confirm.** One constant to change: `src/lib/site.ts`.
- **Brand voice in the database and editable** on the Settings page (name, description, audience, tone, preferred terms, key messages, call to action style, prohibited words). The AI follows it on every write and rewrite. Saved for everyone, on any computer.
- **Prohibited words enforced.** Generated posts are rewritten if they contain a banned word; the editor shows a warning; a post containing one cannot be scheduled or published. "Agniveer" can never be removed from the list.
- **In-app help** updated for every page.

### Tests this period
Media API 31 of 32 (the one miss was a faulty test file, covered by a manual check); delete, link and article-picture 17 of 17; brand voice 12 of 12; prohibited words 8 of 8; sign-in 11 of 11; Buffer live scheduling and cancelling checked directly against Buffer. The browser (UI) test scripts depend on images that no longer exist and were not re-run; the new pages were not checked in a browser by me.

## 3. Known issues and risks

1. **Sandbox is the starting mode on every page load.** Switch to Live in the header (or Settings) before scheduling for real. Deliberate, to stop accidental posts.
2. **Public sign-ups were still switched on in Supabase** when last checked. Turn off "Allow new users to sign up" (Authentication, Sign In / Providers). Until then anyone could register an account.
3. **All signed-in users share one workspace** and see the same content. There are no separate roles.
4. **Facebook and Instagram are not connected.** Instagram needs a Business or Creator account linked to a Facebook Page, and every Instagram post needs a picture.
5. **Analytics are empty until a post is published through Buffer** (and platforms report a few hours later).
6. **Buffer free plan limits:** 100 API calls per 15 minutes, 250 per day. Plenty for manual posting.
7. **Supabase free plan pauses a project after about a week of inactivity** (it happened once). Upgrade the plan or schedule a regular request to prevent it.
8. **Prohibited words:** if the AI cannot remove a banned word after two rewrites, the post is kept and publishing stays blocked until you edit it. Brand voice changes apply to new posts only.
9. **Windows / K: drive.** The bundler cannot link native libraries on this drive, so `sharp` is loaded at run time. It works locally and on Vercel; do not change `next.config.ts` or the loader in `src/lib/db/media.ts` without testing both.
10. **Article pictures are usually copyrighted** by the news outlet. Use them only with the right to do so, or credit the source.
11. **Lint** has 37 warnings (unused variables in publishing skeletons: LinkedIn, X and Meta providers, which are not used because Buffer handles those channels).
12. **Page metadata** is still "VeerNXT Social" with a placeholder description; the real OpenAI key spends money on each generation (about Rs 3-10 per content item).
13. **LibreOffice on this machine is half-installed**, so the workbooks use fixed values and were not recalculated.
14. **The GitHub repository is public** until you change it at the end of the project. It contains no secrets (`.env` is ignored).

## 4. Open decisions

**For the team**
1. Confirm the website address is `veernxt.in`.
2. What content goes on Facebook and Instagram, and who creates those accounts.
3. Whether to remember Live mode between visits (convenient, but a rehearsal could become a real post by mistake). Recommended: keep Sandbox as the start.

**For the client** (unchanged)
1. **Audience wording.** The VeerNXT website is written largely for Agniveers; the social brand rules exclude the word. Confirm posts stay ESM/veteran-only.
2. **Claims to verify before posting:** "Government of India Approved" vs "Aligned"; SEBI-compliant and NISM-certified planners; "500+ exams"; veteran and community counts.
3. **Features not ready to promote:** Legal Aid Cell (page says "demonstration"), WhatsApp alerts (simulated), Rewards (empty catalogue), app-store listings ("coming soon").
4. **Employer wording:** the site says employers contact candidates directly; the Private Sector module is deliberately HR-mediated.
5. **Approve the 16 themes, start date and posting days and times** in the campaign workbook.

## 5. Next steps

1. **Turn off public sign-ups** in Supabase.
2. **Colonel reviews the Industry Insights workbook.** Then edit, approve and schedule the approved posts in the app (the posts have no pictures and no article link yet; the link can be added with one request per item and pictures uploaded in the editor).
3. **First real post** through Buffer in Live mode, then check Analytics a few hours later.
4. **Facebook and Instagram** once the accounts and content plan exist.
5. **Later:** daily automatic source scans, PDF article support, calendar drag-to-reschedule, a role for each team member, and a plan upgrade to avoid Supabase pausing.

## 6. Where things are

- **Migrations:** `supabase/migrations/01` to `04` (schema, sources, thumbnails, one brand row per owner). All applied to the database.
- **Server data layer:** `src/lib/db/`. **API routes:** `src/app/api/`. **Browser client:** `src/lib/api.ts`.
- **Buffer:** `src/lib/publishing/buffer.ts`. **Analytics:** `src/lib/analytics.ts`. **Brand voice:** `src/lib/db/brand.ts`, `src/lib/openai.ts`. **Prohibited words:** `src/lib/prohibited.ts`, `src/lib/contentGuard.ts`.
- **Sign-in:** `src/proxy.ts`, `src/app/login/`, `src/app/api/auth/`.
- **Docs:** `UI_REDESIGN_PLAN.md`, `VeerNXT_Campaign_Schedule_and_Costing.xlsx`, `VeerNXT_Industry_Insights_Schedule.xlsx`.
- **Secrets** live only in `.env` locally and in Vercel's Environment Variables (`OPENAI_API_KEY`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `BUFFER_API_KEY`).

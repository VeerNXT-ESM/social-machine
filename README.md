# VeerNXT Social - AI Social Content Assistant

> **Production-Ready Web Application for VeerNXT**

VeerNXT Social is a purpose-built AI-powered social media content assistant designed for the VeerNXT editorial and communications team. It transforms single ideas, announcements, or articles into platform-tailored, professional communications across **LinkedIn**, **X (Twitter)**, **Instagram**, and **Facebook**.

---

## 🎯 Key Purpose

This application is **NOT** primarily a generic social media scheduler. Its core workflow is:

```
TAKE ONE IDEA / ARTICLE / LINK / ANNOUNCEMENT
                      ↓
                UNDERSTAND IT
                      ↓
       CREATE PLATFORM-SPECIFIC CONTENT
                      ↓
       LET THE USER REVIEW AND EDIT IT
                      ↓
               SCHEDULE / PUBLISH
```

### 🇮🇳 Brand Rules & Messaging Guidelines
- **Strictly No "Agniveer"**: Mention of "Agniveer" is completely prohibited across all prompts, sample content, generated output, and UI.
- **Terminology**: Uses **"Ex-Service Men (ESM)"** and veteran transition terminology.
- **Brand Voice**: Professional, Supportive, Confident, Practical, and Human.
- **Fact Preservation**: Never invents facts, fake statistics, dates, or URLs.

---

## 🛠️ Technology Stack

- **Framework**: Next.js (App Router, Server Actions & API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism & dark navy aesthetic
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage)
- **AI Engine**: OpenAI API (GPT-4o structured JSON mode + single-platform refinements)
- **Icons**: Lucide React
- **Deployment Target**: Vercel

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18.x or higher
- npm 10.x or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your secrets in `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
> *Note*: If `OPENAI_API_KEY` is not supplied, the app automatically operates using the built-in AI mock engine so you can test all features offline.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

1. Create a new project in [Supabase](https://supabase.com).
2. Open the SQL Editor in Supabase Dashboard.
3. Run the SQL migration script located at:
   `supabase/migrations/01_initial_schema.sql`
4. This sets up tables for:
   - `profiles`
   - `brand_settings`
   - `campaigns`
   - `content_items`
   - `platform_posts`
   - `media`
   - `publishing_jobs`
   - `social_accounts`
5. Enable Storage Bucket `media` with public read access.

---

## ⚡ Mock Mode & Test Campaign (#35)

The application includes a built-in **MOCK MODE** indicator. You can test the complete end-to-end user workflow without social API credentials:

1. Click **"Run Test Campaign (#35)"** in the sidebar or header.
2. The system executes the complete pipeline:
   - Source: *"We are launching VeerNXT, a platform designed to help Ex-Service Men transition..."*
   - Generates tailored copy for LinkedIn (editorial), X (punchy), Instagram (visual), Facebook (conversational).
   - Approves all posts.
   - Runs `MockPublishingProvider`.
   - Verifies **PUBLISHED** status.

---

## 🔌 Publishing Provider Architecture

Located in `/src/lib/publishing/`:
- `MockPublishingProvider`: Simulates instant execution & status tracking.
- `ManualPublishingProvider`: Provides copy text, media download, and native app links.
- `LinkedInProvider`: REST API integration skeleton.
- `XProvider`: Twitter v2 API integration skeleton.
- `MetaProvider`: Facebook Page & Instagram Graph API integration skeleton.
- `BufferProvider`: Optional Buffer REST API provider.

---

## ☁️ Vercel Deployment

1. Push your repository to GitHub.
2. Import project into Vercel.
3. Add Environment Variables (`OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Click **Deploy**.

---

## 📄 License

Copyright © 2026 VeerNXT. All Rights Reserved.

# Ummah-DarazListings 🚀

A production-ready SaaS web application that generates SEO-optimized Daraz product listings from 2 to 5 competitor titles using **Claude 3.5 Sonnet**, **Next.js 14 App Router**, **Clerk Authentication**, and **Neon PostgreSQL with Drizzle ORM**.

---

## 🌟 Key Features

1. **Competitor Title Synthesizer**: Input 2 to 5 existing Daraz titles to extract common product attributes and target search keywords.
2. **Daraz SEO Title Engine**: Generates 1 optimized title engineered to rank on Daraz's first page:
   - Front-loads primary search keywords.
   - Enforces strict character limits (**100–120 characters** optimal).
   - Excludes banned promotional words (`best`, `cheap`, `sale`, `free shipping`, `#1`).
3. **High-Converting Highlights**: Formats 4–6 concise bullet points in official Daraz "Highlights" format.
4. **Structured Long Description**: Covers features, tech specs, package contents, and customer guarantees formatted for Daraz long-description fields.
5. **Product Gallery Image Generator**: Upload 1 to 3 real product photos and generate 5 to 8 composited 1:1 square (1200x1200px) e-commerce slides server-side using `sharp` (Hero slide, feature callouts, dimensions diagram, multi-angle grid, versatility banner, benefits list, package contents, seller trust badges).
6. **ZIP Download & Storage**: Download individual slides or export all 8 slides as a `.zip` file using `jszip`. Backed by DigitalOcean Spaces / S3 object storage (with local fallback).
7. **Per-Field Copy & Saved History**: Per-field instant copy buttons with toast notifications and a dedicated dashboard history page backed by Neon PostgreSQL.
8. **Rate Limiting**: Built-in sliding window rate limiter (15 listings per hour per user) protecting AI endpoints.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS with custom Daraz Brand Palette (`#F57224`)
- **Auth**: Clerk (`@clerk/nextjs` v6)
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM & Drizzle Kit
- **Image Compositor**: Sharp (`sharp` server-side 1200x1200px compositing)
- **Object Storage**: DigitalOcean Spaces / AWS S3 SDK (`@aws-sdk/client-s3`)
- **AI Engine**: Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`)
- **Validation**: Zod
- **Notifications**: Sonner

---

## ☁️ DigitalOcean Spaces (S3 Storage) Setup

1. Log into your **DigitalOcean Console** and create a **Space** (e.g. `ummah-daraz-assets` in `sgp1` or `nyc3` region).
2. Go to **API -> Spaces Access Keys** and generate an Access Key & Secret.
3. Add the keys to `.env.local` or DigitalOcean App Platform Environment Variables:
   ```env
   SPACES_KEY="DO00xxxxxxxxxxxxxxxx"
   SPACES_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   SPACES_BUCKET="ummah-daraz-assets"
   SPACES_ENDPOINT="https://sgp1.digitaloceanspaces.com"
   ```
> *Note: If `SPACES_KEY` is not provided during local development, the app automatically falls back to saving files in `public/uploads` so developers can test immediately without S3 setup.*

---

## 📋 Prerequisites & Environment Setup

### 1. Clone & Install Dependencies

```bash
cd "d:/Prd des"
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your actual environment credentials in `.env.local`:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Anthropic Claude API Key
ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx"
```

> ⚠️ **Security Note**: Never commit `.env.local` to git repositories!

---

## 🗄️ Database Setup & Migrations (Drizzle ORM)

### Generate & Push Schema to Neon PostgreSQL

```bash
# Push schema directly to Neon DB
npx drizzle-kit push

# (Optional) Launch Drizzle Studio to inspect DB tables visually
npx drizzle-kit studio
```

---

## 🚀 Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Public Landing & Interactive Demo: `http://localhost:3000`
- Protected Generator Dashboard: `http://localhost:3000/dashboard`
- Saved History: `http://localhost:3000/dashboard/history`

---

## 📦 Deployment Guide

### Deploying to Vercel

1. Push code to GitHub repository.
2. Import project into Vercel.
3. In Vercel Environment Variables configuration, add:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`)
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`)
   - `ANTHROPIC_API_KEY`
4. Click **Deploy**.

---

## 📄 License

MIT License. Designed for Daraz Marketplace Sellers.

# ThreadDNA V0

A deployable V0 for a viral Threads creator analyzer.

## What V0 includes

- Landing page with a single primary CTA: **Connect Threads**
- Meta Threads OAuth with CSRF `state` validation
- Read-only permissions: `threads_basic` + `threads_manage_insights`
- Fetches the connected user's profile and up to **24 recent posts**
- Fetches available post insights: views, likes, replies, reposts, quotes, shares
- Deterministic scoring for:
  - Conversation
  - Originality
  - Authority
  - Consistency
  - Virality
  - Weighted overall score
- Gemini-generated archetype, strength, weakness, and concise summary
- Deterministic fallback copy if `GEMINI_API_KEY` is omitted or the free-tier quota is unavailable
- Public shareable result URL: `/r/<uuid>`
- Dynamic Open Graph image for every report
- Native mobile share sheet + clipboard fallback
- Built-in `/r/demo` report for launch testing while Meta App Review is pending
- Responsive/mobile UI and reduced-motion support
- No persisted Threads access token
- No persisted raw Threads post history

## Architecture

```text
Browser
  │
  ├─ /api/oauth/threads/start ──> Meta Threads OAuth
  │                                  │
  │<─ /api/oauth/threads/callback <──┘
  │          │
  │          └─ temporary HttpOnly Threads token (10 min)
  │
  ├─ /analyze ──POST /api/analyze
  │                  ├─ Threads profile/posts/insights
  │                  ├─ deterministic scoring
  │                  ├─ Gemini narrative (optional)
  │                  └─ Supabase report insert
  │
  └─ /r/<id> ── public shareable report + dynamic OG image
```

## 1. Run locally

### Prerequisites

- Node.js 20+ (current LTS is recommended)
- npm
- A Supabase project
- A Meta developer account + Threads app
- Optional: a Gemini Developer API key (Google AI Studio)

### Install

```bash
npm install
cp .env.example .env.local
```

Keep this while developing locally:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

Do **not** commit `.env.local`.

## 2. Create the Supabase database

1. Create a project at Supabase.
2. Open **SQL Editor**.
3. Paste the entire contents of `supabase/schema.sql` and run it.
4. Open **Project Settings → API**.
5. Copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

Your local env should now include:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_SECRET
```

**Important:** the service role key is server-only. Never rename it with a `NEXT_PUBLIC_` prefix.

## 3. Add Gemini (free tier)

1. Open **Google AI Studio** and create a Gemini Developer API key.
2. Add it to `.env.local`:

```env
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
```

`gemini-2.5-flash-lite` is the default because it currently has a Gemini Developer API free tier and is sufficient for V0's short structured narrative. Free-tier requests are still subject to Google's rate limits.

If you omit the API key, exceed quota, or Gemini returns an invalid response, the app still works using deterministic fallback copy. The numerical score itself never comes from the LLM.

The app uses Gemini's stateless `generateContent` endpoint with structured JSON output. ThreadDNA itself does not persist the raw post history. **Privacy note:** Google's current Gemini Developer API pricing documentation states that free-tier content may be used to improve Google's products, so do not describe the free-tier AI processing as zero-retention/private processing in your public policy.

## 4. Create the Meta Threads app

1. Go to Meta for Developers.
2. Create a new app and select the **Threads API** use case.
3. In the app dashboard, find the Threads app credentials.
4. Copy:
   - Threads App ID → `THREADS_APP_ID`
   - Threads App Secret → `THREADS_APP_SECRET`
5. Configure the Threads OAuth redirect URL exactly as:

```text
http://localhost:3000/api/oauth/threads/callback
```

6. Add your Threads account as an app tester/developer while the app is in development.
7. Ensure the app can request:

```text
threads_basic
threads_manage_insights
```

Local env:

```env
THREADS_APP_ID=YOUR_THREADS_APP_ID
THREADS_APP_SECRET=YOUR_THREADS_APP_SECRET
```

### Important Meta limitation

You can test the full real OAuth flow today with accounts assigned to the Meta app (developer/tester roles). Letting arbitrary public Threads users connect generally requires taking the Meta app live and completing the relevant App Review/permission approval flow.

That is why `NEXT_PUBLIC_DEMO_MODE=true` is included: you can deploy, market-test the landing page, inspect the report UX, and test social previews before review is complete.

## 5. Start locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful routes:

```text
/                 landing page
/r/demo           no-API demo report
/api/oauth/threads/start
```

Before deployment, verify:

```bash
npm run typecheck
npm run build
```

## 6. Deploy to Vercel today

There is a small chicken-and-egg problem: Meta needs your production callback URL, but you need a Vercel URL first. Use this sequence.

### A. Push source to GitHub

From this directory:

```bash
git init
git add .
git commit -m "feat: build ThreadDNA V0"
git branch -M main
```

Create an empty GitHub repository, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/threaddna-v0.git
git push -u origin main
```

### B. First Vercel deployment

1. Vercel → **Add New → Project**.
2. Import the GitHub repository.
3. Framework should auto-detect as **Next.js**.
4. Add these environment variables first:

```env
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NEXT_PUBLIC_DEMO_MODE=true
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
```

You may leave the Meta values unset for this first deployment.

5. Deploy.
6. Open `https://YOUR-PROJECT.vercel.app/r/demo` and confirm the UI works.

### C. Configure the production Meta callback

Now that you know the real Vercel domain, return to Meta for Developers and add this exact OAuth redirect URI:

```text
https://YOUR-PROJECT.vercel.app/api/oauth/threads/callback
```

If you attach a custom domain later, add its callback too and update `NEXT_PUBLIC_APP_URL`.

### D. Add Meta secrets to Vercel

Vercel → Project → **Settings → Environment Variables**:

```env
THREADS_APP_ID=...
THREADS_APP_SECRET=...
```

Redeploy after changing environment variables.

### E. Test real analysis

Using a Threads account that has access to the Meta development app:

1. Open the production homepage.
2. Click **Connect Threads**.
3. Approve permissions.
4. You should return to `/analyze`.
5. The app reads up to 24 recent posts and available insights.
6. It creates a Supabase report.
7. You are redirected to `/r/<uuid>`.
8. Press **Share my Threads DNA**.

## 7. Custom domain

Once the flow works:

1. Add the domain in Vercel → **Settings → Domains**.
2. Change:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. Add this redirect URI in the Meta app:

```text
https://yourdomain.com/api/oauth/threads/callback
```

4. Redeploy.

Do not remove the old callback until you know you no longer need it.

## 8. Meta App Review checklist before public launch

Before trying to acquire real users:

- Complete the Meta app's basic/business information as required.
- Provide a privacy policy URL.
- Provide data deletion instructions/callback if Meta requests it for your app configuration.
- Request review for the Threads permissions your public OAuth flow needs.
- Prepare a short screencast demonstrating why each permission is required.
- Explain that the app performs read-only creator analytics and does not publish on behalf of users.
- Do not request `threads_content_publish` for V0; it is unnecessary.

## 9. Privacy/security properties in this V0

- OAuth uses a random state cookie to reduce CSRF risk.
- Threads access token is stored only as an HttpOnly, `SameSite=Lax`, 10-minute cookie.
- The token is deleted after analysis succeeds or fails.
- Threads App Secret, Supabase service role key, and Gemini API key remain server-only.
- Raw posts are used transiently to calculate scores and generate the narrative, then discarded.
- Only derived report fields are persisted.
- Supabase RLS is enabled and no public database policy is created; report reads happen through server-side code.
- Gemini is called server-side through the stateless `generateContent` endpoint.
- Free-tier Gemini data handling is governed by Google's Gemini Developer API terms; Google currently states free-tier content may be used to improve its products.
- The app requests only `threads_basic` and `threads_manage_insights`.

## 10. V0 product requirements covered

### Functional requirements

| Requirement | Status |
|---|---|
| Landing page | ✅ |
| Connect Threads | ✅ |
| OAuth callback | ✅ |
| Analyze recent account content | ✅ |
| Animated analysis state | ✅ |
| Overall score | ✅ |
| Creator archetype | ✅ |
| Strength | ✅ |
| Weakness | ✅ |
| Five personality/growth dimensions | ✅ |
| Public result page | ✅ |
| Share action | ✅ |
| Dynamic social preview image | ✅ |
| Demo before Meta review | ✅ |

### Non-functional requirements

| Requirement | Implementation |
|---|---|
| Fast to ship | Single Next.js deployment + Supabase |
| Responsive | Desktop/tablet/mobile CSS |
| Accessible motion | `prefers-reduced-motion` support |
| Explainable scores | Deterministic scoring, not LLM-generated |
| Security | CSRF state, HttpOnly temporary token, server-only secrets |
| Privacy | No persisted access token/raw post history |
| Graceful API degradation | Missing post metrics become zero; Gemini has deterministic fallback |
| Shareability | Stable public URL + generated 1200×630 OG image |
| Low infra burden | No worker, Redis, queue, or separate backend |

## 11. What I intentionally did NOT build

V0 is for validating the viral loop, so it does not contain:

- subscriptions / Stripe
- user accounts
- historical dashboards
- scheduled sync
- content calendar
- competitor tracking
- post generation
- auto-posting
- Redis / job queues

Only add those after real users demonstrate that they connect, finish analysis, and share the result.

## 12. First metrics to instrument next

Once V0 is live, the first addition should be product analytics for:

```text
landing_view
connect_clicked
oauth_completed
analysis_completed
report_viewed
share_clicked
```

Your most important early ratio is:

```text
share_clicked / analysis_completed
```

That tells you whether the viral hypothesis is actually working.

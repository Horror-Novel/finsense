# Deploying FinSense on Vercel

FinSense deploys as **two Vercel projects from this one repo**:

| Project | Root Directory | What it runs |
| --- | --- | --- |
| `finsense-api` | `backend` | Express API as a serverless function (`backend/api/index.js`) |
| `finsense` | `frontend` | Next.js app; proxies `/api/*` to the API project |

The browser only ever talks to the frontend domain, so no CORS setup is needed.

## 1. Create the hosted services

Vercel doesn't run databases, so the backend needs hosted ones. All have free tiers.

- **Postgres** — Neon (Vercel → Storage → Create → Neon). Connecting it to the
  `finsense-api` project sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.
- **MongoDB** — MongoDB Atlas free cluster. In Atlas → Network Access, allow
  `0.0.0.0/0` (Vercel functions have no fixed IP). Copy the `mongodb+srv://…` URI.
- **Receipt uploads** — Vercel Blob (Storage → Create → Blob), connected to
  `finsense-api`. This sets `BLOB_READ_WRITE_TOKEN`. Without it, transactions
  still save but receipt images are dropped.
- **Redis cache (optional)** — Upstash Redis (Storage → Upstash). Use the
  `rediss://…` URL as `REDIS_URL`. Without it the API just skips caching.

## 2. Deploy the backend (`finsense-api`)

1. Vercel → Add New → Project → import this repo.
2. Set **Root Directory** to `backend`. Framework preset: **Other**. Leave build
   settings as they are (`backend/vercel.json` defines them).
3. Add environment variables:

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | yes | Set by the Neon integration (or paste your Postgres URL) |
| `MONGODB_URI` | yes | Atlas `mongodb+srv://…` URI |
| `JWT_SECRET` | yes | Long random string (`openssl rand -hex 32`) |
| `GEMINI_API_KEY` | yes | From https://aistudio.google.com/apikey |
| `CRON_SECRET` | yes | Random string; Vercel Cron uses it to call the daily digest |
| `BLOB_READ_WRITE_TOKEN` | for receipts | Set by the Blob integration |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash` |
| `REDIS_URL` | no | Upstash URL |
| `GOOGLE_CLIENT_ID` | for Google login | OAuth client ID |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for payments | Razorpay keys |
| `JWT_EXPIRES_IN` | no | Defaults to `7d` |

4. Deploy. The build runs `prisma generate` and `prisma db push`, which creates
   the Postgres tables on first deploy (it refuses destructive changes).
5. Check `https://<api-domain>/api/health` returns `{"success":true,…}`.

## 3. Deploy the frontend (`finsense`)

1. Import the same repo again as a second project.
2. Set **Root Directory** to `frontend`. Framework preset: **Next.js**.
3. Add environment variables:

| Variable | Required | Value |
| --- | --- | --- |
| `BACKEND_URL` | yes | The API project's URL, e.g. `https://finsense-api.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | for Google login | Same OAuth client ID as the backend |

4. Deploy, then open the frontend URL and sign up.

If you use Google login, add the frontend domain to the OAuth client's
**Authorized JavaScript origins** in Google Cloud Console.

Changing `BACKEND_URL` or any `NEXT_PUBLIC_*` value needs a frontend redeploy,
since they're baked in at build time.

## What behaves differently on Vercel

- **Live cross-tab sync (Socket.io) is off.** Vercel functions can't hold
  WebSocket connections. The app works normally; the navbar "Live" pill just
  stays off and other open tabs update on refresh. To keep it, host the
  backend on a long-running server (e.g. Render, see `render.yaml`) and set
  `NEXT_PUBLIC_SOCKET_URL` to it.
- **Daily digest** runs through Vercel Cron at 08:00 UTC
  (`/api/cron/daily-digest`) instead of node-cron. "Run now" on the dashboard
  still works.
- **Receipts** are stored in Vercel Blob and capped at 4 MB (Vercel's request
  body limit is 4.5 MB).
- **Rate limits** are per function instance, so they're looser than on a
  single server.

## Optional: demo data

Run the seed once from your machine against the production database:

```bash
cd backend
DATABASE_URL="<your Neon URL>" npm run prisma:seed
```

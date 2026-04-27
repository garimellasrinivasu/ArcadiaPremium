# ArcadiaPremium — Live Deployment Guide

## Architecture

- **Frontend** (React) → Netlify (free tier)
- **Backend** (Spring Boot) → Render (free tier)
- **Database** (PostgreSQL) → Render (free tier, 90-day limit)

---

## Step 1: Deploy PostgreSQL on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign up / log in.
2. Click **New → PostgreSQL**.
3. Fill in:
   - **Name**: `arcadia-premium-db`
   - **Database**: `arcadia_premium`
   - **User**: `arcadia`
   - **Region**: Oregon (or closest to your users)
   - **Plan**: Free
4. Click **Create Database**.
5. Once created, go to the database page and note down these values from the **Connections** section:
   - **Hostname** (e.g., `dpg-xxxxx.oregon-postgres.render.com`)
   - **Port** (usually `5432`)
   - **Database** (`arcadia_premium`)
   - **Username** (`arcadia`)
   - **Password** (auto-generated)

---

## Step 2: Deploy Backend on Render

1. In the Render dashboard, click **New → Web Service**.
2. Connect your GitHub account and select the **ArcadiaPremium** repository.
3. Configure:
   - **Name**: `arcadia-premium-api`
   - **Region**: Same as your database
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Plan**: Free
4. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `DB_HOST` | *(Hostname from Step 1)* |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | `arcadia_premium` |
   | `DB_USER` | `arcadia` |
   | `DB_PASS` | *(Password from Step 1)* |
   | `JWT_SECRET` | *(Generate a random 64-char string)* |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app-name.netlify.app` *(update after Netlify deploy)* |
   | `PORT` | `8080` |
   | `MAIL_USERNAME` | *(your Gmail address, optional)* |
   | `MAIL_PASSWORD` | *(your Gmail app password, optional)* |

5. Click **Create Web Service**.
6. Wait for the build and deploy to complete (first build takes ~5-8 minutes).
7. Once deployed, note your backend URL: `https://arcadia-premium-api.onrender.com`

### Generate a JWT Secret

Run this in your terminal to generate a secure random secret:
```bash
openssl rand -base64 48
```

---

## Step 3: Deploy Frontend on Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) and sign up / log in.
2. Click **Add new site → Import an existing project**.
3. Connect your GitHub account and select the **ArcadiaPremium** repository.
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://arcadia-premium-api.onrender.com/api` |

   *(Replace with your actual Render backend URL from Step 2)*

6. Click **Deploy site**.
7. Once deployed, note your frontend URL (e.g., `https://your-app-name.netlify.app`).

---

## Step 4: Update CORS on Render

Now that you know your Netlify URL, go back to Render:

1. Go to your `arcadia-premium-api` service → **Environment**.
2. Update the `CORS_ALLOWED_ORIGINS` variable to your actual Netlify URL:
   ```
   https://your-app-name.netlify.app
   ```
   To allow multiple origins (e.g., local dev + production), use a comma-separated list:
   ```
   https://your-app-name.netlify.app,http://localhost:3000
   ```
3. The service will automatically redeploy.

---

## Step 5: Verify

1. Open your Netlify URL in a browser.
2. Log in with the default admin credentials (the DataSeeder creates them on first boot):
   - **Email**: `admin@arcadia.com`
   - **Password**: `admin123`
3. Verify:
   - Login works
   - Pages load correctly
   - Data saves to the database

---

## Important Notes

### Render Free Tier

- **Web services** spin down after 15 minutes of inactivity. The first request after sleep takes ~30-60 seconds to cold-start.
- **PostgreSQL** free databases expire after 90 days. Back up your data before that, or upgrade to a paid plan ($7/month).
- To keep the backend awake, you can use a free cron service like [UptimeRobot](https://uptimerobot.com) to ping your API every 14 minutes.

### Updating the App

After pushing code changes to GitHub:
- **Render**: Automatically rebuilds and deploys the backend.
- **Netlify**: Automatically rebuilds and deploys the frontend.

### Custom Domain (Optional)

Both Render and Netlify support custom domains:
- In Netlify: **Site settings → Domain management → Add custom domain**
- In Render: **Service settings → Custom Domains**

Update `CORS_ALLOWED_ORIGINS` on Render to include your custom domain.

### Troubleshooting

- **CORS errors**: Check that `CORS_ALLOWED_ORIGINS` on Render exactly matches your Netlify URL (no trailing slash).
- **502 errors on Render**: Check the service logs. Usually a database connection issue — verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` are correct.
- **Blank page on Netlify**: Ensure the publish directory is `frontend/dist` and the SPA redirect rule is in place (netlify.toml handles this).
- **API calls fail**: Check the browser console. Ensure `VITE_API_BASE_URL` in Netlify env vars includes `/api` at the end.

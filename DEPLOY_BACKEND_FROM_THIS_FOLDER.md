## Goal
Deploy a **separate backend URL for the mobile app**, while operating from this folder:

`D:\Tempwallets-mobile`

Because the backend code currently lives in the main monorepo, this folder includes a **sync script** that copies the backend + required shared packages into `D:\Tempwallets-mobile\server\` so you can deploy from here.

---

## 1) Sync backend code into this folder

Open PowerShell and run:

```powershell
cd "D:\Tempwallets-mobile"
powershell -ExecutionPolicy Bypass -File ".\scripts\sync-backend-from-main.ps1"
```

After this, you will have:

- `D:\Tempwallets-mobile\server\apps\backend\` (backend app)
- `D:\Tempwallets-mobile\server\packages\types\`
- `D:\Tempwallets-mobile\server\packages\typescript-config\`
- plus the monorepo root files needed to build with pnpm/turbo

---

## 2) Push `D:\Tempwallets-mobile` to GitHub

Railway deploys from GitHub, so create a repo (example name):
- `tempwallets-mobile`

Then push the entire folder (including `server/` that was created by the sync script).

---

## 3) Create a NEW Railway Project for mobile-backend

In Railway:
- New Project → Deploy from GitHub Repo → select your `tempwallets-mobile` repo

Create a service and set:
- **Root directory**: `server`

Then set build/start commands:

- **Build command**:
  - `corepack enable && pnpm install && pnpm --filter backend build`
- **Start command**:
  - `corepack enable && pnpm --filter backend start:prod`

---

## 4) Add Railway environment variables (backend service)

Minimum required:
- `DATABASE_URL` (add Railway Postgres plugin, it provides this)
- `JWT_SECRET` (any long random string)
- `BACKEND_URL` = `https://<your-new-mobile-backend>.up.railway.app`
- `FRONTEND_URL` = `https://www.tempwallets.com`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional (if you want gasless / EIP-7702 on backend):
- `PIMLICO_API_KEY`
- `ENABLE_EIP7702=true`
- `EIP7702_CHAINS=ethereum,base,arbitrum,optimism,polygon,bnb,avalanche`
- `EIP7702_DELEGATION_ADDRESS=0xe6Cae83BdE06E4c305530e199D7217f42808555B`

---

## 5) Google Cloud: add redirect URI for the NEW backend

In Google Cloud OAuth Client → Authorized redirect URIs add:

- `https://<your-new-mobile-backend>.up.railway.app/auth/google/callback`

---

## 6) Point the mobile app to the NEW backend URL

Update:
- `D:\Tempwallets-mobile\.env`

Set:
- `EXPO_PUBLIC_MOBILE_API_URL=https://<your-new-mobile-backend>.up.railway.app`

Then restart Expo with cache cleared:

```powershell
cd "D:\Tempwallets-mobile"
npx expo start --clear --tunnel
```

---

## Notes
- The mobile app is not deployed to Railway; only the backend is.
- The separate backend URL prevents web login redirects from hijacking mobile sign-in.


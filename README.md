# TempwalletsApp

Tempwallets mobile application - Android local setup.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create/update `.env` in this folder:

```env
EXPO_PUBLIC_MOBILE_API_URL=https://backend-production-01b2.up.railway.app
EXPO_PUBLIC_API_URL=https://backend-production-01b2.up.railway.app
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

3. Start Android app locally (Expo + emulator/device):

```bash
npm run android:local
```

## Notes

- Keep both API URL variables the same.
- For Google login, backend OAuth redirect URI must include:
  `https://backend-production-01b2.up.railway.app/auth/google/callback`

# Tan Tan Marketplace Recovery Memo

## Canonical Project

- Real working repo:
  - `C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall`
- Frontend real entry:
  - `apps/web/src/main.jsx`
- Real app shell:
  - `apps/web/src/AuthApp.jsx`
- The testing/demo file is not the real app:
  - `apps/web/src/App.jsx`

If the wrong UI appears, check `main.jsx` first and make sure it still mounts `AuthApp` and imports both CSS files.

## Required Frontend Wiring

`apps/web/src/main.jsx` should use:

```jsx
import AuthApp from "./AuthApp";
import "./styles/theme.css";
import "./styles/auth.css";
```

## Backend / Database

- API server:
  - `apps/api/src/server.js`
- MongoDB:
  - `mongodb://127.0.0.1:27017/tan-tan-marketplace`
- API port:
  - `4000`
- Main data lives in MongoDB, especially:
  - `users`
  - `sessions`
  - `products`
  - `requests`
  - `requestchats`
  - `orders`
  - `outboxes`
  - `retailermessages`

## Current Env Expectations

### `apps/web/.env.local`

```env
VITE_API_URL=/api
VITE_API_TARGET=http://127.0.0.1:4000
```

### `apps/api/.env`

Expected keys:

- `MONGODB_URI`
- `PORT`
- `MAIL_USER`
- `MAIL_APP_PASSWORD`
- `MAIL_FROM`

Do not push real secrets to GitHub.

## Run Commands

### API

```powershell
cd "C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall\apps\api"
npm run dev
```

### Web

```powershell
cd "C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall\apps\web"
npm run dev
```

### Web with phone QR

```powershell
cd "C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall\apps\web"
npm run dev:qr
```

## Old Flow That Must Stay Intact

1. Logged-out users open the marketplace home page.
2. Header feels like:
   - `Home`
   - `Login`
3. Login screen has 3 tabs:
   - `Login`
   - `Customer signup`
   - `Retailer apply`
4. Customer signup:
   - creates account
   - can log in immediately
5. Retailer apply:
   - uses payment reference
   - waits for admin approval
   - after approval, email verification code is sent
6. Existing accounts already in MongoDB must continue to work.
7. Customer post-login:
   - returns to customer marketplace flow / home shopping experience
8. Retailer post-login:
   - goes to retailer dashboard
9. Admin post-login:
   - goes to admin review dashboard

## Important Frontend Files

### Auth / Home

- `apps/web/src/home/HomePage.jsx`
- `apps/web/src/auth/AuthFormPanel.jsx`
- `apps/web/src/auth/constants.js`
- `apps/web/src/auth/api.js`
- `apps/web/src/AuthApp.jsx`

### Dashboard Pages

- `apps/web/src/dashboard/DashboardPage.jsx`
- `apps/web/src/dashboard/CustomerDashboardPage.jsx`
- `apps/web/src/dashboard/CustomerRequestsPage.jsx`
- `apps/web/src/dashboard/CustomerOrderDetailPage.jsx`
- `apps/web/src/dashboard/ItemDetailPage.jsx`
- `apps/web/src/dashboard/RetailerDashboardPage.jsx`
- `apps/web/src/dashboard/RetailerPostsPage.jsx`
- `apps/web/src/dashboard/RetailerHistoryPage.jsx`
- `apps/web/src/dashboard/UserProfilePage.jsx`

### Styles

- `apps/web/src/styles/theme.css`
- `apps/web/src/styles/auth.css`

## Known UI Areas That Were Sensitive

- Navbar feel in logged-out and logged-in states
- Dashboard section gutters and card spacing
- Retailer dashboard card layout
- Retailer post studio spacing
- Customer / retailer chat layout
- Profile mobile layout

If one screen looks wrong, check whether the issue is:

- `theme.css` global shell/header spacing
- `auth.css` dashboard / form / card spacing
- `AuthApp.jsx` navigation state

## Fast Recovery Checklist

If the app breaks again:

1. Start MongoDB
2. Start API on port `4000`
3. Start Web
4. Confirm `main.jsx -> AuthApp`
5. Confirm both `theme.css` and `auth.css` are imported
6. Confirm `.env.local` still points to `4000`
7. Check `/health`
8. Check existing users in MongoDB Compass
9. Hard refresh browser with `Ctrl + F5`

## If Login Stops Working

Check in this order:

1. MongoDB is running
2. API server is running on `4000`
3. Web proxy target is still `http://127.0.0.1:4000`
4. `/health` works
5. `/auth/me` works with token
6. `users` collection still contains expected accounts

## If Wrong UI Appears

Most likely causes:

- `main.jsx` was changed to mount the wrong component
- global CSS imports were removed
- browser is showing old cached assets

Fix order:

1. Check `main.jsx`
2. Restart web server
3. `Ctrl + F5`

## GitHub Push Checklist

Before pushing:

1. Check status:

```powershell
git status
```

2. Make sure these are not committed:
   - `.env`
   - `.env.local`
   - `node_modules`
   - `dist`
   - local logs / temp files

3. If Gmail App Password or other secrets were ever exposed outside local machine history, rotate them first.

4. Commit:

```powershell
git add .
git commit -m "docs: add marketplace recovery memo and repo safety ignores"
```

5. Push:

```powershell
git push origin main
```

## Purpose

This memo is here so even if the project gets visually or structurally scrambled again, the main app can be restored quickly without re-guessing:

- which repo is canonical
- which file is the real entry point
- which env values matter
- which flow is the old correct flow
- which files control the UI and dashboard behavior

# Tan Tan Marketplace Recovery Memo

## 1. Canonical project and current entry points

- Canonical working repo path:
  - `C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall`
- Frontend entry:
  - `apps/web/src/main.jsx`
- Real app shell:
  - `apps/web/src/AuthApp.jsx`
- Global styles that must both be loaded:
  - `apps/web/src/styles/theme.css`
  - `apps/web/src/styles/auth.css`
- Testing/demo file:
  - `apps/web/src/App.jsx`
  - This is not the real marketplace app entry. If the wrong page appears, check `main.jsx` first.

## 2. Current backend / database wiring

- Backend app:
  - `apps/api/src/server.js`
- API package:
  - `apps/api/package.json`
- Web package:
  - `apps/web/package.json`
- MongoDB:
  - host: `127.0.0.1:27017`
  - database: `tan-tan-marketplace`
- Main collections already used by the app:
  - `users`
  - `sessions`
  - `products`
  - `requests`
  - `requestchats`
  - `orders`
  - `outboxes`
  - `retailermessages`

## 3. Run commands

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

## 4. Required env expectations

### `apps/web/.env.local`

```env
VITE_API_URL=/api
VITE_API_TARGET=http://127.0.0.1:4000
```

### `apps/api/.env`

Required keys:

- `MONGODB_URI`
- `PORT`
- `MAIL_USER`
- `MAIL_APP_PASSWORD`
- `MAIL_FROM`

Do not commit real secrets to GitHub.

## 5. Old flow to preserve

This is the old version flow that screenshots confirmed:

1. Logged-out users land on the marketplace home page.
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
   - includes payment reference
   - waits for admin approval
   - after approval, verification code is emailed
6. Existing accounts already live in MongoDB and should continue to work.
7. Customer post-login flow:
   - returns to marketplace home / shopping experience
8. Retailer / Admin post-login flow:
   - opens their related dashboard

## 6. Important UI files

### Auth / home

- `apps/web/src/home/HomePage.jsx`
- `apps/web/src/auth/AuthFormPanel.jsx`
- `apps/web/src/auth/constants.js`
- `apps/web/src/auth/api.js`

### Dashboards

- `apps/web/src/dashboard/DashboardPage.jsx`
- `apps/web/src/dashboard/CustomerDashboardPage.jsx`
- `apps/web/src/dashboard/CustomerRequestsPage.jsx`
- `apps/web/src/dashboard/CustomerOrderDetailPage.jsx`
- `apps/web/src/dashboard/ItemDetailPage.jsx`
- `apps/web/src/dashboard/RetailerDashboardPage.jsx`
- `apps/web/src/dashboard/RetailerPostsPage.jsx`
- `apps/web/src/dashboard/RetailerHistoryPage.jsx`
- `apps/web/src/dashboard/UserProfilePage.jsx`

### CSS

- `apps/web/src/styles/theme.css`
- `apps/web/src/styles/auth.css`

## 7. If the app looks wrong, check these first

### If the wrong theme/demo page appears

Check `apps/web/src/main.jsx` and make sure it still imports:

```jsx
import AuthApp from "./AuthApp";
import "./styles/theme.css";
import "./styles/auth.css";
```

### If CSS looks broken or spacing changes unexpectedly

1. Hard refresh:
   - `Ctrl + F5`
2. Restart web dev server.
3. Re-check:
   - `theme.css`
   - `auth.css`
4. Make sure dashboard sections still use the same card spacing / gutter feel as the home page.

### If login stops working

Check in this order:

1. MongoDB is running on `127.0.0.1:27017`
2. API server is running on `4000`
3. Web proxy target still points to `4000`
4. `/health` returns OK
5. Existing users are still present in `tan-tan-marketplace.users`

### If npm errors appear

Make sure commands are run inside the correct folders:

- API commands inside `apps/api`
- Web commands inside `apps/web`

## 8. Quick recovery checklist

If something breaks again:

1. Start MongoDB
2. Start API
3. Start Web
4. Confirm `main.jsx -> AuthApp`
5. Confirm both CSS files are imported
6. Confirm `.env.local` still targets port `4000`
7. Confirm existing users still exist in MongoDB
8. Hard refresh browser
9. Re-test:
   - login
   - customer home
   - retailer dashboard
   - admin dashboard

## 9. GitHub publish checklist

Before pushing:

1. Review changes:

```powershell
git status
```

2. Make sure these do not get committed:
   - `.env`
   - `.env.local`
   - `node_modules`
   - `dist`
   - local temp files

3. Security note:
   - rotate the Gmail App Password before public push if there is any chance it was exposed outside local machine history

4. Commit:

```powershell
git add .
git commit -m "docs: add marketplace recovery memo and repo safety ignores"
```

5. Push to GitHub:

```powershell
git push origin main
```

## 10. Purpose of this memo

This file is the shortest path to catch up again after:

- accidental agent-mode changes
- CSS regressions
- wrong entry file wiring
- broken login / database link
- repo cleanup before GitHub publish

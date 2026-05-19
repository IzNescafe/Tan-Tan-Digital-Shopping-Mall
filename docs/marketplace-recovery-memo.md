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
7. Post-login flow:
   - customer, retailer, and admin accounts all go straight to `/dashboard`
   - `DashboardPage.jsx` chooses the correct customer / retailer / admin view from `session.role`

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

## 9. Recent fixes to preserve

### Login goes straight to the related dashboard

- File:
  - `apps/web/src/AuthApp.jsx`
- Expected behavior:
  - after `/auth/login` succeeds, call `navigateTo("dashboard")`
  - do not send customers back to `home`
- Why:
  - `DashboardPage.jsx` already renders the correct dashboard by `session.role`

### Header / Orders dropdown overlap fix

- File:
  - `apps/web/src/styles/theme.css`
- Expected CSS:
  - `.site-header` should stay above dashboard content with `z-index: 20`
  - inside `@media (max-width: 640px)`, `.nav-hover-panel.is-static` should use `min-width: 0`
- Why:
  - prevents the Orders dropdown from being painted under dashboard filters/cards
  - prevents narrow-screen header buttons such as `Logout` from clipping off-screen

### Retailer post form format fix

- File:
  - `apps/web/src/styles/auth.css`
- Expected CSS:
  - `.upload-field input, .upload-field textarea` should both have the app field style
  - form fields should be a single-column stack about `560px` wide inside the product details card
  - keep that same single-column width through the `max-width: 1080px` breakpoint
  - inputs should be compact rounded boxes (`min-height: 44px`, `border-radius: 14px`) with bold text
  - focused fields should use a clean dark outline instead of the browser default black rectangle
  - include width, padding, rounded border, themed background, font, placeholder color, and focus state
  - do not leave the post form fields as browser-default inputs
- Why:
  - `RetailerPostsPage.jsx` uses `search-input` on post inputs, but `search-input` only controls width
  - textarea needs its own matching `.upload-field textarea` styling

### Compact system pass

- Files:
  - `apps/web/src/styles/theme.css`
  - `apps/web/src/styles/auth.css`
- Expected CSS:
  - use a denser shared shape across the website: smaller radii, lighter shadow, tighter page/header/card spacing
  - keep buttons around `40px` high on desktop and dashboard inputs around `44px`
  - keep product cards, dashboard sections, auth panels, retailer post cards, admin cards, and profile cards using similar compact padding
  - preserve important behavior from earlier fixes: header stays above dashboard content, post form stays single-column, and login routes to `/dashboard`
- Why:
  - prevents each page from feeling like a different design system
  - keeps marketplace pages easier to scan on laptop and mobile screens

### Expanded chat / navbar collapse fix

- File:
  - `apps/web/src/styles/auth.css`
- Expected CSS:
  - when `body.chat-hub-expanded` is active, hide `.site-header`
  - keep `.chat-hub-panel.is-expanded` as a fixed overlay with `inset: 12px`, `width: auto`, and high `z-index`
  - set `body.chat-hub-expanded .app-shell { overflow: visible; }`
  - hide `.chat-launcher-button` while expanded
  - keep mobile expanded chat as one-column with the conversation list stacked above the chat body
- Why:
  - expanded chat should not squeeze or collapse the navbar
  - chat full-screen mode should be isolated from normal page/header layout

### Validation after each UI fix

Run:

```powershell
cd "C:\Users\user\OneDrive\Documents\Tan Tan Digital Shopping Mall\apps\web"
npm run build
```

The latest confirmed fixes above all passed Vite build.

## 10. GitHub publish checklist

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

## 11. Purpose of this memo

This file is the shortest path to catch up again after:

- accidental agent-mode changes
- CSS regressions
- wrong entry file wiring
- broken login / database link
- repo cleanup before GitHub publish

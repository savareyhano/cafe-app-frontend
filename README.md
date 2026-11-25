# cafe-app-frontend

Customer ordering site and staff console (CMS) for cafe-app-backend. React Router v8 framework mode in **SPA mode** (`ssr: false`), with shadcn/ui components restyled to the app's own design tokens, in light and dark mode. The UI is in Indonesian.

## Run

```bash
cp .env.example .env   # then fill in the values
npm install
npm run dev            # http://localhost:5173
```

The backend must be running (default `http://localhost:3000`) and must list this site's origin in its `CORS_ORIGINS`.

## Environment

| Variable | Required | What it does |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | Backend URL, no trailing slash |
| `VITE_CAFE_NAME` | no | Name in headers, sign-in and invoices (default `Kafe`) |
| `VITE_CAFE_LOGO_URL` | no | Square logo; an initials circle is used without it |
| `VITE_CAFE_ADDRESS` | no | Address line on the order page and invoices |
| `VITE_GOOGLE_REVIEW_URL` | no | Enables the footer review link and the one-time rate-us popup |

Values are baked in at build time, so rebuild after changing them.

## Routes

| Path | Who | Page |
| --- | --- | --- |
| `/?meja=N` | customer | Menu and checkout. Ordering needs the table number from the table's QR link. |
| `/pesanan?order_id=…` | customer | Order status, polls every 5 s, plays `public/sounds/alarm.mp3` when ready, PDF invoice once paid. Without `order_id` it opens this device's newest order. |
| `/cms/masuk` | staff | Sign in |
| `/cms/pesanan` | all staff | Order queue, 5 s polling, accept cash, mark ready/completed, invoices |
| `/cms/dasbor`, `/cms/menu`, `/cms/banner`, `/cms/qr-meja`, `/cms/akun` | admin, super admin | Dashboard, menu, banners, table QR codes, accounts |
| `/cms/kata-sandi` | all staff | Change password |

The backend's `FRONTEND_PAYMENT_FINISH_URL` and `FRONTEND_PAYMENT_ERROR_URL` must point to `<this site>/pesanan`; the payment page appends `order_id` on its redirect.

## Build and deploy

```bash
npm run build          # static files in build/client
```

Serve `build/client` from any static host with a fallback of every path to `index.html`.

## Notes

- Design tokens live in `app/styles/tokens.css` under the `--ds-` prefix; `app/app.css` maps shadcn's variables onto them.
- Icons come from an Apache-2.0 icon pack (see `public/icons-LICENSE.txt`). `scripts/build-icons.mjs` trims the full sprite in `scripts/icons-full.svg` to the names in `app/components/icon.tsx` before `dev` and `build`; add a name there before using a new icon.
- Invoice PDFs are built in the browser with jsPDF, loaded only when someone downloads one.

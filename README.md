# WeaveConnect

A multivendor silk saree marketplace that connects traditional saree **manufacturers** directly with **buyers**. WeaveConnect is a MERN college mini-project: it is built to be simple, stable and easy to demonstrate.

The repository holds four separate apps:

| Folder         | What it is                                        | Dev port |
|----------------|---------------------------------------------------|----------|
| `server`       | Express + MongoDB REST API (single backend)        | 5000 |
| `buyer-app`    | React + Vite storefront for buyers                 | 5173 |
| `seller-app`   | React + Vite dashboard for manufacturers           | 5174 |
| `admin-app`    | React + Vite dashboard for the admin               | 5175 |

## Tech Stack

- **Backend:** Node.js, Express 5, MongoDB, Mongoose 9
- **Auth:** JSON Web Tokens (JWT) + bcrypt password hashing
- **Validation:** express-validator
- **Images:** Multer with the optional Cloudinary upload endpoint
- **Security:** Helmet, rate limiting, NoSQL-injection sanitisation
- **Frontend:** React 18, React Router, Vite, plain CSS

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally (Windows service, or any local/cloud MongoDB)
- Optional: a Cloudinary account, only if you want to upload your own product photos

## Running the Project

The backend must be started first, because all three frontends talk to it.

### 1. Backend

```bash
cd server
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run seed              # optional: loads the small demo dataset
npm run dev               # nodemon, restarts on save
```

The API starts on `http://localhost:5000`. Use `npm start` to run it without nodemon.

### 2. Frontends

Open three separate terminals:

```bash
cd buyer-app  && npm install && npm run dev   # http://localhost:5173
cd seller-app && npm install && npm run dev   # http://localhost:5174
cd admin-app  && npm install && npm run dev   # http://localhost:5175
```

Vite gives each app the next free port, so the numbers above are the normal case — if one is taken, Vite prints the port it actually used.

**How the frontends reach the API:** each app calls `/api/...` on its own origin, and `vite.config.js` proxies those requests to the backend (`http://localhost:5000` by default). This avoids CORS problems and keeps the API address out of the source code. To point a frontend somewhere else, set `VITE_API_TARGET` (the backend address used by the dev proxy) or `VITE_API_URL` (a full API base URL such as `http://localhost:5000/api`, which overrides the proxy and is what you would use for a deployed build).

## Environment Variables

Backend variables live in `server/.env` (copy it from `server/.env.example`). `server/.env` is listed in `.gitignore` and must never be committed.

| Variable                | Description                        | Default                          |
|-------------------------|------------------------------------|----------------------------------|
| `PORT`                  | Server port                        | `5000`                           |
| `MONGODB_URI`           | MongoDB connection string          | `mongodb://localhost:27017/weaveconnect` |
| `JWT_SECRET`            | Secret used to sign JWTs           | *(required, min 16 chars)*       |
| `JWT_EXPIRE`            | Refresh-token expiry (e.g. `7d`)   | `7d`                             |
| `JWT_ACCESS_EXPIRE`     | Short-lived access-token expiry    | `15m`                            |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name              | *(only for `POST /api/upload`)*  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                 | *(only for `POST /api/upload`)*  |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret              | *(only for `POST /api/upload`)*  |
| `EMAIL_HOST`            | SMTP host for OTP emails           | `smtp.gmail.com`                 |
| `EMAIL_PORT`            | SMTP port                          | `587`                            |
| `EMAIL_USER`            | SMTP username (email address)      | *(required for forgot password)* |
| `EMAIL_PASSWORD`        | SMTP password (Gmail App Password) | *(required for forgot password)* |
| `EMAIL_FROM`            | Sender address for OTP emails      | *(required for forgot password)* |
| `RAZORPAY_KEY_ID`       | Razorpay test-mode key id          | *(only for online checkout)*     |
| `RAZORPAY_KEY_SECRET`   | Razorpay test-mode key secret      | *(only for online checkout)*     |
| `CORS_ORIGIN`           | Comma-separated allowed origins    | *(empty = any origin)*           |

Optional rate-limit overrides: `AUTH_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_MAX`, `OTP_RATE_LIMIT_MAX`, `OTP_VERIFY_RATE_LIMIT_MAX`, `PAYMENT_RATE_LIMIT_MAX`.

Optional seeding overrides: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

Notes:

- `JWT_SECRET` has no default. The server refuses to start with a missing or too-short secret, so a weak secret can never reach production by accident.
- The Cloudinary values are only used by the image-upload endpoint. The demo data uses local images that already ship inside `buyer-app/public/images`, so a Cloudinary account is **not** needed for the demo.
- The email values are only used by the forgot-password OTP flow. With an App Password (not your normal Google password) the reset email works on a real Gmail address.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are only needed for "Pay online". Without them the API answers `503` for the payment endpoints and cash on delivery remains the only usable option. The secret stays on the server.
- The Razorpay checkout script itself is loaded from Razorpay's CDN in the browser; only the public key id is ever sent to the client.
- No secret is ever sent to the browser. The frontends only ever receive a JWT.

## Roles

| Role           | Capabilities                                                                                   |
|----------------|-----------------------------------------------------------------------------------------------|
| `buyer`        | Browse/search products, manage cart and wishlist, check out with cash on delivery or Razorpay, cancel own orders, review purchases, view own orders |
| `manufacturer` | Apply for seller account, manage own products and stock, upload images, view and update orders for their own products, sales statistics |
| `admin`        | Approve/block sellers and users, manage every product, order and user, platform analytics and settings |

Manufacturers start as `pending` and cannot sell or appear in the marketplace until an admin approves them. Write endpoints need `Authorization: Bearer <token>`, and the role middleware rejects a token that does not match the required role.

## API Endpoints

All responses follow one shape, so the frontend can always read `res.data` the same way:

```json
{ "success": true, "message": "Products fetched successfully", "data": { } }
```

Errors use `{ "success": false, "message": "..." }`, with an optional `errors` array for validation failures.

> Note: the buyer app's Axios interceptor already returns `response.data`, so an API function resolves to the body shown above — not to the raw Axios response.

### Health

| Method | Endpoint      | Auth | Description  |
|--------|---------------|------|--------------|
| GET    | `/api/health` | —    | Health check |

### Auth — `/api/auth`

| Method | Endpoint               | Auth | Description |
|--------|------------------------|------|-------------|
| POST   | `/register`            | —    | Register (`name`, `email`, `password`, optional `phone`, `role`) |
| POST   | `/login`               | —    | Login (`email`, `password`) → returns a short-lived `token` and a `refreshToken` |
| POST   | `/refresh`             | —    | Exchange a valid `refreshToken` for a new token pair (the old one is rotated) |
| POST   | `/logout`              | Token optional | Revoke this session (`refreshToken` in the body works even when the access token has expired) |
| POST   | `/logout-all`          | Token | Revoke every session of the user and bump their session version |
| POST   | `/forgot-password`     | —    | Request a 6-digit OTP for `email` |
| POST   | `/verify-otp`          | —    | Verify `email` + `otp` → returns a short-lived `resetToken` |
| POST   | `/reset-password`      | —    | Set a new password with `resetToken`, `newPassword`, `confirmPassword` (all sessions are signed out) |

Sessions: each login creates a `Session` record holding a hash of the refresh token. Refreshing rotates it (the previous token stops working), and logout deletes it server-side, so a stolen or leftover token cannot be replayed after sign-out. Each app's Axios client silently calls `/refresh` once when a request comes back `401`, and only redirects to the login page when that fails.

Forgot-password rules: the OTP is emailed (never returned by the API), stored only as a hash, expires after 10 minutes, allows 5 attempts, and has a resend cooldown. Unknown addresses get the same generic reply as known ones. If the SMTP send fails, the API answers with a clear `502` instead of pretending the email was sent, and the user can retry once the cooldown has passed.

### Products — `/api/products`

| Method | Endpoint    | Auth         | Description |
|--------|-------------|--------------|-------------|
| GET    | `/`         | Public       | List products. Query: `page`, `limit`, `search` (name, category, description), `category`, `manufacturer` |
| GET    | `/:id`      | Public       | Get one product (includes `averageRating` and `totalReviews`) |
| POST   | `/`         | Manufacturer | Create a product |
| PUT    | `/:id`      | Manufacturer | Update **own** product |
| DELETE | `/:id`      | Manufacturer | Delete **own** product |

Product fields: `name`, `description`, `category`, `price`, `stock`, `images` (array of URLs), `isAvailable`. Categories in use: Kanchipuram, Banarasi, Mysore, Patola, Pochampally, Paithani.

### Cart — `/api/cart` (buyer only)

| Method | Endpoint               | Description |
|--------|------------------------|-------------|
| GET    | `/`                    | View own cart |
| POST   | `/add`                 | Add item (`productId`, `quantity`) |
| PUT    | `/update`              | Update quantity (`productId`, `quantity`) |
| DELETE | `/remove/:productId`   | Remove one item |

Quantities below 1 or above the available stock are rejected. Creating an order empties the saved cart on the server, so a page refresh does not bring already-purchased items back.

### Orders — `/api/orders` and role dashboards

| Method | Endpoint                                | Auth         | Description |
|--------|-----------------------------------------|--------------|-------------|
| POST   | `/api/orders`                           | Buyer        | Create an order (`items`, `shippingAddress`, `paymentMethod: 'cod'`). The total is always computed on the server |
| PATCH  | `/api/orders/:id/cancel`                | Buyer        | Cancel own order while it is still `pending` or `accepted`; reserved stock is returned |
| GET    | `/api/orders`                           | Any role     | Buyers see their own orders, manufacturers see orders containing their products, admins see all |
| GET    | `/api/orders/:id`                       | Any role     | One order, with the same visibility rules |
| GET    | `/api/manufacturer/orders`              | Manufacturer | The manufacturer's own order list, including each item's share of the total |
| GET    | `/api/manufacturer/orders/:id`          | Manufacturer | One order belonging to that manufacturer |
| PATCH  | `/api/manufacturer/orders/:id/status`   | Manufacturer | Update status to `accepted`, `shipped` or `delivered` |
| PATCH  | `/api/admin/order/:id/status`           | Admin        | Update status, including `cancelled` |
| GET    | `/api/admin/orders`                     | Admin        | Every order in the system |

Order statuses: `pending`, `accepted`, `shipped`, `delivered`, `cancelled`. Any other value is rejected with `400`.

Shipping address is stored on the order as `name`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `zip` — the same property names used by the checkout form — and is visible to the manufacturer and the admin on the order.

### Payment

Two methods, chosen on the checkout screen:

| Method | Where it is created | Notes |
|--------|--------------------|-------|
| Cash on delivery | `POST /api/orders` with `paymentMethod: 'cod'` | Nothing is charged; the manufacturer is paid on delivery |
| Online (Razorpay) | `POST /api/payment/create-order` | Card / UPI / netbanking; the order is marked `paid` only after the server verifies Razorpay's signature |

`/api/payment` — buyer only, rate-limited:

| Method | Endpoint        | Description |
|--------|-----------------|-------------|
| POST   | `/create-order` | `{ items, shippingAddress }` for a fresh checkout, or `{ orderId }` to retry an unpaid order. Returns `keyId`, `amount` (paise), `razorpayOrderId` and the order |
| POST   | `/verify`       | `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` — the HMAC signature is recomputed with the secret before the order is marked `paid` |
| POST   | `/failure`      | `{ orderId }` — records a dismissed or declined attempt so the order is retryable and never claims success |

How the online flow stays safe:

- The amount is always recomputed from MongoDB prices; the browser never sends an amount, price or discount.
- The Razorpay order is created first, then stock is reserved and the saved cart is emptied — so a gateway failure cannot leave reserved stock the buyer never ordered, and a refresh cannot bring already-ordered items back. Retrying a payment reuses the same order instead of reserving stock twice.
- The browser's "payment succeeded" claim is never trusted: verification recomputes `HMAC_SHA256(order_id|payment_id)` with the server-side secret and compares it in constant time. A forged response simply gets `400`.
- Verification is idempotent: submitting the same verified payment twice returns success instead of double-processing.
- Cancelling a paid Razorpay order starts a refund (`refundStatus`: `not_requested` → `pending` → `processed` / `failed`); "processed" is only written after Razorpay confirms it.

If `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not set, the payment endpoints answer `503` and cash on delivery remains the only usable option.

### Wishlist — `/api/wishlist` (buyer only)

| Method | Endpoint     | Description |
|--------|--------------|-------------|
| GET    | `/`          | Own wishlist with product details |
| POST   | `/:productId`| Add a product |
| DELETE | `/:productId`| Remove a product |

### Reviews — `/api/reviews`

| Method | Endpoint                          | Auth | Description |
|--------|-----------------------------------|------|-------------|
| GET    | `/product/:productId`            | Public | All reviews for a product |
| GET    | `/product/:productId/mine`       | Buyer  | The logged-in buyer's own review |
| GET    | `/product/:productId/can-review` | Buyer  | Whether this buyer may review (must have a non-cancelled order) |
| POST   | `/product/:productId`            | Buyer  | Create a review (`rating`, `text`) |
| PUT    | `/:reviewId`                     | Buyer  | Update own review |
| DELETE | `/:reviewId`                     | Buyer  | Delete own review |

### Storefront, Profile and Analytics

| Method | Endpoint                        | Auth         | Description |
|--------|---------------------------------|--------------|-------------|
| GET    | `/api/stores/:id`               | Public       | Public manufacturer profile: business name, city, product count, average rating. The email address is never returned |
| GET    | `/api/profile`                  | Any role     | Own profile |
| PATCH  | `/api/profile`                  | Any role     | Update own profile |
| GET    | `/api/manufacturer/analytics`   | Manufacturer | Sales statistics for the dashboard |
| GET    | `/api/admin/analytics`          | Admin        | Platform-wide statistics |

### Admin — `/api/admin`

| Method | Endpoint                        | Description |
|--------|---------------------------------|-------------|
| GET    | `/users`                        | All users (password hashes are never returned) |
| GET    | `/buyers`                       | Buyers only |
| GET    | `/manufacturers`                | Manufacturers only |
| GET    | `/manufacturers/pending`        | Sellers waiting for approval |
| GET    | `/products`                     | All products |
| GET    | `/orders`                       | All orders |
| GET    | `/analytics`                    | Dashboard statistics |
| GET    | `/settings`                     | Platform settings (single document, created with defaults) |
| PATCH  | `/settings`                     | Update `orderFlow`, `autoAccept`, `approvalRequired`, `maxProducts`, `commission`, `payoutCycle` |
| PATCH  | `/manufacturer/:id/approve`     | Approve a seller |
| PATCH  | `/manufacturer/:id/reject`      | Reject a seller |
| PATCH  | `/manufacturer/:id/disapprove`  | Withdraw approval |
| PATCH  | `/user/:id/block`               | Block a user |
| PATCH  | `/user/:id/unblock`             | Unblock a user |
| PATCH  | `/order/:id/status`             | Update an order status |
| DELETE | `/product/:id`                  | Delete any product |
| DELETE | `/user/:id`                     | Delete any user except the logged-in admin |

### Upload

| Method | Endpoint      | Auth               | Description |
|--------|---------------|--------------------|-------------|
| POST   | `/api/upload` | Manufacturer/Admin | Multipart form, field `images` (max 5 files, 5MB each, image types only). Returns `data.urls` |

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

Only the returned URLs are stored — pass them in the product `images` array.

## Error Responses

Errors are JSON, never stack traces:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [{ "field": "price", "message": "Price must be a number greater than or equal to 0" }]
}
```

Common status codes: `400` invalid input or id, `401` missing/invalid/expired token, `403` wrong role or not the owner, `404` not found, `409` duplicate, `429` rate limit, `503` email could not be sent, `500` unexpected server error.

## Demo Data

`server` ships with a small seed script that creates a realistic but tiny dataset: **1 admin, 10 manufacturers, 20 buyers, 20 products, 25 orders and 15 reviews** — never thousands of records.

```bash
cd server
npm run seed
```

| Role          | Email                             | Password     |
|---------------|-----------------------------------|--------------|
| Admin         | `admin@weaveconnect.com`          | `Admin@123`  |
| Manufacturer  | `manufacturer1@weaveconnect.com` (…`manufacturer10`) | `Weave@123` |
| Buyer         | `buyer1@weaveconnect.com` (…`buyer20`) | `Weave@123` |

How the seed behaves:

- Passwords are hashed with bcrypt (12 rounds); the plain text above exists only for local demo login.
- The data is spread over the six real saree categories and woven to real relationships: every order points at a real buyer, product and manufacturer, and every review belongs to an actual purchase.
- Re-running the script is safe. It deletes **only** the previous demo records — recognised by their `manufacturer1@weaveconnect.com` / `buyer1@weaveconnect.com` email pattern — so it never creates duplicates, never drops the database, and never destroys accounts, products or orders you created yourself. The admin account and platform settings are left alone.
- Nothing is dropped at the database level, and no real person's information is used.

## Testing

The backend has a self-contained end-to-end suite (156 checks) covering registration, login, role protection, seller approval, products, search, cart, stock limits, checkout, shipping addresses, order visibility, reviews and analytics, plus the forgot-password OTP flow (the code is read back out of the fake SMTP inbox, then a wrong OTP, a reused OTP, a reused reset token, the resend cooldown and unknown addresses are all checked) and the payment guards (`401`/`403`/`400` and the unconfigured-gateway `503`).

```bash
cd server
npm test
```

`npm test` automatically:

1. Starts the API on port `5050` against an isolated test database (`weaveconnect_test`) and a local fake SMTP server, so your development data and real inbox are never touched.
2. Runs the full suite.
3. Shuts everything down and exits `0` on success, `1` on any failure.

There is also a smaller manual check for the session and payment endpoints — refresh-token rotation, logout revoking both token kinds, the unconfigured-gateway `503`, the unknown-order `404` and login validation:

```bash
cd server
node scripts/smokeSessionPayment.js
```

The frontends have no test suite; validate them with `npm run build` in each app.

## Build

```bash
cd buyer-app  && npm run build
cd seller-app && npm run build
cd admin-app  && npm run build
```

## Project Structure

```
.
├── server/                  # Express API
│   ├── src/
│   │   ├── config/          # env + database + cloudinary config
│   │   ├── controllers/     # request handlers
│   │   ├── middleware/      # auth, authorize, upload, sanitize, validateRequest, notFound, errorHandler
│   │   ├── models/          # Mongoose models (User, Product, Order, Cart, Wishlist, Review, Settings)
│   │   ├── routes/          # route definitions + index
│   │   ├── scripts/         # seedAdmin.js, seedDemo.js
│   │   ├── utils/           # AppError, asyncHandler, apiResponse, validateObjectId, jwt, email
│   │   ├── validations/     # express-validator schemas
│   │   ├── app.js           # express app (middleware + route mounting)
│   │   └── server.js        # entrypoint (db connect + listen + graceful shutdown)
│   ├── _test-e2e.js         # end-to-end test suite
│   ├── scripts/runTests.js  # test runner (starts API + fake SMTP)
│   ├── .env.example
│   └── package.json
├── buyer-app/               # React storefront
├── seller-app/              # React manufacturer dashboard
└── admin-app/               # React admin dashboard
```

## Conventions

- Controllers are wrapped in `asyncHandler`; errors are thrown as `AppError` and formatted centrally by the error handler.
- Responses always go through the `apiResponse` helpers (`success`, `error`).
- `ObjectId` route params are checked with `validateObjectId` before they reach a query.
- Protected routes use `authenticate` (valid JWT) and then `authorize('role')` (correct role).
- The codebase carries short explanatory comments so it can be followed during a viva.

# React + TypeScript + Vite

## Paystack preparation

In Supabase Dashboard → SQL Editor, run `supabase/migrations/20261113223000_add_paystack_order_columns.sql` to add the four payment fields to `public.orders`.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the ignored frontend `.env.local`. Set `PAYSTACK_SECRET_KEY` and `SITE_URL` as Supabase Edge Function secrets; the Supabase runtime provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Never prefix a secret with `VITE_` or access it from frontend code.

Run `supabase/migrations/20261115220000_admin_auth_allowlist.sql` followed by `supabase/migrations/20261115233000_secure_customer_order_flows.sql` only after reviewing the live policy preflight, checking for duplicate non-null `paystack_reference` values, and completing local tests. The order-flow migration denies direct public order reads/writes; checkout, payment and tracking must use the Edge Functions. `create-order` prices items and extras from `menu_items` and `extras` in the database. `initialize-payment` initializes Paystack with the server-calculated amount; `verify-payment` checks Paystack's server API before calling an idempotent database function; `paystack-webhook` validates Paystack's HMAC signature and verifies the transaction again. Customers track orders using the high-entropy access code shown after checkout, not a phone number alone.

For local development, create an untracked `supabase/functions/.env` containing local `PAYSTACK_SECRET_KEY` and `SITE_URL=http://localhost:5173`, run Supabase locally, and serve the functions with that env file. Configure Paystack's webhook URL to the deployed `paystack-webhook` Edge Function only after deployment approval. Neither local setup nor deployment has been run as part of this change.

## Delivery and pickup

Run `supabase/migrations/20261113154500_add_delivery_method.sql` in the Supabase SQL Editor. New orders store `delivery_method`, set `delivery_fee` to zero, and use the food subtotal as the total. Delivery charges are arranged with the rider separately.

## Menu image uploads

The admin menu uploads JPG/PNG images (up to 5 MB) to the Supabase Storage bucket `menu-images` and saves the public URL to `menu_items.image_url`. The bucket must allow public reads so customer menu pages can display the images.

The bucket may be public for reads, but writes must be restricted by Storage RLS to authenticated administrators.

## Admin authentication

The admin UI signs in with Supabase Auth email and password. Run `supabase/migrations/20261115220000_admin_auth_allowlist.sql` in the Supabase SQL Editor to create a private Auth-user allowlist, the `is_admin()` authorization function, and admin-only read/update/upload policies. The migration allowlists the existing administrator Auth user ID and configures the `menu-images` bucket for public reads and JPG/PNG uploads up to 5 MB.

Before running it, inspect existing RLS policies on `menu_items`, `orders`, `order_items`, and `storage.objects` using the preflight query in the migration. The migration requires RLS to already be enabled on those tables and aborts otherwise. Its restrictive write policies ensure existing permissive policies cannot allow non-admin menu/order updates or menu-image writes. Review existing SELECT policies separately, particularly for customer order tracking, so admin access is added without exposing customer data. The migration has not been applied to the live project. Keep the legacy `admin_credentials` table unchanged until the new login and policies are verified; the frontend no longer queries it.

The frontend checks admin access through `public.is_admin()`. Add or remove administrators only through trusted SQL/admin tooling; do not grant clients write access to `admin_users`. Supabase Auth persists and restores the session, and RLS—not the route guard—is the authorization boundary.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

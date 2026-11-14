# React + TypeScript + Vite

## Paystack preparation

In Supabase Dashboard → SQL Editor, run `supabase/migrations/20261113223000_add_paystack_order_columns.sql` to add the four payment fields to `public.orders`.

Configure local keys in the ignored `.env.local` file using `.env.example` as a template. The checkout uses Paystack Inline v1 and only reads `VITE_PAYSTACK_PUBLIC_KEY` in the browser. Keep `PAYSTACK_SECRET_KEY` server-only; never prefix it with `VITE_` or access it from frontend code. After Paystack returns a reference, checkout calls the `verify-payment` Supabase Edge Function. That endpoint must verify the transaction with Paystack before an order is marked paid.

## Delivery and pickup

Run `supabase/migrations/20261113154500_add_delivery_method.sql` in the Supabase SQL Editor. New orders store `delivery_method`, set `delivery_fee` to zero, and use the food subtotal as the total. Delivery charges are arranged with the rider separately.

## Menu image uploads

The admin menu uploads JPG/PNG images (up to 5 MB) to the Supabase Storage bucket `menu-images` and saves the public URL to `menu_items.image_url`. The bucket must allow public reads so customer menu pages can display the images.

Uploads and menu updates are made from the browser using the Supabase anon key. The current `sessionStorage` admin flag is not an authorization credential that Supabase Storage RLS can verify. Do not allow unrestricted anonymous uploads in production; secure uploads with a server-side endpoint that verifies admin authorization before accepting files.

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


  # Finanzas Personales Fluent App

  This is a code bundle for Finanzas Personales Fluent App. The original project is available at https://www.figma.com/design/rPKig1O5uqmnPc3fKm6rN6/Finanzas-Personales-Fluent-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Create a `.env` file in the project root based on `.env.example` and point
  `VITE_API_BASE_URL` and endpoint paths to your backend.

  Run `npm run dev` to start the development server.

  ## Backend integration

  The frontend now consumes backend APIs from a centralized client in
  `src/app/services/api.ts` and from `src/app/context/AppContext.tsx`.

  API code is organized by functionality under `src/app/services/api/`:
  - `config.ts` (env and endpoints)
  - `http.ts` (shared request helper)
  - `auth.ts` (login/register/me/logout/forgot)
  - `transactions.ts` (list/create transactions)
  - `users.ts` (admin users endpoint)
  - `mock-api.ts` (temporary local mock responses)

  Configure these environment variables as needed:

  - `VITE_API_BASE_URL`
  - `VITE_API_USE_MOCK` (defaults to `true` in `dev` when not defined)
  - `VITE_API_LOGIN_ENDPOINT`
  - `VITE_API_REGISTER_ENDPOINT`
  - `VITE_API_ME_ENDPOINT`
  - `VITE_API_LOGOUT_ENDPOINT`
  - `VITE_API_FORGOT_PASSWORD_ENDPOINT`
  - `VITE_API_TRANSACTIONS_ENDPOINT`
  - `VITE_API_USERS_ENDPOINT`

  ## Mock credentials (temporary)

  If `VITE_API_USE_MOCK=true`, you can use:

  - Admin: `admin@fluent.local` / `Admin123!`
  - User: `usuario@fluent.local` / `Usuario123!`
  
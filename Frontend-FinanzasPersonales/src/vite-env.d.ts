/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_USE_MOCK?: string;
  readonly VITE_API_LOGIN_ENDPOINT?: string;
  readonly VITE_API_REGISTER_ENDPOINT?: string;
  readonly VITE_API_ME_ENDPOINT?: string;
  readonly VITE_API_LOGOUT_ENDPOINT?: string;
  readonly VITE_API_FORGOT_PASSWORD_ENDPOINT?: string;
  readonly VITE_API_TRANSACTIONS_ENDPOINT?: string;
  readonly VITE_API_USERS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

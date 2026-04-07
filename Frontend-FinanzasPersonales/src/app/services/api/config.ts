const DEFAULT_API_BASE_URL = "http://localhost:8080/api";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const parseBooleanEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL);

export const ENDPOINTS = {
  login: ensureLeadingSlash(import.meta.env.VITE_API_LOGIN_ENDPOINT ?? "/auth/login"),
  register: ensureLeadingSlash(import.meta.env.VITE_API_REGISTER_ENDPOINT ?? "/auth/register"),
  me: ensureLeadingSlash(import.meta.env.VITE_API_ME_ENDPOINT ?? "/auth/me"),
  logout: ensureLeadingSlash(import.meta.env.VITE_API_LOGOUT_ENDPOINT ?? "/auth/logout"),
  forgotPassword: ensureLeadingSlash(import.meta.env.VITE_API_FORGOT_PASSWORD_ENDPOINT ?? "/auth/forgot-password"),
  transactions: ensureLeadingSlash(import.meta.env.VITE_API_TRANSACTIONS_ENDPOINT ?? "/transactions"),
  users: ensureLeadingSlash(import.meta.env.VITE_API_USERS_ENDPOINT ?? "/users"),
} as const;

export const USE_MOCK_API = parseBooleanEnv(import.meta.env.VITE_API_USE_MOCK, import.meta.env.DEV);

export const AUTH_TOKEN_KEY = "fluent.auth.token";
export const MOCK_SESSION_KEY = "fluent.mock.session";

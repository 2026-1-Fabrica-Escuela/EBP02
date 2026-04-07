import { AUTH_TOKEN_KEY, MOCK_SESSION_KEY } from "./config";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getStoredAuthToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const saveStoredAuthToken = (token: string) => {
  if (canUseStorage()) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearStoredAuthToken = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const getMockSessionUserId = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(MOCK_SESSION_KEY);
};

export const setMockSessionUserId = (userId: string) => {
  if (canUseStorage()) {
    window.localStorage.setItem(MOCK_SESSION_KEY, userId);
  }
};

export const clearMockSessionUserId = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
  }
};

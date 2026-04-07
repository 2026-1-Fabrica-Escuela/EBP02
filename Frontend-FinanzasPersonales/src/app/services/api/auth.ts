import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import {
  mockForgotPasswordRequest,
  mockGetCurrentUserRequest,
  mockLoginRequest,
  mockLogoutRequest,
  mockRegisterRequest,
} from "./mock-api";

export const loginRequest = (email: string, password: string) => {
  if (USE_MOCK_API) {
    return mockLoginRequest(email, password);
  }

  return request<unknown>(ENDPOINTS.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const registerRequest = (name: string, email: string, password: string) => {
  if (USE_MOCK_API) {
    return mockRegisterRequest(name, email, password);
  }

  return request<unknown>(ENDPOINTS.register, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
};

export const forgotPasswordRequest = (email: string) => {
  if (USE_MOCK_API) {
    return mockForgotPasswordRequest();
  }

  return request<unknown>(ENDPOINTS.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const logoutRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockLogoutRequest();
  }

  return request<unknown>(ENDPOINTS.logout, { method: "POST" }, token);
};

export const getCurrentUserRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetCurrentUserRequest(token);
  }

  return request<unknown>(ENDPOINTS.me, { method: "GET" }, token);
};

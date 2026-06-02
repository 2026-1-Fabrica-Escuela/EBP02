import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import {
  mockForgotPasswordRequest,
  mockGetCurrentUserRequest,
  mockGetLoginLogsRequest,
  mockLoginRequest,
  mockLogoutRequest,
  mockRegisterRequest,
  mockResetPasswordRequest,
  mockUpdateProfileRequest,
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
    return mockForgotPasswordRequest(email);
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

export const getLoginLogsRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetLoginLogsRequest(token);
  }

  return request<unknown>(ENDPOINTS.loginLogs, { method: "GET" }, token);
};

export const resetPasswordRequest = (
  token: string,
  newPassword: string,
) => {
  if (USE_MOCK_API) {
    return mockResetPasswordRequest(token, newPassword);
  }

  return request<unknown>(ENDPOINTS.resetPassword, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
};

export const updateProfileRequest = (
  name: string,
  email: string,
  token?: string | null,
) => {
  if (USE_MOCK_API) {
    return mockUpdateProfileRequest(name, email, token);
  }

  return request<unknown>(ENDPOINTS.updateProfile, {
    method: "PUT",
    body: JSON.stringify({ name, email }),
  }, token);
};

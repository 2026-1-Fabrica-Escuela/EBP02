import { ENDPOINTS } from "./config";
import { request } from "./http";

export const getAdminUsersRequest = (token?: string | null) => {
  return request<unknown>(ENDPOINTS.adminUsers, { method: "GET" }, token);
};

export const suspendUserRequest = (userId: string, reason: string, token?: string | null) => {
  return request<unknown>(
    `${ENDPOINTS.adminUsers}/${userId}/suspend`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
    token,
  );
};

export const activateUserRequest = (userId: string, token?: string | null) => {
  return request<unknown>(
    `${ENDPOINTS.adminUsers}/${userId}/activate`,
    { method: "PATCH" },
    token,
  );
};

export const updateAdminUserRequest = (
  userId: string,
  payload: { name: string; email: string },
  token?: string | null,
) => {
  return request<unknown>(
    `${ENDPOINTS.adminUsers}/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
};

export const getLoginLogsRequest = (start: string, end: string, token?: string | null) => {
  return request<unknown>(
    `${ENDPOINTS.loginLogs}?start=${start}&end=${end}`,
    { method: "GET" },
    token,
  );
};

import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import { mockGetUsersRequest } from "./mock-api";

export const getUsersRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetUsersRequest(token);
  }

  return request<unknown>(ENDPOINTS.users, { method: "GET" }, token);
};

import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import { extractMessage } from "./messages";

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? text : null;
};

export const request = async <T>(
  endpoint: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> => {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, `La solicitud fallo con estado ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
};

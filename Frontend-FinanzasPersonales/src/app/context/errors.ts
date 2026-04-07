import { ApiError } from "../services/api";

export const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return fallback;
};

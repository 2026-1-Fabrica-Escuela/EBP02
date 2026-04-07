const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const extractMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const messageKeys = ["message", "error", "detail", "mensaje"];
  for (const key of messageKeys) {
    const candidate = payload[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  for (const parentKey of ["data", "result", "payload"]) {
    const nested = payload[parentKey];
    if (!isRecord(nested)) {
      continue;
    }

    for (const key of messageKeys) {
      const candidate = nested[key];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return fallback;
};

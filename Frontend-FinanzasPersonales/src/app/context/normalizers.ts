import type { Transaction, User } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const pickString = (source: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
};

const pickNumber = (source: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const normalizeRole = (value: string | null): User["role"] =>
  value?.toLowerCase() === "admin" ? "admin" : "user";

const normalizeTransactionType = (value: string | null): Transaction["type"] | null => {
  if (!value) return null;

  const normalized = value.toLowerCase();
  // Añadimos "income" y "expense" que es lo que manda tu categoryType
  if (["ingreso", "income", "entrada"].includes(normalized)) {
    return "ingreso";
  }
  if (["gasto", "expense", "egreso"].includes(normalized)) {
    return "gasto";
  }

  return null;
};

const normalizeDate = (value: string): string => {
  if (value.includes("T")) {
    return value.split("T")[0];
  }
  return value;
};

const normalizeUser = (value: unknown): User | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = pickString(value, ["id", "_id", "userId", "uid"]);
  const name = pickString(value, ["name", "fullName", "nombre"]);
  const email = pickString(value, ["email", "correo"]);

  if (!id || !name || !email) {
    return null;
  }

  return {
    id,
    name,
    email,
    role: normalizeRole(pickString(value, ["role", "rol"])),
  };
};

const normalizeTransaction = (value: unknown, fallbackUserId?: string): Transaction | null => {
  if (!isRecord(value)) return null;

  const id = pickString(value, ["transactionId", "id", "_id"]);
  
  // Buscamos el tipo en la nueva llave 'categoryType'
  const type = normalizeTransactionType(
    pickString(value, ["categoryType", "type", "transactionType", "tipo"])
  );
  
  const amount = pickNumber(value, ["amount", "value", "monto"]);
  const date = pickString(value, ["date", "transactionDate", "fecha"]);
  const description = pickString(value, ["description", "concept", "detalle"]) ?? "Sin descripción";
  
  // Buscamos el nombre de la categoría en 'categoryTitle'
  const category = pickString(value, ["categoryTitle", "category", "categoria"]) ?? "Sin categoría";
  
  // Si el backend no manda userId, usamos el fallback o un string vacío
  const userId = pickString(value, ["userId", "user_id"]) ?? fallbackUserId ?? "current-user";

  // VALIDACIÓN: Si falta el ID, el Tipo o el Monto, el objeto no es válido
  if (!id || !type || amount === null || !date) {
    console.warn("Transacción descartada por falta de datos críticos:", { id, type, amount, date });
    return null;
  }

  return {
    id,
    type,
    amount,
    date: normalizeDate(date),
    description,
    category,
    userId,
  };
};

const extractArrayFromPayload = (payload: unknown, preferredKeys: string[]): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of preferredKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const parentKey of ["data", "result", "payload"]) {
    const nested = payload[parentKey];
    if (Array.isArray(nested)) {
      return nested;
    }

    if (!isRecord(nested)) {
      continue;
    }

    for (const key of preferredKeys) {
      const value = nested[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
};

export const extractUserFromPayload = (payload: unknown): User | null => {
  const direct = normalizeUser(payload);
  if (direct) {
    return direct;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const userKeys = ["user", "profile", "account", "data", "result", "payload"];
  for (const key of userKeys) {
    const candidate = payload[key];
    const normalized = normalizeUser(candidate);
    if (normalized) {
      return normalized;
    }

    if (!isRecord(candidate)) {
      continue;
    }

    const nestedNormalized = normalizeUser(candidate.user);
    if (nestedNormalized) {
      return nestedNormalized;
    }
  }

  return null;
};

export const extractTokenFromPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = pickString(payload, ["token", "accessToken", "access_token", "jwt"]);
  if (direct) {
    return direct;
  }

  for (const parentKey of ["data", "result", "payload", "auth"]) {
    const nested = payload[parentKey];
    if (!isRecord(nested)) {
      continue;
    }

    const token = pickString(nested, ["token", "accessToken", "access_token", "jwt"]);
    if (token) {
      return token;
    }
  }

  return null;
};

export const normalizeUsersFromPayload = (payload: unknown, currentUser: User): User[] => {
  const list = extractArrayFromPayload(payload, ["users", "items", "results", "data"])
    .map((entry) => normalizeUser(entry))
    .filter((entry): entry is User => Boolean(entry));

  if (!list.some((entry) => entry.id === currentUser.id)) {
    list.unshift(currentUser);
  }

  return list;
};

export const sortTransactions = (items: Transaction[]): Transaction[] =>
  [...items].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return bTime - aTime;
  });

export const normalizeTransactionsFromPayload = (
  payload: unknown,
  fallbackUserId?: string,
): Transaction[] =>
  sortTransactions(
    extractArrayFromPayload(payload, ["transactions", "items", "results", "data"])
      .map((entry) => normalizeTransaction(entry, fallbackUserId))
      .filter((entry): entry is Transaction => Boolean(entry)),
  );

export const extractTransactionFromPayload = (
  payload: unknown,
  fallbackUserId?: string,
): Transaction | null => {
  const direct = normalizeTransaction(payload, fallbackUserId);
  if (direct) {
    return direct;
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of ["transaction", "data", "result", "payload"]) {
    const candidate = payload[key];
    const normalized = normalizeTransaction(candidate, fallbackUserId);
    if (normalized) {
      return normalized;
    }

    if (!isRecord(candidate)) {
      continue;
    }

    const nested = normalizeTransaction(candidate.transaction, fallbackUserId);
    if (nested) {
      return nested;
    }
  }

  return null;
};

import type {
  BudgetResponse,
  LoginLog,
  PocketResponse,
  Transaction,
  User,
} from "./types";

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

const pickBoolean = (source: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value !== 0;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
};

const normalizeRole = (value: string | null): User["role"] =>
  value?.toLowerCase() === "admin" ? "admin" : "user";

const normalizeUserStatus = (value: string | null): User["status"] => {
  if (!value) {
    return "activa";
  }

  const normalized = value.toLowerCase();
  if (["suspendida", "suspended", "inactive", "inactiva", "disabled", "blocked"].includes(normalized)) {
    return "suspendida";
  }

  return "activa";
};

const normalizeTransactionType = (value: string | null): Transaction["type"] | null => {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
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

const normalizeBudget = (value: unknown): BudgetResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  const budgetId = pickString(value, ["budgetId", "id", "_id"]);
  const totalAmount = pickNumber(value, ["totalAmount", "total_amount", "amount"]);
  const allocatedAmount = pickNumber(value, ["allocatedAmount", "allocated_amount"]) ?? 0;
  const remainingAmount = pickNumber(value, ["remainingAmount", "remaining_amount"]);
  const month = pickNumber(value, ["month"]);
  const year = pickNumber(value, ["year"]);

  if (!budgetId || totalAmount === null || month === null || year === null) {
    return null;
  }

  const resolvedAllocated = allocatedAmount ?? 0;
  const resolvedRemaining = remainingAmount ?? totalAmount - resolvedAllocated;

  return {
    budgetId,
    totalAmount,
    allocatedAmount: resolvedAllocated,
    remainingAmount: resolvedRemaining,
    month: Math.trunc(month),
    year: Math.trunc(year),
  };
};

const normalizePocket = (value: unknown): PocketResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  const pocketId = pickString(value, ["pocketId", "id", "_id"]);
  const title = pickString(value, ["title", "name", "nombre"]);
  const allocatedAmount = pickNumber(value, ["allocatedAmount", "allocated_amount"]);
  const currentAmount = pickNumber(value, ["currentAmount", "current_amount"]);
  const isSavings = pickBoolean(value, ["isSavings", "is_savings", "savings"]);
  const categoryTitle = pickString(value, ["categoryTitle", "category_title", "categoryName"]);
  const budgetId = pickString(value, ["budgetId", "budget_id"]);

  if (!pocketId || !title || allocatedAmount === null || isSavings === null || !budgetId) {
    return null;
  }

  return {
    pocketId,
    title,
    allocatedAmount,
    currentAmount: currentAmount ?? allocatedAmount,
    isSavings,
    categoryTitle,
    budgetId,
  };
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
    status: normalizeUserStatus(pickString(value, ["status", "state", "estado", "accountStatus"])),
    suspendReason: pickString(value, ["suspendReason", "suspensionReason", "motivoSuspension"]),
  };
};

const normalizeTransaction = (value: unknown, fallbackUserId?: string): Transaction | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = pickString(value, ["id", "_id", "transactionId"]);
  const type = normalizeTransactionType(
    pickString(value, ["type", "transactionType", "movementType", "tipo"]),
  );
  const amount = pickNumber(value, ["amount", "value", "monto"]);
  const date = pickString(value, ["date", "transactionDate", "createdAt", "fecha"]);
  const description =
    pickString(value, ["description", "concept", "detalle", "concepto"]) ?? "Sin descripción";
  const category = pickString(value, ["category", "categoria"]) ?? "Sin categoría";
  const userId =
    pickString(value, ["userId", "user_id", "ownerId", "usuarioId"]) ?? fallbackUserId ?? "";

  if (!id || !type || amount === null || !date || !userId) {
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

const extractObjectFromPayload = (payload: unknown, preferredKeys: string[]): unknown => {
  if (isRecord(payload)) {
    for (const key of preferredKeys) {
      const value = payload[key];
      if (isRecord(value)) {
        return value;
      }
    }

    for (const parentKey of ["data", "result", "payload"]) {
      const nested = payload[parentKey];
      if (!isRecord(nested)) {
        continue;
      }

      for (const key of preferredKeys) {
        const value = nested[key];
        if (isRecord(value)) {
          return value;
        }
      }
    }
  }

  return payload;
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
    list.unshift({
      ...currentUser,
      status: currentUser.status ?? "activa",
      suspendReason: currentUser.suspendReason ?? null,
    });
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

const normalizeLoginLog = (value: unknown): LoginLog | null => {
  if (!isRecord(value)) {
    return null;
  }

  const loginLogId = pickString(value, ["loginLogId", "id", "_id"]);
  const userId = pickString(value, ["userId", "user_id", "uid"]);
  const userName = pickString(value, ["userName", "name", "fullName", "nombre"]);
  const userEmail = pickString(value, ["userEmail", "email", "correo"]);
  const timestamp = pickString(value, ["timestamp", "loginAt", "createdAt", "date", "fecha"]);

  if (!loginLogId || !userId || !userName || !userEmail || !timestamp) {
    return null;
  }

  return {
    loginLogId,
    userId,
    userName,
    userEmail,
    timestamp,
  };
};

export const sortLoginLogs = (items: LoginLog[]): LoginLog[] =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.timestamp).getTime();
    const rightTime = new Date(right.timestamp).getTime();
    return rightTime - leftTime;
  });

export const normalizeLoginLogsFromPayload = (payload: unknown): LoginLog[] =>
  sortLoginLogs(
    extractArrayFromPayload(payload, ["loginLogs", "items", "results", "data"])
      .map((entry) => normalizeLoginLog(entry))
      .filter((entry): entry is LoginLog => Boolean(entry)),
  );

  export const sortBudgets = (items: BudgetResponse[]): BudgetResponse[] =>
    [...items].sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      if (a.month !== b.month) {
        return b.month - a.month;
      }
      return a.budgetId.localeCompare(b.budgetId);
    });

  export const sortPockets = (items: PocketResponse[]): PocketResponse[] =>
    [...items].sort((a, b) => {
      if (a.isSavings !== b.isSavings) {
        return Number(b.isSavings) - Number(a.isSavings);
      }

      const aLabel = (a.categoryTitle ?? a.title).toLowerCase();
      const bLabel = (b.categoryTitle ?? b.title).toLowerCase();

      return aLabel.localeCompare(bLabel, "es");
    });

  export const normalizeBudgetsFromPayload = (payload: unknown): BudgetResponse[] =>
    sortBudgets(
      extractArrayFromPayload(payload, ["budgets", "items", "results", "data"])
        .map((entry) => normalizeBudget(entry))
        .filter((entry): entry is BudgetResponse => Boolean(entry)),
    );

  export const normalizePocketsFromPayload = (payload: unknown): PocketResponse[] =>
    sortPockets(
      extractArrayFromPayload(payload, ["pockets", "items", "results", "data"])
        .map((entry) => normalizePocket(entry))
        .filter((entry): entry is PocketResponse => Boolean(entry)),
    );

  export const extractBudgetFromPayload = (payload: unknown): BudgetResponse | null => {
    const direct = normalizeBudget(payload);
    if (direct) {
      return direct;
    }

    const candidate = extractObjectFromPayload(payload, ["budget", "data", "result", "payload"]);
    const normalized = normalizeBudget(candidate);
    if (normalized) {
      return normalized;
    }

    if (!isRecord(payload)) {
      return null;
    }

    for (const key of ["budget", "data", "result", "payload"]) {
      const nested = payload[key];
      const nestedBudget = normalizeBudget(isRecord(nested) ? nested.budget : nested);
      if (nestedBudget) {
        return nestedBudget;
      }
    }

    return null;
  };

  export const extractPocketFromPayload = (payload: unknown): PocketResponse | null => {
    const direct = normalizePocket(payload);
    if (direct) {
      return direct;
    }

    const candidate = extractObjectFromPayload(payload, ["pocket", "data", "result", "payload"]);
    const normalized = normalizePocket(candidate);
    if (normalized) {
      return normalized;
    }

    if (!isRecord(payload)) {
      return null;
    }

    for (const key of ["pocket", "data", "result", "payload"]) {
      const nested = payload[key];
      const nestedPocket = normalizePocket(isRecord(nested) ? nested.pocket : nested);
      if (nestedPocket) {
        return nestedPocket;
      }
    }

    return null;
  };

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

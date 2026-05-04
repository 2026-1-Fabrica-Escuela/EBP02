import { clearMockSessionUserId, getMockSessionUserId, setMockSessionUserId } from "./auth-storage";
import { ApiError } from "./errors";
import type {
  CategoryResponse,
  CategoryType,
  CreateTransactionPayload,
} from "./types";
import type {
  CreateBudgetRequest,
  CreatePocketRequest,
  LoginLog,
  UpdateBudgetRequest,
} from "../../context/types";

interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  password: string;
}

interface MockTransactionRecord {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  date: string;
  description: string;
  category: string;
  userId: string;
}

interface MockCategoryRecord extends CategoryResponse {
  userId: string | null;
}

interface MockBudgetRecord {
  budgetId: string;
  userId: string;
  totalAmount: number;
  month: number;
  year: number;
}

interface MockPocketRecord {
  pocketId: string;
  userId: string;
  budgetId: string;
  title: string;
  allocatedAmount: number;
  currentAmount: number;
  isSavings: boolean;
  categoryId: string | null;
}

interface MockLoginLogRecord {
  loginLogId: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
}

export const MOCK_LOGIN_CREDENTIALS = {
  admin: {
    email: "admin@fluent.local",
    password: "Admin123!",
  },
  user: {
    email: "usuario@fluent.local",
    password: "Usuario123!",
  },
} as const;

let mockUsers: MockUserRecord[] = [
  {
    id: "mock-admin-1",
    name: "Admin Fluent",
    email: MOCK_LOGIN_CREDENTIALS.admin.email,
    role: "admin",
    password: MOCK_LOGIN_CREDENTIALS.admin.password,
  },
  {
    id: "mock-user-1",
    name: "Usuario Demo",
    email: MOCK_LOGIN_CREDENTIALS.user.email,
    role: "user",
    password: MOCK_LOGIN_CREDENTIALS.user.password,
  },
];

let mockTransactions: MockTransactionRecord[] = [
  {
    id: "mock-tx-1",
    type: "ingreso",
    amount: 3500000,
    date: "2026-03-28",
    description: "Salario mensual",
    category: "Salario",
    userId: "mock-user-1",
  },
  {
    id: "mock-tx-2",
    type: "gasto",
    amount: 190000,
    date: "2026-03-27",
    description: "Supermercado",
    category: "Alimentacion",
    userId: "mock-user-1",
  },
  {
    id: "mock-tx-3",
    type: "ingreso",
    amount: 500000,
    date: "2026-03-26",
    description: "Servicio freelance",
    category: "Freelance",
    userId: "mock-user-1",
  },
  {
    id: "mock-tx-4",
    type: "gasto",
    amount: 120000,
    date: "2026-03-25",
    description: "Transporte",
    category: "Transporte",
    userId: "mock-user-1",
  },
  {
    id: "mock-tx-5",
    type: "gasto",
    amount: 250000,
    date: "2026-03-24",
    description: "Servicios del hogar",
    category: "Servicios",
    userId: "mock-admin-1",
  },
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();
const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);
const previousMonth = previousMonthDate.getMonth() + 1;
const previousYear = previousMonthDate.getFullYear();

let mockCategories: MockCategoryRecord[] = [
  { categoryId: "mock-cat-food", title: "Alimentación", type: "EXPENSE", userId: null },
  { categoryId: "mock-cat-transport", title: "Transporte", type: "EXPENSE", userId: null },
  { categoryId: "mock-cat-home", title: "Vivienda", type: "EXPENSE", userId: null },
  { categoryId: "mock-cat-services", title: "Servicios", type: "EXPENSE", userId: null },
  { categoryId: "mock-cat-savings", title: "Ahorro", type: "EXPENSE", userId: null },
  { categoryId: "mock-cat-salary", title: "Salario", type: "INCOME", userId: null },
  { categoryId: "mock-cat-freelance", title: "Freelance", type: "INCOME", userId: null },
];

let mockBudgets: MockBudgetRecord[] = [
  { budgetId: "mock-budget-current", userId: "mock-user-1", totalAmount: 2500000, month: currentMonth, year: currentYear },
  { budgetId: "mock-budget-previous", userId: "mock-user-1", totalAmount: 1800000, month: previousMonth, year: previousYear },
];

let mockPockets: MockPocketRecord[] = [
  {
    pocketId: "mock-pocket-1",
    userId: "mock-user-1",
    budgetId: "mock-budget-current",
    title: "Mercado mensual",
    allocatedAmount: 450000,
    currentAmount: 320000,
    isSavings: false,
    categoryId: "mock-cat-food",
  },
  {
    pocketId: "mock-pocket-2",
    userId: "mock-user-1",
    budgetId: "mock-budget-current",
    title: "Transporte",
    allocatedAmount: 180000,
    currentAmount: 150000,
    isSavings: false,
    categoryId: "mock-cat-transport",
  },
  {
    pocketId: "mock-pocket-3",
    userId: "mock-user-1",
    budgetId: "mock-budget-previous",
    title: "Fondo viaje",
    allocatedAmount: 300000,
    currentAmount: 300000,
    isSavings: true,
    categoryId: "mock-cat-savings",
  },
];

let mockLoginLogs: MockLoginLogRecord[] = [];

const MOCK_TOKEN_PREFIX = "mock-token:";

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const toPublicUser = ({ password: _password, ...user }: MockUserRecord) => user;

const createMockToken = (userId: string) => `${MOCK_TOKEN_PREFIX}${userId}`;

const parseUserIdFromToken = (token?: string | null): string | null => {
  if (!token || !token.startsWith(MOCK_TOKEN_PREFIX)) {
    return null;
  }
  return token.slice(MOCK_TOKEN_PREFIX.length);
};

const findUserById = (id: string) => mockUsers.find((entry) => entry.id === id) ?? null;

const resolveSessionUser = (token?: string | null): MockUserRecord => {
  const tokenUserId = parseUserIdFromToken(token);
  if (tokenUserId) {
    const tokenUser = findUserById(tokenUserId);
    if (tokenUser) {
      setMockSessionUserId(tokenUser.id);
      return tokenUser;
    }
  }

  const storedUserId = getMockSessionUserId();
  if (storedUserId) {
    const storedUser = findUserById(storedUserId);
    if (storedUser) {
      return storedUser;
    }
  }

  throw new ApiError("No hay sesion activa", 401);
};

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const sortByPeriod = (items: MockBudgetRecord[]) => [...items].sort((a, b) => {
  if (a.year !== b.year) {
    return b.year - a.year;
  }
  if (a.month !== b.month) {
    return b.month - a.month;
  }
  return a.budgetId.localeCompare(b.budgetId);
});

const findCategoryById = (id: string) => mockCategories.find((category) => category.categoryId === id) ?? null;
const findBudgetById = (id: string) => mockBudgets.find((budget) => budget.budgetId === id) ?? null;
const findPocketById = (id: string) => mockPockets.find((pocket) => pocket.pocketId === id) ?? null;

const getUserCategories = (userId: string) => mockCategories.filter((category) => category.userId === null || category.userId === userId);
const getUserBudgets = (userId: string) => mockBudgets.filter((budget) => budget.userId === userId);
const getUserPockets = (userId: string) => mockPockets.filter((pocket) => pocket.userId === userId);

const sumAllocatedByBudgetId = (budgetId: string) => mockPockets
  .filter((pocket) => pocket.budgetId === budgetId)
  .reduce((sum, pocket) => sum + pocket.allocatedAmount, 0);

const toCategoryResponse = (category: MockCategoryRecord): CategoryResponse => ({
  categoryId: category.categoryId,
  title: category.title,
  type: category.type,
});

const toBudgetResponse = (budget: MockBudgetRecord) => {
  const allocatedAmount = sumAllocatedByBudgetId(budget.budgetId);

  return {
    budgetId: budget.budgetId,
    totalAmount: budget.totalAmount,
    allocatedAmount,
    remainingAmount: budget.totalAmount - allocatedAmount,
    month: budget.month,
    year: budget.year,
  };
};

const toPocketResponse = (pocket: MockPocketRecord) => ({
  pocketId: pocket.pocketId,
  title: pocket.title,
  allocatedAmount: pocket.allocatedAmount,
  currentAmount: pocket.currentAmount,
  isSavings: pocket.isSavings,
  categoryTitle: pocket.categoryId ? findCategoryById(pocket.categoryId)?.title ?? null : null,
  budgetId: pocket.budgetId,
});

const toLoginLogResponse = (log: MockLoginLogRecord): LoginLog => ({
  loginLogId: log.loginLogId,
  userId: log.userId,
  userName: log.userName,
  userEmail: log.userEmail,
  timestamp: log.timestamp,
});

const recordLoginLog = (user: MockUserRecord) => {
  const log: MockLoginLogRecord = {
    loginLogId: nextId("mock-login-log"),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    timestamp: new Date().toISOString(),
  };

  mockLoginLogs = [log, ...mockLoginLogs];
};

export const mockLoginRequest = async (email: string, password: string): Promise<unknown> => {
  await wait();

  const user = mockUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError("Correo electronico o contrasena incorrectos", 401);
  }

  setMockSessionUserId(user.id);
  recordLoginLog(user);

  return {
    message: "Inicio de sesion exitoso (mock)",
    token: createMockToken(user.id),
    user: toPublicUser(user),
  };
};

export const mockRegisterRequest = async (
  name: string,
  email: string,
  password: string,
): Promise<unknown> => {
  await wait();

  const alreadyExists = mockUsers.some(
    (entry) => entry.email.toLowerCase() === email.toLowerCase(),
  );
  if (alreadyExists) {
    throw new ApiError("El correo electronico ya esta registrado", 409);
  }

  const newUser: MockUserRecord = {
    id: nextId("mock-user"),
    name,
    email,
    password,
    role: "user",
  };

  mockUsers = [...mockUsers, newUser];
  setMockSessionUserId(newUser.id);
  recordLoginLog(newUser);

  return {
    message: "Registro exitoso (mock)",
    token: createMockToken(newUser.id),
    user: toPublicUser(newUser),
  };
};

export const mockForgotPasswordRequest = async (): Promise<unknown> => {
  await wait();
  return {
    message: "Solicitud de recuperacion recibida (mock).",
  };
};

export const mockLogoutRequest = async (): Promise<unknown> => {
  await wait();
  clearMockSessionUserId();
  return {
    message: "Sesion cerrada (mock)",
  };
};

export const mockGetCurrentUserRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);
  return {
    user: toPublicUser(user),
  };
};

export const mockGetLoginLogsRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const loginLogs = user.role === "admin"
    ? mockLoginLogs
    : mockLoginLogs.filter((entry) => entry.userId === user.id);

  return {
    loginLogs: [...loginLogs].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    ).map(toLoginLogResponse),
  };
};

export const mockGetTransactionsRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const transactions = user.role === "admin"
    ? mockTransactions
    : mockTransactions.filter((entry) => entry.userId === user.id);

  return {
    transactions: [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  };
};

export const mockGetCategoriesRequest = async (
  token?: string | null,
  type?: CategoryType,
): Promise<CategoryResponse[]> => {
  await wait();
  const user = resolveSessionUser(token);

  return getUserCategories(user.id)
    .filter((category) => !type || category.type === type)
    .map((category) => toCategoryResponse(category));
};

export const mockGetBudgetsRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  return {
    budgets: sortByPeriod(getUserBudgets(user.id)).map((budget) => toBudgetResponse(budget)),
  };
};

export const mockGetBudgetByMonthYearRequest = async (
  month: number,
  year: number,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const budget = getUserBudgets(user.id).find((entry) => entry.month === month && entry.year === year);
  if (!budget) {
    throw new ApiError("Presupuesto no encontrado", 404);
  }

  return { budget: toBudgetResponse(budget) };
};

export const mockCreateBudgetRequest = async (
  payload: CreateBudgetRequest,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const exists = getUserBudgets(user.id).some(
    (budget) => budget.month === payload.month && budget.year === payload.year,
  );

  if (exists) {
    throw new ApiError("Ya existe un presupuesto para ese mes y año", 409);
  }

  const created: MockBudgetRecord = {
    budgetId: nextId("mock-budget"),
    userId: user.id,
    totalAmount: payload.totalAmount,
    month: payload.month,
    year: payload.year,
  };

  mockBudgets = [...mockBudgets, created];

  return {
    message: "Presupuesto creado con éxito (mock)",
    budget: toBudgetResponse(created),
  };
};

export const mockUpdateBudgetRequest = async (
  id: string,
  payload: UpdateBudgetRequest,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const budget = findBudgetById(id);
  if (!budget || budget.userId !== user.id) {
    throw new ApiError("Presupuesto no encontrado", 404);
  }

  const allocated = sumAllocatedByBudgetId(id);
  if (payload.totalAmount < allocated) {
    throw new ApiError("El nuevo monto es menor al ya asignado a bolsillos", 400);
  }

  budget.totalAmount = payload.totalAmount;

  return {
    message: "Presupuesto actualizado con éxito (mock)",
    budget: toBudgetResponse(budget),
  };
};

export const mockGetPocketsRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  return {
    pockets: getUserPockets(user.id).map((pocket) => toPocketResponse(pocket)),
  };
};

export const mockGetPocketsByBudgetRequest = async (
  budgetId: string,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  return {
    pockets: getUserPockets(user.id)
      .filter((pocket) => pocket.budgetId === budgetId)
      .map((pocket) => toPocketResponse(pocket)),
  };
};

export const mockCreatePocketRequest = async (
  payload: CreatePocketRequest,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const budget = findBudgetById(payload.budgetId);
  if (!budget || budget.userId !== user.id) {
    throw new ApiError("Presupuesto no encontrado", 404);
  }

  const category = payload.categoryId ? findCategoryById(payload.categoryId) : null;
  if (payload.categoryId && !category) {
    throw new ApiError("Categoría no encontrada", 404);
  }

  const alreadyAllocated = sumAllocatedByBudgetId(payload.budgetId);
  const available = budget.totalAmount - alreadyAllocated;

  if (payload.allocatedAmount > available) {
    throw new ApiError(`Monto excede el presupuesto disponible. Disponible: ${available}`, 400);
  }

  const created: MockPocketRecord = {
    pocketId: nextId("mock-pocket"),
    userId: user.id,
    budgetId: payload.budgetId,
    title: payload.title,
    allocatedAmount: payload.allocatedAmount,
    currentAmount: payload.allocatedAmount,
    isSavings: payload.isSavings ?? false,
    categoryId: payload.categoryId ?? null,
  };

  mockPockets = [...mockPockets, created];

  return {
    message: "Pocket creado con éxito (mock)",
    pocket: toPocketResponse(created),
  };
};

export const mockDeletePocketRequest = async (
  id: string,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const pocket = findPocketById(id);
  if (!pocket || pocket.userId !== user.id) {
    throw new ApiError("Pocket no encontrado", 404);
  }

  mockPockets = mockPockets.filter((entry) => entry.pocketId !== id);

  return {
    message: "Pocket eliminado con éxito (mock)",
  };
};

export const mockAddTransactionRequest = async (
  payload: CreateTransactionPayload,
  token?: string | null,
): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  const created: MockTransactionRecord = {
    id: nextId("mock-tx"),
    userId: user.id,
    type: payload.type,
    amount: payload.amount,
    date: payload.date,
    description: payload.description,
    category: payload.category,
  };

  mockTransactions = [created, ...mockTransactions];

  return {
    message: "Transaccion registrada (mock)",
    transaction: created,
  };
};

export const mockGetUsersRequest = async (token?: string | null): Promise<unknown> => {
  await wait();
  const user = resolveSessionUser(token);

  if (user.role !== "admin") {
    throw new ApiError("No autorizado para consultar usuarios", 403);
  }

  return {
    users: mockUsers.map((entry) => toPublicUser(entry)),
  };
};

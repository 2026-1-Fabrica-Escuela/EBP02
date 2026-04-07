import { clearMockSessionUserId, getMockSessionUserId, setMockSessionUserId } from "./auth-storage";
import { ApiError } from "./errors";
import type { CreateTransactionPayload } from "./types";

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

export const mockLoginRequest = async (email: string, password: string): Promise<unknown> => {
  await wait();

  const user = mockUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError("Correo electronico o contrasena incorrectos", 401);
  }

  setMockSessionUserId(user.id);

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

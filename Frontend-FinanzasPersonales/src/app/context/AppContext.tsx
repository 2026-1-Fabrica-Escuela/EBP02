import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  addTransactionRequest,
  clearStoredAuthToken,
  extractMessage,
  forgotPasswordRequest,
  getCurrentUserRequest,
  getStoredAuthToken,
  getTransactionsRequest,
  getUsersRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  saveStoredAuthToken,
} from "../services/api";
import { toErrorMessage } from "./errors";
import {
  extractTokenFromPayload,
  extractTransactionFromPayload,
  extractUserFromPayload,
  normalizeTransactionsFromPayload,
  normalizeUsersFromPayload,
  sortTransactions,
} from "./normalizers";
import type {
  ActionResult,
  AppState,
  AuthActionResult,
  Transaction,
  User,
  CreateTransactionPayload,
} from "./types";

export type {
  ActionResult,
  AppState,
  AuthActionResult,
  Transaction,
  User,
} from "./types";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearLocalSession = useCallback(() => {
    clearStoredAuthToken();
    setUser(null);
    setUsers([]);
    setTransactions([]);
  }, []);

  const loadDataForUser = useCallback(async (activeUser: User) => {
    const token = getStoredAuthToken();

    const transactionsPayload = await getTransactionsRequest(token);
    setTransactions(normalizeTransactionsFromPayload(transactionsPayload, activeUser.id));

    if (activeUser.role === "admin") {
      try {
        const usersPayload = await getUsersRequest(token);
        setUsers(normalizeUsersFromPayload(usersPayload, activeUser));
      } catch {
        setUsers([activeUser]);
      }
      return;
    }

    setUsers([activeUser]);
  }, []);

  const applyAuthPayload = useCallback(async (payload: unknown, defaultMessage: string) => {
    const token = extractTokenFromPayload(payload);
    if (token) {
      saveStoredAuthToken(token);
    }

    const message = extractMessage(payload, defaultMessage);
    let activeUser = extractUserFromPayload(payload);

    if (!activeUser) {
      try {
        const mePayload = await getCurrentUserRequest(getStoredAuthToken());
        activeUser = extractUserFromPayload(mePayload);
      } catch {
        activeUser = null;
      }
    }

    if (activeUser) {
      setUser(activeUser);
      try {
        await loadDataForUser(activeUser);
      } catch {
        setTransactions([]);
        setUsers([activeUser]);
      }
    }

    return { user: activeUser, message };
  }, [loadDataForUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const payload = await loginRequest(email, password);
      const { user: activeUser, message } = await applyAuthPayload(payload, "Inicio de sesión exitoso");

      if (!activeUser) {
        return {
          success: false,
          message: "El backend no devolvió la información del usuario autenticado.",
        };
      }

      return { success: true, message, user: activeUser };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "Correo electrónico o contraseña incorrectos"),
      };
    }
  }, [applyAuthPayload]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthActionResult> => {
    try {
      const registerPayload = await registerRequest(name, email, password);
      let { user: activeUser, message } = await applyAuthPayload(registerPayload, "Registro exitoso");

      if (!activeUser) {
        try {
          const loginPayload = await loginRequest(email, password);
          const loginResult = await applyAuthPayload(loginPayload, message);
          activeUser = loginResult.user;
          message = loginResult.message;
        } catch {
          // The account may require manual activation; keep register response.
        }
      }

      if (!activeUser) {
        return {
          success: true,
          message: `${message}. Inicia sesión para continuar.`,
        };
      }

      return { success: true, message, user: activeUser };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible completar el registro"),
      };
    }
  }, [applyAuthPayload]);

  const requestPasswordReset = useCallback(async (email: string): Promise<ActionResult> => {
    try {
      const payload = await forgotPasswordRequest(email);
      return {
        success: true,
        message: extractMessage(
          payload,
          "Si el correo existe en el sistema, recibirás instrucciones para recuperar la contraseña.",
        ),
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No se pudo enviar la solicitud de recuperación de contraseña"),
      };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredAuthToken();
    try {
      await logoutRequest(token);
    } catch {
      // If logout endpoint fails, clear local session anyway.
    }
    clearLocalSession();
  }, [clearLocalSession]);

 // Cambia la definición de la función para usar el nuevo Payload
const addTransaction = useCallback(async (
  transactionData: CreateTransactionPayload, // <--- CAMBIO AQUÍ
): Promise<ActionResult> => {
  if (!user) {
    return {
      success: false,
      message: "Debes iniciar sesión para registrar transacciones",
    };
  }

  try {
    const token = getStoredAuthToken();
    // Ahora transactionData ya trae categoryId y status desde el formulario
    const payload = await addTransactionRequest(transactionData, token);

    const created = extractTransactionFromPayload(payload, user.id);
    if (created) {
      setTransactions((prev) => sortTransactions([created, ...prev]));
    } else {
      const transactionsPayload = await getTransactionsRequest(token);
      setTransactions(normalizeTransactionsFromPayload(transactionsPayload, user.id));
    }

    return {
      success: true,
      message: extractMessage(payload, "Transacción registrada con éxito"),
    };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "No fue posible registrar la transacción"),
    };
  }
}, [user]);

  const refreshData = useCallback(async () => {
    if (!user) {
      return;
    }
    await loadDataForUser(user);
  }, [loadDataForUser, user]);

  useEffect(() => {
    let active = true;

    // AppContext.tsx

const bootstrap = async () => {
  try {
    // 1. Intentamos obtener el token PRIMERO
    const token = getStoredAuthToken();

    // 2. Si NO hay token, ni siquiera llamamos al servidor
    if (!token) {
      setIsInitializing(false);
      return; // Salimos pacíficamente, el usuario verá el login
    }

    // 3. Solo si hay token, preguntamos al servidor quién es
    const payload = await getCurrentUserRequest(token);
    const activeUser = extractUserFromPayload(payload);

    if (!activeUser) {
      throw new Error("Token inválido o usuario no encontrado");
    }

    if (!active) return;

    setUser(activeUser);
    await loadDataForUser(activeUser);

  } catch (error) {
    // Si el token era viejo o hubo error, limpiamos sin ruido
    console.warn("Sesión no válida o expirada.");
    if (active) {
      clearLocalSession();
    }
  } finally {
    if (active) {
      setIsInitializing(false);
    }
  }
};

    bootstrap();

    return () => {
      active = false;
    };
  }, [clearLocalSession, loadDataForUser]);

  const contextValue = useMemo<AppState>(() => ({
    user,
    users,
    transactions,
    isInitializing,
    login,
    register,
    requestPasswordReset,
    logout,
    addTransaction,
    refreshData,
  }), [
    addTransaction,
    isInitializing,
    login,
    logout,
    refreshData,
    register,
    requestPasswordReset,
    transactions,
    user,
    users,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

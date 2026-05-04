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
  createBudgetRequest,
  createPocketRequest,
  forgotPasswordRequest,
  getBudgetsRequest,
  getLoginLogsRequest,
  getPocketsRequest,
  getCurrentUserRequest,
  getStoredAuthToken,
  getTransactionsRequest,
  getUsersRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  deletePocketRequest,
  updateBudgetRequest,
  saveStoredAuthToken,
} from "../services/api";
import { toErrorMessage } from "./errors";
import {
  extractBudgetFromPayload,
  extractPocketFromPayload,
  extractTokenFromPayload,
  extractTransactionFromPayload,
  extractUserFromPayload,
  normalizeBudgetsFromPayload,
  normalizeLoginLogsFromPayload,
  normalizePocketsFromPayload,
  normalizeTransactionsFromPayload,
  normalizeUsersFromPayload,
  sortBudgets,
  sortPockets,
  sortTransactions,
} from "./normalizers";
import type {
  ActionResult,
  AppState,
  AuthActionResult,
  BudgetActionResult,
  BudgetResponse,
  CreateBudgetRequest,
  CreatePocketRequest,
  LoginLog,
  PocketActionResult,
  PocketResponse,
  Transaction,
  UpdateBudgetRequest,
  User,
} from "./types";

export type {
  ActionResult,
  AppState,
  AuthActionResult,
  BudgetActionResult,
  Budget,
  BudgetResponse,
  CreateBudgetRequest,
  CreatePocketRequest,
  LoginLog,
  PocketActionResult,
  Pocket,
  PocketResponse,
  Transaction,
  UpdateBudgetRequest,
  User,
} from "./types";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [pockets, setPockets] = useState<PocketResponse[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearLocalSession = useCallback(() => {
    clearStoredAuthToken();
    setUser(null);
    setUsers([]);
    setLoginLogs([]);
    setTransactions([]);
    setBudgets([]);
    setPockets([]);
  }, []);

  const syncBudgetDataForUser = useCallback(async () => {
    const token = getStoredAuthToken();

    const [budgetsResult, pocketsResult] = await Promise.allSettled([
      getBudgetsRequest(token),
      getPocketsRequest(token),
    ]);

    if (budgetsResult.status === "fulfilled") {
      setBudgets(normalizeBudgetsFromPayload(budgetsResult.value));
    } else {
      setBudgets([]);
    }

    if (pocketsResult.status === "fulfilled") {
      setPockets(normalizePocketsFromPayload(pocketsResult.value));
    } else {
      setPockets([]);
    }

    return budgetsResult.status === "fulfilled" && pocketsResult.status === "fulfilled";
  }, []);

  const loadDataForUser = useCallback(async (activeUser: User) => {
    const token = getStoredAuthToken();

    const transactionsPayload = await getTransactionsRequest(token);
    setTransactions(normalizeTransactionsFromPayload(transactionsPayload, activeUser.id));

    await syncBudgetDataForUser();

    if (activeUser.role === "admin") {
      const [usersResult, loginLogsResult] = await Promise.allSettled([
        getUsersRequest(token),
        getLoginLogsRequest(token),
      ]);

      if (usersResult.status === "fulfilled") {
        setUsers(normalizeUsersFromPayload(usersResult.value, activeUser));
      } else {
        setUsers([activeUser]);
      }

      if (loginLogsResult.status === "fulfilled") {
        setLoginLogs(normalizeLoginLogsFromPayload(loginLogsResult.value));
      } else {
        setLoginLogs([]);
      }
      return;
    }

    setUsers([activeUser]);
    setLoginLogs([]);
  }, [syncBudgetDataForUser]);

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
        setLoginLogs([]);
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

  const addTransaction = useCallback(async (
    transactionData: Omit<Transaction, "id" | "userId">,
  ): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para registrar transacciones",
      };
    }

    try {
      const token = getStoredAuthToken();
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

  const suspendUser = useCallback(async (userId: string, reason: string): Promise<ActionResult> => {
    if (!user || user.role !== "admin") {
      return {
        success: false,
        message: "Debes iniciar sesión como administrador para suspender usuarios",
      };
    }

    const targetUser = users.find((entry) => entry.id === userId);
    if (!targetUser) {
      return {
        success: false,
        message: "No se encontró el usuario seleccionado",
      };
    }

    if (targetUser.role === "admin") {
      return {
        success: false,
        message: "No se puede suspender una cuenta de administrador",
      };
    }

    setUsers((prev) => prev.map((entry) => (
      entry.id === userId
        ? { ...entry, status: "suspendida", suspendReason: reason }
        : entry
    )));

    return {
      success: true,
      message: "El usuario ha sido suspendido con éxito",
    };
  }, [user, users]);

  const activateUser = useCallback(async (userId: string): Promise<ActionResult> => {
    if (!user || user.role !== "admin") {
      return {
        success: false,
        message: "Debes iniciar sesión como administrador para activar usuarios",
      };
    }

    const targetUser = users.find((entry) => entry.id === userId);
    if (!targetUser) {
      return {
        success: false,
        message: "No se encontró el usuario seleccionado",
      };
    }

    if (targetUser.status !== "suspendida") {
      return {
        success: false,
        message: "La cuenta no puede activarse porque no está suspendida",
      };
    }

    setUsers((prev) => prev.map((entry) => (
      entry.id === userId
        ? { ...entry, status: "activa", suspendReason: null }
        : entry
    )));

    return {
      success: true,
      message: "La cuenta ha sido reactivada con éxito",
    };
  }, [user, users]);

  const updateUserProfile = useCallback(async (
    userId: string,
    data: { name: string; email: string },
  ): Promise<ActionResult> => {
    if (!user || user.role !== "admin") {
      return {
        success: false,
        message: "Debes iniciar sesión como administrador para editar usuarios",
      };
    }

    const targetUser = users.find((entry) => entry.id === userId);
    if (!targetUser) {
      return {
        success: false,
        message: "No se encontró el usuario seleccionado",
      };
    }

    const normalizedName = data.name.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      return {
        success: false,
        message: "El nombre y el correo son obligatorios",
      };
    }

    setUsers((prev) => prev.map((entry) => (
      entry.id === userId
        ? { ...entry, name: normalizedName, email: normalizedEmail }
        : entry
    )));

    if (user.id === userId) {
      setUser((current) => (current ? { ...current, name: normalizedName, email: normalizedEmail } : current));
    }

    return {
      success: true,
      message: "El usuario ha sido actualizado con éxito",
    };
  }, [user, users]);

  const refreshBudgets = useCallback(async (): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para consultar los presupuestos",
      };
    }

    const ok = await syncBudgetDataForUser();

    return ok
      ? { success: true, message: "Presupuestos actualizados correctamente" }
      : { success: false, message: "No fue posible cargar los presupuestos y pockets" };
  }, [syncBudgetDataForUser, user]);

  const createBudget = useCallback(async (
    budgetData: CreateBudgetRequest,
  ): Promise<BudgetActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para crear presupuestos",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await createBudgetRequest(budgetData, token);
      const createdBudget = extractBudgetFromPayload(payload);

      if (createdBudget) {
        setBudgets((prev) => sortBudgets([
          ...prev.filter((budget) => budget.budgetId !== createdBudget.budgetId),
          createdBudget,
        ]));
      } else {
        await syncBudgetDataForUser();
      }

      return {
        success: true,
        message: extractMessage(payload, "Presupuesto creado con éxito"),
        budget: createdBudget ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible crear el presupuesto"),
      };
    }
  }, [syncBudgetDataForUser, user]);

  const updateBudget = useCallback(async (
    id: string,
    budgetData: UpdateBudgetRequest,
  ): Promise<BudgetActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para actualizar presupuestos",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await updateBudgetRequest(id, budgetData, token);
      const updatedBudget = extractBudgetFromPayload(payload);

      if (updatedBudget) {
        setBudgets((prev) => sortBudgets([
          ...prev.filter((budget) => budget.budgetId !== updatedBudget.budgetId),
          updatedBudget,
        ]));
      } else {
        await syncBudgetDataForUser();
      }

      return {
        success: true,
        message: extractMessage(payload, "Presupuesto actualizado con éxito"),
        budget: updatedBudget ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible actualizar el presupuesto"),
      };
    }
  }, [syncBudgetDataForUser, user]);

  const createPocket = useCallback(async (
    pocketData: CreatePocketRequest,
  ): Promise<PocketActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para crear pockets",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await createPocketRequest(pocketData, token);
      const createdPocket = extractPocketFromPayload(payload);

      if (createdPocket) {
        setPockets((prev) => sortPockets([
          ...prev.filter((pocket) => pocket.pocketId !== createdPocket.pocketId),
          createdPocket,
        ]));

        setBudgets((prev) => sortBudgets(prev.map((budget) => {
          if (budget.budgetId !== createdPocket.budgetId) {
            return budget;
          }

          const allocatedAmount = budget.allocatedAmount + createdPocket.allocatedAmount;
          return {
            ...budget,
            allocatedAmount,
            remainingAmount: Math.max(0, budget.totalAmount - allocatedAmount),
          };
        })));
      } else {
        await syncBudgetDataForUser();
      }

      return {
        success: true,
        message: extractMessage(payload, "Pocket creado con éxito"),
        pocket: createdPocket ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible crear el pocket"),
      };
    }
  }, [syncBudgetDataForUser, user]);

  const deletePocket = useCallback(async (id: string): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para eliminar pockets",
      };
    }

    const pocketToDelete = pockets.find((pocket) => pocket.pocketId === id);

    try {
      const token = getStoredAuthToken();
      const payload = await deletePocketRequest(id, token);

      if (pocketToDelete) {
        setPockets((prev) => sortPockets(prev.filter((pocket) => pocket.pocketId !== id)));

        setBudgets((prev) => sortBudgets(prev.map((budget) => {
          if (budget.budgetId !== pocketToDelete.budgetId) {
            return budget;
          }

          const allocatedAmount = Math.max(0, budget.allocatedAmount - pocketToDelete.allocatedAmount);
          return {
            ...budget,
            allocatedAmount,
            remainingAmount: Math.max(0, budget.totalAmount - allocatedAmount),
          };
        })));
      } else {
        await syncBudgetDataForUser();
      }

      return {
        success: true,
        message: extractMessage(payload, "Pocket eliminado con éxito"),
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible eliminar el pocket"),
      };
    }
  }, [pockets, syncBudgetDataForUser, user]);

  const refreshData = useCallback(async () => {
    if (!user) {
      return;
    }
    await loadDataForUser(user);
  }, [loadDataForUser, user]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const payload = await getCurrentUserRequest(getStoredAuthToken());
        const activeUser = extractUserFromPayload(payload);

        if (!activeUser) {
          throw new Error("No authenticated user");
        }

        if (!active) {
          return;
        }

        setUser(activeUser);

        try {
          await loadDataForUser(activeUser);
        } catch {
          setTransactions([]);
          setUsers([activeUser]);
        }
      } catch {
        if (!active) {
          return;
        }
        clearLocalSession();
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
    loginLogs,
    transactions,
    budgets,
    pockets,
    isInitializing,
    login,
    register,
    requestPasswordReset,
    logout,
    addTransaction,
    suspendUser,
    activateUser,
    updateUserProfile,
    refreshBudgets,
    createBudget,
    updateBudget,
    createPocket,
    deletePocket,
    refreshData,
  }), [
    addTransaction,
    budgets,
    createBudget,
    createPocket,
    deletePocket,
    activateUser,
    isInitializing,
    login,
    loginLogs,
    logout,
    refreshData,
    refreshBudgets,
    register,
    requestPasswordReset,
    suspendUser,
    transactions,
    updateUserProfile,
    updateBudget,
    pockets,
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

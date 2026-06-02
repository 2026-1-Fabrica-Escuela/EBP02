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
  deleteTransactionRequest,
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
  loginRequest,
  logoutRequest,
  registerRequest,
  deletePocketRequest,
  updateBudgetRequest,
  updateProfileRequest,
  updateTransactionRequest,
  saveStoredAuthToken,
  getCategoriesRequest,
  activateUserRequest,
  getAdminUsersRequest,
  suspendUserRequest,
  updateAdminUserRequest,
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
  Category,
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
  Category,
} from "./types";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [pockets, setPockets] = useState<PocketResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearLocalSession = useCallback(() => {
    clearStoredAuthToken();
    setUser(null);
    setUsers([]);
    setLoginLogs([]);
    setTransactions([]);
    setBudgets([]);
    setPockets([]);
    setCategories([]);
  }, []);

  const syncBudgetDataForUser = useCallback(async () => {
    const token = getStoredAuthToken();

    const [budgetsResult, pocketsResult, categoriesResult] = await Promise.allSettled([
      getBudgetsRequest(token),
      getPocketsRequest(token),
      getCategoriesRequest(token),
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

    if (categoriesResult.status === "fulfilled") {
      setCategories(categoriesResult.value);
    } else {
      setCategories([]);
    }

    return budgetsResult.status === "fulfilled" && pocketsResult.status === "fulfilled" && categoriesResult.status === "fulfilled";
  }, []);

  const loadDataForUser = useCallback(async (activeUser: User) => {
    const token = getStoredAuthToken();

    const transactionsPayload = await getTransactionsRequest(token);
    setTransactions(normalizeTransactionsFromPayload(transactionsPayload, activeUser.id));

    await syncBudgetDataForUser();

    if (activeUser.role === "admin") {
      const [usersResult, loginLogsResult] = await Promise.allSettled([
        getAdminUsersRequest(token),
        getLoginLogsRequest(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          new Date().toISOString().split("T")[0],
          token
        ),
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
      const createPayload: any = {
        ...transactionData,
        status: "COMPLETED",
      };
      
      const payload = await addTransactionRequest(createPayload, token);

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

  const updateTransaction = useCallback(async (
    id: string,
    data: { amount: number; date: string; description: string; categoryId: string },
  ): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para editar transacciones",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await updateTransactionRequest(id, data, token);
      const updated = extractTransactionFromPayload(payload, user.id);

      if (updated) {
        setTransactions((prev) => sortTransactions(
          prev.map((tx) => (tx.id === id ? updated : tx)),
        ));
      } else {
        const transactionsPayload = await getTransactionsRequest(token);
        setTransactions(normalizeTransactionsFromPayload(transactionsPayload, user.id));
      }

      return {
        success: true,
        message: extractMessage(payload, "Transacción actualizada con éxito"),
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible actualizar la transacción"),
      };
    }
  }, [user]);

  const updateProfile = useCallback(async (
    name: string,
    email: string,
  ): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para actualizar tu perfil",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await updateProfileRequest(name, email, token);
      const updatedUser = extractUserFromPayload(payload);

      if (updatedUser) {
        setUser(updatedUser);
      }

      return {
        success: true,
        message: extractMessage(payload, "Tu información ha sido actualizada con éxito"),
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible actualizar tu perfil"),
      };
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string): Promise<ActionResult> => {
    if (!user) {
      return {
        success: false,
        message: "Debes iniciar sesión para eliminar transacciones",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await deleteTransactionRequest(id, token);

      setTransactions((prev) => prev.filter((tx) => tx.id !== id));

      return {
        success: true,
        message: extractMessage(payload, "Transacción eliminada con éxito"),
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No fue posible eliminar la transacción"),
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

    try {
      console.log(`[AdminAction] Suspending user ${userId}`);
      const token = getStoredAuthToken();
      const payload = await suspendUserRequest(userId, reason, token);
      const updatedUser = extractUserFromPayload(payload);

      if (updatedUser) {
        setUsers((prev) => prev.map((entry) => (entry.id === userId ? updatedUser : entry)));
      } else {
        await loadDataForUser(user);
      }

      return {
        success: true,
        message: "El usuario ha sido suspendido con éxito",
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No se pudo suspender al usuario"),
      };
    }
  }, [user, loadDataForUser]);

  const activateUser = useCallback(async (userId: string): Promise<ActionResult> => {
    if (!user || user.role !== "admin") {
      return {
        success: false,
        message: "Debes iniciar sesión como administrador para activar usuarios",
      };
    }

    try {
      console.log(`[AdminAction] Activating user ${userId}`);
      const token = getStoredAuthToken();
      const payload = await activateUserRequest(userId, token);
      const updatedUser = extractUserFromPayload(payload);

      if (updatedUser) {
        setUsers((prev) => prev.map((entry) => (entry.id === userId ? updatedUser : entry)));
      } else {
        await loadDataForUser(user);
      }

      return {
        success: true,
        message: "La cuenta ha sido reactivada con éxito",
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No se pudo activar al usuario"),
      };
    }
  }, [user, loadDataForUser]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    if (!user || user.role !== "admin") return null;
    try {
      const token = getStoredAuthToken();
      const payload = await getAdminUserRequest(userId, token);
      return extractUserFromPayload(payload);
    } catch {
      return null;
    }
  }, [user]);

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

    const normalizedName = data.name.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      return {
        success: false,
        message: "El nombre y el correo son obligatorios",
      };
    }

    try {
      const token = getStoredAuthToken();
      const payload = await updateAdminUserRequest(userId, { name: normalizedName, email: normalizedEmail }, token);
      const updatedUser = extractUserFromPayload(payload);

      if (updatedUser) {
        setUsers((prev) => prev.map((entry) => (entry.id === userId ? updatedUser : entry)));
        if (user.id === userId) {
          setUser(updatedUser);
        }
      } else {
        await loadDataForUser(user);
      }

      return {
        success: true,
        message: "El usuario ha sido actualizado con éxito",
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, "No se pudo actualizar el perfil del usuario"),
      };
    }
  }, [user, loadDataForUser]);

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
    categories,
    isInitializing,
    login,
    register,
    requestPasswordReset,
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateProfile,
    suspendUser,
    activateUser,
    updateUserProfile,
    getUserById,
    refreshBudgets,
    createBudget,
    updateBudget,
    createPocket,
    deletePocket,
    refreshData,
  }), [
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateProfile,
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

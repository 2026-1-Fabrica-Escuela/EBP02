export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status?: "activa" | "suspendida";
  suspendReason?: string | null;
}

export interface Transaction {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  date: string;
  description: string;
  category: string;
  categoryId?: string;
  userId: string;
}

export interface Category {
  categoryId: string;
  title: string;
  type: "INCOME" | "EXPENSE";
}

export interface Budget {
  budgetId: string;
  totalAmount: number;
  month: number;
  year: number;
}

export interface BudgetResponse {
  budgetId: string;
  totalAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  month: number;
  year: number;
}

export interface Pocket {
  pocketId: string;
  title: string;
  allocatedAmount: number;
  currentAmount: number;
  isSavings: boolean;
  budgetId: string;
  categoryId?: string | null;
}

export interface PocketResponse {
  pocketId: string;
  title: string;
  allocatedAmount: number;
  currentAmount: number;
  isSavings: boolean;
  categoryTitle?: string | null;
  budgetId: string;
}

export interface LoginLog {
  loginLogId: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface AuthActionResult extends ActionResult {
  user?: User;
}

export interface BudgetActionResult extends ActionResult {
  budget?: BudgetResponse;
}

export interface PocketActionResult extends ActionResult {
  pocket?: PocketResponse;
}

export interface CreateBudgetRequest {
  month: number;
  year: number;
  totalAmount: number;
}

export interface UpdateBudgetRequest {
  totalAmount: number;
}

export interface CreatePocketRequest {
  budgetId: string;
  title: string;
  categoryId: string | null;
  allocatedAmount: number;
  isSavings: boolean;
}

export interface AppState {
  user: User | null;
  users: User[];
  loginLogs: LoginLog[];
  transactions: Transaction[];
  budgets: BudgetResponse[];
  pockets: PocketResponse[];
  categories: Category[];
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "userId">) => Promise<ActionResult>;
  suspendUser: (userId: string, reason: string) => Promise<ActionResult>;
  activateUser: (userId: string) => Promise<ActionResult>;
  updateUserProfile: (userId: string, data: { name: string; email: string }) => Promise<ActionResult>;
  refreshBudgets: () => Promise<ActionResult>;
  createBudget: (data: CreateBudgetRequest) => Promise<BudgetActionResult>;
  updateBudget: (id: string, data: UpdateBudgetRequest) => Promise<BudgetActionResult>;
  createPocket: (data: CreatePocketRequest) => Promise<PocketActionResult>;
  deletePocket: (id: string) => Promise<ActionResult>;
  refreshData: () => Promise<void>;
}


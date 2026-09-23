export type UserRole = 'owner' | 'adult' | 'member' | 'viewer';

export type PrivacyLevel = 'private' | 'shared_summary' | 'house';

export type ExpenseScope = 'personal' | 'house' | 'selected';

export type SplitMethod = 
  | 'proportional_income' 
  | 'equal' 
  | 'custom_percentage' 
  | 'custom_amount' 
  | 'selected_members';

export type BudgetGroup = 'needs' | 'wants' | 'savings'; // 50 / 30 / 20

export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'cash' 
  | 'boleto' 
  | 'auto_debit' 
  | 'transfer' 
  | 'other';

export type TransactionType = 'expense' | 'income' | 'transfer';

export type BillStatus = 'projected' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
}

export interface Household {
  id: string;
  name: string;
  createdById: string;
  createdAt: string;
  defaultSplitMethod: SplitMethod;
  budgetMethod: '50/30/20' | 'custom';
  budgetPercentages: {
    needs: number;    // default 50
    wants: number;    // default 30
    savings: number;  // default 20
  };
  emergencyFundMonthsTarget: number; // default 6
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  displayName: string;
  role: UserRole;
  netIncome: number; // in cents
  color: string;
  avatar: string;
  joinedAt: string;
  permissions: {
    canInvite: boolean;
    canEditRules: boolean;
    canAddSharedIncome: boolean;
    canEditExpenses: boolean;
    canDeleteExpenses: boolean;
    canCloseMonth: boolean;
    canViewOtherIncomes: boolean;
    canViewAssets: boolean;
    canViewPrivateDetails: boolean;
  };
}

export interface HouseholdIncomeSnapshot {
  id: string;
  householdId: string;
  yearMonth: string; // "YYYY-MM"
  memberId: string;
  netIncome: number; // in cents
  sharePercentage: number; // e.g. 60.00
  createdAt: string;
}

export interface Account {
  id: string;
  householdId?: string; // null if strictly personal
  ownerMemberId: string;
  name: string;
  institution: string;
  type: 'checking' | 'savings' | 'investment' | 'cash';
  balance: number; // in cents
  isShared: boolean;
}

export interface CreditCard {
  id: string;
  ownerMemberId: string;
  name: string;
  institution: string;
  creditLimit: number; // in cents
  closingDay: number;  // e.g. 15
  dueDay: number;      // e.g. 25
  availableLimit: number; // in cents
  colorGradient: string;
}

export interface InstallmentPlan {
  id: string;
  transactionId: string;
  totalAmount: number; // in cents
  installmentCount: number;
  installmentAmount: number; // in cents
  currentInstallment: number;
  startYearMonth: string;
}

export interface Category {
  id: string;
  name: string;
  budgetGroup: BudgetGroup;
  icon: string;
  color: string;
  defaultSplitMethod?: SplitMethod;
  defaultScope?: ExpenseScope;
  isSystem: boolean;
}

export interface TransactionSplit {
  id: string;
  transactionId: string;
  memberId: string;
  amount: number; // in cents
  percentage: number; // e.g. 60.00
  isSettled: boolean;
}

export interface Transaction {
  id: string;
  householdId: string;
  type: TransactionType;
  amount: number; // in cents
  description: string;
  establishment?: string;
  categoryId: string;
  date: string; // ISO date YYYY-MM-DD
  dueDate?: string;
  paidAt?: string;
  paidByMemberId: string;
  scope: ExpenseScope;
  privacy: PrivacyLevel;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  accountId?: string;
  splitMethod: SplitMethod;
  splits: TransactionSplit[];
  installmentTotal?: number;
  installmentNumber?: number;
  installmentPlanId?: string;
  receiptId?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  householdId: string;
  description: string;
  beneficiary: string;
  amount: number; // in cents
  dueDate: string;
  categoryId: string;
  status: BillStatus;
  barcode?: string;
  digitableLine?: string;
  isRecurring: boolean;
  assignedToMemberId?: string; // person in charge of executing payment
  scope: ExpenseScope;
  splitMethod: SplitMethod;
}

export interface RecurringRule {
  id: string;
  householdId: string;
  description: string;
  amount: number; // in cents
  categoryId: string;
  type: 'expense' | 'income';
  scope: ExpenseScope;
  splitMethod: SplitMethod;
  dayOfMonth: number;
  paidByMemberId: string;
  active: boolean;
}

export interface FinancialGoal {
  id: string;
  householdId: string;
  title: string;
  category: 'emergency_fund' | 'travel' | 'vehicle' | 'real_estate' | 'renovation' | 'debt_payoff' | 'education' | 'custom';
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  targetDate: string; // YYYY-MM-DD
  monthlyContributionTarget: number; // in cents
  isShared: boolean;
  memberShares?: { memberId: string; percentage: number }[];
}

export interface DebtSettlementItem {
  fromMemberId: string;
  toMemberId: string;
  amount: number; // in cents
  suggestedPixKey?: string;
  reason: string;
}

export interface HouseholdSettlementSummary {
  period: string; // e.g. "2026-09"
  totalSharedExpenses: number; // in cents
  memberBalances: {
    memberId: string;
    paidAmount: number;     // how much member physically disbursed
    owedAmount: number;     // member's theoretical share of expenses
    netBalance: number;     // paidAmount - owedAmount (+ means receive, - means pay)
  }[];
  transfersToSettle: DebtSettlementItem[];
}

export interface SmartAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  message: string;
  categoryGroup?: BudgetGroup;
  actionLabel?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  householdId: string;
  memberId: string;
  action: 'create' | 'update' | 'delete' | 'close_month' | 'settle_debt';
  entityType: 'transaction' | 'bill' | 'budget' | 'snapshot' | 'rule';
  entityId: string;
  previousValue?: string;
  newValue?: string;
  description: string;
  timestamp: string;
}

export interface ReceiptItem {
  id: string;
  code?: string;
  rawDescription: string;
  normalizedDescription: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalPriceCents: number;
  budgetGroup: BudgetGroup;
  categoryId: string;
  confidence: number;
}

export interface Receipt {
  id: string;
  householdId: string;
  transactionId?: string;
  emitterName: string;
  emitterCnpj?: string;
  accessKey?: string;
  qrCodeUrl?: string;
  issuedAt: string;
  totalAmountCents: number;
  items: ReceiptItem[];
  status: 'draft' | 'processed' | 'imported';
  rawText?: string;
  createdAt: string;
}

export interface HouseholdInvite {
  code: string; // e.g. "FINCAS-8KJF2A"
  householdId: string;
  householdName: string;
  createdByMemberId: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  status: 'active' | 'used' | 'expired';
}

export interface AppState {
  currentUser: User;
  households: Household[];
  household: Household; // Active household
  members: HouseholdMember[];
  currentMemberId: string;
  activePerspective: 'house' | 'personal';
  snapshots: HouseholdIncomeSnapshot[];
  accounts: Account[];
  creditCards: CreditCard[];
  bills: Bill[];
  transactions: Transaction[];
  categories: Category[];
  goals: FinancialGoal[];
  alerts: SmartAlert[];
  auditLogs: AuditLog[];
  receipts: Receipt[];
  invites: HouseholdInvite[];
}


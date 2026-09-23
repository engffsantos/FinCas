import {
  Household,
  HouseholdMember,
  HouseholdIncomeSnapshot,
  Account,
  CreditCard,
  Bill,
  Transaction,
  Category,
  FinancialGoal,
  AuditLog,
  SmartAlert,
  AppState,
  User,
  Receipt,
  HouseholdInvite,
} from '../types';
import { toCents } from '../domain/money';

export type { AppState };

const STORAGE_KEY = 'fincas_state_v1';


export const initialCategories: Category[] = [
  { id: 'cat_housing', name: 'Aluguel & Condomínio', budgetGroup: 'needs', icon: 'Home', color: '#3b82f6', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'proportional_income' },
  { id: 'cat_supermarket', name: 'Supermercado Essencial', budgetGroup: 'needs', icon: 'ShoppingCart', color: '#10b981', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'proportional_income' },
  { id: 'cat_utilities', name: 'Energia, Água & Gás', budgetGroup: 'needs', icon: 'Zap', color: '#f59e0b', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'proportional_income' },
  { id: 'cat_internet', name: 'Internet & Celular', budgetGroup: 'needs', icon: 'Wifi', color: '#06b6d4', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'equal' },
  { id: 'cat_transport', name: 'Transporte & Gasolina', budgetGroup: 'needs', icon: 'Car', color: '#64748b', isSystem: true, defaultScope: 'personal' },
  { id: 'cat_health', name: 'Saúde & Farmácia', budgetGroup: 'needs', icon: 'HeartPulse', color: '#ec4899', isSystem: true, defaultScope: 'personal' },
  
  { id: 'cat_restaurant', name: 'Restaurantes & Delivery', budgetGroup: 'wants', icon: 'Utensils', color: '#f43f5e', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'equal' },
  { id: 'cat_entertainment', name: 'Lazer & Passeios', budgetGroup: 'wants', icon: 'Film', color: '#8b5cf6', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'equal' },
  { id: 'cat_streaming', name: 'Streaming & Assinaturas', budgetGroup: 'wants', icon: 'Tv', color: '#a855f7', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'equal' },
  { id: 'cat_shopping', name: 'Compras & Hobbies', budgetGroup: 'wants', icon: 'ShoppingBag', color: '#d946ef', isSystem: true, defaultScope: 'personal' },

  { id: 'cat_emergency', name: 'Reserva de Emergência', budgetGroup: 'savings', icon: 'ShieldCheck', color: '#10b981', isSystem: true, defaultScope: 'house', defaultSplitMethod: 'proportional_income' },
  { id: 'cat_investments', name: 'Investimentos & Futuro', budgetGroup: 'savings', icon: 'TrendingUp', color: '#059669', isSystem: true, defaultScope: 'personal' },
  { id: 'cat_debt_amort', name: 'Amortização de Dívidas', budgetGroup: 'savings', icon: 'Banknote', color: '#0284c7', isSystem: true, defaultScope: 'house' },
];

export const initialMembers: HouseholdMember[] = [
  {
    id: 'mem_carlos',
    householdId: 'house_1',
    userId: 'usr_carlos',
    displayName: 'Carlos Eduardo',
    role: 'owner',
    netIncome: toCents(6500), // R$ 6.500,00
    color: '#10b981', // emerald
    avatar: 'CE',
    joinedAt: '2026-01-10',
    permissions: {
      canInvite: true,
      canEditRules: true,
      canAddSharedIncome: true,
      canEditExpenses: true,
      canDeleteExpenses: true,
      canCloseMonth: true,
      canViewOtherIncomes: true,
      canViewAssets: true,
      canViewPrivateDetails: true,
    },
  },
  {
    id: 'mem_mariana',
    householdId: 'house_1',
    userId: 'usr_mariana',
    displayName: 'Mariana Souza',
    role: 'adult',
    netIncome: toCents(4500), // R$ 4.500,00
    color: '#8b5cf6', // violet
    avatar: 'MS',
    joinedAt: '2026-01-10',
    permissions: {
      canInvite: true,
      canEditRules: true,
      canAddSharedIncome: true,
      canEditExpenses: true,
      canDeleteExpenses: true,
      canCloseMonth: true,
      canViewOtherIncomes: true,
      canViewAssets: true,
      canViewPrivateDetails: false,
    },
  },
  {
    id: 'mem_bruno',
    householdId: 'house_1',
    userId: 'usr_bruno',
    displayName: 'Bruno Lima',
    role: 'member',
    netIncome: toCents(3000), // R$ 3.000,00
    color: '#06b6d4', // cyan
    avatar: 'BL',
    joinedAt: '2026-02-01',
    permissions: {
      canInvite: false,
      canEditRules: false,
      canAddSharedIncome: false,
      canEditExpenses: true,
      canDeleteExpenses: false,
      canCloseMonth: false,
      canViewOtherIncomes: true,
      canViewAssets: false,
      canViewPrivateDetails: false,
    },
  },
];

export const initialUser: User = {
  id: 'usr_carlos',
  name: 'João Carlos Silva',
  email: 'engffsantos@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  pixKey: 'engffsantos@gmail.com',
  pixKeyType: 'email',
};

export const initialHouseholds: Household[] = [
  {
    id: 'house_1',
    name: 'Casa Família Silva',
    createdById: 'mem_carlos',
    createdAt: '2026-01-10',
    defaultSplitMethod: 'proportional_income',
    budgetMethod: '50/30/20',
    budgetPercentages: {
      needs: 50,
      wants: 30,
      savings: 20,
    },
    emergencyFundMonthsTarget: 6,
  },
  {
    id: 'house_republica',
    name: 'República SP',
    createdById: 'mem_bruno',
    createdAt: '2026-02-15',
    defaultSplitMethod: 'equal',
    budgetMethod: '50/30/20',
    budgetPercentages: {
      needs: 60,
      wants: 25,
      savings: 15,
    },
    emergencyFundMonthsTarget: 3,
  },
  {
    id: 'house_praia',
    name: 'Casa de Praia Ubatuba',
    createdById: 'mem_carlos',
    createdAt: '2026-04-01',
    defaultSplitMethod: 'equal',
    budgetMethod: '50/30/20',
    budgetPercentages: {
      needs: 50,
      wants: 30,
      savings: 20,
    },
    emergencyFundMonthsTarget: 6,
  },
];

export const initialHousehold: Household = initialHouseholds[0];

export const initialSnapshots: HouseholdIncomeSnapshot[] = [
  {
    id: 'snap_202609_carlos',
    householdId: 'house_1',
    yearMonth: '2026-09',
    memberId: 'mem_carlos',
    netIncome: toCents(6500),
    sharePercentage: 46.43,
    createdAt: '2026-09-01',
  },
  {
    id: 'snap_202609_mariana',
    householdId: 'house_1',
    yearMonth: '2026-09',
    memberId: 'mem_mariana',
    netIncome: toCents(4500),
    sharePercentage: 32.14,
    createdAt: '2026-09-01',
  },
  {
    id: 'snap_202609_bruno',
    householdId: 'house_1',
    yearMonth: '2026-09',
    memberId: 'mem_bruno',
    netIncome: toCents(3000),
    sharePercentage: 21.43,
    createdAt: '2026-09-01',
  },
];

export const initialAccounts: Account[] = [
  { id: 'acc_nubank_carlos', ownerMemberId: 'mem_carlos', name: 'Nubank Conta Principal', institution: 'Nubank', type: 'checking', balance: toCents(4250.80), isShared: false },
  { id: 'acc_itau_mariana', ownerMemberId: 'mem_mariana', name: 'Itaú Uniclass', institution: 'Itaú', type: 'checking', balance: toCents(3120.40), isShared: false },
  { id: 'acc_inter_bruno', ownerMemberId: 'mem_bruno', name: 'Inter Digital', institution: 'Banco Inter', type: 'checking', balance: toCents(1480.00), isShared: false },
  { id: 'acc_caixa_casa', householdId: 'house_1', ownerMemberId: 'mem_carlos', name: 'Fundo Comum da Casa', institution: 'Conta Compartilhada', type: 'cash', balance: toCents(2300.00), isShared: true },
];

export const initialCreditCards: CreditCard[] = [
  { id: 'card_nubank_carlos', ownerMemberId: 'mem_carlos', name: 'Nubank Ultravioleta', institution: 'Nubank', creditLimit: toCents(18000), closingDay: 15, dueDay: 22, availableLimit: toCents(14850), colorGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  { id: 'card_xp_mariana', ownerMemberId: 'mem_mariana', name: 'XP Visa Infinite', institution: 'XP Investimentos', creditLimit: toCents(20000), closingDay: 10, dueDay: 18, availableLimit: toCents(16400), colorGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { id: 'card_inter_bruno', ownerMemberId: 'mem_bruno', name: 'Inter Gold', institution: 'Banco Inter', creditLimit: toCents(5000), closingDay: 5, dueDay: 12, availableLimit: toCents(3800), colorGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
];

export const initialBills: Bill[] = [
  {
    id: 'bill_aluguel',
    householdId: 'house_1',
    description: 'Aluguel do Apartamento 142',
    beneficiary: 'Imobiliária Vila Nova',
    amount: toCents(3400),
    dueDate: '2026-09-10',
    categoryId: 'cat_housing',
    status: 'paid',
    barcode: '341917900101043510047910201500088910000340000',
    digitableLine: '34191.79001 01043.510047 91020.150008 8 8910000340000',
    isRecurring: true,
    assignedToMemberId: 'mem_carlos',
    scope: 'house',
    splitMethod: 'proportional_income',
  },
  {
    id: 'bill_condominio',
    householdId: 'house_1',
    description: 'Taxa Condominial Ref. 09/2026',
    beneficiary: 'Condomínio Residencial Aurora',
    amount: toCents(820),
    dueDate: '2026-09-15',
    categoryId: 'cat_housing',
    status: 'paid',
    barcode: '237933812860083013528560000633077910000082000',
    digitableLine: '23793.38128 60083.013528 56000.063307 7 7910000082000',
    isRecurring: true,
    assignedToMemberId: 'mem_mariana',
    scope: 'house',
    splitMethod: 'proportional_income',
  },
  {
    id: 'bill_enel',
    householdId: 'house_1',
    description: 'Conta de Energia Elétrica',
    beneficiary: 'Enel Distribuição',
    amount: toCents(312.45),
    dueDate: '2026-09-22',
    categoryId: 'cat_utilities',
    status: 'pending',
    barcode: '8366000000311245013800049581002340578190',
    digitableLine: '83660000003-1 12450138000-4 95810023405-7 81900000000-0',
    isRecurring: true,
    assignedToMemberId: 'mem_carlos',
    scope: 'house',
    splitMethod: 'proportional_income',
  },
  {
    id: 'bill_internet',
    householdId: 'house_1',
    description: 'Internet Fibra 600MB',
    beneficiary: 'Vivo Fibra',
    amount: toCents(169.90),
    dueDate: '2026-09-25',
    categoryId: 'cat_internet',
    status: 'pending',
    barcode: '8460000000166990013800049581002340578190',
    digitableLine: '84600000001-6 69900138000-4 95810023405-7 81900000000-0',
    isRecurring: true,
    assignedToMemberId: 'mem_mariana',
    scope: 'house',
    splitMethod: 'equal',
  },
];

export const initialTransactions: Transaction[] = [
  // 1. Aluguel pago por Carlos
  {
    id: 'tx_aluguel_set',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(3400),
    description: 'Aluguel do Mês de Setembro',
    establishment: 'Imobiliária Vila Nova',
    categoryId: 'cat_housing',
    date: '2026-09-10',
    paidByMemberId: 'mem_carlos',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'pix',
    splitMethod: 'proportional_income',
    splits: [
      { id: 'sp_1', transactionId: 'tx_aluguel_set', memberId: 'mem_carlos', amount: toCents(1578.62), percentage: 46.43, isSettled: false },
      { id: 'sp_2', transactionId: 'tx_aluguel_set', memberId: 'mem_mariana', amount: toCents(1092.76), percentage: 32.14, isSettled: false },
      { id: 'sp_3', transactionId: 'tx_aluguel_set', memberId: 'mem_bruno', amount: toCents(728.62), percentage: 21.43, isSettled: false },
    ],
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
  // 2. Condomínio pago por Mariana
  {
    id: 'tx_condo_set',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(820),
    description: 'Condomínio Residencial Aurora',
    establishment: 'Administradora Aurora',
    categoryId: 'cat_housing',
    date: '2026-09-15',
    paidByMemberId: 'mem_mariana',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'boleto',
    splitMethod: 'proportional_income',
    splits: [
      { id: 'sp_4', transactionId: 'tx_condo_set', memberId: 'mem_carlos', amount: toCents(380.73), percentage: 46.43, isSettled: false },
      { id: 'sp_5', transactionId: 'tx_condo_set', memberId: 'mem_mariana', amount: toCents(263.55), percentage: 32.14, isSettled: false },
      { id: 'sp_6', transactionId: 'tx_condo_set', memberId: 'mem_bruno', amount: toCents(175.72), percentage: 21.43, isSettled: false },
    ],
    createdAt: '2026-09-15T14:30:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
  },
  // 3. Supermercado Mensal pago por Carlos
  {
    id: 'tx_mercado_1',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(1240.50),
    description: 'Compras do mês - Alimentos & Limpeza',
    establishment: 'Pão de Açúcar Morumbi',
    categoryId: 'cat_supermarket',
    date: '2026-09-08',
    paidByMemberId: 'mem_carlos',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'credit_card',
    creditCardId: 'card_nubank_carlos',
    splitMethod: 'proportional_income',
    splits: [
      { id: 'sp_7', transactionId: 'tx_mercado_1', memberId: 'mem_carlos', amount: toCents(575.96), percentage: 46.43, isSettled: false },
      { id: 'sp_8', transactionId: 'tx_mercado_1', memberId: 'mem_mariana', amount: toCents(398.70), percentage: 32.14, isSettled: false },
      { id: 'sp_9', transactionId: 'tx_mercado_1', memberId: 'mem_bruno', amount: toCents(265.84), percentage: 21.43, isSettled: false },
    ],
    createdAt: '2026-09-08T18:20:00Z',
    updatedAt: '2026-09-08T18:20:00Z',
  },
  // 4. Pizza de Sexta paga por Bruno (Dividido igual)
  {
    id: 'tx_pizza_bruno',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(165.00),
    description: 'Pizza Artesanal & Refrigerante',
    establishment: 'Pizzaria Napolitana',
    categoryId: 'cat_restaurant',
    date: '2026-09-12',
    paidByMemberId: 'mem_bruno',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'pix',
    splitMethod: 'equal',
    splits: [
      { id: 'sp_10', transactionId: 'tx_pizza_bruno', memberId: 'mem_carlos', amount: toCents(55.00), percentage: 33.33, isSettled: false },
      { id: 'sp_11', transactionId: 'tx_pizza_bruno', memberId: 'mem_mariana', amount: toCents(55.00), percentage: 33.33, isSettled: false },
      { id: 'sp_12', transactionId: 'tx_pizza_bruno', memberId: 'mem_bruno', amount: toCents(55.00), percentage: 33.34, isSettled: false },
    ],
    createdAt: '2026-09-12T21:10:00Z',
    updatedAt: '2026-09-12T21:10:00Z',
  },
  // 5. Gasto Pessoal de Carlos (Privado)
  {
    id: 'tx_pessoal_carlos',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(180.00),
    description: 'Curso Online de TypeScript & Node',
    establishment: 'Plataforma EduTech',
    categoryId: 'cat_shopping',
    date: '2026-09-14',
    paidByMemberId: 'mem_carlos',
    scope: 'personal',
    privacy: 'private',
    paymentMethod: 'credit_card',
    creditCardId: 'card_nubank_carlos',
    splitMethod: 'selected_members',
    splits: [
      { id: 'sp_13', transactionId: 'tx_pessoal_carlos', memberId: 'mem_carlos', amount: toCents(180.00), percentage: 100, isSettled: true },
    ],
    createdAt: '2026-09-14T09:15:00Z',
    updatedAt: '2026-09-14T09:15:00Z',
  },
  // 6. Gasto Pessoal de Mariana (Compartilhado Resumido)
  {
    id: 'tx_pessoal_mariana',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(240.00),
    description: 'Gasto pessoal confidencial',
    establishment: 'Loja de Cosméticos',
    categoryId: 'cat_shopping',
    date: '2026-09-13',
    paidByMemberId: 'mem_mariana',
    scope: 'personal',
    privacy: 'shared_summary',
    paymentMethod: 'debit_card',
    splitMethod: 'selected_members',
    splits: [
      { id: 'sp_14', transactionId: 'tx_pessoal_mariana', memberId: 'mem_mariana', amount: toCents(240.00), percentage: 100, isSettled: true },
    ],
    createdAt: '2026-09-13T16:00:00Z',
    updatedAt: '2026-09-13T16:00:00Z',
  },
  // 7. Compra Parcelada Compartilhada: Geladeira Frost Free (10x R$ 320,00) paga no cartão de Mariana
  {
    id: 'tx_geladeira_parc1',
    householdId: 'house_1',
    type: 'expense',
    amount: toCents(320.00),
    description: 'Geladeira Frost Free Inox (Parcela 1/10)',
    establishment: 'Fast Shop',
    categoryId: 'cat_housing',
    date: '2026-09-02',
    dueDate: '2026-09-18',
    paidByMemberId: 'mem_mariana',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'credit_card',
    creditCardId: 'card_xp_mariana',
    splitMethod: 'proportional_income',
    installmentTotal: 10,
    installmentNumber: 1,
    splits: [
      { id: 'sp_15', transactionId: 'tx_geladeira_parc1', memberId: 'mem_carlos', amount: toCents(148.58), percentage: 46.43, isSettled: false },
      { id: 'sp_16', transactionId: 'tx_geladeira_parc1', memberId: 'mem_mariana', amount: toCents(102.85), percentage: 32.14, isSettled: false },
      { id: 'sp_17', transactionId: 'tx_geladeira_parc1', memberId: 'mem_bruno', amount: toCents(68.57), percentage: 21.43, isSettled: false },
    ],
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
  },
  // 8. Receita Compartilhada: Reembolso de Seguro Residencial
  {
    id: 'tx_reembolso_seguro',
    householdId: 'house_1',
    type: 'income',
    amount: toCents(450.00),
    description: 'Reembolso Parcial do Seguro da Casa',
    categoryId: 'cat_housing',
    date: '2026-09-05',
    paidByMemberId: 'mem_carlos',
    scope: 'house',
    privacy: 'house',
    paymentMethod: 'pix',
    splitMethod: 'proportional_income',
    splits: [],
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
  },
];

export const initialGoals: FinancialGoal[] = [
  {
    id: 'goal_reserva',
    householdId: 'house_1',
    title: 'Reserva de Emergência da Casa (6 meses essenciais)',
    category: 'emergency_fund',
    targetAmount: toCents(30000), // R$ 30.000,00
    currentAmount: toCents(18500), // R$ 18.500,00
    targetDate: '2027-06-30',
    monthlyContributionTarget: toCents(1200),
    isShared: true,
  },
  {
    id: 'goal_viagem',
    householdId: 'house_1',
    title: 'Viagem de Ano Novo em Florianópolis',
    category: 'travel',
    targetAmount: toCents(7500),
    currentAmount: toCents(5100),
    targetDate: '2026-12-20',
    monthlyContributionTarget: toCents(800),
    isShared: true,
  },
  {
    id: 'goal_carro_carlos',
    householdId: 'house_1',
    title: 'Troca de Carro (Carlos)',
    category: 'vehicle',
    targetAmount: toCents(25000),
    currentAmount: toCents(14000),
    targetDate: '2027-12-31',
    monthlyContributionTarget: toCents(700),
    isShared: false,
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    householdId: 'house_1',
    memberId: 'mem_carlos',
    action: 'create',
    entityType: 'transaction',
    entityId: 'tx_aluguel_set',
    description: 'Registrou Aluguel R$ 3.400,00 com divisão proporcional à renda',
    timestamp: '2026-09-10T10:00:00Z',
  },
  {
    id: 'log_2',
    householdId: 'house_1',
    memberId: 'mem_mariana',
    action: 'create',
    entityType: 'transaction',
    entityId: 'tx_condo_set',
    description: 'Registrou Condomínio R$ 820,00 pago via boleto',
    timestamp: '2026-09-15T14:30:00Z',
  },
];

export const initialAlerts: SmartAlert[] = [
  {
    id: 'al_1',
    type: 'warning',
    title: 'Atenção ao Ritmo em Restaurantes',
    message: 'O grupo Estilo de Vida está consumindo 27% da renda mensal (meta: 30%). O pacing diário recomendado é de até R$ 85,00/dia.',
    categoryGroup: 'wants',
    actionLabel: 'Ver Pacing',
    timestamp: '2026-09-16T18:00:00Z',
  },
  {
    id: 'al_2',
    type: 'info',
    title: 'Boleto Próximo do Vencimento',
    message: 'Conta de Luz Enel (R$ 245,80) vence em 28/09. Carlos é o responsável cadastrado.',
    actionLabel: 'Pagar com Pix',
    timestamp: '2026-09-17T09:00:00Z',
  },
  {
    id: 'al_3',
    type: 'success',
    title: 'Reserva de Emergência da Casa',
    message: 'A Casa já acumulou R$ 18.500,00 na reserva coletiva (4.1 meses de cobertura essencial).',
    categoryGroup: 'savings',
    timestamp: '2026-09-15T12:00:00Z',
  },
];

export const initialInvites: HouseholdInvite[] = [
  {
    code: 'FINCAS-8KJF2A',
    householdId: 'house_1',
    householdName: 'Casa Família Silva',
    createdByMemberId: 'mem_carlos',
    expiresAt: '2026-10-31T23:59:59Z',
    maxUses: 5,
    currentUses: 2,
    status: 'active',
  },
  {
    code: 'REPUBLICA-SP26',
    householdId: 'house_republica',
    householdName: 'República SP',
    createdByMemberId: 'mem_bruno',
    expiresAt: '2026-12-31T23:59:59Z',
    maxUses: 10,
    currentUses: 4,
    status: 'active',
  },
];

export const initialReceipts: Receipt[] = [
  {
    id: 'rec_1',
    householdId: 'house_1',
    emitterName: 'Pão de Açúcar - Cerqueira César',
    emitterCnpj: '47.508.411/0001-56',
    issuedAt: '2026-09-14',
    totalAmountCents: 14580,
    status: 'processed',
    items: [
      { id: 'ri_1', rawDescription: 'ARR T1 CBR 5KG', normalizedDescription: 'Arroz Tipo 1 Camil 5kg', quantity: 1, unit: 'UN', unitPriceCents: 2890, totalPriceCents: 2890, budgetGroup: 'needs', categoryId: 'cat_supermarket', confidence: 0.95 },
      { id: 'ri_2', rawDescription: 'FEIJ CARIOCA 1KG', normalizedDescription: 'Feijão Carioca 1kg', quantity: 2, unit: 'UN', unitPriceCents: 850, totalPriceCents: 1700, budgetGroup: 'needs', categoryId: 'cat_supermarket', confidence: 0.95 },
      { id: 'ri_3', rawDescription: 'LEIT INT PIRAC 1L', normalizedDescription: 'Leite Integral Piracanjuba 1L', quantity: 4, unit: 'UN', unitPriceCents: 549, totalPriceCents: 2196, budgetGroup: 'needs', categoryId: 'cat_supermarket', confidence: 0.95 },
      { id: 'ri_4', rawDescription: 'CERV HEINEKEN LT 350ML', normalizedDescription: 'Cerveja Heineken 350ml', quantity: 6, unit: 'UN', unitPriceCents: 620, totalPriceCents: 3720, budgetGroup: 'wants', categoryId: 'cat_dining', confidence: 0.95 },
      { id: 'ri_5', rawDescription: 'DETERG YPE 500ML', normalizedDescription: 'Detergente Neutro Ypê 500ml', quantity: 2, unit: 'UN', unitPriceCents: 280, totalPriceCents: 560, budgetGroup: 'needs', categoryId: 'cat_supermarket', confidence: 0.95 },
      { id: 'ri_6', rawDescription: 'CHOC NESTLE 90G', normalizedDescription: 'Chocolate Barra Nestlé 90g', quantity: 3, unit: 'UN', unitPriceCents: 790, totalPriceCents: 2370, budgetGroup: 'wants', categoryId: 'cat_lifestyle', confidence: 0.95 },
      { id: 'ri_7', rawDescription: 'CAFE PILAO 500G', normalizedDescription: 'Café Torrado e Moído Pilão 500g', quantity: 1, unit: 'UN', unitPriceCents: 1144, totalPriceCents: 1144, budgetGroup: 'needs', categoryId: 'cat_supermarket', confidence: 0.95 },
    ],
    createdAt: '2026-09-14T18:20:00Z',
  },
];

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.alerts) parsed.alerts = initialAlerts;
      if (!parsed.currentUser) parsed.currentUser = initialUser;
      if (!parsed.households || parsed.households.length === 0) parsed.households = initialHouseholds;
      if (!parsed.household) parsed.household = parsed.households[0] || initialHousehold;
      if (!parsed.receipts) parsed.receipts = initialReceipts;
      if (!parsed.invites) parsed.invites = initialInvites;
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }

  return {
    currentUser: initialUser,
    households: initialHouseholds,
    household: initialHousehold,
    members: initialMembers,
    currentMemberId: 'mem_carlos',
    activePerspective: 'house',
    snapshots: initialSnapshots,
    accounts: initialAccounts,
    creditCards: initialCreditCards,
    bills: initialBills,
    transactions: initialTransactions,
    categories: initialCategories,
    goals: initialGoals,
    alerts: initialAlerts,
    auditLogs: initialAuditLogs,
    receipts: initialReceipts,
    invites: initialInvites,
  };
}

export const getInitialState = loadAppState;

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

export const saveState = saveAppState;

export function addTransaction(state: AppState, tx: Transaction): AppState {
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId: tx.paidByMemberId,
    action: 'create',
    entityType: 'transaction',
    entityId: tx.id,
    description: `Registrou despesa "${tx.description}" (${tx.scope === 'house' ? 'Casa' : 'Pessoal'})`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    transactions: [tx, ...state.transactions],
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function deleteTransaction(state: AppState, id: string, memberId: string): AppState {
  const tx = state.transactions.find(t => t.id === id);
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId,
    action: 'delete',
    entityType: 'transaction',
    entityId: id,
    description: `Excluiu transação "${tx?.description || id}"`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    transactions: state.transactions.filter(t => t.id !== id),
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function addBill(state: AppState, bill: Bill): AppState {
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId: bill.assignedToMemberId || state.members[0].id,
    action: 'create',
    entityType: 'bill',
    entityId: bill.id,
    description: `Cadastrou conta/boleto "${bill.description}"`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    bills: [...state.bills, bill],
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function updateBill(state: AppState, bill: Bill): AppState {
  return {
    ...state,
    bills: state.bills.map(b => (b.id === bill.id ? bill : b)),
  };
}

export function updateMemberIncome(
  state: AppState,
  memberId: string,
  newIncome: number,
  operatorId: string
): AppState {
  const member = state.members.find(m => m.id === memberId);
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId: operatorId,
    action: 'update',
    entityType: 'rule',
    entityId: memberId,
    description: `Atualizou renda líquida de ${member?.displayName} para nova base futura. Despesas passadas preservadas intactas.`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    members: state.members.map(m => (m.id === memberId ? { ...m, netIncome: newIncome } : m)),
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function saveIncomeSnapshot(state: AppState, yearMonth: string): AppState {
  const totalIncome = state.members.reduce((sum, m) => sum + m.netIncome, 0);
  const newSnapshots: HouseholdIncomeSnapshot[] = state.members.map(m => ({
    id: `snap_${yearMonth}_${m.id}`,
    householdId: state.household.id,
    yearMonth,
    memberId: m.id,
    netIncome: m.netIncome,
    sharePercentage: parseFloat(((m.netIncome / totalIncome) * 100).toFixed(2)),
    createdAt: new Date().toISOString(),
  }));

  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId: state.currentMemberId,
    action: 'close_month',
    entityType: 'snapshot',
    entityId: yearMonth,
    description: `Fechamento do mês ${yearMonth}: Snapshot de renda e cotas congelado para histórico.`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    snapshots: [...state.snapshots.filter(s => s.yearMonth !== yearMonth), ...newSnapshots],
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function updateBudgetPercentages(
  state: AppState,
  percentages: { needs: number; wants: number; savings: number },
  operatorId: string
): AppState {
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: state.household.id,
    memberId: operatorId,
    action: 'update',
    entityType: 'budget',
    entityId: state.household.id,
    description: `Alterou metodologia orçamentária para ${percentages.needs}/${percentages.wants}/${percentages.savings}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    household: {
      ...state.household,
      budgetPercentages: percentages,
    },
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function addGoal(state: AppState, goal: FinancialGoal): AppState {
  return {
    ...state,
    goals: [...state.goals, goal],
  };
}

export function switchHousehold(state: AppState, houseId: string): AppState {
  const targetHouse = state.households.find(h => h.id === houseId);
  if (!targetHouse) return state;

  return {
    ...state,
    household: targetHouse,
  };
}

export function createHousehold(
  state: AppState,
  name: string,
  defaultSplitMethod: any = 'proportional_income',
  budgetPercentages = { needs: 50, wants: 30, savings: 20 }
): AppState {
  const newHouseId = `house_${Date.now()}`;
  const newHouse: Household = {
    id: newHouseId,
    name,
    createdById: state.currentMemberId,
    createdAt: new Date().toISOString(),
    defaultSplitMethod,
    budgetMethod: '50/30/20',
    budgetPercentages,
    emergencyFundMonthsTarget: 6,
  };

  const newMember: HouseholdMember = {
    id: `mem_${Date.now()}`,
    householdId: newHouseId,
    userId: state.currentUser.id,
    displayName: state.currentUser.name,
    role: 'owner',
    netIncome: toCents(6000),
    color: '#10b981',
    avatar: state.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    joinedAt: new Date().toISOString(),
    permissions: {
      canInvite: true,
      canEditRules: true,
      canAddSharedIncome: true,
      canEditExpenses: true,
      canDeleteExpenses: true,
      canCloseMonth: true,
      canViewOtherIncomes: true,
      canViewAssets: true,
      canViewPrivateDetails: true,
    },
  };

  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: newHouseId,
    memberId: newMember.id,
    action: 'create',
    entityType: 'rule',
    entityId: newHouseId,
    description: `Criou a residência "${name}"`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    households: [...state.households, newHouse],
    household: newHouse,
    members: [...state.members, newMember],
    currentMemberId: newMember.id,
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function deleteHousehold(state: AppState, householdId: string): AppState {
  const targetHouse = state.households.find(h => h.id === householdId);
  const remainingHouseholds = state.households.filter(h => h.id !== householdId);

  let newActiveHousehold: Household;
  let newMembers = state.members.filter(m => m.householdId !== householdId);
  let activeMemberId = state.currentMemberId;

  if (remainingHouseholds.length === 0) {
    const fallbackId = `house_${Date.now()}`;
    newActiveHousehold = {
      id: fallbackId,
      name: 'Minha Residência',
      createdById: state.currentUser.id,
      createdAt: new Date().toISOString(),
      defaultSplitMethod: 'proportional_income',
      budgetMethod: '50/30/20',
      budgetPercentages: { needs: 50, wants: 30, savings: 20 },
      emergencyFundMonthsTarget: 6,
    };
    remainingHouseholds.push(newActiveHousehold);

    const fallbackMember: HouseholdMember = {
      id: `mem_${Date.now()}`,
      householdId: fallbackId,
      userId: state.currentUser.id,
      displayName: state.currentUser.name || 'Morador',
      role: 'owner',
      netIncome: toCents(5000),
      color: '#10b981',
      avatar: (state.currentUser.name || 'ME').slice(0, 2).toUpperCase(),
      joinedAt: new Date().toISOString(),
      permissions: {
        canInvite: true,
        canEditRules: true,
        canAddSharedIncome: true,
        canEditExpenses: true,
        canDeleteExpenses: true,
        canCloseMonth: true,
        canViewOtherIncomes: true,
        canViewAssets: true,
        canViewPrivateDetails: true,
      },
    };
    newMembers.push(fallbackMember);
    activeMemberId = fallbackMember.id;
  } else {
    if (state.household.id === householdId) {
      newActiveHousehold = remainingHouseholds[0];
      const memberInTarget = newMembers.find(m => m.householdId === newActiveHousehold.id);
      if (memberInTarget) {
        activeMemberId = memberInTarget.id;
      }
    } else {
      newActiveHousehold = state.household;
    }
  }

  const deletedMemberIds = new Set(
    state.members.filter(m => m.householdId === householdId).map(m => m.id)
  );

  const updatedTransactions = state.transactions.filter(t => t.householdId !== householdId);
  const updatedBills = state.bills.filter(b => b.householdId !== householdId);
  const updatedGoals = state.goals.filter(g => g.householdId !== householdId);
  const updatedInvites = state.invites.filter(i => i.householdId !== householdId);
  const updatedReceipts = state.receipts.filter(r => r.householdId !== householdId);
  const updatedSnapshots = state.snapshots.filter(s => s.householdId !== householdId);
  const updatedAccounts = state.accounts.filter(
    a => a.householdId !== householdId && !deletedMemberIds.has(a.ownerMemberId)
  );
  const updatedCards = state.creditCards.filter(c => !deletedMemberIds.has(c.ownerMemberId));

  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    householdId: newActiveHousehold.id,
    memberId: activeMemberId,
    action: 'delete',
    entityType: 'rule',
    entityId: householdId,
    description: `Removeu a residência "${targetHouse?.name || householdId}"`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    households: remainingHouseholds,
    household: newActiveHousehold,
    members: newMembers,
    currentMemberId: activeMemberId,
    transactions: updatedTransactions,
    bills: updatedBills,
    goals: updatedGoals,
    invites: updatedInvites,
    receipts: updatedReceipts,
    snapshots: updatedSnapshots,
    accounts: updatedAccounts,
    creditCards: updatedCards,
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function joinHouseholdByCode(state: AppState, inviteCode: string): { success: boolean; newState: AppState; error?: string } {
  const cleanCode = inviteCode.trim().toUpperCase();
  const invite = state.invites.find(i => i.code.toUpperCase() === cleanCode && i.status === 'active');

  if (!invite) {
    return { success: false, newState: state, error: 'Código de convite não encontrado ou expirado.' };
  }

  const targetHouse = state.households.find(h => h.id === invite.householdId);
  if (!targetHouse) {
    return { success: false, newState: state, error: 'Casa associada ao convite não existe.' };
  }

  // Verificar se o usuário já é membro desta casa
  const alreadyMember = state.members.some(
    m => m.householdId === targetHouse.id && m.userId === state.currentUser.id
  );

  let updatedMembers = state.members;
  let activeMemberId = state.currentMemberId;

  if (!alreadyMember) {
    const newMember: HouseholdMember = {
      id: `mem_${Date.now()}`,
      householdId: targetHouse.id,
      userId: state.currentUser.id,
      displayName: state.currentUser.name,
      role: 'member',
      netIncome: toCents(4000),
      color: '#8b5cf6',
      avatar: state.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      joinedAt: new Date().toISOString(),
      permissions: {
        canInvite: false,
        canEditRules: false,
        canAddSharedIncome: false,
        canEditExpenses: true,
        canDeleteExpenses: false,
        canCloseMonth: false,
        canViewOtherIncomes: true,
        canViewAssets: false,
        canViewPrivateDetails: false,
      },
    };
    updatedMembers = [...state.members, newMember];
    activeMemberId = newMember.id;
  }

  const updatedInvites = state.invites.map(i => {
    if (i.code === invite.code) {
      const nextUses = i.currentUses + 1;
      return {
        ...i,
        currentUses: nextUses,
        status: nextUses >= i.maxUses ? ('used' as const) : ('active' as const),
      };
    }
    return i;
  });

  return {
    success: true,
    newState: {
      ...state,
      household: targetHouse,
      members: updatedMembers,
      currentMemberId: activeMemberId,
      invites: updatedInvites,
    },
  };
}

export function createInvite(state: AppState, householdId: string, maxUses = 5, daysValid = 30): AppState {
  const house = state.households.find(h => h.id === householdId) || state.household;
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `FINCAS-${randomSuffix}`;

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + daysValid);

  const newInvite: HouseholdInvite = {
    code,
    householdId: house.id,
    householdName: house.name,
    createdByMemberId: state.currentMemberId,
    expiresAt: expiresDate.toISOString(),
    maxUses,
    currentUses: 0,
    status: 'active',
  };

  return {
    ...state,
    invites: [newInvite, ...state.invites],
  };
}

export function addReceipt(state: AppState, receipt: Receipt): AppState {
  return {
    ...state,
    receipts: [receipt, ...state.receipts],
  };
}

export function updateCurrentUser(state: AppState, user: User): AppState {
  return {
    ...state,
    currentUser: user,
  };
}

/**
 * Clears all mock/sample transactions, bills, and demo debts,
 * leaving a pristine real ledger for the household.
 */
export function clearMockData(state: AppState): AppState {
  const cleanState: AppState = {
    ...state,
    transactions: [],
    bills: [],
    goals: [],
    receipts: [],
    snapshots: [],
    alerts: [
      {
        id: `al_real_${Date.now()}`,
        type: 'info',
        title: 'Modo Dados Reais Ativado',
        message: 'Os dados de demonstração foram limpos. Registre suas despesas e receitas reais.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
  saveAppState(cleanState);
  return cleanState;
}

/**
 * Creates a brand new pristine real state for an authenticated user
 */
export function createRealUserHousehold(
  user: User,
  householdName: string = 'Nossa Casa',
  netIncomeCents: number = 500000
): AppState {
  const houseId = `house_${user.id}_${Date.now()}`;
  const memberId = `mem_${user.id}`;

  const realHousehold: Household = {
    id: houseId,
    name: householdName,
    createdById: memberId,
    createdAt: new Date().toISOString(),
    defaultSplitMethod: 'proportional_income',
    budgetMethod: '50/30/20',
    budgetPercentages: {
      needs: 50,
      wants: 30,
      savings: 20,
    },
    emergencyFundMonthsTarget: 6,
  };

  const realMember: HouseholdMember = {
    id: memberId,
    householdId: houseId,
    userId: user.id,
    displayName: user.name,
    role: 'owner',
    netIncome: netIncomeCents,
    color: '#10b981',
    avatar: user.name.substring(0, 2).toUpperCase(),
    joinedAt: new Date().toISOString().split('T')[0],
    permissions: {
      canInvite: true,
      canEditRules: true,
      canAddSharedIncome: true,
      canEditExpenses: true,
      canDeleteExpenses: true,
      canCloseMonth: true,
      canViewOtherIncomes: true,
      canViewAssets: true,
      canViewPrivateDetails: true,
    },
  };

  const realState: AppState = {
    currentUser: user,
    households: [realHousehold],
    household: realHousehold,
    members: [realMember],
    currentMemberId: memberId,
    activePerspective: 'house',
    snapshots: [],
    accounts: [],
    creditCards: [],
    bills: [],
    transactions: [],
    categories: initialCategories,
    goals: [],
    alerts: [
      {
        id: `al_welcome_${Date.now()}`,
        type: 'success',
        title: 'Bem-vindo ao FinCas Real!',
        message: 'Conectado com sucesso ao Firebase. Comece adicionando seus gastos e receitas reais.',
        timestamp: new Date().toISOString(),
      },
    ],
    auditLogs: [],
    receipts: [],
    invites: [],
  };

  saveAppState(realState);
  return realState;
}


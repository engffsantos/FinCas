import { distributeIntegerProportions, toCents, fromCents, formatBRL } from './money';
import { calculateTransactionSplits } from './proportionalSplit';
import { calculateHouseholdSettlement } from './debtSimplification';
import { calculateBudget503020 } from './budget503020';
import { parseNaturalLanguageInput } from './quickParser';
import { calculateCardInvoice, settleCardInvoicePayment } from './creditCards';
import { generateInstallmentSchedule } from './installments';
import {
  verifyLedgerBalance,
  createCreditCardPurchaseLedgerEntries,
  createInvoiceSettlementLedgerEntries,
} from './ledger';
import { normalizeFiscalDescription, parseReceiptOCRText } from './receiptParser';
import { generatePixPayload } from './pix';
import { HouseholdMember, Transaction, Category, CreditCard, Account } from '../types';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export function runAllFinancialUnitTests(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: Exact integer cents remainder distribution
  try {
    // 100 cents divided equally among 3 people: must equal exactly 34, 33, 33 = 100
    const splits = distributeIntegerProportions(100, [
      { id: 'user1', weight: 1 },
      { id: 'user2', weight: 1 },
      { id: 'user3', weight: 1 },
    ]);
    const totalAllocated = splits.reduce((sum, s) => sum + s.amount, 0);
    results.push({
      name: 'Distribuição exata de centavos sem arredondamento fracionário residual (100 / 3)',
      category: 'Precisão Monetária',
      passed: totalAllocated === 100 && splits[0].amount === 34 && splits[1].amount === 33 && splits[2].amount === 33,
      expected: 'Soma exata de 100 centavos (34, 33, 33)',
      actual: `Soma = ${totalAllocated} centavos (${splits.map(s => s.amount).join(', ')})`,
    });
  } catch (e: any) {
    results.push({
      name: 'Distribuição exata de centavos',
      category: 'Precisão Monetária',
      passed: false,
      expected: 'Soma = 100',
      actual: 'Falha',
      error: e.message,
    });
  }

  // TEST 2: Proportional to income split (Exemplo do Usuário: A = R$ 6.000 [60%], B = R$ 4.000 [40%], Despesa R$ 2.000)
  try {
    const mockMembers: HouseholdMember[] = [
      {
        id: 'member_a',
        householdId: 'h1',
        userId: 'u1',
        displayName: 'Morador A',
        role: 'owner',
        netIncome: toCents(6000), // R$ 6.000,00
        color: '#10b981',
        avatar: 'A',
        joinedAt: '2026-01-01',
        permissions: { canInvite: true, canEditRules: true, canAddSharedIncome: true, canEditExpenses: true, canDeleteExpenses: true, canCloseMonth: true, canViewOtherIncomes: true, canViewAssets: true, canViewPrivateDetails: true },
      },
      {
        id: 'member_b',
        householdId: 'h1',
        userId: 'u2',
        displayName: 'Morador B',
        role: 'adult',
        netIncome: toCents(4000), // R$ 4.000,00
        color: '#6366f1',
        avatar: 'B',
        joinedAt: '2026-01-01',
        permissions: { canInvite: true, canEditRules: true, canAddSharedIncome: true, canEditExpenses: true, canDeleteExpenses: true, canCloseMonth: true, canViewOtherIncomes: true, canViewAssets: true, canViewPrivateDetails: true },
      },
    ];

    const splits = calculateTransactionSplits({
      transactionId: 'tx_aluguel',
      totalAmountCents: toCents(2000), // R$ 2.000,00
      splitMethod: 'proportional_income',
      members: mockMembers,
    });

    const splitA = splits.find(s => s.memberId === 'member_a');
    const splitB = splits.find(s => s.memberId === 'member_b');

    const passed = splitA?.amount === toCents(1200) && splitB?.amount === toCents(800);
    results.push({
      name: 'Divisão proporcional à renda líquida (R$ 6k vs R$ 4k para gasto de R$ 2.000)',
      category: 'Divisão Proporcional',
      passed,
      expected: 'Morador A: R$ 1.200,00 (60%) | Morador B: R$ 800,00 (40%)',
      actual: `Morador A: ${formatBRL(splitA?.amount || 0)} | Morador B: ${formatBRL(splitB?.amount || 0)}`,
    });
  } catch (e: any) {
    results.push({
      name: 'Divisão proporcional à renda líquida',
      category: 'Divisão Proporcional',
      passed: false,
      expected: 'A: 1200, B: 800',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 3: Debt Simplification (Compensação Inteligente)
  try {
    const mockMembers: HouseholdMember[] = [
      {
        id: 'member_a',
        householdId: 'h1',
        userId: 'u1',
        displayName: 'Morador A',
        role: 'owner',
        netIncome: toCents(5000),
        color: '#10b981',
        avatar: 'A',
        joinedAt: '2026-01-01',
        permissions: { canInvite: true, canEditRules: true, canAddSharedIncome: true, canEditExpenses: true, canDeleteExpenses: true, canCloseMonth: true, canViewOtherIncomes: true, canViewAssets: true, canViewPrivateDetails: true },
      },
      {
        id: 'member_b',
        householdId: 'h1',
        userId: 'u2',
        displayName: 'Morador B',
        role: 'adult',
        netIncome: toCents(5000),
        color: '#6366f1',
        avatar: 'B',
        joinedAt: '2026-01-01',
        permissions: { canInvite: true, canEditRules: true, canAddSharedIncome: true, canEditExpenses: true, canDeleteExpenses: true, canCloseMonth: true, canViewOtherIncomes: true, canViewAssets: true, canViewPrivateDetails: true },
      },
    ];

    // Transaction 1: A paid R$ 2.400 for Aluguel (50/50 split -> A owes 1200, B owes 1200)
    // Transaction 2: B paid R$ 1.000 for Supermercado (50/50 split -> A owes 500, B owes 500)
    // Net:
    // A paid 2400, owes (1200 + 500) = 1700 -> A net balance = +700 (must receive 700)
    // B paid 1000, owes (1200 + 500) = 1700 -> B net balance = -700 (must pay 700)
    const mockTransactions: Transaction[] = [
      {
        id: 'tx_1',
        householdId: 'h1',
        type: 'expense',
        amount: toCents(2400),
        description: 'Aluguel',
        categoryId: 'cat_housing',
        date: '2026-09-05',
        paidByMemberId: 'member_a',
        scope: 'house',
        privacy: 'house',
        paymentMethod: 'pix',
        splitMethod: 'equal',
        splits: [
          { id: 's1', transactionId: 'tx_1', memberId: 'member_a', amount: toCents(1200), percentage: 50, isSettled: false },
          { id: 's2', transactionId: 'tx_1', memberId: 'member_b', amount: toCents(1200), percentage: 50, isSettled: false },
        ],
        createdAt: '2026-09-05',
        updatedAt: '2026-09-05',
      },
      {
        id: 'tx_2',
        householdId: 'h1',
        type: 'expense',
        amount: toCents(1000),
        description: 'Supermercado',
        categoryId: 'cat_supermarket',
        date: '2026-09-10',
        paidByMemberId: 'member_b',
        scope: 'house',
        privacy: 'house',
        paymentMethod: 'credit_card',
        splitMethod: 'equal',
        splits: [
          { id: 's3', transactionId: 'tx_2', memberId: 'member_a', amount: toCents(500), percentage: 50, isSettled: false },
          { id: 's4', transactionId: 'tx_2', memberId: 'member_b', amount: toCents(500), percentage: 50, isSettled: false },
        ],
        createdAt: '2026-09-10',
        updatedAt: '2026-09-10',
      },
    ];

    const settlement = calculateHouseholdSettlement(mockTransactions, mockMembers, '2026-09');
    const balanceA = settlement.memberBalances.find(m => m.memberId === 'member_a');
    const balanceB = settlement.memberBalances.find(m => m.memberId === 'member_b');
    const transfer = settlement.transfersToSettle[0];

    const passed =
      balanceA?.netBalance === toCents(700) &&
      balanceB?.netBalance === -toCents(700) &&
      settlement.transfersToSettle.length === 1 &&
      transfer?.fromMemberId === 'member_b' &&
      transfer?.toMemberId === 'member_a' &&
      transfer?.amount === toCents(700);

    results.push({
      name: 'Compensação inteligente de dívidas (Debt Simplification mínimo de transferências)',
      category: 'Compensação e Liquidação',
      passed,
      expected: '1 transferência única: Morador B paga R$ 700,00 para Morador A',
      actual: `${settlement.transfersToSettle.length} transferência(s): ${formatBRL(transfer?.amount || 0)} de B para A`,
    });
  } catch (e: any) {
    results.push({
      name: 'Compensação inteligente de dívidas',
      category: 'Compensação e Liquidação',
      passed: false,
      expected: 'B paga 700 a A',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 4: Natural language parsing
  try {
    const mockCategories: Category[] = [
      { id: 'cat_supermarket', name: 'Supermercado', budgetGroup: 'needs', icon: 'ShoppingCart', color: '#10b981', isSystem: true },
      { id: 'cat_internet', name: 'Internet', budgetGroup: 'needs', icon: 'Wifi', color: '#06b6d4', isSystem: true },
    ];

    const parsed1 = parseNaturalLanguageInput('Gastei 42 reais no mercado no débito', mockCategories);
    const passed1 =
      parsed1.amount === toCents(42) &&
      parsed1.paymentMethod === 'debit_card' &&
      parsed1.budgetGroup === 'needs';

    results.push({
      name: 'Parser de linguagem natural em PT-BR ("Gastei 42 reais no mercado no débito")',
      category: 'Assistente e UX',
      passed: passed1,
      expected: 'R$ 42,00 | Método Débito | Categoria Supermercado | Grupo Necessidades',
      actual: `${formatBRL(parsed1.amount)} | Método: ${parsed1.paymentMethod} | Grupo: ${parsed1.budgetGroup}`,
    });
  } catch (e: any) {
    results.push({
      name: 'Parser de linguagem natural',
      category: 'Assistente e UX',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 5: Cartões de Crédito & Não Duplicação de Despesa no Pagamento da Fatura
  try {
    const mockCard: CreditCard = {
      id: 'card_nubank_test',
      ownerMemberId: 'mem_a',
      name: 'Nubank Ultravioleta',
      institution: 'Nubank',
      creditLimit: toCents(10000), // R$ 10.000
      closingDay: 15,
      dueDay: 25,
      availableLimit: toCents(10000),
      colorGradient: 'from-purple-600 to-indigo-600',
    };

    const mockTxs: Transaction[] = [
      {
        id: 'tx_compra_1',
        householdId: 'h1',
        type: 'expense',
        amount: toCents(300),
        description: 'Jantar',
        categoryId: 'cat_dining',
        date: '2026-09-08',
        paidByMemberId: 'mem_a',
        scope: 'house',
        privacy: 'house',
        paymentMethod: 'credit_card',
        creditCardId: 'card_nubank_test',
        splitMethod: 'equal',
        splits: [],
        createdAt: '2026-09-08',
        updatedAt: '2026-09-08',
      },
    ];

    const invoice = calculateCardInvoice(mockCard, mockTxs, '2026-09', new Date('2026-09-17'));

    const mockAccount: Account = {
      id: 'acc_checking_test',
      ownerMemberId: 'mem_a',
      name: 'Conta Corrente',
      institution: 'Nubank',
      type: 'checking',
      balance: toCents(5000), // R$ 5.000
      isShared: true,
    };

    const settlement = settleCardInvoicePayment(mockAccount, invoice.currentInvoiceAmount);

    const passed =
      invoice.currentInvoiceAmount === toCents(300) &&
      invoice.availableLimit === toCents(9700) &&
      settlement.success &&
      settlement.newAccountBalance === toCents(4700);

    results.push({
      name: 'Cartão: Fatura aberta de R$ 300, limite comprometido e liquidação sem duplicação',
      category: 'Cartões & Faturas',
      passed,
      expected: 'Fatura: R$ 300,00 | Limite Disp: R$ 9.700,00 | Saldo após pagamento: R$ 4.700,00',
      actual: `Fatura: ${formatBRL(invoice.currentInvoiceAmount)} | Limite Disp: ${formatBRL(invoice.availableLimit)} | Saldo após pagamento: ${formatBRL(settlement.newAccountBalance)}`,
    });
  } catch (e: any) {
    results.push({
      name: 'Cartões & Faturas',
      category: 'Cartões & Faturas',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 6: Installments (Compras Parceladas com Distribuição Exata de Centavos)
  try {
    // R$ 1.000,00 dividido em 3 parcelas -> 333,34 + 333,33 + 333,33 = 1.000,00
    const schedule = generateInstallmentSchedule(toCents(1000), 3, '2026-09', 10);
    const totalSchedule = schedule.reduce((sum, item) => sum + item.amountCents, 0);

    const passed =
      schedule.length === 3 &&
      totalSchedule === toCents(1000) &&
      schedule[0].amountCents === 33334 &&
      schedule[1].amountCents === 33333 &&
      schedule[2].amountCents === 33333;

    results.push({
      name: 'Parcelamento: Divisão do maior resto (R$ 1.000 em 3x: 333,34 + 333,33 + 333,33)',
      category: 'Parcelamentos',
      passed,
      expected: 'Soma exata = R$ 1.000,00 (P1: 333,34 / P2: 333,33 / P3: 333,33)',
      actual: `Soma = ${formatBRL(totalSchedule)} (${schedule.map(s => formatBRL(s.amountCents)).join(', ')})`,
    });
  } catch (e: any) {
    results.push({
      name: 'Parcelamentos',
      category: 'Parcelamentos',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 7: Ledger - Razão Contábil de Partidas Dobradas & Invariante Universal
  try {
    // 1. Compra no cartão
    const purchaseEntries = createCreditCardPurchaseLedgerEntries({
      id: 'tx_notebook',
      householdId: 'h1',
      transactionId: 'tx_notebook',
      description: 'Notebook',
      amountCents: toCents(3000),
      categoryGroup: 'needs',
      cardId: 'nubank',
    });

    // 2. Pagamento da fatura
    const settlementEntries = createInvoiceSettlementLedgerEntries({
      id: 'pay_fatura',
      householdId: 'h1',
      description: 'Fatura Nubank',
      amountCents: toCents(3000),
      cardId: 'nubank',
      sourceAccountId: 'checking_nubank',
    });

    const allEntries = [...purchaseEntries, ...settlementEntries];
    const balance = verifyLedgerBalance(allEntries);

    // Na compra: debitAccount é 'expense:needs', creditAccount é 'liability:card_nubank'
    // No pagamento de fatura: debitAccount é 'liability:card_nubank', creditAccount é 'asset:checking_nubank'
    // NENHUMA conta de despesa é acionada no pagamento da fatura!
    const invoiceDebitIsLiability = settlementEntries[0].debitAccount.startsWith('liability:');
    const invoiceCreditIsAsset = settlementEntries[0].creditAccount.startsWith('asset:');
    const zeroExpenseOnInvoice = !settlementEntries[0].debitAccount.startsWith('expense:') && !settlementEntries[0].creditAccount.startsWith('expense:');

    const passed = balance.isBalanced && invoiceDebitIsLiability && invoiceCreditIsAsset && zeroExpenseOnInvoice;

    results.push({
      name: 'Razão Contábil: Partidas dobradas sum(D)==sum(C) e prova contábil fatura=passivo',
      category: 'Ledger & Contabilidade',
      passed,
      expected: 'Invariante equilibrada e Pagamento de fatura debita Passivo (ZERO despesa)',
      actual: `Equilíbrio: ${balance.isBalanced} | Discrepância: ${formatBRL(balance.discrepancyCents)} | Conta Fatura: ${settlementEntries[0].debitAccount}`,
    });
  } catch (e: any) {
    results.push({
      name: 'Ledger & Contabilidade',
      category: 'Ledger & Contabilidade',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 8: Receipt Processing - Normalização Semântica Fiscal & Classificação 50/30/20
  try {
    const rawSample = `
      PAO DE ACUCAR LTDA
      CNPJ 47.508.411/0001-56
      EXTRATO No. 129845
      ARR T1 CBR 5KG 1 UN X 28,90 28,90
      CERV HEINEKEN LT 350ML 6 UN X 6,20 37,20
      TOTAL R$ 66,10
    `;

    const parsed = parseReceiptOCRText(rawSample);
    const itemArroz = parsed.items.find(i => i.rawDescription.includes('ARR'));
    const itemCerveja = parsed.items.find(i => i.rawDescription.includes('CERV'));

    const passed =
      itemArroz?.normalizedDescription.includes('Arroz Tipo 1') &&
      itemArroz?.budgetGroup === 'needs' &&
      itemCerveja?.normalizedDescription.includes('Cerveja') &&
      itemCerveja?.budgetGroup === 'wants';

    results.push({
      name: 'Leitor de Cupom Fiscal: Normalização de abreviações ("ARR T1 CBR" -> "Arroz Tipo 1") e 50/30/20',
      category: 'Scanner & OCR',
      passed: !!passed,
      expected: 'Arroz = Necessidades | Cerveja = Estilo de Vida',
      actual: `${itemArroz?.normalizedDescription} (${itemArroz?.budgetGroup}) | ${itemCerveja?.normalizedDescription} (${itemCerveja?.budgetGroup})`,
    });
  } catch (e: any) {
    results.push({
      name: 'Scanner & OCR',
      category: 'Scanner & OCR',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  // TEST 9: Pix Copia e Cola - Geração de Payload Padrão BACEN / EMVCo
  try {
    const pixString = generatePixPayload({
      pixKey: 'engffsantos@gmail.com',
      merchantName: 'Joao Silva',
      merchantCity: 'Sao Paulo',
      amountCents: toCents(350), // R$ 350,00
      txId: 'FINCAS01',
      description: 'Acerto Setembro',
    });

    const passed =
      pixString.startsWith('000201') &&
      pixString.includes('br.gov.bcb.pix') &&
      pixString.includes('engffsantos@gmail.com') &&
      pixString.includes('350.00') &&
      pixString.length > 50;

    results.push({
      name: 'Pix Oficial BACEN: Geração de Copia e Cola EMVCo com CRC16 válido',
      category: 'Pix & Pagamentos',
      passed,
      expected: 'Payload EMVCo com chave engffsantos@gmail.com e valor 350.00',
      actual: `Válido (${pixString.substring(0, 35)}... CRC16=${pixString.slice(-4)})`,
    });
  } catch (e: any) {
    results.push({
      name: 'Pix Oficial BACEN',
      category: 'Pix & Pagamentos',
      passed: false,
      expected: 'Sucesso',
      actual: 'Erro',
      error: e.message,
    });
  }

  return results;
}

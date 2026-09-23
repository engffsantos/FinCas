import { Transaction, HouseholdMember, HouseholdSettlementSummary, DebtSettlementItem } from '../types';
import { calculateTransactionSplits } from './proportionalSplit';

/**
 * Calculates net debt balances for each resident and computes the minimal set of
 * transfer transactions to settle all debts (Greedy Debt Simplification algorithm).
 */
export function calculateHouseholdSettlement(
  transactions: Transaction[],
  members: HouseholdMember[],
  period: string
): HouseholdSettlementSummary {
  // Initialize balance accumulators
  const memberStats: Record<string, { paid: number; owed: number }> = {};
  for (const m of members) {
    memberStats[m.id] = { paid: 0, owed: 0 };
  }

  let totalSharedExpenses = 0;

  // Filter only shared expenses (household or selected members, not purely personal)
  const sharedExpenses = transactions.filter(
    t => t.type === 'expense' && t.scope !== 'personal'
  );

  for (const tx of sharedExpenses) {
    totalSharedExpenses += tx.amount;

    // The person who paid physically
    if (memberStats[tx.paidByMemberId]) {
      memberStats[tx.paidByMemberId].paid += tx.amount;
    }

    // The shares each person is responsible for
    const effectiveSplits =
      tx.splits && tx.splits.length > 0
        ? tx.splits
        : calculateTransactionSplits({
            transactionId: tx.id,
            totalAmountCents: tx.amount,
            splitMethod: tx.splitMethod || 'proportional_income',
            members,
          });

    for (const split of effectiveSplits) {
      if (memberStats[split.memberId]) {
        memberStats[split.memberId].owed += split.amount;
      }
    }
  }

  // Compute net balance for each member
  const memberBalances = members.map(m => {
    const stats = memberStats[m.id] || { paid: 0, owed: 0 };
    const netBalance = stats.paid - stats.owed;
    return {
      memberId: m.id,
      paidAmount: stats.paid,
      owedAmount: stats.owed,
      netBalance,
    };
  });

  // Debt Simplification (Minimizing transactions count)
  interface BalanceNode {
    memberId: string;
    balance: number; // positive = creditor, negative = debtor
  }

  const debtors: BalanceNode[] = [];
  const creditors: BalanceNode[] = [];

  for (const mb of memberBalances) {
    if (mb.netBalance < -1) {
      // owes money
      debtors.push({ memberId: mb.memberId, balance: Math.abs(mb.netBalance) });
    } else if (mb.netBalance > 1) {
      // should receive money
      creditors.push({ memberId: mb.memberId, balance: mb.netBalance });
    }
  }

  // Sort descending by magnitude
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transfersToSettle: DebtSettlementItem[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0) {
      const creditorMember = members.find(m => m.id === creditor.memberId);
      const debtorMember = members.find(m => m.id === debtor.memberId);

      transfersToSettle.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount,
        suggestedPixKey: `pix_${creditorMember?.displayName.toLowerCase() || 'casa'}@fincas.app`,
        reason: `Compensação de despesas compartilhadas (${debtorMember?.displayName} -> ${creditorMember?.displayName})`,
      });

      debtor.balance -= amount;
      creditor.balance -= amount;
    }

    if (debtor.balance <= 0) dIdx++;
    if (creditor.balance <= 0) cIdx++;
  }

  return {
    period,
    totalSharedExpenses,
    memberBalances,
    transfersToSettle,
  };
}

/**
 * Generates a mock BR Code / Pix Copia e Cola string according to the Central Bank standard structure
 */
export function generatePixCopiaECola(
  pixKey: string,
  receiverName: string,
  amountCents: number,
  description: string
): string {
  const formattedAmount = (amountCents / 100).toFixed(2);
  const cleanName = receiverName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25);
  // Standard EMV format string preview
  return `00020126580014BR.GOV.BCB.PIX0114${pixKey}02${description.substring(0, 20)}520400005303986540${formattedAmount.length}${formattedAmount}5802BR59${cleanName.length}${cleanName}6009SAO PAULO62070503***6304FC02`;
}

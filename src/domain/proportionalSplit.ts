import { HouseholdMember, HouseholdIncomeSnapshot, SplitMethod, TransactionSplit } from '../types';
import { distributeIntegerProportions } from './money';

export interface SplitCalculationParams {
  transactionId: string;
  totalAmountCents: number;
  splitMethod: SplitMethod;
  members: HouseholdMember[];
  monthlySnapshots?: HouseholdIncomeSnapshot[]; // Optional historical snapshot for the transaction's month
  selectedMemberIds?: string[];
  customPercentages?: Record<string, number>; // memberId -> percentage (0-100)
  customAmounts?: Record<string, number>; // memberId -> cents
}

/**
 * Computes splits for a shared transaction.
 * Invariant: Sum of returned split amounts ALWAYS equals totalAmountCents.
 */
export function calculateTransactionSplits(params: SplitCalculationParams): TransactionSplit[] {
  const {
    transactionId,
    totalAmountCents,
    splitMethod,
    members,
    monthlySnapshots,
    selectedMemberIds,
    customPercentages,
    customAmounts,
  } = params;

  if (totalAmountCents <= 0 || members.length === 0) {
    return [];
  }

  // Determine active participant pool
  const activeMembers = selectedMemberIds && selectedMemberIds.length > 0
    ? members.filter(m => selectedMemberIds.includes(m.id))
    : members;

  if (activeMembers.length === 0) return [];

  // 1. Proportional to Income
  if (splitMethod === 'proportional_income') {
    // If snapshot exists for this month, use snapshot income; otherwise use member.netIncome
    const weights = activeMembers.map(m => {
      const snap = monthlySnapshots?.find(s => s.memberId === m.id);
      const income = snap ? snap.netIncome : m.netIncome;
      return { id: m.id, weight: Math.max(income, 1) };
    });

    const distributions = distributeIntegerProportions(totalAmountCents, weights);
    return distributions.map(d => ({
      id: `split_${transactionId}_${d.id}`,
      transactionId,
      memberId: d.id,
      amount: d.amount,
      percentage: d.percentage,
      isSettled: false,
    }));
  }

  // 2. Equal Parts (50/50, 33/33/33, etc.)
  if (splitMethod === 'equal' || splitMethod === 'selected_members') {
    const weights = activeMembers.map(m => ({ id: m.id, weight: 1 }));
    const distributions = distributeIntegerProportions(totalAmountCents, weights);
    return distributions.map(d => ({
      id: `split_${transactionId}_${d.id}`,
      transactionId,
      memberId: d.id,
      amount: d.amount,
      percentage: d.percentage,
      isSettled: false,
    }));
  }

  // 3. Custom Percentages
  if (splitMethod === 'custom_percentage' && customPercentages) {
    const weights = activeMembers.map(m => ({
      id: m.id,
      weight: customPercentages[m.id] ?? 0,
    }));
    const distributions = distributeIntegerProportions(totalAmountCents, weights);
    return distributions.map(d => ({
      id: `split_${transactionId}_${d.id}`,
      transactionId,
      memberId: d.id,
      amount: d.amount,
      percentage: d.percentage,
      isSettled: false,
    }));
  }

  // 4. Custom Amounts
  if (splitMethod === 'custom_amount' && customAmounts) {
    return activeMembers.map(m => {
      const amt = customAmounts[m.id] ?? 0;
      const pct = totalAmountCents > 0 ? Number(((amt / totalAmountCents) * 100).toFixed(2)) : 0;
      return {
        id: `split_${transactionId}_${m.id}`,
        transactionId,
        memberId: m.id,
        amount: amt,
        percentage: pct,
        isSettled: false,
      };
    });
  }

  // Default fallback: Equal
  const weights = activeMembers.map(m => ({ id: m.id, weight: 1 }));
  const distributions = distributeIntegerProportions(totalAmountCents, weights);
  return distributions.map(d => ({
    id: `split_${transactionId}_${d.id}`,
    transactionId,
    memberId: d.id,
    amount: d.amount,
    percentage: d.percentage,
    isSettled: false,
  }));
}

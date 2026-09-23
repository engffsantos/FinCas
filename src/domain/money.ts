/**
 * Domain: Money & Exact Financial Precision
 * Handles amounts strictly in integer cents (centavos) to prevent floating-point inaccuracies.
 */

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(percentage: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percentage) + '%';
}

/**
 * Splits an integer amount (in cents) across multiple participants given their proportions.
 * Guaranteed invariant: sum(resulting splits) === totalCents exactly, distributing remainder cents.
 */
export function distributeIntegerProportions(
  totalCents: number,
  proportions: { id: string; weight: number }[]
): { id: string; amount: number; percentage: number }[] {
  if (proportions.length === 0 || totalCents <= 0) {
    return proportions.map(p => ({ id: p.id, amount: 0, percentage: 0 }));
  }

  const totalWeight = proportions.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) {
    // Equal distribution fallback
    const equalShare = Math.floor(totalCents / proportions.length);
    let remainder = totalCents - equalShare * proportions.length;
    return proportions.map((p, idx) => ({
      id: p.id,
      amount: equalShare + (idx < remainder ? 1 : 0),
      percentage: 100 / proportions.length,
    }));
  }

  // Calculate raw shares and maintain tracking of fractional remainders for largest remainder method
  const computed = proportions.map(p => {
    const rawShare = (totalCents * p.weight) / totalWeight;
    const baseShare = Math.floor(rawShare);
    const remainder = rawShare - baseShare;
    const percentage = Number(((p.weight / totalWeight) * 100).toFixed(2));
    return {
      id: p.id,
      amount: baseShare,
      remainder,
      percentage,
    };
  });

  const allocated = computed.reduce((sum, item) => sum + item.amount, 0);
  let discrepancy = totalCents - allocated;

  // Sort by remainder descending to distribute left-over cents
  const sortedIndices = computed
    .map((item, index) => ({ index, remainder: item.remainder }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < discrepancy; i++) {
    const targetIdx = sortedIndices[i % sortedIndices.length].index;
    computed[targetIdx].amount += 1;
  }

  return computed.map(item => ({
    id: item.id,
    amount: item.amount,
    percentage: item.percentage,
  }));
}

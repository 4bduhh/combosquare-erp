export const INR_SYMBOL = '₹';

export function formatINR(amount: number, decimals = 0): string {
  return `${INR_SYMBOL}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

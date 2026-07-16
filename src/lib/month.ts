export function parseMonthParam(monthParam?: string): { year: number; month: number } {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthParamString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

export function getPeriodRange(period) {
  const now = new Date();
  const from = new Date(now);
  if (period === '7d') from.setDate(now.getDate() - 7);
  else from.setHours(now.getHours() - 24);
  return { from: from.toISOString(), to: now.toISOString() };
}

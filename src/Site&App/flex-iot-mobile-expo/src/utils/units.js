export function temperature(value, unit = 'C') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (unit === 'F') return `${((n * 9) / 5 + 32).toFixed(1)} °F`;
  return `${n.toFixed(1)} °C`;
}

export function numberValue(value, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(1)}${suffix}`;
}

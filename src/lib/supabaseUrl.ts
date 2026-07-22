export function normalizeSupabaseProjectUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/rest\/v1$/i, '');
}

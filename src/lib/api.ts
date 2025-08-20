export const apiPath = (p: string) => {
  const base = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, '') ?? '';
  return `${base}${p.startsWith('/') ? p : '/' + p}`;
};
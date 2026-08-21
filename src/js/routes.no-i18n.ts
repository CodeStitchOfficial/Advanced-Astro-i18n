function normalizePath(path: string) {
  // 1. Force it to be a string or fallback to empty string if it's null/undefined
  const safePath = String(path || "");

  // 2. Use the safe string for your checks
  let result = safePath;
  if (!result.startsWith("/")) result = `/${result}`;

  if (!result.endsWith("/")) result = `${result}/`;

  return result;
}

export function getRoute(locale: string | undefined, path: string) {
  const cleanPath = normalizePath(path);

  if (!locale || locale === "en") {
    return cleanPath;
  }

  return normalizePath(`/${locale}${cleanPath}`);
}

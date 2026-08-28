function normalizePath(path: string) {
  const safePath = String(path || "");

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

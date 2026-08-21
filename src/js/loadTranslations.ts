export function loadTranslations(locale: string) {
  const modules = import.meta.glob("../locales/**/**/*.json", {
    eager: true,
  });

  const result: Record<string, any> = {};

  for (const path in modules) {
    if (!path.includes(`/${locale}/`)) continue;

    const mod = modules[path] as any;
    const data = mod.default ?? mod;

    const key = getFileKey(path);

    result[key] = data;
  }

  return result;
}

function getFileKey(path: string) {
  // "../locales/en/home.json" → "home"
  return path.split("/").pop()?.replace(".json", "")!;
}

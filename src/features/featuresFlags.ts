export type FeatureFlags = {
  setup: boolean;
  i18n: boolean;
  cms: boolean;
  demo: boolean;
  darkMode: boolean;
};

export const features: FeatureFlags = {
  setup: true, //true means the script hasn't been used yet in this case
  i18n: true,
  cms: true,
  demo: true,
  darkMode: true,
};

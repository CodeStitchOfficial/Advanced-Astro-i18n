export declare global {
  var StarlightThemeProvider: {
    updatePickers(theme?: string): void;
  };
}

export interface NavItem {
  key: string;
  urls: Record<string, string>;
  label: Record<string, string>;
  children: NavItem[];
}

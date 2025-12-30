// Service de configuration pour les paramètres globaux de l'application

export interface AppConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  adminEmail: string;
  version: string;
  theme: {
    light: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      surfaceColor: string;
      borderColor: string;
      textColor: string;
      textMutedColor: string;
      sidebarColor: string;
      headerColor: string;
      accentColor: string;
    };
    dark: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      surfaceColor: string;
      borderColor: string;
      textColor: string;
      textMutedColor: string;
      sidebarColor: string;
      headerColor: string;
      accentColor: string;
    };
  };
  features: {
    userRegistration: boolean;
    darkMode: boolean;
    search: boolean;
  };
}

class ConfigService {
  private configKey = 'appConfig';
  private defaultConfig: AppConfig = {
    siteName: 'Open Book Wiki',
    siteDescription: 'Wiki open source',
    siteUrl: 'https://openbook.wiki',
    logoUrl: '/Icon.svg',
    faviconUrl: '/favicon/favicon.ico',
    adminEmail: 'admin@openbook.wiki',
    version: '1.0.0',
    theme: {
      light: {
        primaryColor: '#3b82f6',      // Modern vibrant blue
        secondaryColor: '#8b5cf6',    // Purple accent
        backgroundColor: '#fafafa',   // Soft off-white
        surfaceColor: '#ffffff',      // Pure white for cards
        borderColor: '#e5e7eb',       // Subtle gray border
        textColor: '#111827',         // Rich dark gray (not pure black)
        textMutedColor: '#6b7280',    // Medium gray for secondary text
        sidebarColor: '#fafafa',      // Same as background for unified look
        headerColor: '#fafafa',       // Same as background for unified look
        accentColor: '#10b981',       // Fresh green for accents
      },
      dark: {
        primaryColor: '#60a5fa',      // Lighter blue for dark mode
        secondaryColor: '#a78bfa',    // Lighter purple
        backgroundColor: '#0f172a',   // Deep navy blue (warmer than pure black)
        surfaceColor: '#1e293b',      // Slate surface
        borderColor: '#334155',       // Subtle slate border
        textColor: '#f1f5f9',         // Soft white (not harsh)
        textMutedColor: '#94a3b8',    // Muted slate for secondary text
        sidebarColor: '#0f172a',      // Same as background for unified look
        headerColor: '#0f172a',       // Same as background for unified look
        accentColor: '#34d399',       // Bright green accent
      }
    },
    features: {
      userRegistration: false,
      darkMode: true,
      search: true
    }
  };

  /**
   * Obtient l'URL de base de l'API automatiquement
   */
  getApiBaseUrl(): string {
    const currentUrl = window.location;
    const protocol = currentUrl.protocol;
    const hostname = currentUrl.hostname;

    // En production, utilise le même domaine avec le port 3001
    // En développement, détecte automatiquement
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    } else {
      // En production, suppose que l'API est sur le même domaine mais port différent
      // ou sur un sous-domaine api.
      return `${protocol}//${hostname}:3001`;
    }
  }

  /**
   * Obtient l'URL complète pour un endpoint d'API
   */
  getApiUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}/api${cleanEndpoint}`;
  }

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const existing = localStorage.getItem(this.configKey);
    if (!existing) {
      localStorage.setItem(this.configKey, JSON.stringify(this.defaultConfig));
      console.log('✅ Configuration par défaut initialisée');
      return;
    }

    try {
      const config = JSON.parse(existing);
      let needsUpdate = false;

      // Migrate theme structure or add missing fields
      if (config.theme) {
        if (!config.theme.light) {
          console.log('🔄 Migration de la structure du thème...');
          const oldPrimary = config.theme.primaryColor || this.defaultConfig.theme.light.primaryColor;
          const oldSecondary = config.theme.secondaryColor || this.defaultConfig.theme.light.secondaryColor;

          config.theme = {
            light: { ...this.defaultConfig.theme.light, primaryColor: oldPrimary, secondaryColor: oldSecondary },
            dark: { ...this.defaultConfig.theme.dark, primaryColor: oldPrimary, secondaryColor: oldSecondary }
          };
          needsUpdate = true;
        } else {
          // Check for missing individual properties in existing light/dark themes
          const modes: ('light' | 'dark')[] = ['light', 'dark'];
          modes.forEach(mode => {
            Object.keys(this.defaultConfig.theme[mode]).forEach(key => {
              if (config.theme[mode][key] === undefined) {
                config.theme[mode][key] = (this.defaultConfig.theme[mode] as Record<string, string>)[key];
                needsUpdate = true;
              }
            });
          });
        }
      }

      // Add missing top-level fields
      if (config.logoUrl === undefined) {
        config.logoUrl = this.defaultConfig.logoUrl;
        needsUpdate = true;
      }
      if (config.faviconUrl === undefined || config.faviconUrl === '/favicon.ico') {
        config.faviconUrl = this.defaultConfig.faviconUrl;
        needsUpdate = true;
      }

      if (needsUpdate) {
        localStorage.setItem(this.configKey, JSON.stringify(config));
        console.log('✅ Configuration migrée vers la nouvelle version');
      }
    } catch (e) {
      console.error('Erreur lors de l\'initialisation de la config:', e);
      localStorage.setItem(this.configKey, JSON.stringify(this.defaultConfig));
    }
  }

  /**
   * Récupère la configuration complète
   */
  getConfig(): AppConfig {
    const stored = localStorage.getItem(this.configKey);
    if (!stored) return this.defaultConfig;

    try {
      const parsed = JSON.parse(stored);
      // Deep merge pour s'assurer que toutes les propriétés thématiques existent
      return {
        ...this.defaultConfig,
        ...parsed,
        theme: {
          light: { ...this.defaultConfig.theme.light, ...(parsed.theme?.light || {}) },
          dark: { ...this.defaultConfig.theme.dark, ...(parsed.theme?.dark || {}) }
        },
        features: { ...this.defaultConfig.features, ...(parsed.features || {}) }
      };
    } catch {
      return this.defaultConfig;
    }
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.configKey, JSON.stringify(updated));
    console.log('✅ Configuration mise à jour:', updates);
  }

  /**
   * Récupère le nom du site
   */
  getSiteName(): string {
    return this.getConfig().siteName;
  }

  /**
   * Met à jour le nom du site
   */
  setSiteName(name: string): void {
    this.updateConfig({ siteName: name });
  }

  /**
   * Récupère la description du site
   */
  getSiteDescription(): string {
    return this.getConfig().siteDescription;
  }

  /**
   * Met à jour la description du site
   */
  setSiteDescription(description: string): void {
    this.updateConfig({ siteDescription: description });
  }

  /**
   * Récupère l'email admin
   */
  getAdminEmail(): string {
    return this.getConfig().adminEmail;
  }

  /**
   * Met à jour l'email admin
   */
  setAdminEmail(email: string): void {
    this.updateConfig({ adminEmail: email });
  }

  /**
   * Récupère le logo
   */
  getLogoUrl(): string {
    return this.getConfig().logoUrl;
  }

  /**
   * Met à jour le logo
   */
  setLogoUrl(url: string): void {
    this.updateConfig({ logoUrl: url });
  }

  /**
   * Récupère le favicon
   */
  getFaviconUrl(): string {
    return this.getConfig().faviconUrl;
  }

  /**
   * Met à jour le favicon
   */
  setFaviconUrl(url: string): void {
    const config = this.getConfig();
    config.faviconUrl = url;
    this.updateConfig(config);

    // Mettre à jour le favicon dans le DOM
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = url;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = url;
      document.head.appendChild(newLink);
    }
  }

  /**
   * Récupère la couleur primaire selon le mode
   */
  getPrimaryColor(isDarkMode: boolean): string {
    const config = this.getConfig();
    return isDarkMode ? config.theme.dark.primaryColor : config.theme.light.primaryColor;
  }

  /**
   * Met à jour la couleur primaire
   */
  setPrimaryColor(color: string, mode: 'light' | 'dark'): void {
    const config = this.getConfig();
    config.theme[mode].primaryColor = color;
    this.updateConfig(config);
  }

  /**
   * Récupère les couleurs d'un thème
   */
  getThemeColors(mode: 'light' | 'dark') {
    return this.getConfig().theme[mode];
  }

  /**
   * Met à jour les couleurs d'un thème
   */
  setThemeColors(mode: 'light' | 'dark', colors: Partial<AppConfig['theme']['light']>): void {
    const config = this.getConfig();
    config.theme[mode] = { ...config.theme[mode], ...colors };
    this.updateConfig(config);
  }

  /**
   * Vérifie si une fonctionnalité est activée
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.getConfig().features[feature];
  }

  /**
   * Active/désactive une fonctionnalité
   */
  toggleFeature(feature: keyof AppConfig['features'], enabled: boolean): void {
    const config = this.getConfig();
    config.features[feature] = enabled;
    this.updateConfig(config);
  }

  /**
   * Remet la configuration par défaut
   */
  resetToDefault(): void {
    localStorage.setItem(this.configKey, JSON.stringify(this.defaultConfig));
    console.log('✅ Configuration réinitialisée');
  }
}

// Instance singleton
let configServiceInstance: ConfigService | null = null;

export const getConfigService = (): ConfigService => {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
};

export default ConfigService;

import React, { useEffect } from 'react';
import { Header } from './components/app-header';
import { Sidebar } from './components/app-sidebar';
import { MainContent } from './components/main-content';
import { EditModal } from './components/edit-modal';
import SimpleAdminPanel from './components/simple-admin-panel';
import { WikiProvider, useWiki } from './context/wiki-context';
import { getConfigService } from './services/config-service';
import logger from './utils/logger';

const AppContent: React.FC = () => {
  const { isDarkMode, isAdminPanelOpen, setIsAdminPanelOpen, user, wikiData, isLoading, loadingMessage, isBackendConnected, retryConnection, showRetry } = useWiki();
  const configService = getConfigService();
  const siteName = configService.getSiteName();

  const hexToRgb = (hex: string) => {
    if (!hex || hex[0] !== '#') return '0 0 0';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r} ${g} ${b}`;
  };

  useEffect(() => {
    // Sync dark mode class with HTML tag
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply dynamic theme variables
    const theme = configService.getThemeColors(isDarkMode ? 'dark' : 'light');
    const root = document.documentElement;

    if (theme) {
      root.style.setProperty('--primary-color', hexToRgb(theme.primaryColor));
      root.style.setProperty('--secondary-color', hexToRgb(theme.secondaryColor));
      root.style.setProperty('--bg-color', hexToRgb(theme.backgroundColor));
      root.style.setProperty('--surface-color', hexToRgb(theme.surfaceColor));
      root.style.setProperty('--border-color', hexToRgb(theme.borderColor));
      root.style.setProperty('--text-color', hexToRgb(theme.textColor));
      root.style.setProperty('--text-muted-color', hexToRgb(theme.textMutedColor));
      root.style.setProperty('--sidebar-color', hexToRgb(theme.sidebarColor));
      root.style.setProperty('--header-color', hexToRgb(theme.headerColor));
      root.style.setProperty('--accent-color', hexToRgb(theme.accentColor));

      // Compute a hover color
      root.style.setProperty('--primary-hover', hexToRgb(theme.primaryColor));

      // Fallback for html/body
      root.style.backgroundColor = theme.backgroundColor;
      document.body.style.backgroundColor = theme.backgroundColor;
    }
  }, [isDarkMode, configService]);
  useEffect(() => {
    logger.info('🚀 Application started', siteName);
    const pageCount = Object.keys(wikiData).length;
    logger.debug('📄 Pages loaded', pageCount);
    if (user) {
      logger.user('👤 User connected', user.username);
    }
  }, [user, wikiData, siteName]);

  useEffect(() => {
    // Exposer la fonction de retry globalement
    (window as typeof window & { retryBackendConnection?: () => void }).retryBackendConnection = retryConnection;

    return () => {
      // Nettoyer lors du démontage
      delete (window as typeof window & { retryBackendConnection?: () => void }).retryBackendConnection;
    };
  }, [retryConnection]);

  useEffect(() => {
    // Mettre à jour le message de chargement dans l'écran de chargement HTML
    const updateLoadingMessage = () => {
      const loadingSubtitle = document.querySelector('.loading-subtitle');
      if (loadingSubtitle && isLoading) {
        loadingSubtitle.innerHTML = `${loadingMessage}<span class="loading-dots"></span>`;
      }
    };

    // Gérer l'affichage du bouton retry
    const updateRetryButton = () => {
      const retryButton = document.getElementById('retry-button');
      if (retryButton) {
        if (showRetry) {
          retryButton.classList.add('show');
        } else {
          retryButton.classList.remove('show');
        }
      }
    };

    updateLoadingMessage();
    updateRetryButton();
  }, [loadingMessage, isLoading, showRetry]);

  useEffect(() => {
    // Masquer l'écran de chargement seulement quand l'initialisation est terminée ET que le backend est connecté
    // OU si on décide de continuer sans backend (pour l'instant, on reste en chargement)
    if (!isLoading && isBackendConnected) {
      const hideLoadingScreen = () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
          setTimeout(() => {
            loadingScreen.remove();
          }, 500);
        }
      };

      // Petit délai pour s'assurer que le rendu est terminé
      const timer = setTimeout(() => {
        hideLoadingScreen();
        logger.success('✨ User interface ready');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isBackendConnected]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 bg-custom-bg text-custom-text`}>
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      <EditModal />
      <SimpleAdminPanel
        isOpenFromMenu={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <WikiProvider>
      <AppContent />
    </WikiProvider>
  );
}

export default App;
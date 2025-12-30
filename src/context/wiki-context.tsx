import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, WikiPage } from '../types';
import logger from '../utils/logger';

// Hooks
import { useWikiAuth } from '../hooks/use-wiki-auth';
import { useWikiData, WikiData } from '../hooks/use-wiki-data';
export type { WikiData };
import { useWikiUI } from '../hooks/use-wiki-ui';

// Interfaces
interface WikiContextType {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: () => boolean;
  canContribute: () => boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;
  retryConnection: () => Promise<void>;
  authLoading: boolean;

  // Data
  wikiData: WikiData;
  setWikiData: (data: WikiData) => void;
  refreshWikiData: () => Promise<void>;
  dataLoading: boolean;
  dataError: string | null;
  addPage: (title: string, content?: string, icon?: string) => Promise<string | null>;
  updatePage: (pageId: string, content: string, icon?: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  renamePage: (pageId: string, newTitle: string) => Promise<void>;
  enrichPageWithSections: (page: WikiPage) => WikiPage;
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: WikiPage[];
  searchInPages: (term: string) => WikiPage[];

  // UI
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (isOpen: boolean) => void;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (isOpen: boolean) => void;
  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;
  openAdminTab: (tab: string) => void;
  editingPageTitle: string | null;
  setEditingPageTitle: (title: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  loadingStep: string;
  showRetry: boolean;

  // Legacy/Unimplemented stubs (to keep TS happy if used elsewhere)
  reorderPages: (pageIds: string[]) => Promise<void>;
  getFirstNavigationPage: () => string | null;
  renameSectionTitle: (pageId: string, sectionId: string, newTitle: string) => Promise<void>;
  addSection: (title: string) => Promise<string | null>;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

export const useWiki = () => {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
};

interface WikiProviderProps {
  children: ReactNode;
}

export const WikiProvider: React.FC<WikiProviderProps> = ({ children }) => {
  // Initialize Hooks
  const ui = useWikiUI();
  const auth = useWikiAuth();
  const data = useWikiData(auth.isBackendConnected);

  // --- Orchestration / Side Effects ---

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      ui.setLoadingMessage('Initializing connection...');
      await auth.checkAuth();
      // data hook triggers refresh when `isBackendConnected` becomes true
    };
    init();
  }, []);

  // Update loading state based on auth and data
  useEffect(() => {
    if (auth.authLoading || (auth.isBackendConnected && data.dataLoading)) {
      ui.setIsLoading(true);
      if (auth.authLoading) {
        ui.setLoadingMessage('Checking authentication');
      } else if (data.dataLoading) {
        ui.setLoadingMessage(data.loadingStep || 'Loading wiki database');
      }
    } else if (!auth.isBackendConnected && !auth.authLoading) {
      ui.setIsLoading(true);
      ui.setLoadingMessage('Establishing connection to server');
    } else {
      ui.setIsLoading(false);
    }
  }, [auth.authLoading, data.dataLoading, auth.isBackendConnected, data.loadingStep]);


  // --- Legacy / Compatibility Functions ---
  const reorderPages = useCallback(async (pageIds: string[]) => {
    localStorage.setItem('wiki_pages_order', JSON.stringify(pageIds));
    logger.success(`✅ Ordre des pages sauvegardé`);
  }, []);

  const getFirstNavigationPage = useCallback(() => {
    if (!data.wikiData || Object.keys(data.wikiData).length === 0) return null;

    // Check for custom order
    try {
      const savedOrder = localStorage.getItem('wiki_pages_order');
      if (savedOrder) {
        const pageOrder = JSON.parse(savedOrder) as string[];
        // Find first valid page ID in order
        const firstValidId = pageOrder.find(id => data.wikiData[id]);
        if (firstValidId) return firstValidId;
      }
    } catch (e) {
      console.warn('Error reading page order', e);
    }

    // Fallback to first regular key
    return Object.keys(data.wikiData)[0];
  }, [data.wikiData]);

  const renameSectionTitle = useCallback(async (pageId: string, sectionId: string, newTitle: string) => {
    await data.renameSectionTitle(pageId, sectionId, newTitle);
  }, [data.renameSectionTitle]);

  const addSection = useCallback(async (title: string) => {
    return await data.addSection(ui.currentPage, title);
  }, [data.addSection, ui.currentPage]);

  const retryConnection = async () => {
    await auth.checkAuth();
    await data.refreshWikiData();
  };

  // Automatically fetch first page if we are on default 'Home' and data loads
  useEffect(() => {
    if (!data.dataLoading && data.wikiData && Object.keys(data.wikiData).length > 0) {
      // If current page is the generic 'Home' but we have a specific ID for it or another first page
      if (ui.currentPage === 'Home') {
        const firstPage = getFirstNavigationPage();
        if (firstPage) {
          ui.setCurrentPage(firstPage);
        }
      }
    }
  }, [data.dataLoading, data.wikiData, ui.currentPage, getFirstNavigationPage, ui.setCurrentPage]);

  const showRetry = (!auth.isBackendConnected && !auth.authLoading) || (data.dataError !== null && !data.dataLoading);


  const contextValue: WikiContextType = {
    // Auth
    ...auth,
    retryConnection,

    // Data
    ...data,

    // UI
    ...ui,
    showRetry,

    // Legacy
    reorderPages,
    getFirstNavigationPage,
    renameSectionTitle, // Stubbed for now
    addSection, // Stubbed for now
  };

  return (
    <WikiContext.Provider value={contextValue}>
      {children}
    </WikiContext.Provider>
  );
};

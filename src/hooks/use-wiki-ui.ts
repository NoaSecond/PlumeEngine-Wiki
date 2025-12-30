import { useState, useEffect } from 'react';

export const useWikiUI = () => {
    // Theme
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

    // Navigation
    const [currentPage, setCurrentPage] = useState<string>('Home');

    // Modals
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
    const [adminActiveTab, setAdminActiveTab] = useState<string>('activity');
    const [editingPageTitle, setEditingPageTitle] = useState<string | null>(null);

    const openAdminTab = (tab: string) => {
        setAdminActiveTab(tab);
        setIsAdminPanelOpen(true);
    };

    // Global Loading State
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('Chargement...');

    // --- Effects ---

    // Load preferences
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('wiki_dark_mode');
        if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');

        const savedPage = localStorage.getItem('wiki_current_page');
        if (savedPage) setCurrentPage(savedPage);
    }, []);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('wiki_dark_mode', isDarkMode.toString());
    }, [isDarkMode]);

    useEffect(() => {
        localStorage.setItem('wiki_current_page', currentPage);
    }, [currentPage]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    return {
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        currentPage,
        setCurrentPage,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
        adminActiveTab,
        setAdminActiveTab,
        openAdminTab,
        editingPageTitle,
        setEditingPageTitle,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage
    };
};

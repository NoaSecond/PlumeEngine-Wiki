import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWiki } from '../context/wiki-context';
import { getConfigService } from '../services/config-service';
import activityService, { ActivityLog } from '../services/activity-service';
import { SidebarNavigationItem } from '../types';

export const useSidebarLogic = () => {
    const {
        wikiData,
        addPage,
        updatePage,
        renamePage,
        deletePage,
        reorderPages,
        setCurrentPage,
        hasPermission
    } = useWiki();

    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [appVersion, setAppVersion] = useState('...');
    const [orderUpdateTrigger, setOrderUpdateTrigger] = useState(0);

    // Modal & Edit states
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [deletionState, setDeletionState] = useState<{ isOpen: boolean; id: string; title: string }>({
        isOpen: false,
        id: '',
        title: ''
    });


    // Logic for loading activities
    useEffect(() => {
        if (hasPermission('view_activity')) {
            const loadActivities = async () => {
                try {
                    const activities = await activityService.getLogs(10);
                    const recentMods = activities.filter((log: ActivityLog) =>
                        ['edit_page', 'edit_section', 'create_page', 'create_section'].includes(log.action)
                    ).slice(0, 3);
                    setRecentActivities(recentMods);
                } catch (error) {
                    console.error('Erreur lors du chargement des activités:', error);
                }
            };
            loadActivities();
        }
    }, [hasPermission]);

    // Logic for app version
    useEffect(() => {
        const configService = getConfigService();
        const version = configService.getConfig().version;
        setAppVersion(version);
    }, []);

    // Logic for Navigation Items
    const createNavigationItems = useCallback((): SidebarNavigationItem[] => {
        const items: SidebarNavigationItem[] = [];

        for (const pageData of Object.values(wikiData)) {
            let iconName = pageData.icon || 'book-open';
            if ((pageData.title === 'Accueil' || pageData.title === 'Home') && !pageData.icon) {
                iconName = 'home';
            }

            items.push({
                id: pageData.id.toString(), // Store numeric ID as string for consistency
                label: pageData.title,
                title: pageData.title,
                iconName: iconName
            });
        }

        try {
            const savedOrder = localStorage.getItem('wiki_pages_order');
            if (savedOrder) {
                const pageOrder = JSON.parse(savedOrder) as string[];
                const orderedItems: SidebarNavigationItem[] = [];

                pageOrder.forEach(pageId => {
                    const item = items.find(item => item.id === pageId);
                    if (item) {
                        orderedItems.push(item);
                    }
                });

                items.forEach(item => {
                    if (!pageOrder.includes(item.id)) {
                        orderedItems.push(item);
                    }
                });

                return orderedItems;
            }
        } catch (error) {
            console.warn('Erreur lors du chargement de l\'ordre des pages:', error);
        }

        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wikiData, orderUpdateTrigger]);

    const dynamicNavigationItems = useMemo(() => createNavigationItems(), [createNavigationItems]);

    // Handlers
    const handleReorder = (newOrder: string[]) => {
        localStorage.setItem('wiki_pages_order', JSON.stringify(newOrder));
        setOrderUpdateTrigger(prev => prev + 1);
        reorderPages(newOrder);
    };

    const handleCreateCategory = async (name: string, availableIcons: { name: string }[], iconIndex: number) => {
        if (name.trim()) {
            const selectedIcon = availableIcons[iconIndex];
            const initialContent = `<!-- ICON:${selectedIcon.name} -->\n# ${name.trim()}\n\nContenu de la page...`;
            const newPageId = await addPage(name.trim(), initialContent);
            if (newPageId) {
                setCurrentPage(newPageId);
            }
            console.log(`Catégorie créée: ${name.trim()} avec icône: ${selectedIcon.name}`);
            setShowAddCategoryModal(false);
        }
    };

    const handleUpdateIcon = async (pageId: string, iconName: string) => {
        const page = Object.values(wikiData).find(p => p.id.toString() === pageId || p.title === pageId);
        if (!page) return;

        let content = page.content || '';
        const iconMarker = `<!-- ICON:${iconName} -->`;

        if (content.includes('<!-- ICON:')) {
            content = content.replace(/<!-- ICON:[^-]+ -->/, iconMarker);
        } else {
            content = iconMarker + '\n' + content;
        }

        await updatePage(page.id.toString(), content);
    };

    const handleAddCategoryClick = () => setShowAddCategoryModal(true);

    const handleRenamePage = (id: string, newTitle: string) => {
        renamePage(id, newTitle);
    };

    const handleDeletePage = (id: string, title: string) => {
        setDeletionState({
            isOpen: true,
            id,
            title
        });
    };

    const handleConfirmDelete = async () => {
        if (deletionState.id) {
            await deletePage(deletionState.id);
            setDeletionState({ isOpen: false, id: '', title: '' });
        }
    };

    const handleCancelDelete = () => {
        setDeletionState({ isOpen: false, id: '', title: '' });
    };

    return {
        appVersion,
        recentActivities,
        dynamicNavigationItems,
        handleReorder,
        // Modal State
        showAddCategoryModal,
        setShowAddCategoryModal,
        // Deletion state
        deletionState,
        handleConfirmDelete,
        handleCancelDelete,
        // Handlers
        handleAddCategoryClick,
        handleCreateCategory,
        handleUpdateIcon,
        // Item handlers
        handleRenamePage,
        handleDeletePage
    };
};

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import { useSidebarLogic } from '../hooks/use-sidebar-logic';
import SidebarHeader from './sidebar/sidebar-header';
import SidebarFooter from './sidebar/sidebar-footer';
import ActivityList from './sidebar/activity-list';
import NavigationList from './sidebar/navigation-list';
import AddCategoryModal from './sidebar/add-category-modal';
import ConfirmModal from './sidebar/confirm-modal';
import { WikiPage, WikiSection } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,

    hasPermission,
    wikiData
  } = useWiki();
  const { t } = useTranslation();

  const {
    appVersion,
    recentActivities,
    dynamicNavigationItems,
    handleReorder,
    // Modal State
    showAddCategoryModal,
    setShowAddCategoryModal,
    // Handlers
    handleAddCategoryClick,
    handleCreateCategory,
    handleDeletePage,
    handleRenamePage,
    handleUpdateIcon,
    // Deletion Modal
    deletionState,
    handleConfirmDelete,
    handleCancelDelete
  } = useSidebarLogic();

  const availableIcons = useMemo(() => [
    { name: 'home', label: t('icons.home') },
    { name: 'book-open', label: t('icons.book') },
    { name: 'code', label: t('icons.code') },
    { name: 'star', label: t('icons.star') },
    { name: 'heart', label: t('icons.heart') },
    { name: 'coffee', label: t('icons.coffee') },
    { name: 'music', label: t('icons.music') },
    { name: 'camera', label: t('icons.camera') },
    { name: 'gamepad', label: t('icons.gamepad') },
    { name: 'palette', label: t('icons.palette') },
    { name: 'mountain', label: t('icons.mountain') },
    { name: 'compass', label: t('icons.compass') },
    { name: 'trophy', label: t('icons.trophy') },
    { name: 'shield', label: t('icons.shield') },
    { name: 'zap', label: t('icons.zap') },
    { name: 'globe', label: t('icons.globe') }
  ], [t]);

  return (
    <aside className={`w-64 h-full flex flex-col border-r transition-colors duration-300 bg-custom-sidebar border-custom-border`}>

      <SidebarHeader onAddCategory={handleAddCategoryClick} />

      {/* Scrollable area for categories and sections */}
      <div className="flex-1 overflow-y-auto content-scrollbar px-4">

        <NavigationList
          items={dynamicNavigationItems}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          canReorder={hasPermission('reorder_pages')}
          canEdit={hasPermission('edit_pages') || hasPermission('delete_pages')}
          onReorder={handleReorder}
          onRename={handleRenamePage}
          onDelete={handleDeletePage}
          onIconChange={handleUpdateIcon}
          availableIcons={availableIcons}

        />

        {/* Current page sections */}
        {currentPage && (wikiData[currentPage] || Object.values(wikiData).find(p => p.title === currentPage)) && (() => {
          const currentPageData = (wikiData[currentPage] || Object.values(wikiData).find(p => p.title === currentPage)) as WikiPage;
          const sections = currentPageData.sections || [{
            id: 'main-content',
            title: 'Main Content'
          } as WikiSection];

          return sections.length > 0 ? (
            <div className={`mb-6 p-3 rounded-lg transition-colors duration-300 bg-custom-surface/50`}>
              <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 text-custom-text`}>
                {t('sidebar.pageSections')}
              </h3>
              <ul className="space-y-1">
                {sections.map((section: WikiSection) => (
                  <li key={section.id}>
                    <button
                      onClick={() => {
                        const element = document.getElementById(`section-${section.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full text-left flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors text-custom-muted hover:bg-custom-surface hover:text-custom-text`}
                    >
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        <ActivityList recentActivities={recentActivities} />

        <div className={`mt-4 mb-6 p-4 bg-primary/20 rounded-lg border border-primary/30 transition-colors duration-300`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 text-primary`}>
            {t('sidebar.contribute')}
          </h3>
          <p className={`text-xs transition-colors duration-300 text-custom-text/80`}>
            {t('sidebar.contributeDesc')}
          </p>
        </div>
      </div>

      <SidebarFooter appVersion={appVersion} />

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        availableIcons={availableIcons}
        onCreate={async (name, iconIndex) => {
          await handleCreateCategory(name, availableIcons, iconIndex);
        }}
      />
      <ConfirmModal
        isOpen={deletionState.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('sidebar.deleteCategory')}
        message={t('sidebar.confirmDeleteCategory', { title: deletionState.title })}
        confirmText={t('common.delete')}
        type="danger"
      />
    </aside>
  );
};
import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus, Lock, Unlock, Clock, Download, MessageSquare, MessageSquareOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { ProfilePage } from './profile-page';
import { MembersPage } from './members-page';
import { CollapsibleSections } from './collapsible-sections';
import { HistoryModal } from './history-modal';
import { CommentSection } from './comment-section';
import { ExportModal } from './export-modal';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';
import { WikiPage } from '../types';
import authService from '../services/auth-service';

export const MainContent: React.FC = () => {
  const { currentPage, wikiData, setCurrentPage, setIsEditModalOpen, setEditingPageTitle, searchTerm, searchResults, addSection, hasPermission, enrichPageWithSections, refreshWikiData } = useWiki();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Enregistrer la vue de page et récupérer les statistiques
  useEffect(() => {
    if (currentPage && wikiData[currentPage]) {
      logger.debug('📊 Page vue', currentPage);
    }
  }, [currentPage, wikiData]);

  // Si c'est la page profil, afficher le composant ProfilePage
  if (currentPage === 'profile') {
    return <ProfilePage />;
  }

  // Si c'est la page membres, afficher le composant MembersPage
  if (currentPage === 'members') {
    return <MembersPage />;
  }

  // Chercher la page (soit par ID, soit par Titre pour la compatibilité/init)
  let currentPageData: WikiPage | undefined = wikiData[currentPage];
  if (!currentPageData && currentPage) {
    currentPageData = Object.values(wikiData).find(p => p.title === currentPage);
  }

  if (!currentPageData) {
    return (
      <main className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 text-custom-text`}>
            {t('pages.notFound')}
          </h2>
          <p className={`transition-colors duration-300 text-custom-muted`}>
            {t('pages.notFoundDesc')}
          </p>
        </div>
      </main>
    );
  }

  const handleAddSection = () => {
    setShowAddModal(true);
  };

  const handleCreateSection = async () => {
    if (newSectionTitle.trim()) {
      try {
        const newSectionId = await addSection(newSectionTitle.trim());
        if (newSectionId) {
          setEditingPageTitle(`${currentPage}:${newSectionId}`);
          setIsEditModalOpen(true);
        }
        setShowAddModal(false);
        setNewSectionTitle('');
      } catch (error) {
        logger.error('Erreur lors de la création de section', error instanceof Error ? error.message : String(error));
      }
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewSectionTitle('');
  };

  const handleToggleProtection = async () => {
    if (!currentPageData) return;
    try {
      const newStatus = !currentPageData.is_protected;
      const response = await authService.fetchWithAuth<{ success: boolean; message?: string }>(`/wiki/${currentPageData.id}/protect`, {
        method: 'PUT',
        body: JSON.stringify({ isProtected: newStatus })
      });

      if (response.success) {
        logger.success(`Protection ${newStatus ? 'activée' : 'désactivée'} pour la page`);
        await refreshWikiData();
      } else {
        logger.error('Erreur lors du changement de protection', response.message);
      }
    } catch (error) {
      logger.error('Erreur lors du changement de protection', error instanceof Error ? error.message : String(error));
    }
  };



  // Enrichir la page actuelle avec des sections
  const currentPageWithSections = currentPageData ? enrichPageWithSections(currentPageData) : null;

  return (
    <main className={`flex-1 content-scrollbar overflow-y-auto bg-custom-bg text-custom-text`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className={`mb-6 pb-4 border-b border-custom-border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">

              <h1 className={`text-3xl font-bold text-custom-text`}>{currentPageData.title}</h1>

              {/* History Button (Visible to all) */}
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                title={t('history.pageHistory')}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-custom-muted"
              >
                <Clock className="w-5 h-5" />
              </button>

              {/* Export Button (Visible to authenticated users) */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                title={t('export.exportPage')}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-custom-muted"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
            {hasPermission('protect_pages') && (
              <div className="flex space-x-2">
                <button
                  onClick={handleToggleProtection}
                  title={currentPageData.is_protected ? t('pages.unprotectPage') : t('pages.protectPage')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentPageData.is_protected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200'
                    }`}
                >
                  {currentPageData.is_protected ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  disabled
                  title={t('common.comingSoon')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-not-allowed opacity-50 ${currentPageData.comments_enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-200'
                    }`}
                >
                  {currentPageData.comments_enabled ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
                </button>
                {hasPermission('edit_pages') && (
                  <button
                    onClick={handleAddSection}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('pages.addSection')}</span>
                  </button>
                )}
              </div>
            )}
            {!hasPermission('protect_pages') && hasPermission('edit_pages') && (
              <button
                onClick={handleAddSection}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('pages.addSection')}</span>
              </button>
            )}
          </div>
          <div className={`flex items-center space-x-6 text-sm text-custom-muted`}>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{t('pages.modified')} {DateUtils.getRelativeTime(currentPageData.updated_at || DateUtils.getCurrentTimestamp())}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{t('pages.by')} {currentPageData.author_username}</span>
            </div>
          </div>
        </div>

        {/* Search Results Indicator */}
        {searchTerm && (
          <div className={`mb-4 p-3 bg-primary/10 border-primary/30 border rounded-lg`}>
            <p className={`text-sm text-primary`}>
              {t('common.resultsFor')} "{searchTerm}" ({searchResults.length} {t('common.resultCount')})
            </p>
          </div>
        )}

        {/* Résultats de recherche ou contenu de la page avec sections */}
        {searchTerm && searchTerm.length > 2 ? (
          /* Afficher les résultats de recherche */
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((page) => {
                const enrichedPage = enrichPageWithSections(page);
                return (
                  <div key={page.title} className={`p-4 border rounded-lg border-custom-border bg-custom-surface/50`}>
                    <h3 className={`text-lg font-semibold mb-2 text-custom-text`}>
                      <button
                        onClick={() => setCurrentPage(page.title)}
                        className="hover:text-primary transition-colors"
                      >
                        {page.title}
                      </button>
                    </h3>
                    <div className={`text-sm mb-2 text-custom-muted`}>
                      {t('pages.by')} {page.author_username} • {t('pages.modified')} {DateUtils.getRelativeTime(page.updated_at || DateUtils.getCurrentTimestamp())}
                    </div>
                    {enrichedPage.sections && enrichedPage.sections.length > 0 && (
                      <CollapsibleSections
                        sections={enrichedPage.sections}
                        pageId={page.title}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className={`text-center py-8 text-custom-text/60`}>
                {t('common.noResults')} "{searchTerm}"
              </div>
            )}
          </div>
        ) : currentPageWithSections ? (
          /* Afficher le contenu normal de la page */
          <CollapsibleSections
            key={currentPage}
            sections={currentPageWithSections.sections || []}
            pageId={currentPage}
          />
        ) : null}

        {/* Modal pour ajouter une section */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-custom-surface p-6 rounded-lg shadow-xl w-96 max-w-[90vw] border border-custom-border">
              <h2 className="text-xl font-bold mb-4 text-custom-text">
                {t('pages.addNewSection')}
              </h2>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={t('pages.sectionTitlePlaceholder')}
                className="w-full p-3 border border-custom-border rounded-lg mb-4 bg-custom-bg text-custom-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSection();
                  } else if (e.key === 'Escape') {
                    handleCancelAdd();
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateSection}
                  disabled={!newSectionTitle.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          pageId={currentPageData.id}
          onRestore={() => {
            refreshWikiData();
          }}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          pageId={currentPageData.id}
          pageTitle={currentPageData.title}
        />

        {/* Comments Section - Only show if enabled */}
        {currentPageData.id && currentPageData.comments_enabled ? (
          <CommentSection pageId={currentPageData.id} />
        ) : null}
      </div>
    </main>
  );
};
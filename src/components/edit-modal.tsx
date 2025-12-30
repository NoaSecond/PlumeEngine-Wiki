import React, { useState, useEffect } from 'react';
import { Save, X, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { MarkdownRenderer } from './markdown-renderer';
import logger from '../utils/logger';

export const EditModal: React.FC = () => {
  const {
    isEditModalOpen,
    setIsEditModalOpen,
    editingPageTitle,
    setEditingPageTitle,
    wikiData,
    updatePage,
    renameSectionTitle,
    isDarkMode
  } = useWiki();
  const { t } = useTranslation();

  const [content, setContent] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [pageIcon, setPageIcon] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (isEditModalOpen && editingPageTitle) {
      // Si c'est une section (format: "pageId:sectionId")
      if (editingPageTitle.includes(':')) {
        const [mainPageId, sectionId] = editingPageTitle.split(':');
        const mainPage = wikiData[mainPageId];
        if (mainPage?.sections) {
          const section = mainPage.sections.find(s => s.id === sectionId);
          if (section) {
            setContent(section.content);
            setSectionTitle(section.title);
          }
        }
      } else {
        // Page simple (cas rare maintenant)
        const page = wikiData[editingPageTitle];
        if (page?.content) {
          setContent(page.content);
          setSectionTitle(page.title);
          setPageIcon(page.icon || '');
        }
      }
    }
  }, [isEditModalOpen, editingPageTitle, wikiData]);

  const handleSave = async () => {
    if (editingPageTitle) {
      try {
        logger.debug('🔧 Début de la sauvegarde', { editingPageTitle, sectionTitle, content: content.substring(0, 50) + '...' });

        // Si c'est une section et que le titre a changé, le renommer d'abord
        if (editingPageTitle.includes(':')) {
          const [mainPageId, sectionId] = editingPageTitle.split(':');
          const mainPage = wikiData[mainPageId];
          logger.debug('🔧 Traitement de section', { mainPageId, sectionId, hasPage: !!mainPage });

          if (mainPage?.sections) {
            const section = mainPage.sections.find(s => s.id === sectionId);
            logger.debug('🔧 Section trouvée', { section: section ? { id: section.id, title: section.title } : null, newTitle: sectionTitle.trim() });

            if (section && section.title !== sectionTitle.trim() && sectionTitle.trim()) {
              // Renommer le titre de la section d'abord
              logger.info('🏷️ Renommage en cours', `"${section.title}" → "${sectionTitle.trim()}"`);
              await renameSectionTitle(mainPageId, sectionId, sectionTitle.trim());
              logger.info('🏷️ Titre de section modifié', `"${section.title}" → "${sectionTitle.trim()}"`);

              // IMPORTANT: Attendre un peu pour que les données se rechargent
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }

        // Puis sauvegarder le contenu
        await updatePage(editingPageTitle, content, pageIcon);
        logger.info('✅ Section sauvegardée', editingPageTitle);

        setIsEditModalOpen(false);
        setEditingPageTitle(null);
      } catch (error) {
        logger.error('❌ Erreur lors de la sauvegarde', error instanceof Error ? error.message : String(error));
      }
    }
  };

  const handleCancel = () => {
    logger.debug('❌ Édition annulée', editingPageTitle || 'unknown');
    setIsEditModalOpen(false);
    setEditingPageTitle(null);
    setContent('');
    setSectionTitle('');
    setPageIcon('');
  };

  if (!isEditModalOpen || !editingPageTitle) {
    return null;
  }

  // Déterminer le titre à afficher
  const getEditingTitle = () => {
    if (editingPageTitle && editingPageTitle.includes(':')) {
      const [mainPageId, sectionId] = editingPageTitle.split(':');
      const mainPage = wikiData[mainPageId];
      if (mainPage?.sections) {
        const section = mainPage.sections.find(s => s.id === sectionId);
        return section ? `${mainPage.title} - ${section.title}` : t('errors.notFound');
      }
    }
    return wikiData[editingPageTitle]?.title || t('errors.notFound');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('common.edit')} : {getEditingTitle()}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isPreview
                ? `${isDarkMode ? 'bg-slate-600 text-white' : 'bg-gray-300 text-gray-800'}`
                : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isPreview ? t('common.edit') : t('common.preview')}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </button>
          </div>
        </div>

        {/* Section Title Editor (only for sections) */}
        {editingPageTitle && editingPageTitle.includes(':') && (
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center space-x-4">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('pages.sectionTitle')}:
              </label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder={t('pages.sectionTitle')}
              />
            </div>
          </div>

        )}

        {/* Page Icon Editor (only for main pages) */}
        {editingPageTitle && !editingPageTitle.includes(':') && (
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center space-x-4">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('pages.icon') || 'Icon'}:
              </label>
              <input
                type="text"
                value={pageIcon}
                onChange={(e) => setPageIcon(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="icon-name (e.g. file-plus, home)"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          {!isPreview && (
            <div className="w-full p-6">
              <div className="mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('editor.markdownEditor')}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('editor.markdownHelp')}
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full h-full border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 mini-scrollbar ${isDarkMode
                  ? 'bg-slate-900 text-white border-slate-600'
                  : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                placeholder={t('editor.contentPlaceholder')}
              />
            </div>
          )}

          {/* Preview */}
          {isPreview && (
            <div className="w-full p-6 overflow-y-auto content-scrollbar">
              <div className="mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('common.preview')}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('editor.previewHelp')}
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <div>
              <p>💡 <strong>{t('common.tip')} :</strong> {t('editor.markdownHelp')}</p>
            </div>
            <div>
              {t('pages.lastModified')} : {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};
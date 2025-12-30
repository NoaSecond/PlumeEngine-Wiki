import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import { MarkdownRenderer } from './markdown-renderer';
import { SectionParser } from '../utils/sectionParser';
import logger from '../utils/logger';

interface Section {
  id: string;
  title: string;
  content: string;
  level: number;
  anchor?: string;
}

interface ContentRendererProps {
  content: string;
  pageId: string;
  searchTerm?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, pageId, searchTerm }) => {
  const { isDarkMode, setIsEditModalOpen, setEditingPageTitle, canContribute } = useWiki();
  const { t } = useTranslation();

  // Parser le contenu en sections basées sur les titres Markdown
  const parseSections = (text: string): Section[] => {
    const lines = text.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Sauvegarder la section précédente
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          sections.push(currentSection);
        }

        // Créer une nouvelle section
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        currentSection = {
          id: `section-${sections.length}`,
          title,
          content: '',
          level,
          anchor: SectionParser.createAnchor(title)
        };
        contentLines = [];
      } else {
        contentLines.push(line);
      }
    }

    // Ajouter la dernière section
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      sections.push(currentSection);
    }

    // Si aucune section trouvée, traiter tout le contenu comme une seule section
    if (sections.length === 0) {
      sections.push({
        id: 'section-0',
        title: 'Main Content',
        content: text,
        level: 1,
        anchor: 'contenu-principal'
      });
    }

    return sections;
  };

  const sections = parseSections(content);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    // Si une seule section, l'afficher dépliée par défaut
    sections.length === 1 ? new Set([sections[0].id]) : new Set()
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEditSection = (sectionId: string) => {
    setEditingPageTitle(`${pageId}:${sectionId}`);
    setIsEditModalOpen(true);
    logger.debug('🖊️ Début de l\'édition de section', sectionId);
  };

  if (sections.length === 0) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        <p>{t('common.noContent')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const headerSize = section.level === 1 ? 'text-xl' :
          section.level === 2 ? 'text-lg' : 'text-base';

        return (
          <div
            key={section.id}
            id={section.anchor}
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${isDarkMode
              ? 'border-slate-700 bg-slate-800/50'
              : 'border-gray-200 bg-white'
              }`}
          >
            {/* En-tête de section */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isDarkMode
                ? 'hover:bg-slate-700/50'
                : 'hover:bg-gray-50'
                }`}
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
                <h3 className={`font-semibold ${headerSize} ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  {section.title}
                </h3>
              </div>

              {canContribute() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSection(section.id);
                  }}
                  className={`p-2 rounded-md transition-colors ${isDarkMode
                    ? 'hover:bg-slate-600 text-slate-400 hover:text-white'
                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('editor.editSection')}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contenu de section */}
            {isExpanded && (
              <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="p-6">
                  <MarkdownRenderer
                    content={section.content}
                    searchTerm={searchTerm}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

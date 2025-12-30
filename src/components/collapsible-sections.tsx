import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableSection from './sortable-section';
import { ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import { useWiki } from '../context/wiki-context';


import DateUtils from '../utils/dateUtils';
import logger from '../utils/logger';
import { MarkdownRenderer } from './markdown-renderer';
import { WikiSection } from '../types';

export interface CollapsibleSectionsProps {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    lastModified?: string;
    author?: string;
  }>;
  pageId: string;
}

export const CollapsibleSections: React.FC<CollapsibleSectionsProps> = ({ sections, pageId }) => {
  const { isDarkMode, setIsEditModalOpen, setEditingPageTitle, updatePage, refreshWikiData, wikiData, hasPermission } = useWiki();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    sections.length === 1 ? new Set([sections[0].id]) : new Set()
  );
  const [orderedSections, setOrderedSections] = useState<string[]>(sections.map((s) => s.id));

  React.useEffect(() => {
    setOrderedSections(sections.map((s) => s.id));
  }, [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = orderedSections.indexOf(String(active.id));
      const newIndex = orderedSections.indexOf(String(over.id));
      const newOrder = arrayMove(orderedSections, oldIndex, newIndex);
      setOrderedSections(newOrder);

      // Reconstruire le markdown de la page avec le nouvel ordre des sections
      const page = wikiData[pageId];

      if (!page || !Array.isArray(page.sections)) return;
      // On prend le contenu de chaque section dans le bon ordre
      const newContent = newOrder.map((sectionId) => {
        const s = page.sections!.find((sec: WikiSection) => sec.id === sectionId);
        if (!s) return '';
        // On suppose que chaque section a bien les balises SECTION/END_SECTION
        return `<!-- SECTION:${s.id}:${s.title} -->\n${s.content}\n<!-- END_SECTION:${s.id} -->`;
      }).join('\n\n');

      // On sauvegarde le nouvel ordre dans le backend
      await updatePage(pageId, newContent);
      // On rafraîchit les données pour que la sidebar soit à jour
      await refreshWikiData();
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEdit = (sectionId: string) => {
    logger.debug('✏️ Ouverture modal d\'édition', `Section: ${sectionId}`);
    setEditingPageTitle(`${pageId}:${sectionId}`);
    setIsEditModalOpen(true);
  };

  // Map des sections par id pour accès rapide
  const sectionMap = React.useMemo(() => {
    const map: Record<string, CollapsibleSectionsProps['sections'][0]> = {};
    sections.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [sections]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => setExpandedSections(new Set())}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedSections} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {orderedSections.map((sectionId) => {
            const section = sectionMap[sectionId];
            const isExpanded = expandedSections.has(section.id);
            return (
              <SortableSection
                key={section.id}
                id={section.id}
                isDarkMode={isDarkMode}
                isExpanded={isExpanded}
                canDrag={hasPermission('edit_pages')}
              >
                <div
                  id={`section-${section.id}`}
                  className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}
                >
                  {/* Header de la section */}
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{section.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{DateUtils.getRelativeTime(section.lastModified || DateUtils.getCurrentTimestamp())} par {section.author || 'Inconnu'}</div>
                      {hasPermission('edit_pages') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(section.id);
                          }}
                          className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-slate-500 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}
                          title="Modifier cette section"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Contenu de la section */}
                  {isExpanded && (
                    <div className={`p-6 border-t ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      <MarkdownRenderer content={section.content} />
                    </div>
                  )}
                </div>
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

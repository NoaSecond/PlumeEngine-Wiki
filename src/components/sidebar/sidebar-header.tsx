import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../../context/wiki-context';

interface SidebarHeaderProps {
    onAddCategory: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onAddCategory }) => {
    const { isDarkMode, hasPermission } = useWiki();
    const { t } = useTranslation();

    return (
        <div className="p-4 flex-shrink-0">
            <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                {t('navigation.home')}
            </h2>

            {/* Add Category Button */}
            {hasPermission('create_pages') && (
                <div className="mb-4">
                    <button
                        onClick={onAddCategory}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg border-2 border-dashed transition-colors border-custom-border text-custom-muted hover:bg-primary/5 hover:border-primary/50 hover:text-primary`}
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('sidebar.createPage')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SidebarHeader;

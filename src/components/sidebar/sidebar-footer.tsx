import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useWiki } from '../../context/wiki-context';

interface SidebarFooterProps {
    appVersion: string;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ appVersion }) => {
    const { isDarkMode } = useWiki();

    return (
        <div className={`flex-shrink-0 py-2 px-4 border-t text-center bg-custom-sidebar border-custom-border`}>
            <a
                href="https://github.com/NoaSecond/Open-Book-Wiki"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-1.5 text-xs transition-colors duration-300 hover:underline ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <span className="font-medium">Open Book Wiki</span>
                <span className={`opacity-60 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>v{appVersion}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
        </div>
    );
};

export default SidebarFooter;

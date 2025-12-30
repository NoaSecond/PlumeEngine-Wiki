import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { WikiHistoryEntry, WikiHistoryDetail } from '../types';
import authService from '../services/auth-service';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';
import { MarkdownRenderer } from './markdown-renderer';

interface HistoryModalProps {
    pageId: string | number;
    isOpen: boolean;
    onClose: () => void;
    onRestore: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ pageId, isOpen, onClose, onRestore }) => {
    const { isDarkMode, updatePage, hasPermission } = useWiki();
    const { t } = useTranslation();
    const [history, setHistory] = useState<WikiHistoryEntry[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<WikiHistoryDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (isOpen && pageId) {
            fetchHistory();
            setSelectedVersion(null);
        }
    }, [isOpen, pageId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await authService.fetchWithAuth<{ success: boolean; history: WikiHistoryEntry[] }>(`/wiki/${pageId}/history`);
            if (response.success && response.history) {
                setHistory(response.history);
            }
        } catch (error) {
            logger.error('Error fetching history', error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectVersion = async (historyId: number) => {
        setLoadingDetail(true);
        try {
            const response = await authService.fetchWithAuth<{ success: boolean; version: WikiHistoryDetail }>(`/wiki/${pageId}/history/${historyId}`);
            if (response.success && response.version) {
                setSelectedVersion(response.version);
            }
        } catch (error) {
            logger.error('Error fetching version detail', error instanceof Error ? error.message : String(error));
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedVersion) return;

        if (confirm(t('history.confirmRestore'))) {
            try {
                await updatePage(String(pageId), selectedVersion.content);
                onRestore();
                onClose();
            } catch (error) {
                logger.error('Error restoring version', error instanceof Error ? error.message : String(error));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
                {/* Sidebar: List */}
                <div className={`w-1/3 border-r flex flex-col ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                        <h3 className="font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5" /> {t('history.pageHistory')}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">{t('common.loading')}</div>
                        ) : history.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">{t('history.noHistory')}</div>
                        ) : (
                            <ul className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                                {history.map(entry => (
                                    <li
                                        key={entry.id}
                                        onClick={() => handleSelectVersion(entry.id)}
                                        className={`p-4 cursor-pointer transition-colors ${selectedVersion?.id === entry.id
                                            ? 'bg-blue-500 bg-opacity-20 border-l-4 border-blue-500'
                                            : `hover:bg-opacity-10 hover:bg-blue-500 ${isDarkMode ? 'border-l-4 border-transparent' : ''}`
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{DateUtils.formatDate(entry.changed_at)}</div>
                                        <div className="text-xs opacity-70">{t('history.modifiedBy')} {entry.changed_by_username || t('common.unknown')}</div>
                                        <div className={`text-xs truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{entry.title}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* content: Preview */}
                <div className="flex-1 flex flex-col w-2/3">
                    <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                        <h3 className="font-bold">{t('common.preview')}</h3>
                        <div className="flex gap-2">
                            {selectedVersion && hasPermission('edit_pages') && (
                                <button
                                    onClick={handleRestore}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" /> {t('history.restoreVersion')}
                                </button>
                            )}
                            <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                        {loadingDetail ? (
                            <div className="flex items-center justify-center h-full">{t('common.loading')}</div>
                        ) : selectedVersion ? (
                            <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                                <MarkdownRenderer content={selectedVersion.content} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                {t('history.selectVersion')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

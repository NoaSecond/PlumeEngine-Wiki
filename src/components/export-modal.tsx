import React, { useState } from 'react';
import { Download, FileText, Code, FileCode, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import authService from '../services/auth-service';
import logger from '../utils/logger';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: string | number;
    pageTitle: string;
}

type ExportFormat = 'markdown' | 'html' | 'pdf';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, pageId, pageTitle }) => {
    const { isDarkMode } = useWiki();
    const { t } = useTranslation();
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Create a temporary link and trigger download
            const url = authService.getApiUrl(`/export/${pageId}/${selectedFormat}`);
            const token = localStorage.getItem('wiki_token');

            const link = document.createElement('a');
            link.href = url;
            link.download = `${pageTitle}.${selectedFormat === 'pdf' ? 'pdf' : selectedFormat === 'html' ? 'html' : 'md'}`;

            // Add authorization header via fetch and blob
            const fileResponse = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!fileResponse.ok) {
                throw new Error('Export failed');
            }

            const blob = await fileResponse.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            onClose();
        } catch (error) {
            logger.error('Export error', error instanceof Error ? error.message : String(error));
            alert(t('export.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    const formats = [
        {
            id: 'markdown' as ExportFormat,
            name: t('export.markdown'),
            description: t('export.markdownDesc'),
            icon: FileText,
            extension: '.md'
        },
        {
            id: 'html' as ExportFormat,
            name: t('export.html'),
            description: t('export.htmlDesc'),
            icon: Code,
            extension: '.html'
        },
        {
            id: 'pdf' as ExportFormat,
            name: t('export.pdf'),
            description: t('export.pdfDesc'),
            icon: FileCode,
            extension: '.pdf'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-xl max-w-2xl w-full mx-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Download className="w-6 h-6" />
                        {t('export.exportPage')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="mb-6 text-gray-600 dark:text-slate-400">
                        {t('export.selectFormat')} <strong>{pageTitle}</strong>
                    </p>

                    <div className="space-y-3">
                        {formats.map((format) => {
                            const Icon = format.icon;
                            const isSelected = selectedFormat === format.id;

                            return (
                                <button
                                    key={format.id}
                                    onClick={() => setSelectedFormat(format.id)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${isSelected
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-700'
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{format.name}</h3>
                                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                                    {format.extension}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                                {format.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? t('export.exporting') : t('export.export')}
                    </button>
                </div>
            </div>
        </div>
    );
};

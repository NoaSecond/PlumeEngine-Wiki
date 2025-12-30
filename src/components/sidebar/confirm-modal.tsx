import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    type = 'danger'
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        info: 'bg-primary hover:bg-primary-hover text-white'
    };

    const iconColors = {
        danger: 'text-red-500',
        warning: 'text-yellow-500',
        info: 'text-primary'
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
            <div className="bg-custom-surface border border-custom-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-custom-border">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-5 h-5 ${iconColors[type]}`} />
                        <h2 className="text-lg font-bold text-custom-text">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-custom-muted hover:text-custom-text transition-colors p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-custom-text/80 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 bg-custom-bg/50 border-t border-custom-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg transition-colors border border-custom-border text-custom-text bg-custom-bg hover:bg-custom-surface"
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg transition-all shadow-sm font-medium ${colors[type]}`}
                    >
                        {confirmText || t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

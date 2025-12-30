import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SvgIcon from '../svg-icon';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (categoryName: string, iconIndex: number) => Promise<void>;
    availableIcons: Array<{ name: string; label: string }>;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    availableIcons
}) => {
    const { t } = useTranslation();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIconIndex, setSelectedIconIndex] = useState(0);

    const handleCreate = async () => {
        if (newCategoryName.trim()) {
            await onCreate(newCategoryName, selectedIconIndex);
            setNewCategoryName('');
            setSelectedIconIndex(0);
        }
    };

    const handleCancel = () => {
        setNewCategoryName('');
        setSelectedIconIndex(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className={`p-6 rounded-xl shadow-2xl w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto bg-custom-surface border border-custom-border animate-in zoom-in-95 duration-200`}>
                <h2 className={`text-xl font-bold mb-4 text-custom-text`}>
                    {t('sidebar.createPage')}
                </h2>

                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t('pages.pageTitle')}
                    className={`w-full px-4 py-3 border rounded-lg mb-4 transition-all focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCreate();
                        } else if (e.key === 'Escape') {
                            handleCancel();
                        }
                    }}
                />

                <div className="mb-6">
                    <label className={`block text-sm font-medium mb-3 text-custom-muted`}>
                        {t('pages.icons')}:
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto content-scrollbar pr-1">
                        {availableIcons.map((iconData, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedIconIndex(index)}
                                className={`p-2 rounded-lg transition-all border flex items-center justify-center ${selectedIconIndex === index
                                    ? 'border-primary bg-primary/10'
                                    : 'border-custom-border bg-custom-bg hover:bg-custom-surface'
                                    }`}
                                title={iconData.label}
                            >
                                <SvgIcon
                                    name={iconData.name}
                                    className={`w-5 h-5 ${selectedIconIndex === index
                                        ? 'text-primary'
                                        : 'text-custom-muted'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-2">
                    <button
                        onClick={handleCancel}
                        className={`px-4 py-2 rounded-lg transition-colors border border-custom-border text-custom-text bg-custom-bg hover:bg-custom-surface`}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!newCategoryName.trim()}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-custom-muted/30 disabled:text-custom-muted disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {t('common.create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;

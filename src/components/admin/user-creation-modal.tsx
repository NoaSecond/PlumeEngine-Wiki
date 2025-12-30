import React, { useState } from 'react';
import { Mail, Save, X, Shield, UserCheck, Eye, Tag, UserPlus, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../../context/wiki-context';
import type { Tag as TagType } from '../../types';

export interface UserCreationData {
    username: string;
    email: string;
    password?: string;
    isAdmin: boolean;
    tags: string[];
    bio: string;
}

interface UserCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: UserCreationData) => Promise<void>;
    availableTags?: TagType[];
}

export const UserCreationModal: React.FC<UserCreationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    availableTags = []
}) => {
    const { isDarkMode } = useWiki();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        isAdmin: false,
        tags: [] as string[],
        bio: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTagColor = (tagName: string) => {
        const tag = availableTags.find(t => t.name === tagName);
        return tag ? tag.color : '#6B7280';
    };

    const getTagIcon = (tag: string) => {
        switch (tag) {
            case 'Administrateur':
                return <Shield className="w-3 h-3" />;
            case 'Contributeur':
                return <UserCheck className="w-3 h-3" />;
            case 'Visiteur':
                return <Eye className="w-3 h-3" />;
            default:
                return <Tag className="w-3 h-3" />;
        }
    };

    const handleSave = async () => {
        if (!formData.username || !formData.email || !formData.password) {
            setError('Username, email and password are required');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData(prev => ({
            ...prev,
            [e.target.name]: value
        }));
    };

    const handleTagToggle = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-lg shadow-xl flex flex-col`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center space-x-3">
                        <UserPlus className="w-6 h-6 text-primary" />
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {t('members.createUser')}
                        </h1>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('auth.username')}
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                placeholder={t('auth.username')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('auth.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    placeholder={t('auth.email')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.password')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                placeholder={t('auth.password')}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            name="isAdmin"
                            id="isAdmin"
                            checked={formData.isAdmin}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="isAdmin" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('members.adminPrivileges')}
                        </label>
                    </div>

                    <div className="space-y-3">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('members.tags')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map((tagObj) => (
                                <button
                                    key={tagObj.name}
                                    type="button"
                                    onClick={() => handleTagToggle(tagObj.name)}
                                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.tags.includes(tagObj.name)
                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-custom-bg scale-105'
                                        : 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                                        }`}
                                    style={{
                                        backgroundColor: getTagColor(tagObj.name),
                                        color: '#fff'
                                    }}
                                >
                                    {getTagIcon(tagObj.name)}
                                    <span>{tagObj.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('profile.bio')}
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full rounded-lg p-3 border focus:outline-none focus:ring-2 focus:ring-primary resize-none ${isDarkMode
                                ? 'bg-gray-700 text-white border-gray-600'
                                : 'bg-white text-gray-900 border-gray-300'
                                }`}
                            placeholder={t('profile.bioPlaceholder')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            } disabled:opacity-50`}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? t('common.saving') : t('common.create')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

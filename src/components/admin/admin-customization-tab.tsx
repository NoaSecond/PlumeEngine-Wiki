import React, { useState } from 'react';
import { Save, RotateCcw, Image as ImageIcon, Globe, Moon, Sun, Upload } from 'lucide-react';
import { getConfigService, AppConfig } from '../../services/config-service';
import logger from '../../utils/logger';

interface AdminCustomizationTabProps {
    isDarkMode: boolean;
}

export const AdminCustomizationTab: React.FC<AdminCustomizationTabProps> = ({ isDarkMode }) => {
    const configService = getConfigService();
    const currentConfig = configService.getConfig();

    const [config, setConfig] = useState<AppConfig>(currentConfig);
    const [hasChanges, setHasChanges] = useState(false);

    if (!config || !config.theme || !config.theme.light || !config.theme.dark) {
        return <div className="p-8 text-center">Loading configuration structure...</div>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
        setHasChanges(true);
    };

    const handleThemeColorChange = (mode: 'light' | 'dark', field: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                [mode]: {
                    ...prev.theme[mode],
                    [field]: value
                }
            }
        }));
        setHasChanges(true);
    };

    const handleImageUpload = async (field: 'logoUrl' | 'faviconUrl', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, we'll use a data URL. In production, you'd upload to a server
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setConfig(prev => ({ ...prev, [field]: dataUrl }));
            setHasChanges(true);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        configService.updateConfig(config);
        setHasChanges(false);
        logger.success('Customization saved successfully');

        // Update favicon if it changed
        if (config.faviconUrl !== currentConfig.faviconUrl) {
            configService.setFaviconUrl(config.faviconUrl);
        }

        // We might need a full reload to apply some changes (like favicon or deep theme changes)
        if (window.confirm('Some changes may require a page reload to be fully applied. Reload now?')) {
            window.location.reload();
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all customization to default?')) {
            configService.resetToDefault();
            setConfig(configService.getConfig());
            setHasChanges(false);
            window.location.reload();
        }
    };

    const ColorInput = ({
        label,
        mode,
        field,
        value
    }: {
        label: string,
        mode: 'light' | 'dark',
        field: string,
        value: string
    }) => {
        const [isEditingHex, setIsEditingHex] = useState(false);
        const [hexValue, setHexValue] = useState(value);

        const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHexValue(e.target.value);
        };

        const handleHexBlur = () => {
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
                handleThemeColorChange(mode, field, hexValue);
            } else {
                setHexValue(value); // Reset to original if invalid
            }
            setIsEditingHex(false);
        };

        return (
            <div className="flex items-center justify-between p-2 rounded border border-transparent hover:border-blue-500/20 transition-all">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
                <div className="flex items-center space-x-2">
                    {isEditingHex ? (
                        <input
                            type="text"
                            value={hexValue}
                            onChange={handleHexChange}
                            onBlur={handleHexBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleHexBlur();
                                if (e.key === 'Escape') {
                                    setHexValue(value);
                                    setIsEditingHex(false);
                                }
                            }}
                            className={`w-24 px-2 py-1 text-xs font-mono rounded border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            autoFocus
                        />
                    ) : (
                        <span
                            className="text-xs font-mono opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                            onClick={() => {
                                setHexValue(value);
                                setIsEditingHex(true);
                            }}
                            title="Click to edit"
                        >
                            {value}
                        </span>
                    )}
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                            handleThemeColorChange(mode, field, e.target.value);
                            setHexValue(e.target.value);
                        }}
                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Wiki Customization
                </h2>
                <div className="flex space-x-3">
                    <button
                        onClick={handleReset}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Defaults</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasChanges
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <section className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Identity & Content</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Wiki Name</label>
                        <input
                            type="text"
                            name="siteName"
                            value={config.siteName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Subtitle</label>
                        <input
                            type="text"
                            name="siteDescription"
                            value={config.siteDescription}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>
                </div>
            </section>

            {/* Assets */}
            <section className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Icons & Graphics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Logo</label>
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                name="logoUrl"
                                value={config.logoUrl}
                                onChange={handleInputChange}
                                className={`flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
                                placeholder="URL or path"
                            />
                            <label className={`flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <Upload className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload('logoUrl', e)}
                                    className="hidden"
                                />
                            </label>
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src={config.logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Favicon</label>
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                name="faviconUrl"
                                value={config.faviconUrl}
                                onChange={handleInputChange}
                                className={`flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
                                placeholder="URL or path"
                            />
                            <label className={`flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <Upload className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept=".ico,image/*"
                                    onChange={(e) => handleImageUpload('faviconUrl', e)}
                                    className="hidden"
                                />
                            </label>
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src={config.faviconUrl} alt="Favicon preview" className="w-6 h-6 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Themes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Light Theme */}
                <section className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Sun className="w-5 h-5 text-yellow-500" />
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Light Theme</h3>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <ColorInput label="Primary Color" mode="light" field="primaryColor" value={config.theme.light.primaryColor} />
                        <ColorInput label="Secondary Color" mode="light" field="secondaryColor" value={config.theme.light.secondaryColor} />
                        <ColorInput label="Background" mode="light" field="backgroundColor" value={config.theme.light.backgroundColor} />
                        <ColorInput label="Surface" mode="light" field="surfaceColor" value={config.theme.light.surfaceColor} />
                        <ColorInput label="Border" mode="light" field="borderColor" value={config.theme.light.borderColor} />
                        <ColorInput label="Text Color" mode="light" field="textColor" value={config.theme.light.textColor} />
                        <ColorInput label="Text Muted" mode="light" field="textMutedColor" value={config.theme.light.textMutedColor} />
                        <ColorInput label="Sidebar" mode="light" field="sidebarColor" value={config.theme.light.sidebarColor} />
                        <ColorInput label="Header" mode="light" field="headerColor" value={config.theme.light.headerColor} />
                        <ColorInput label="Accent" mode="light" field="accentColor" value={config.theme.light.accentColor} />
                    </div>
                </section>

                {/* Dark Theme */}
                <section className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Moon className="w-5 h-5 text-blue-400" />
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dark Theme</h3>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <ColorInput label="Primary Color" mode="dark" field="primaryColor" value={config.theme.dark.primaryColor} />
                        <ColorInput label="Secondary Color" mode="dark" field="secondaryColor" value={config.theme.dark.secondaryColor} />
                        <ColorInput label="Background" mode="dark" field="backgroundColor" value={config.theme.dark.backgroundColor} />
                        <ColorInput label="Surface" mode="dark" field="surfaceColor" value={config.theme.dark.surfaceColor} />
                        <ColorInput label="Border" mode="dark" field="borderColor" value={config.theme.dark.borderColor} />
                        <ColorInput label="Text Color" mode="dark" field="textColor" value={config.theme.dark.textColor} />
                        <ColorInput label="Text Muted" mode="dark" field="textMutedColor" value={config.theme.dark.textMutedColor} />
                        <ColorInput label="Sidebar" mode="dark" field="sidebarColor" value={config.theme.dark.sidebarColor} />
                        <ColorInput label="Header" mode="dark" field="headerColor" value={config.theme.dark.headerColor} />
                        <ColorInput label="Accent" mode="dark" field="accentColor" value={config.theme.dark.accentColor} />
                    </div>
                </section>
            </div>
        </div>
    );
};

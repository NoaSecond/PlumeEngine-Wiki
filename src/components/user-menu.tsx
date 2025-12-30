import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings, Grid3X3, Sun, Moon, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';

export const UserMenu: React.FC = () => {
  const { user, logout, isDarkMode, setCurrentPage, isAdmin, setIsAdminPanelOpen, toggleDarkMode, hasPermission } = useWiki();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags] = useState<Array<{ name: string, color: string }>>([]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setCurrentPage('Home');
  };

  const handleProfile = () => {
    setCurrentPage('profile');
    setIsOpen(false);
  };

  const handleAdminPanel = () => {
    setIsAdminPanelOpen(true);
    setIsOpen(false);
  };

  const handleToggleTheme = () => {
    toggleDarkMode();
    setIsOpen(false);
  };

  const handleChangeLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    setIsOpen(false);
  };

  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag ? tag.color : '#6b7280'; // Default color (gray-500)
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isDarkMode
          ? 'bg-slate-700 hover:bg-slate-600 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            user?.username.charAt(0).toUpperCase()
          )}
        </div>
        <span className="font-medium">{user?.username}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-20 mini-scrollbar ${isDarkMode
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-200'
            }`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    user?.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    {user?.username}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {user?.tags && user.tags.length > 0 && (
                      <>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getTagColor(user.tags[0]) }}
                        >
                          {user.tags[0]}
                        </span>
                        {user.tags.length > 1 && (
                          <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            +{user.tags.length - 1}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={handleProfile}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isDarkMode
                  ? 'hover:bg-slate-700 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>{t('navigation.profile')}</span>
              </button>

              <button
                onClick={handleToggleTheme}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isDarkMode
                  ? 'hover:bg-slate-700 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? t('header.lightMode') : t('header.darkMode')}</span>
              </button>

              <button
                onClick={handleChangeLanguage}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isDarkMode
                  ? 'hover:bg-slate-700 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
              >
                <Languages className="w-4 h-4" />
                <span>{t('header.language')}: {i18n.language.toUpperCase()}</span>
              </button>

              {(isAdmin() || hasPermission('admin_panel_access')) && (
                <button
                  onClick={handleAdminPanel}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isDarkMode
                    ? 'hover:bg-slate-700 text-white'
                    : 'hover:bg-gray-100 text-gray-900'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>{t('navigation.settings')}</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${isDarkMode
                  ? 'hover:bg-slate-700 text-red-400'
                  : 'hover:bg-gray-100 text-red-600'
                  }`}
              >
                <LogOut className="w-4 h-4" />
                <span>{t('navigation.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Search, LogIn, Edit3, Sun, Moon, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { UserMenu } from './user-menu';
import { LoginModal } from './login-modal';
import { getConfigService } from '../services/config-service';
import logger from '../utils/logger';

export const Header: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    user,
    isDarkMode,
    toggleDarkMode,
    setCurrentPage,
    getFirstNavigationPage,
    openAdminTab
  } = useWiki();

  const { t, i18n } = useTranslation();
  const configService = getConfigService();
  const siteName = configService.getSiteName();
  const siteDescription = configService.getSiteDescription();
  const logoUrl = configService.getLogoUrl();

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleEditClick = () => {
    openAdminTab('customization');
    logger.debug('🎨 Opening customization tab');
  };

  const changeLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    logger.debug('🌐 Language changed to:', newLang);
  };

  return (
    <>
      <header className={`shadow-lg border-b transition-colors duration-300 bg-custom-header border-custom-border`}>
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const firstPageId = getFirstNavigationPage();
                    if (firstPageId) {
                      setCurrentPage(firstPageId);
                      logger.debug('🏠 Navigation vers la première page:', firstPageId);
                    } else {
                      // Fallback si aucune page trouvée, mais normalement getFirstNavigationPage s'en charge
                      setCurrentPage('Home');
                      logger.debug('🏠 Navigation vers l\'accueil (fallback)');
                    }
                  }}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                  title={t('navigation.home')}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img
                      src={logoUrl || "/Icon.svg"}
                      alt={`${siteName} Icon`}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300 text-custom-text`}>
                      {siteName || 'Open Book Wiki'}
                    </h1>
                    <p className={`text-sm transition-colors duration-300 text-custom-muted`}>
                      {siteDescription || 'Open source wiki'}
                    </p>
                  </div>
                </button>

                {user?.isAdmin && (
                  <button
                    onClick={handleEditClick}
                    className={`p-1 rounded hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                    title={t('header.customize')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 text-custom-text/40`} />
                <input
                  type="text"
                  placeholder={t('header.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.length > 2) {
                      logger.debug('🔍 Recherche', e.target.value);
                    }
                  }}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64 transition-colors duration-300 bg-custom-bg text-custom-text border-custom-border`}
                />
              </div>

              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      logger.auth('🔐 Ouverture du modal de connexion');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('auth.login')}</span>
                  </button>
                  <button
                    onClick={changeLanguage}
                    className={`p-2 rounded-lg transition-colors bg-custom-surface hover:bg-custom-surface/80 text-primary flex items-center space-x-1`}
                    title={t('header.language')}
                  >
                    <Languages className="w-4 h-4" />
                    <span className="text-xs font-semibold">{i18n.language.toUpperCase()}</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      logger.debug('🎨 Basculement de thème:', !isDarkMode ? 'sombre' : 'clair');
                    }}
                    className={`p-2 rounded-lg transition-colors bg-custom-surface hover:bg-custom-surface/80 text-primary`}
                    title={isDarkMode ? t('header.lightMode') : t('header.darkMode')}
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

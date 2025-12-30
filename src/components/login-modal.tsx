import React, { useState } from 'react';
import { X, User, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import authService from '../services/auth-service';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setUser, isDarkMode } = useWiki();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.login(username, password);

      if (result.success && result.user) {
        setUser(result.user);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(result.message || t('auth.invalidCredentials'));
      }
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl w-96 max-w-90vw ${isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            {t('auth.login')}
          </h2>
          <button
            onClick={handleClose}
            className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                {t('auth.username')}
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username')}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    }`}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('common.loading') : t('auth.login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
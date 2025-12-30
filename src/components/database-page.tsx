import React, { useState, useEffect } from 'react';
import { Database, Users, FileText, Activity, Eye, EyeOff } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import logger from '../utils/logger';
import { getConfigService } from '../services/config-service';
import type { User, WikiPage, Activity as ActivityType } from '../types';

interface DatabaseStats {
  users: User[];
  pages: WikiPage[];
  activities: ActivityType[];
}

export const DatabasePage: React.FC = () => {
  const { isDarkMode, isAdmin } = useWiki();
  const configService = getConfigService();
  const [dbStats, setDbStats] = useState<DatabaseStats>({ users: [], pages: [], activities: [] });
  const [activeTab, setActiveTab] = useState<'users' | 'pages' | 'activities'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        setIsLoading(true);

        // Charger les utilisateurs (nécessite les droits admin)
        if (isAdmin()) {
          try {
            const usersResponse = await fetch(configService.getApiUrl('/auth/users'), {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              setDbStats(prev => ({ ...prev, users: usersData.users || [] }));
            }
          } catch (error) {
            logger.error('Erreur lors du chargement des utilisateurs', { error: error instanceof Error ? error.message : String(error) });
          }
        }

        // Charger les pages
        try {
          const pagesResponse = await fetch(configService.getApiUrl('/wiki'));
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            setDbStats(prev => ({ ...prev, pages: pagesData.pages || [] }));
          }
        } catch (error) {
          logger.error('Erreur lors du chargement des pages', { error: error instanceof Error ? error.message : String(error) });
        }

        // Charger les activités
        try {
          const activitiesResponse = await fetch(configService.getApiUrl('/activities'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json();
            setDbStats(prev => ({ ...prev, activities: activitiesData.activities || [] }));
          }
        } catch (error) {
          logger.error('Erreur lors du chargement des activités', { error: error instanceof Error ? error.message : String(error) });
        }

      } catch (error) {
        logger.error('Erreur lors du chargement des données de la base', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setIsLoading(false);
      }
    };

    loadDatabaseData();
  }, [isAdmin, configService]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <span className="ml-3">Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-8 h-8 text-cyan-600" />
            <h1 className="text-3xl font-bold">Base de données</h1>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Visualisation des données de la base de données Open Book Wiki
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">Utilisateurs</h3>
                <p className="text-2xl font-bold text-blue-600">{dbStats.users.length}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Pages</h3>
                <p className="text-2xl font-bold text-green-600">{dbStats.pages.length}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold">Activités</h3>
                <p className="text-2xl font-bold text-purple-600">{dbStats.activities.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} mb-6`}>
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'pages', label: 'Pages', icon: FileText },
              { id: 'activities', label: 'Activités', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'users' | 'pages' | 'activities')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === id
                  ? 'border-cyan-600 text-cyan-600'
                  : isDarkMode
                    ? 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
          {activeTab === 'users' && (
            <div>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-gray-200 bg-gray-50'
                }`}>
                <h3 className="text-lg font-semibold">Utilisateurs ({dbStats.users.length})</h3>
                {isAdmin() && (
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${showPasswords
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showPasswords ? 'Masquer' : 'Afficher'} mots de passe</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Créé le</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dernière connexion</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {dbStats.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.is_admin
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {user.is_admin ? 'Admin' : 'Utilisateur'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.created_at ? formatDate(user.created_at) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-gray-200 bg-gray-50'
                }`}>
                <h3 className="text-lg font-semibold">Pages Wiki ({dbStats.pages.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Auteur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Protégée</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Créée le</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Modifiée le</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {dbStats.pages.map((page) => (
                      <tr key={page.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{page.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{page.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{page.author_username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${page.is_protected
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {page.is_protected ? 'Protégée' : 'Libre'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{page.created_at ? formatDate(page.created_at) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{page.updated_at ? formatDate(page.updated_at) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-gray-200 bg-gray-50'
                }`}>
                <h3 className="text-lg font-semibold">Activités récentes ({dbStats.activities.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {dbStats.activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{activity.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${activity.type === 'auth'
                            ? 'bg-blue-100 text-blue-800'
                            : activity.type === 'wiki'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{activity.title}</td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">{activity.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{activity.username || `ID:${activity.user_id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(activity.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

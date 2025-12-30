import React, { useState } from 'react';
import { Edit3, Calendar, Trophy, Shield, UserCheck, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { User } from '../types';
import authService from '../services/auth-service';
import { DateUtils } from '../utils/dateUtils';

// Type étendu pour l'affichage des membres avec propriétés optionnelles
type DisplayUser = User & {
  joinDate?: string;
  contributions?: number;
  bio?: string;
};

interface EditingUserData {
  id: number;
  username: string;
  email: string;
  avatar: string;
  tags: string[];
  password?: string;
}

export const MembersPage: React.FC = () => {
  const { isAdmin } = useWiki();
  const { t } = useTranslation();
  const [editingUserData, setEditingUserData] = useState<EditingUserData | null>(null);
  const [allUsers, setAllUsers] = useState<DisplayUser[]>([]);

  // Charger les utilisateurs
  React.useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin()) {
        try {
          const users = await authService.getAllUsers();
          setAllUsers(users);
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        }
      }
    };
    fetchUsers();
  }, [isAdmin]);

  const availableTags = ['Visiteur', 'Contributeur', 'Administrateur'];

  if (!isAdmin()) {
    return (
      <main className={`flex-1 p-6 content-scrollbar bg-custom-bg`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 text-custom-text`}>
            {t('errors.forbidden')}
          </h1>
          <p className={`text-custom-muted`}>
            {t('errors.unauthorized')}
          </p>
        </div>
      </main>
    );
  }

  const handleEditProfile = (user: DisplayUser) => {
    setEditingUserData({
      id: user.id,
      username: user.username,
      email: user.email || '',
      avatar: user.avatar || '',
      tags: [...(user.tags || [])],
      password: ''
    });
  };

  const handleSaveProfile = async () => {
    if (!editingUserData) return;

    try {
      const success = await authService.updateUser(editingUserData.id, {
        username: editingUserData.username,
        email: editingUserData.email,
        avatar: editingUserData.avatar,
        tags: editingUserData.tags
        // password: editingUserData.password || undefined // Note: authService.updateUser doesn't support password update yet via simple PUT
      });

      if (success) {
        setEditingUserData(null);
        // Recharger la liste
        const users = await authService.getAllUsers();
        setAllUsers(users);
      } else {
        alert('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const success = await authService.deleteUser(userId);
      if (success) {
        // Recharger la liste
        const users = await authService.getAllUsers();
        setAllUsers(users);
      } else {
        alert('Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return 'bg-red-500';
      case 'Contributeur':
        return 'bg-blue-500';
      case 'Visiteur':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
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
        return <Eye className="w-3 h-3" />;
    }
  };

  return (
    <main className={`flex-1 p-6 content-scrollbar bg-custom-bg`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 text-custom-text`}>
          {t('members.members')}
        </h1>

        <div className="space-y-6">
          {allUsers.map((user: DisplayUser) => (
            <div
              key={user.id}
              className={`p-6 rounded-lg border transition-all duration-200 border-custom-border bg-custom-surface hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                {/* Informations utilisateur */}
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Nom et email */}
                  <div>
                    <h3 className={`text-xl font-semibold text-custom-text`}>
                      {user.username}
                    </h3>
                    {user.email && (
                      <p className={`text-sm text-custom-muted`}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(user.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                      >
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditProfile(user)}
                      className={`p-2 rounded-md transition-colors text-custom-muted hover:bg-custom-surface hover:text-custom-text`}
                      title="Modifier le profil"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(t('pages.confirmDelete'))) {
                          handleDeleteUser(user.id);
                        }
                      }}
                      className={`p-2 rounded-md transition-colors text-red-400 hover:bg-red-500 hover:text-white`}
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className={`mt-4 flex items-center space-x-6 text-sm text-custom-muted`}>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.joinedOn')} {user.joinDate ? DateUtils.formatDateShort(user.joinDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{user.contributions} {t('profile.contributions')}</span>
                </div>
              </div>

              {user.bio && (
                <div className={`mt-3 p-3 rounded-lg bg-custom-surface/50 border border-custom-border/50`}>
                  <p className={`text-sm text-custom-muted`}>
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'édition du profil */}
      {editingUserData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto bg-custom-surface border border-custom-border`}>
            <h2 className={`text-xl font-bold mb-4 text-custom-text`}>
              {t('profile.editProfile')}: {editingUserData.username}
            </h2>

            <div className="space-y-4">
              {/* Nom d'utilisateur */}
              <div>
                <label className={`block text-sm font-medium mb-1 text-custom-muted`}>
                  {t('auth.username')}
                </label>
                <input
                  type="text"
                  value={editingUserData.username}
                  onChange={(e) => setEditingUserData(prev =>
                    prev ? { ...prev, username: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-1 text-custom-muted`}>
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={editingUserData.email || ''}
                  onChange={(e) => setEditingUserData(prev =>
                    prev ? { ...prev, email: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className={`block text-sm font-medium mb-1 text-custom-muted`}>
                  {t('profile.avatar')} URL
                </label>
                <input
                  type="url"
                  value={editingUserData.avatar || ''}
                  onChange={(e) => setEditingUserData(prev =>
                    prev ? { ...prev, avatar: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className={`block text-sm font-medium mb-1 text-custom-muted`}>
                  {t('auth.password')} (Optionnel)
                </label>
                <input
                  type="password"
                  value={editingUserData.password || ''}
                  onChange={(e) => setEditingUserData(prev =>
                    prev ? { ...prev, password: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted`}
                  placeholder={t('auth.password')}
                />
              </div>

              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-2 text-custom-muted`}>
                  {t('members.role')}
                </label>
                <div className="space-y-2">
                  {availableTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingUserData.tags.includes(tag)}
                        onChange={() => {
                          setEditingUserData(prev => {
                            if (!prev) return null;
                            const newTags = prev.tags.includes(tag)
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag];
                            return { ...prev, tags: newTags };
                          });
                        }}
                        className="w-4 h-4 text-primary bg-custom-bg border-custom-border rounded focus:ring-primary"
                      />
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium text-white ${getTagColor(tag)}`}>
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditingUserData(null)}
                className={`px-4 py-2 rounded-lg transition-colors bg-custom-bg text-custom-text hover:bg-custom-surface border border-custom-border`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

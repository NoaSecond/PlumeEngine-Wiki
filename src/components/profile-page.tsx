import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Save, X, Award, Tag, Shield, UserCheck, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { AvatarEditor } from './avatar-editor';
import { DateUtils } from '../utils/dateUtils';
import { getConfigService } from '../services/config-service';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, isDarkMode } = useWiki();
  const { t } = useTranslation();
  const configService = getConfigService();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [tags, setTags] = useState<Array<{ id: number, name: string, color: string }>>([]);
  const [currentUser, setCurrentUser] = useState(user); // State local pour les données à jour
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(configService.getApiUrl('/auth/me'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          // Mettre à jour formData avec les nouvelles données
          setFormData({
            username: data.user.username || '',
            email: data.user.email || '',
            bio: data.user.bio || ''
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await fetch(configService.getApiUrl('/tags/public'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tags:', error);
      }
    };

    fetchUserData();
    fetchTags();
  }, [user, configService]); // Ajouter user comme dépendance

  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag ? tag.color : '#6B7280'; // Couleur par défaut si tag non trouvé
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

  if (!user || !currentUser) {
    return (
      <div className={`flex-1 p-6 bg-custom-bg`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className={`w-16 h-16 mx-auto mb-4 text-custom-muted`} />
            <h2 className={`text-2xl font-bold mb-2 text-custom-text`}>{t('profile.profile')}</h2>
            <p className="text-custom-muted">{t('auth.loginError')}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateUser({
      username: formData.username,
      email: formData.email,
      bio: formData.bio
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: currentUser.username,
      email: currentUser.email || '',
      bio: currentUser.bio || ''
    });
    setIsEditing(false);
  };

  const handleAvatarSave = (newAvatar: string) => {
    updateUser({ avatar: newAvatar });
    setShowAvatarEditor(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`flex-1 p-6 bg-custom-bg`}>
      <div className="max-w-4xl mx-auto">
        {/* En-tête du profil */}
        <div className={`rounded-lg p-6 mb-6 bg-custom-surface border border-custom-border shadow-sm`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar utilisateur"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {/* Bouton pour changer l'avatar */}
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center text-white transition-colors border-2 border-custom-sidebar shadow-md"
                  title={t('profile.editProfile')}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Informations de base */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`text-2xl font-bold rounded px-3 py-1 w-full max-w-md border focus:outline-none focus:ring-2 focus:ring-primary bg-custom-bg text-custom-text border-custom-border`}
                      placeholder={t('auth.username')}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`rounded px-3 py-1 w-full max-w-md border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDarkMode
                        ? 'bg-slate-700 text-slate-300 border-slate-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      placeholder={t('auth.email')}
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className={`text-2xl font-bold mb-1 text-custom-text`}>{currentUser.username}</h1>
                    <p className={`flex items-center text-custom-muted`}>
                      <Mail className="w-4 h-4 mr-2" />
                      {currentUser.email}
                    </p>
                  </div>
                )}

                <div className={`flex items-center space-x-4 mt-3 text-sm text-custom-muted`}>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {t('profile.joinedOn')} {currentUser.joinDate ? DateUtils.formatDateShort(currentUser.joinDate) : 'N/A'}
                  </span>
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    {currentUser.contributions || 0} {t('profile.contributions')}
                  </span>
                </div>

                {/* Tags utilisateur */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {(currentUser.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('common.save')}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                      ? 'bg-slate-600 hover:bg-slate-700 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                  >
                    <X className="w-4 h-4" />
                    <span>{t('common.cancel')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('profile.editProfile')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Biographie */}
        <div className={`rounded-lg p-6 mb-6 bg-custom-surface border border-custom-border shadow-sm`}>
          <h2 className={`text-xl font-semibold mb-4 text-custom-text`}>{t('profile.bio')}</h2>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={`w-full rounded-lg p-3 border focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${isDarkMode
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-gray-100 text-gray-900 border-gray-300'
                }`}
              placeholder={t('profile.bio')}
            />
          ) : (
            <div className="text-custom-text">
              {currentUser.bio ? (
                <p className="whitespace-pre-wrap">{currentUser.bio}</p>
              ) : (
                <p className={`italic text-custom-muted`}>{t('profile.bio')}</p>
              )}
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-lg p-6 text-center bg-custom-surface border border-custom-border shadow-sm`}>
            <div className="text-3xl font-bold text-primary mb-2">{currentUser.contributions || 0}</div>
            <div className="text-custom-muted">{t('profile.contributions')}</div>
          </div>

          <div className={`rounded-lg p-6 text-center bg-custom-surface border border-custom-border shadow-sm`}>
            <div className="text-3xl font-bold text-secondary mb-2">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className="text-custom-muted">{t('pages.editPage')}</div>
          </div>

          <div className={`rounded-lg p-6 text-center bg-custom-surface border border-custom-border shadow-sm`}>
            <div className="text-3xl font-bold text-accent mb-2">
              {currentUser.joinDate ? DateUtils.formatDateShort(currentUser.joinDate) : 'N/A'}
            </div>
            <div className="text-custom-muted">{t('profile.joinedOn')}</div>
          </div>
        </div>
      </div>

      {/* Modal d'édition d'avatar */}
      {showAvatarEditor && (
        <AvatarEditor
          currentAvatar={currentUser.avatar}
          onSave={handleAvatarSave}
          onCancel={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  );
};

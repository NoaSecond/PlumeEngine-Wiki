import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Activity as ActivityIcon, Users, Database, Tag, Shield, Settings } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import type { Tag as TagType, Permission, User, WikiPage, Activity } from '../types';
import activityService, { ActivityLog } from '../services/activity-service';
import authService from '../services/auth-service';
import { UserProfileModal } from './user-profile-modal';
import logger from '../utils/logger';
import { getConfigService } from '../services/config-service';

// Admin Components
import { AdminUsersTab } from './admin/admin-users-tab';
import { AdminActivityTab } from './admin/admin-activity-tab';
import { AdminDatabaseTab } from './admin/admin-database-tab';
import { AdminTagsTab } from './admin/admin-tags-tab';
import { AdminPermissionsTab } from './admin/admin-permissions-tab';
import { AdminCustomizationTab } from './admin/admin-customization-tab';
import { UserCreationModal, UserCreationData } from './admin/user-creation-modal';

export const SimpleAdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({
  isOpenFromMenu = false,
  onClose
}) => {
  const { isDarkMode, isAdmin, user, setUser, adminActiveTab, setAdminActiveTab, hasPermission } = useWiki();
  const { t } = useTranslation();
  const configService = getConfigService();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);

  // Permissions checks
  const canManageUsers = hasPermission('user_management');
  const canAccessAdmin = hasPermission('admin_panel_access') || isAdmin();

  // Define tabs with their required permissions
  const allTabs = useMemo(() => [
    { id: 'users', label: t('admin.tabs.users'), icon: Users, permission: 'user_management' },
    { id: 'activity', label: t('admin.tabs.activity'), icon: ActivityIcon, permission: 'view_activity_admin' },
    { id: 'database', label: t('admin.tabs.database'), icon: Database, permission: 'database_management' },
    { id: 'tags', label: t('admin.tabs.tags'), icon: Tag, permission: 'tag_management' },
    { id: 'permissions', label: t('admin.tabs.permissions'), icon: Shield, permission: 'permission_management' },
    { id: 'customization', label: t('admin.tabs.customization'), icon: Settings, permission: 'admin_panel_access' }
  ], [t]);

  // Filter available tabs
  const availableTabs = useMemo(() => {
    if (isAdmin()) return allTabs;
    return allTabs.filter(tab => hasPermission(tab.permission));
  }, [isAdmin, hasPermission, allTabs]);

  // Use adminActiveTab from context instead of local state for consistency
  const activeTab = adminActiveTab as 'users' | 'activity' | 'database' | 'tags' | 'permissions' | 'customization';
  const setActiveTab = (tab: string) => setAdminActiveTab(tab);

  // Ensure active tab is valid
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setAdminActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab, setAdminActiveTab]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  // Grouper les logs par jour (YYYY-MM-DD)
  const groupedActivityLogs = useMemo(() => {
    return activityLogs.reduce((acc: Record<string, ActivityLog[]>, log) => {
      const date = new Date(log.timestamp).toLocaleDateString('fr-CA');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {});
  }, [activityLogs]);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // States for Database tab
  const [dbStats, setDbStats] = useState<{ users: User[], pages: WikiPage[], activities: Activity[] }>({ users: [], pages: [], activities: [] });
  const [dbActiveTab, setDbActiveTab] = useState<'users' | 'pages' | 'activities'>('users');

  // States for user profile modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // States for Tags tab
  const [tags, setTags] = useState<TagType[]>([]);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [isAddingTag, setIsAddingTag] = useState(false);

  // States for Permissions tab
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [tagPermissions, setTagPermissions] = useState<TagType[]>([]);
  const [selectedTagForPermissions, setSelectedTagForPermissions] = useState<TagType | null>(null);
  const [hasUnsavedPermissionChanges, setHasUnsavedPermissionChanges] = useState(false);

  // States for user sorting and search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSortBy, setUserSortBy] = useState<'permissions' | 'name' | 'email' | 'contributions' | 'joinDate'>('permissions');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fonction pour obtenir le nombre de permissions d'un tag
  const getTagPermissionCount = (tagName: string): number => {
    const tagPerm = tagPermissions.find(tp => tp.name === tagName);
    return tagPerm ? (tagPerm.permissions?.length || 0) : 0;
  };

  // Fonction pour obtenir le score de permissions maximum d'un utilisateur
  const getUserMaxPermissionScore = (user: User): number => {
    if (!user.tags || user.tags.length === 0) return 0;
    return Math.max(...user.tags.map((tag: string) => getTagPermissionCount(tag)));
  };

  // Fonction de tri des utilisateurs
  const sortUsers = (users: User[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...users].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'permissions':
          valueA = getUserMaxPermissionScore(a);
          valueB = getUserMaxPermissionScore(b);
          break;
        case 'name':
          valueA = a.username.toLowerCase();
          valueB = b.username.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'contributions':
          valueA = a.contributions || 0;
          valueB = b.contributions || 0;
          break;
        case 'joinDate':
          valueA = new Date(a.created_at || 0).getTime();
          valueB = new Date(b.created_at || 0).getTime();
          break;
        default:
          valueA = getUserMaxPermissionScore(a);
          valueB = getUserMaxPermissionScore(b);
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;

      // Tri secondaire par nom d'utilisateur
      return a.username.localeCompare(b.username);
    });
  };

  // Filtrer les utilisateurs par terme de recherche
  const filteredUsers = allUsers.filter(user => {
    if (!userSearchTerm) return true;

    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  // Appliquer le tri aux utilisateurs filtrés
  const sortedUsers = sortUsers(filteredUsers, userSortBy, userSortOrder);

  useEffect(() => {
    setIsOpen(isOpenFromMenu);
  }, [isOpenFromMenu]);

  useEffect(() => {
    if (isOpen) {
      // Charger les logs d'activité
      const loadLogs = async () => {
        try {
          const logs = await activityService.getLogs(50);
          setActivityLogs(logs);
        } catch (error) {
          console.error('Erreur lors du chargement des logs:', error);
          logger.error(t('admin.errors.loadingLogs'));
        }
      };

      // Charger les utilisateurs
      const loadUsers = async () => {
        try {
          const users = await authService.getAllUsers();
          setAllUsers(users);
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          logger.error(t('admin.errors.loadingUsers'));
        }
      };

      // Charger les données BDD
      const loadDatabaseData = async () => {
        try {
          // Charger les utilisateurs pour l'onglet BDD
          const users = await authService.getAllUsers();
          setDbStats(prev => ({ ...prev, users: users }));

          // Charger les pages
          const pagesResponse = await fetch(configService.getApiUrl('/wiki'));
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            setDbStats(prev => ({ ...prev, pages: pagesData.pages || [] }));
          }

          // Charger les activités
          const activitiesResult = await activityService.getAllActivities(1, 100);
          if (activitiesResult) {
            setDbStats(prev => ({ ...prev, activities: activitiesResult.activities }));
          }
        } catch (error) {
          logger.error(t('admin.errors.loadingDatabase'), { error: error instanceof Error ? error.message : String(error) });
        }
      };

      // Charger les tags
      const loadTags = async () => {
        try {
          const response = await fetch(configService.getApiUrl('/tags'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setTags(data.tags || []);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des tags:', error);
          logger.error(t('admin.errors.loadingTags'));
        }
      };

      // Charger les permissions et les permissions des tags
      const loadPermissions = async () => {
        try {
          // Charger toutes les permissions
          const permissionsResponse = await fetch(configService.getApiUrl('/permissions'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
              'Content-Type': 'application/json'
            }
          });

          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions || []);
          }

          // Charger les permissions des tags
          const tagPermissionsResponse = await fetch(configService.getApiUrl('/permissions/tags'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
              'Content-Type': 'application/json'
            }
          });

          if (tagPermissionsResponse.ok) {
            const tagPermissionsData = await tagPermissionsResponse.json();
            setTagPermissions(tagPermissionsData.tagPermissions || []);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des permissions:', error);
          logger.error(t('admin.errors.loadingPermissions'));
        }
      };

      loadLogs();
      loadUsers();
      loadDatabaseData();
      loadTags();
      loadPermissions();
    }
  }, [isOpen, configService, t]);

  // Fonction pour ouvrir la modal de profil utilisateur
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Fonction pour sauvegarder les modifications de profil utilisateur
  const handleSaveUserProfile = async (userData: Partial<User>) => {
    try {
      if (!userData.id) throw new Error(t('admin.errors.missingUserId'));

      const success = await authService.updateUser(userData.id, {
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        tags: userData.tags,
        avatar: userData.avatar
      });

      if (success) {
        // Recharger la liste des utilisateurs
        const users = await authService.getAllUsers();
        setAllUsers(users);
        setDbStats(prev => ({ ...prev, users: users }));

        // Si l'utilisateur modifié est l'utilisateur connecté, mettre à jour le contexte
        if (user && userData.id === user.id) {
          const updatedUser = await authService.checkAuth();
          if (updatedUser) {
            setUser(updatedUser);
          }
        }

        setIsProfileModalOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error(t('common.saveError'));
      }
    } catch (error) {
      console.error(t('admin.errors.userProfileSave'), error);
      throw error;
    }
  };

  const handleCreateUserAdmin = async (userData: UserCreationData) => {
    try {
      const result = await authService.createUserAdmin(userData);
      if (result.success) {
        logger.success(t('admin.success.userCreated'));
        // Recharger la liste
        const users = await authService.getAllUsers();
        setAllUsers(users);
        setDbStats(prev => ({ ...prev, users: users }));
        setIsCreateUserModalOpen(false);
      } else {
        throw new Error(result.message || t('admin.errors.userCreation'));
      }
    } catch (error) {
      logger.error(t('admin.errors.userCreation'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  // Fonction pour obtenir la couleur d'un tag depuis la base de données
  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag ? tag.color : '#6B7280'; // Couleur par défaut si tag non trouvé
  };

  // Fonctions de gestion des tags
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;

    try {
      const response = await fetch(configService.getApiUrl('/tags'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTag)
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
            'Content-Type': 'application/json'
          }
        });

        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }

        setNewTag({ name: '', color: '#3B82F6' });
        setIsAddingTag(false);
      } else {
        const errorData = await response.json();
        alert(t('common.error') + ': ' + errorData.message);
      }
    } catch (error) {
      console.error(t('admin.errors.tagCreation'), error);
      alert(t('admin.errors.tagCreation'));
    }
  };

  const handleUpdateTag = async (tag: TagType) => {
    try {
      const response = await fetch(configService.getApiUrl(`/tags/${tag.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tag.name, color: tag.color })
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
            'Content-Type': 'application/json'
          }
        });

        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }

        setEditingTag(null);
      } else {
        const errorData = await response.json();
        alert(t('common.error') + ': ' + errorData.message);
      }
    } catch (error) {
      console.error(t('admin.errors.tagUpdate'), error);
      alert(t('admin.errors.tagUpdate'));
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm(t('admin.confirm.deleteTag'))) {
      return;
    }

    try {
      const response = await fetch(configService.getApiUrl(`/tags/${tagId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
            'Content-Type': 'application/json'
          }
        });

        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }
      } else {
        const errorData = await response.json();
        alert(t('common.error') + ': ' + errorData.message);
      }
    } catch (error) {
      console.error(t('admin.errors.tagDeletion'), error);
      alert(t('admin.errors.tagDeletion'));
    }
  };

  const handleUpdateTagPermissions = async (tagId: number, permissionIds: number[]) => {
    try {
      const response = await fetch(configService.getApiUrl(`/permissions/tags/${tagId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissionIds })
      });

      if (response.ok) {
        // Recharger les permissions des tags
        const tagPermissionsResponse = await fetch(configService.getApiUrl('/permissions/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')} `,
            'Content-Type': 'application/json'
          }
        });

        if (tagPermissionsResponse.ok) {
          const tagPermissionsData = await tagPermissionsResponse.json();
          setTagPermissions(tagPermissionsData.tagPermissions || []);

          // Mettre à jour le tag sélectionné
          const updatedTag = tagPermissionsData.tagPermissions.find((tp: TagType) => tp.id === tagId);
          if (updatedTag) {
            setSelectedTagForPermissions(updatedTag);
          }
        }
      } else {
        const errorData = await response.json();
        alert(t('common.error') + ': ' + errorData.message);
      }
    } catch (error) {
      console.error(t('admin.errors.permissionsUpdate'), error);
      alert(t('admin.errors.permissionsUpdate'));
    }
  };

  const handleTagSelectionForPermissions = (newTag: TagType) => {
    if (hasUnsavedPermissionChanges) {
      if (confirm(t('admin.confirm.unsavedChanges'))) {
        setSelectedTagForPermissions(newTag);
        setHasUnsavedPermissionChanges(false);
      }
    } else {
      setSelectedTagForPermissions(newTag);
    }
  };

  const handlePermissionEditorUpdate = (tagId: number, permissionIds: number[]) => {
    handleUpdateTagPermissions(tagId, permissionIds);
    setHasUnsavedPermissionChanges(false);
  };

  // Vérifier que l'utilisateur est admin (après tous les hooks)
  if (!canAccessAdmin) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-11/12 max-w-6xl h-5/6 bg-custom-bg rounded-lg shadow-xl flex flex-col overflow-hidden`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-custom-border`}>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            {t('admin.adminPanel')}
          </h1>
          <button
            onClick={handleClose}
            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b border-custom-border`}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'activity' | 'database' | 'tags' | 'permissions')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/10'
                : 'text-custom-muted hover:text-custom-text hover:bg-custom-surface/50'
                } `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'users' && (
            <AdminUsersTab
              filteredUsers={filteredUsers}
              allUsersCount={allUsers.length}
              userSearchTerm={userSearchTerm}
              setUserSearchTerm={setUserSearchTerm}
              userSortBy={userSortBy}
              setUserSortBy={setUserSortBy}
              userSortOrder={userSortOrder}
              setUserSortOrder={setUserSortOrder}
              sortedUsers={sortedUsers}
              handleEditUser={handleEditUser}
              onCreateUser={() => setIsCreateUserModalOpen(true)}
              hasUserManagementPermission={canManageUsers}
              isDarkMode={isDarkMode}
              getTagColor={getTagColor}
              getTagPermissionCount={getTagPermissionCount}
              getUserMaxPermissionScore={getUserMaxPermissionScore}
            />
          )}

          {activeTab === 'activity' && (
            <AdminActivityTab
              groupedActivityLogs={groupedActivityLogs}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'database' && (
            <AdminDatabaseTab
              dbStats={dbStats}
              dbActiveTab={dbActiveTab}
              setDbActiveTab={setDbActiveTab}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'tags' && (
            <AdminTagsTab
              tags={tags}
              isAddingTag={isAddingTag}
              setIsAddingTag={setIsAddingTag}
              newTag={newTag}
              setNewTag={setNewTag}
              handleCreateTag={handleCreateTag}
              editingTag={editingTag}
              setEditingTag={setEditingTag}
              handleUpdateTag={handleUpdateTag}
              handleDeleteTag={handleDeleteTag}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'permissions' && (
            <AdminPermissionsTab
              tagPermissions={tagPermissions}
              selectedTagForPermissions={selectedTagForPermissions}
              handleTagSelectionForPermissions={handleTagSelectionForPermissions}
              permissions={permissions}
              handlePermissionEditorUpdate={handlePermissionEditorUpdate}
              setHasUnsavedPermissionChanges={setHasUnsavedPermissionChanges}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'customization' && (
            <AdminCustomizationTab isDarkMode={isDarkMode} />
          )}
        </div>
      </div>

      {/* Modal de profil utilisateur */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUserProfile}
          isAdmin={true}
          availableTags={tags}
        />
      )}

      {/* Modal de création utilisateur */}
      <UserCreationModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSave={handleCreateUserAdmin}
        availableTags={tags}
      />
    </div>
  );
};

export default SimpleAdminPanel;

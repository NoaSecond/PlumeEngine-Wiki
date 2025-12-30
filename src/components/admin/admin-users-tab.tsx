import React from 'react';
import { Search, X, Users, Activity as ActivityIcon, Edit3, UserPlus } from 'lucide-react';
import { User } from '../../types';

interface AdminUsersTabProps {
    filteredUsers: User[];
    allUsersCount: number;
    userSearchTerm: string;
    setUserSearchTerm: (term: string) => void;
    userSortBy: string;
    setUserSortBy: (sortBy: 'permissions' | 'name' | 'email' | 'contributions' | 'joinDate') => void;
    userSortOrder: 'asc' | 'desc';
    setUserSortOrder: (order: 'asc' | 'desc') => void;
    sortedUsers: User[];
    handleEditUser: (user: User) => void;
    onCreateUser: () => void;
    hasUserManagementPermission: boolean;
    isDarkMode: boolean;
    getTagColor: (tagName: string) => string;
    getTagPermissionCount: (tagName: string) => number;
    getUserMaxPermissionScore: (user: User) => number;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
    filteredUsers,
    allUsersCount,
    userSearchTerm,
    setUserSearchTerm,
    userSortBy,
    setUserSortBy,
    userSortOrder,
    setUserSortOrder,
    sortedUsers,
    handleEditUser,
    onCreateUser,
    hasUserManagementPermission,
    isDarkMode,
    getTagColor,
    getTagPermissionCount,
    getUserMaxPermissionScore
}) => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Users ({filteredUsers.length}/{allUsersCount})
                    </h2>

                    {hasUserManagementPermission && (
                        <button
                            onClick={onCreateUser}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Create User</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search by name, email or tag..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                        {userSearchTerm && (
                            <button
                                onClick={() => setUserSearchTerm('')}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                    } transition-colors`}
                                title="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-col">
                        <label className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Sort by
                        </label>
                        <select
                            value={userSortBy}
                            onChange={(e) => setUserSortBy(e.target.value as 'permissions' | 'name' | 'email' | 'contributions' | 'joinDate')}
                            className={`px-3 py-2 rounded-lg border text-sm ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                            <option value="permissions">Permissions</option>
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="contributions">Contributions</option>
                            <option value="joinDate">Join Date</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Order
                        </label>
                        <button
                            onClick={() => setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc')}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                } focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-1`}
                        >
                            {userSortOrder === 'asc' ? (
                                <>↑ Ascending</>
                            ) : (
                                <>↓ Descending</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {sortedUsers.length > 0 ? (
                    sortedUsers.map(u => (
                        <div
                            key={u.id}
                            className={`p-4 rounded-lg border ${isDarkMode
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-gray-50 border-gray-200'
                                } `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
                                            {u.avatar ? (
                                                <img
                                                    src={u.avatar}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ActivityIcon className="w-8 h-8 text-purple-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                } `}>
                                                {u.username}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                } `}>
                                                {u.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(u.tags || []).map((tag: string) => {
                                            const permissionCount = getTagPermissionCount(tag);
                                            return (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 text-xs rounded text-white font-medium flex items-center gap-1"
                                                    style={{ backgroundColor: getTagColor(tag) }}
                                                    title={`${tag} - ${permissionCount} permissions`}
                                                >
                                                    {tag}
                                                    <span className="bg-white bg-opacity-20 px-1 rounded text-xs">
                                                        {permissionCount}
                                                    </span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className={`text-sm flex items-center gap-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        } `}>
                                        <span>Contributions: {u.contributions || 0}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                            } `}>
                                            Max permissions: {getUserMaxPermissionScore(u)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleEditUser(u)}
                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                            } `}
                                        title="Edit profile"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        } `}>
                        {userSearchTerm ? (
                            <div>
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No users found for "{userSearchTerm}"</p>
                                <p className="text-sm mt-1">Try other search terms</p>
                            </div>
                        ) : (
                            <div>
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No users found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

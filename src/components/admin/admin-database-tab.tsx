import React, { useState } from 'react';
import { Users, FileText, Activity as ActivityIcon, Eye, EyeOff } from 'lucide-react';
import { User, WikiPage, Activity } from '../../types';

interface AdminDatabaseTabProps {
    dbStats: {
        users: User[];
        pages: WikiPage[];
        activities: Activity[];
    };
    dbActiveTab: 'users' | 'pages' | 'activities';
    setDbActiveTab: (tab: 'users' | 'pages' | 'activities') => void;
    isDarkMode: boolean;
}

export const AdminDatabaseTab: React.FC<AdminDatabaseTabProps> = ({
    dbStats,
    dbActiveTab,
    setDbActiveTab,
    isDarkMode
}) => {
    const [showPasswords, setShowPasswords] = useState(false);

    return (
        <div>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Database Management
            </h2>

            {/* Database Sub-tabs */}
            <div className={`flex space-x-4 mb-6 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                } `}>
                {[
                    { id: 'users', label: 'Users', icon: Users, count: dbStats.users.length },
                    { id: 'pages', label: 'Pages', icon: FileText, count: dbStats.pages.length },
                    { id: 'activities', label: 'Activities', icon: ActivityIcon, count: dbStats.activities.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setDbActiveTab(tab.id as 'users' | 'pages' | 'activities')}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${dbActiveTab === tab.id
                            ? isDarkMode
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-blue-600 border-b-2 border-blue-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-600 hover:text-gray-800'
                            } `}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label} ({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Database Sub-tabs Content */}
            {dbActiveTab === 'users' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-md font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            } `}>
                            Users ({dbStats.users.length})
                        </h3>
                        <button
                            onClick={() => setShowPasswords(!showPasswords)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${isDarkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } `}
                        >
                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span>{showPasswords ? 'Hide' : 'Show'} passwords</span>
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {dbStats.users.map(user => (
                            <div
                                key={user.id}
                                className={`p-4 rounded-lg border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600'
                                    : 'bg-gray-50 border-gray-200'
                                    } `}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>ID:</strong> {user.id}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Username:</strong> {user.username}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Email:</strong> {user.email}
                                    </div>
                                    {showPasswords && (
                                        <div>
                                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Password Hash:</strong>
                                            <span className={`text-xs font-mono break-all ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                } `}>
                                                {user.password_hash}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Created At:</strong> {new Date(user.created_at || new Date().toISOString()).toLocaleString('en-US')}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Tags:</strong> {user.tags || 'None'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dbActiveTab === 'pages' && (
                <div>
                    <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        } `}>
                        Pages ({dbStats.pages.length})
                    </h3>

                    <div className="grid gap-4">
                        {dbStats.pages.map(page => (
                            <div
                                key={page.id}
                                className={`p-4 rounded-lg border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600'
                                    : 'bg-gray-50 border-gray-200'
                                    } `}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>ID:</strong> {page.id}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Title:</strong> {page.title}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Author:</strong> {page.author_username}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Created At:</strong> {page.created_at ? new Date(page.created_at).toLocaleString('en-US') : 'N/A'}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Updated At:</strong> {page.updated_at ? new Date(page.updated_at).toLocaleString('en-US') : 'N/A'}
                                    </div>
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Size:</strong> {page.content?.length || 0} characters
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dbActiveTab === 'activities' && (
                <div>
                    <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        } `}>
                        Activities ({dbStats.activities.length})
                    </h3>

                    <div className="grid gap-2">
                        {dbStats.activities.map(activity => (
                            <div
                                key={activity.id}
                                className={`p-3 rounded-lg border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600'
                                    : 'bg-gray-50 border-gray-200'
                                    } `}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                            {activity.username}
                                        </strong>
                                        <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} `}>
                                            {activity.type}
                                        </span>
                                        {activity.username && (
                                            <span className={`ml-2 font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                } `}>
                                                by {activity.username}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        } `}>
                                        {new Date(activity.created_at || new Date().toISOString()).toLocaleString('en-US')}
                                    </span>
                                </div>
                                {activity.title && (
                                    <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        } `}>
                                        {activity.title}
                                    </div>
                                )}
                            </div>
                        ))}
                        {dbStats.activities.length === 0 && (
                            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                } `}>
                                No activities found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

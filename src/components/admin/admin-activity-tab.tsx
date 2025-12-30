import React, { useState } from 'react';
import activityService, { ActivityLog } from '../../services/activity-service';

interface AdminActivityTabProps {
    groupedActivityLogs: Record<string, ActivityLog[]>;
    isDarkMode: boolean;
}

export const AdminActivityTab: React.FC<AdminActivityTabProps> = ({ groupedActivityLogs, isDarkMode }) => {
    // Local state for toggling days
    const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

    const toggleDay = (date: string) => {
        setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));
    };

    return (
        <div>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity Logs
            </h2>
            <div className="space-y-4">
                {Object.keys(groupedActivityLogs).length === 0 && (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No activity logs found
                    </div>
                )}
                {Object.entries(groupedActivityLogs)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, logs]) => (
                        <div key={date}>
                            <button
                                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border font-semibold text-left transition-colors ${isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                                    }`}
                                onClick={() => toggleDay(date)}
                            >
                                <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span className="ml-2 text-xs opacity-70">{logs.length} activit{logs.length > 1 ? 'ies' : 'y'}</span>
                                <span className="ml-auto">{openDays[date] ? '▲' : '▼'}</span>
                            </button>
                            {openDays[date] && (
                                <div className="space-y-2 mt-2">
                                    {logs.map(log => (
                                        <div
                                            key={log.id}
                                            className={`p-3 rounded-lg border ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600'
                                                : 'bg-gray-50 border-gray-200'
                                                } `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg">
                                                        {activityService.getActionIcon(log.action)}
                                                    </span>
                                                    <div>
                                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                            } `}>
                                                            {log.username}
                                                        </span>
                                                        <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            } `}>
                                                            {activityService.formatAction(log.action)}
                                                        </span>
                                                        {log.target && (
                                                            <span className={`ml-2 font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                                } `}>
                                                                "{log.target}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    } `}>
                                                    {new Date(log.timestamp).toLocaleTimeString('en-US')}
                                                </span>
                                            </div>
                                            {log.details && (
                                                <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    } `}>
                                                    {log.details}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Clock } from 'lucide-react';
import { useWiki } from '../../context/wiki-context';
import activityService, { ActivityLog } from '../../services/activity-service';

interface ActivityListProps {
    recentActivities: ActivityLog[];
}

const ActivityList: React.FC<ActivityListProps> = ({ recentActivities }) => {
    const { hasPermission } = useWiki();
    const { t } = useTranslation();

    if (!hasPermission('view_activity')) {
        return null;
    }

    return (
        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 bg-custom-surface border border-custom-border shadow-sm`}>
            <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 text-custom-text`}>
                {t('activity.recentModifications')}
            </h3>
            <div className="space-y-2">
                {recentActivities.map((log: ActivityLog) => (
                    <div key={log.id} className={`text-xs transition-colors duration-300 text-custom-muted`}>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm">{activityService.getActionIcon(log.action)}</span>
                            <span className={`transition-colors duration-300 text-custom-text font-medium`}>
                                {activityService.formatAction(log.action)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1 font-medium italic">
                            <User className="w-3 h-3" />
                            <span>{log.username}</span>
                        </div>
                        {log.target && (
                            <div className={`truncate transition-colors duration-300 text-custom-text`}>
                                {log.target}
                            </div>
                        )}
                        <div className="flex items-center space-x-1 mt-1 text-[10px] opacity-70">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.timestamp).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                ))}
                {recentActivities.length === 0 && (
                    <div className={`text-xs transition-colors duration-300 text-custom-muted italic`}>
                        {t('activity.noRecentModifications')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityList;

import React, { useState, useEffect, useMemo } from 'react';
import type { Tag as TagType, Permission } from '../../types';

interface PermissionEditorProps {
    tag: TagType;
    allPermissions: Permission[];
    onUpdate: (tagId: number, permissionIds: number[]) => void;
    isDarkMode: boolean;
    onUnsavedChanges?: (hasChanges: boolean) => void;
}

interface CategoryGroup {
    [category: string]: Permission[];
}

export const PermissionEditor: React.FC<PermissionEditorProps> = ({
    tag,
    allPermissions,
    onUpdate,
    isDarkMode,
    onUnsavedChanges
}) => {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
        tag.permissions?.map((p: Permission) => p.id) || []
    );
    const [originalPermissions, setOriginalPermissions] = useState<number[]>(
        tag.permissions?.map((p: Permission) => p.id) || []
    );

    // Update selected permissions when tag changes
    useEffect(() => {
        const newPermissions = tag.permissions?.map((p: Permission) => p.id) || [];
        setSelectedPermissions(newPermissions);
        setOriginalPermissions(newPermissions);
    }, [tag.id, tag.permissions]);

    // Detect unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (selectedPermissions.length !== originalPermissions.length) return true;
        return selectedPermissions.some(id => !originalPermissions.includes(id)) ||
            originalPermissions.some(id => !selectedPermissions.includes(id));
    }, [selectedPermissions, originalPermissions]);

    // Notify parent of unsaved changes
    useEffect(() => {
        if (onUnsavedChanges) {
            onUnsavedChanges(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, onUnsavedChanges]);

    const handlePermissionToggle = (permissionId: number) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    const handleSave = () => {
        onUpdate(tag.id, selectedPermissions);
        setOriginalPermissions([...selectedPermissions]);
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                setSelectedPermissions([...originalPermissions]);
            }
        }
    };

    // Group permissions by category
    const permissionsByCategory = allPermissions.reduce((acc: CategoryGroup, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as CategoryGroup);

    const categoryLabels: Record<string, string> = {
        admin: 'Administration',
        pages: 'Pages',
        sections: 'Sections',
        user: 'User'
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-2 gap-2">
                {selectedPermissions.length < allPermissions.length && (
                    <button
                        type="button"
                        onClick={() => setSelectedPermissions(allPermissions.map(p => p.id))}
                        className={`px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors`}
                    >
                        Grant all permissions
                    </button>
                )}
                {selectedPermissions.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setSelectedPermissions([])}
                        className={`px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors`}
                    >
                        Revoke all permissions
                    </button>
                )}
            </div>
            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                    }`}>
                    <h5 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {categoryLabels[category] || category}
                    </h5>
                    <div className="space-y-2">
                        {permissions.map((permission: Permission) => (
                            <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(permission.id)}
                                    onChange={() => handlePermissionToggle(permission.id)}
                                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {permission.name}
                                    </div>
                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {permission.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
                <div className={`p-3 rounded-lg mb-4 border-l-4 ${isDarkMode
                    ? 'bg-yellow-900/30 border-yellow-500 text-yellow-300'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    } `}>
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                            } `}></div>
                        <span className="text-sm font-medium">
                            You have unsaved changes
                        </span>
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3">
                {hasUnsavedChanges && (
                    <button
                        onClick={handleCancel}
                        className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            } `}
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-lg transition-colors ${hasUnsavedChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                        : isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                        } `}
                    disabled={!hasUnsavedChanges}
                >
                    {hasUnsavedChanges ? 'Save changes' : 'No changes'}
                </button>
            </div>
        </div>
    );
};

import React from 'react';
import { Tag as TagType, Permission } from '../../types';
import { PermissionEditor } from './permission-editor';

interface AdminPermissionsTabProps {
    tagPermissions: TagType[];
    selectedTagForPermissions: TagType | null;
    handleTagSelectionForPermissions: (tag: TagType) => void;
    permissions: Permission[];
    handlePermissionEditorUpdate: (tagId: number, permissionIds: number[]) => void;
    setHasUnsavedPermissionChanges: (hasChanges: boolean) => void;
    isDarkMode: boolean;
}

export const AdminPermissionsTab: React.FC<AdminPermissionsTabProps> = ({
    tagPermissions,
    selectedTagForPermissions,
    handleTagSelectionForPermissions,
    permissions,
    handlePermissionEditorUpdate,
    setHasUnsavedPermissionChanges,
    isDarkMode
}) => {
    return (
        <div className="space-y-6">
            <div className={`p-6 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    Manage Permissions by Tag
                </h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Configure permissions for each tag. Users automatically inherit permissions from their tags.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tags List */}
                    <div>
                        <h4 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            } `}>
                            Tags
                        </h4>
                        <div className="space-y-2">
                            {tagPermissions.map(tagPerm => (
                                <button
                                    key={tagPerm.id}
                                    onClick={() => handleTagSelectionForPermissions(tagPerm)}
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${selectedTagForPermissions?.id === tagPerm.id
                                        ? isDarkMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                                        : isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                                        } `}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: tagPerm.color }}
                                        ></div>
                                        <div>
                                            <div className="font-medium">{tagPerm.name}</div>
                                            <div className={`text-sm ${selectedTagForPermissions?.id === tagPerm.id
                                                ? isDarkMode ? 'text-blue-200' : 'text-blue-700'
                                                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                } `}>
                                                {tagPerm.permissions?.length || 0} permission(s)
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions for Selected Tag */}
                    <div>
                        {selectedTagForPermissions ? (
                            <>
                                <div className="flex items-center space-x-3 mb-3">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: selectedTagForPermissions.color }}
                                    ></div>
                                    <h4 className={`text-md font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        } `}>
                                        Permissions of "{selectedTagForPermissions.name}"
                                    </h4>
                                </div>
                                <PermissionEditor
                                    tag={selectedTagForPermissions}
                                    allPermissions={permissions}
                                    onUpdate={handlePermissionEditorUpdate}
                                    isDarkMode={isDarkMode}
                                    onUnsavedChanges={setHasUnsavedPermissionChanges}
                                />
                            </>
                        ) : (
                            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                Select a tag to view and manage its permissions
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

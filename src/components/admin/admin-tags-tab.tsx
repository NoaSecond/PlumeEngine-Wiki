import React from 'react';
import { Plus, Save, Edit3, Trash2 } from 'lucide-react';
import { Tag as TagType } from '../../types';

interface AdminTagsTabProps {
    tags: TagType[];
    isAddingTag: boolean;
    setIsAddingTag: (isAdding: boolean) => void;
    newTag: { name: string; color: string };
    setNewTag: (tag: { name: string; color: string }) => void;
    handleCreateTag: () => void;
    editingTag: TagType | null;
    setEditingTag: (tag: TagType | null) => void;
    handleUpdateTag: (tag: TagType) => void;
    handleDeleteTag: (tagId: number) => void;
    isDarkMode: boolean;
}

export const AdminTagsTab: React.FC<AdminTagsTabProps> = ({
    tags,
    isAddingTag,
    setIsAddingTag,
    newTag,
    setNewTag,
    handleCreateTag,
    editingTag,
    setEditingTag,
    handleUpdateTag,
    handleDeleteTag,
    isDarkMode
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    Tags Management ({tags.length})
                </h2>
                <button
                    onClick={() => setIsAddingTag(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Tag</span>
                </button>
            </div>

            {/* Add Tag Form */}
            {isAddingTag && (
                <div className={`p-4 rounded-lg border mb-4 ${isDarkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                    } `}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        } `}>
                        New Tag
                    </h3>
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={newTag.name}
                            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                            placeholder="Tag name"
                            className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? 'bg-slate-700 text-white border-slate-600'
                                : 'bg-white text-gray-900 border-gray-300'
                                } `}
                        />
                        <input
                            type="color"
                            value={newTag.color}
                            onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <button
                            onClick={handleCreateTag}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Create</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsAddingTag(false);
                                setNewTag({ name: '', color: '#3B82F6' });
                            }}
                            className={`px-4 py-2 rounded transition-colors ${isDarkMode
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                } `}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Tags List */}
            <div className="grid gap-3">
                {tags.map(tag => (
                    <div
                        key={tag.id}
                        className={`p-4 rounded-lg border ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-gray-50 border-gray-200'
                            } `}
                    >
                        {editingTag?.id === tag.id ? (
                            <div className="flex items-center space-x-3">
                                <input
                                    type="text"
                                    value={editingTag.name}
                                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                    className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                        ? 'bg-slate-700 text-white border-slate-600'
                                        : 'bg-white text-gray-900 border-gray-300'
                                        } `}
                                />
                                <input
                                    type="color"
                                    value={editingTag.color}
                                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <button
                                    onClick={() => handleUpdateTag(editingTag)}
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={() => setEditingTag(null)}
                                    className={`px-3 py-2 rounded transition-colors ${isDarkMode
                                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                        } `}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-6 h-6 rounded"
                                        style={{ backgroundColor: tag.color }}
                                    ></div>
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        } `}>
                                        {tag.name}
                                    </span>
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        } `}>
                                        {tag.color}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setEditingTag({ ...tag })}
                                        className={`p-2 rounded transition-colors ${isDarkMode
                                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                            } `}
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {tags.length === 0 && (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        } `}>
                        No tags found
                    </div>
                )}
            </div>
        </div>
    );
};

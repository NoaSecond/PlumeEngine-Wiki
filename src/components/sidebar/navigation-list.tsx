import React, { useState, useRef, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Check,
    X,
    MoreHorizontal,
    Edit3,
    Trash2,
    Palette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DragHandle from '../drag-handle';
import SvgIcon from '../svg-icon';
import { SidebarNavigationItem } from '../../types';

interface NavigationListProps {
    items: SidebarNavigationItem[];
    currentPage: string | null;
    onNavigate: (id: string) => void;
    canReorder: boolean;
    canEdit: boolean;
    onReorder: (newOrder: string[]) => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string, title: string) => void;
    onIconChange?: (id: string, iconName: string) => void;
    availableIcons?: Array<{ name: string; label: string }>;
}

// Component for each draggable item
const SortableItem: React.FC<{
    item: SidebarNavigationItem;
    isActive: boolean;
    canEdit: boolean;
    onNavigate: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
    onIconChange?: (id: string, iconName: string) => void;
    availableIcons?: Array<{ name: string; label: string }>;
}> = ({ item, isActive, canEdit, onNavigate, onRename, onDelete, onIconChange, availableIcons }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });
    const { t } = useTranslation();

    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [editingTitle, setEditingTitle] = useState(item.label);
    const [showMenu, setShowMenu] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        if (editingTitle.trim() && editingTitle.trim() !== item.label) {
            onRename(item.id, editingTitle.trim());
        }
        setIsBeingEdited(false);
        setShowMenu(false);
    };

    const handleCancel = () => {
        setIsBeingEdited(false);
        setEditingTitle(item.label);
        setShowMenu(false);
    };

    useEffect(() => {
        if (isBeingEdited && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isBeingEdited]);

    if (isBeingEdited) {
        return (
            <li ref={setNodeRef} style={style} className="relative z-50">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-custom-border bg-custom-surface shadow-md`}>
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 text-custom-muted`}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        onBlur={handleSave}
                        className={`flex-1 min-w-0 px-2 py-1 rounded border transition-colors bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted text-sm`}
                    />
                    <div className="flex space-x-1 flex-shrink-0">
                        <button onMouseDown={(e) => { e.preventDefault(); handleSave(); }} className="text-green-500 hover:text-green-400 p-1">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li ref={setNodeRef} style={style} className="relative">
            <div className="flex items-center group">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <DragHandle />
                </div>

                <button
                    onClick={() => onNavigate(item.id)}
                    className={`flex-1 min-w-0 flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-custom-muted hover:bg-custom-surface hover:text-custom-text'
                        }`}
                >
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-custom-muted'}`}
                    />
                    <span className="truncate text-sm">{item.label}</span>
                </button>

                {canEdit && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded transition-colors text-custom-muted hover:text-custom-text hover:bg-custom-surface`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setShowIconPicker(false); }} />
                                <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg border z-20 bg-custom-surface border-custom-border overflow-hidden`}>
                                    {!showIconPicker ? (
                                        <>
                                            <button
                                                onClick={() => setIsBeingEdited(true)}
                                                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span>{t('pages.renamePage')}</span>
                                            </button>
                                            {onIconChange && availableIcons && (
                                                <button
                                                    onClick={() => setShowIconPicker(true)}
                                                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                                >
                                                    <Palette className="w-4 h-4" />
                                                    <span>{t('pages.changeIcon')}</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    onDelete(item.id, item.label);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-red-400 hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>{t('common.delete')}</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-2">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <span className="text-xs font-semibold text-custom-text">{t('pages.icons')}</span>
                                                <button onClick={() => setShowIconPicker(false)} className="text-custom-muted hover:text-custom-text">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto content-scrollbar p-1">
                                                {availableIcons?.map((icon) => (
                                                    <button
                                                        key={icon.name}
                                                        onClick={() => {
                                                            onIconChange?.(item.id, icon.name);
                                                            setShowMenu(false);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className={`p-1.5 rounded hover:bg-custom-bg transition-colors flex items-center justify-center ${item.iconName === icon.name ? 'bg-primary/20 text-primary' : 'text-custom-muted'}`}
                                                        title={icon.label}
                                                    >
                                                        <SvgIcon name={icon.name} className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};

// Component for each static item
const StaticItem: React.FC<{
    item: SidebarNavigationItem;
    isActive: boolean;
    canEdit: boolean;
    onNavigate: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
    onIconChange?: (id: string, iconName: string) => void;
    availableIcons?: Array<{ name: string; label: string }>;
}> = ({ item, isActive, canEdit, onNavigate, onRename, onDelete, onIconChange, availableIcons }) => {
    const { t } = useTranslation();
    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [editingTitle, setEditingTitle] = useState(item.label);
    const [showMenu, setShowMenu] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (editingTitle.trim() && editingTitle.trim() !== item.label) {
            onRename(item.id, editingTitle.trim());
        }
        setIsBeingEdited(false);
        setShowMenu(false);
    };

    const handleCancel = () => {
        setIsBeingEdited(false);
        setEditingTitle(item.label);
        setShowMenu(false);
    };

    useEffect(() => {
        if (isBeingEdited && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isBeingEdited]);

    if (isBeingEdited) {
        return (
            <li className="relative z-50">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-custom-border bg-custom-surface shadow-md`}>
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 text-custom-muted`}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        onBlur={handleSave}
                        className={`flex-1 min-w-0 px-2 py-1 rounded border transition-colors bg-custom-bg border-custom-border text-custom-text placeholder-custom-muted text-sm`}
                    />
                    <div className="flex space-x-1 flex-shrink-0">
                        <button onMouseDown={(e) => { e.preventDefault(); handleSave(); }} className="text-green-500 hover:text-green-400 p-1">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className="relative">
            <div className="flex items-center group">
                <button
                    onClick={() => onNavigate(item.id)}
                    className={`flex-1 min-w-0 flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-custom-muted hover:bg-custom-surface hover:text-custom-text'
                        }`}
                >
                    <SvgIcon
                        name={item.iconName}
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-custom-muted'}`}
                    />
                    <span className="truncate text-sm">{item.label}</span>
                </button>

                {canEdit && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded transition-colors text-custom-muted hover:text-custom-text hover:bg-custom-surface`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setShowIconPicker(false); }} />
                                <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg border z-20 bg-custom-surface border-custom-border overflow-hidden`}>
                                    {!showIconPicker ? (
                                        <>
                                            <button
                                                onClick={() => setIsBeingEdited(true)}
                                                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span>{t('pages.renamePage')}</span>
                                            </button>
                                            {onIconChange && availableIcons && (
                                                <button
                                                    onClick={() => setShowIconPicker(true)}
                                                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-custom-muted hover:bg-custom-bg hover:text-custom-text`}
                                                >
                                                    <Palette className="w-4 h-4" />
                                                    <span>{t('pages.changeIcon')}</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    onDelete(item.id, item.label);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-red-400 hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>{t('common.delete')}</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-2">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <span className="text-xs font-semibold text-custom-text">{t('pages.icons')}</span>
                                                <button onClick={() => setShowIconPicker(false)} className="text-custom-muted hover:text-custom-text">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto content-scrollbar p-1">
                                                {availableIcons?.map((icon) => (
                                                    <button
                                                        key={icon.name}
                                                        onClick={() => {
                                                            onIconChange?.(item.id, icon.name);
                                                            setShowMenu(false);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className={`p-1.5 rounded hover:bg-custom-bg transition-colors flex items-center justify-center ${item.iconName === icon.name ? 'bg-primary/20 text-primary' : 'text-custom-muted'}`}
                                                        title={icon.label}
                                                    >
                                                        <SvgIcon name={icon.name} className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};


const NavigationList: React.FC<NavigationListProps> = ({
    items,
    currentPage,
    onNavigate,
    canReorder,
    canEdit,
    onReorder,
    onRename,
    onDelete,
    onIconChange,
    availableIcons
}) => {


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const ids = items.map(item => item.id);
            const oldIndex = ids.indexOf(active.id as string);
            const newIndex = ids.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = [...ids];
                const [removed] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, removed);
                onReorder(newOrder);
            }
        }
    };



    if (canReorder) {
        return (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 mb-6">
                        {items.map(item => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                isActive={currentPage === item.id}
                                canEdit={canEdit}
                                onNavigate={onNavigate}
                                onRename={onRename}
                                onDelete={onDelete}
                                onIconChange={onIconChange}
                                availableIcons={availableIcons}
                            />
                        ))}
                        {/* Profile link removed as requested */}
                    </ul>
                </SortableContext>
            </DndContext>
        );
    }

    return (
        <ul className="space-y-2 mb-6">
            {items.map(item => (
                <StaticItem
                    key={item.id}
                    item={item}
                    isActive={currentPage === item.id}
                    canEdit={canEdit}
                    onNavigate={onNavigate}
                    onRename={onRename}
                    onDelete={onDelete}
                    onIconChange={onIconChange}
                    availableIcons={availableIcons}
                />
            ))}
            {/* Profile link removed as requested */}
        </ul>
    );
};

export default NavigationList;

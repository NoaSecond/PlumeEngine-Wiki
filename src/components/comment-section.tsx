import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Reply, X, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWiki } from '../context/wiki-context';
import { Comment } from '../types';
import authService from '../services/auth-service';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';
import { MarkdownRenderer } from './markdown-renderer';

interface CommentSectionProps {
    pageId: string | number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ pageId }) => {
    const { isDarkMode, user, isBackendConnected } = useWiki();
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    useEffect(() => {
        if (pageId && isBackendConnected) {
            fetchComments();
        }
    }, [pageId, isBackendConnected]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            // Assuming public read access for now, or auth handled by cookie if needed. 
            // But my route backend checks nothing for GET except page existence.
            const response = await authService.fetchWithAuth<{ success: boolean; comments: Comment[] }>(`/comments/${pageId}`);
            if (response.success && response.comments) {
                setComments(organizeComments(response.comments));
            }
        } catch (error) {
            logger.error('Error fetching comments', error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const organizeComments = (flatComments: Comment[]): Comment[] => {
        const commentMap = new Map<number, Comment>();
        const roots: Comment[] = [];

        // Initialize map and replies array
        flatComments.forEach(c => {
            c.replies = [];
            commentMap.set(c.id, c);
        });

        // Build hierarchy
        flatComments.forEach(c => {
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.replies?.push(c);
                } else {
                    // Parent not found (maybe deleted), treat as root
                    roots.push(c);
                }
            } else {
                roots.push(c);
            }
        });

        return roots;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        try {
            const response = await authService.fetchWithAuth<{ success: boolean }>(`/comments`, {
                method: 'POST',
                body: JSON.stringify({
                    pageId,
                    content: newComment,
                    parentId: replyTo?.id
                })
            });

            if (response.success) {
                setNewComment('');
                setReplyTo(null);
                fetchComments(); // Refresh to show new comment
            }
        } catch (error) {
            logger.error('Error posting comment', error instanceof Error ? error.message : String(error));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm(t('comments.confirmDelete'))) return;

        try {
            const response = await authService.fetchWithAuth<{ success: boolean }>(`/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                fetchComments();
            }
        } catch (error) {
            logger.error('Error deleting comment', error instanceof Error ? error.message : String(error));
        }
    };

    // Generic avatar helper
    const getAvatarUrl = (c: Comment) => {
        if (c.avatar && c.avatar.startsWith('http')) return c.avatar;
        if (c.avatar) return `/avatars/${c.avatar}`; // Adjust path if needed or use backend full URL
        return null;
    };

    const CommentItem = ({ comment, depth = 0 }: { comment: Comment, depth?: number }) => {
        const isOwner = user?.id === comment.user_id;
        const isAdmin = user?.isAdmin || (typeof user?.isAdmin === 'number' && user.isAdmin === 1);
        const canDelete = isOwner || isAdmin;

        return (
            <div className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 pl-4 border-gray-200 dark:border-slate-700' : ''}`}>
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {getAvatarUrl(comment) ? (
                                <img src={getAvatarUrl(comment)!} alt={comment.username} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <UserIcon className="w-4 h-4 opacity-50" />
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-sm">{comment.username}</div>
                                <div className="text-xs opacity-60">{DateUtils.getRelativeTime(comment.created_at)}</div>
                            </div>
                        </div>

                        {user && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setReplyTo(comment)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors text-blue-500"
                                    title={t('comments.replyTo')}
                                >
                                    <Reply className="w-4 h-4" />
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors text-red-500"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`prose prose-sm max-w-none mb-2 ${isDarkMode ? 'prose-invert' : ''}`}>
                        <MarkdownRenderer content={comment.content} />
                    </div>
                </div>

                {/* Reply Form embedded if replying to this specific comment? For now simple global reply form with target indicator */}

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-8 border-t pt-8 border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> {t('comments.comments')}
            </h3>

            {/* Add Comment Form */}
            {user ? (
                <div className={`mb-8 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    {replyTo && (
                        <div className="flex items-center justify-between mb-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-600 dark:text-blue-400">
                            <span>{t('comments.replyTo')} <strong>{replyTo.username}</strong></span>
                            <button onClick={() => setReplyTo(null)} className="hover:text-blue-800"><X className="w-4 h-4" /></button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? t('comments.yourReply') : t('comments.addComment')}
                            className={`w-full p-3 rounded-lg border min-h-[100px] mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300'
                                }`}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" /> {t('comments.send')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-8 text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-slate-400">{t('comments.loginToComment')}</p>
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-4 opacity-70">{t('common.loading')}</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-4 opacity-50 italic">{t('comments.noComments')}</div>
                ) : (
                    comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))
                )}
            </div>
        </div>
    );
};

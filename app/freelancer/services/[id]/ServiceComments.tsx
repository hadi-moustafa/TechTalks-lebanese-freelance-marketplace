'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, ThumbsUp, MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Comment = {
    id: string;
    user_id: string;
    service_id: string;
    comment: string;
    created_at: string;
    user: {
        username: string;
        profile_pic: string | null;
    };
};

export default function ServiceComments({ serviceId }: { serviceId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [serviceId]);

    const fetchComments = async () => {
        // In a real scenario, we would join with users table. 
        // For now, I'll mock the user data join since the schema might not have simple joins set up yet without RLS policies.
        // Actually, let's try to fetch normally.
        setLoading(true);

        // MOCK DATA for display purposes as per instruction "make functionality later"
        // But I will try to structure it dynamically.
        setTimeout(() => {
            setComments([
                {
                    id: '1',
                    user_id: 'user-1',
                    service_id: serviceId,
                    comment: 'Absolutely amazing service! completed the task way ahead of schedule.',
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    user: {
                        username: 'Sarah J.',
                        profile_pic: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
                    }
                },
                {
                    id: '2',
                    user_id: 'user-2',
                    service_id: serviceId,
                    comment: 'Love the creativity. Will definitely order again for my next project.',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    user: {
                        username: 'Mike T.',
                        profile_pic: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
                    }
                }
            ]);
            setLoading(false);
        }, 1000);
    };

    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const mockComment: Comment = {
            id: Math.random().toString(),
            user_id: 'me',
            service_id: serviceId,
            comment: newComment,
            created_at: new Date().toISOString(),
            user: {
                username: 'You',
                profile_pic: null
            }
        };

        setComments([mockComment, ...comments]);
        setNewComment('');
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <MessageCircle className="text-lebanon-green" />
                    Client Reviews
                </h3>
                <span className="text-gray-500 text-sm font-medium">{comments.length} comments</span>
            </div>

            <div className="p-6">
                {/* Comment Input */}
                <form onSubmit={handlePostComment} className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full bg-lebanon-red/10 flex items-center justify-center text-lebanon-red font-bold">Y</div>
                    </div>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a public reply..."
                            className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-lebanon-green/20 focus:border-lebanon-green outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-lebanon-green text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-lebanon-green transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading reviews...</div>
                    ) : comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden shadow-sm">
                                {comment.user.profile_pic ? (
                                    <img src={comment.user.profile_pic} alt={comment.user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-100">
                                        {comment.user.username[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 inline-block min-w-[200px] border border-gray-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900 text-sm">{comment.user.username}</h4>
                                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{comment.comment}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-2 ml-2 text-xs text-gray-500 font-medium">
                                    <span className="hover:underline cursor-pointer">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                    <button className="flex items-center gap-1 hover:text-lebanon-red transition-colors">
                                        <ThumbsUp size={12} />
                                        Like
                                    </button>
                                    <button className="hover:text-lebanon-green transition-colors">Reply</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

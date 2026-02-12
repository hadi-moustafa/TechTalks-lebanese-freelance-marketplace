'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Tag, Calendar, Image as ImageIcon, Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

type ServiceImage = {
    id: number;
    service_id: string;
    image_url: string;
    is_primary: boolean;
    uploaded_at: string;
};

type Service = {
    id: string;
    freelancer_id: string;
    category_id: number;
    title: string;
    description: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at: string;
    categories?: {
        id: number;
        name: string;
    };
    service_images?: ServiceImage[];
};

type Comment = {
    id: string;
    user_id: string;
    service_id: string;
    comment: string;
    created_at: string;
    users?: {
        username: string;
        profile_pic: string | null;
    };
};

interface ServiceCardProps {
    service: Service;
    showStatus?: boolean;
    isFavorited?: boolean;
    onToggleFavorite?: () => void;
    showComments?: boolean;
    userId?: string;
}

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export default function ServiceCard({ service, showStatus = false, isFavorited, onToggleFavorite, showComments, userId }: ServiceCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchComments = useCallback(async () => {
        setLoadingComments(true);
        
        const { data: commentsData, error } = await supabase
            .from('service_comments')
            .select('*')
            .eq('service_id', service.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch comments error:', error);
            setComments([]);
        } else {
            const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
            let usersMap: Record<string, { username: string; profile_pic: string | null }> = {};
            
            if (userIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, username, profile_pic')
                    .in('id', userIds);
                
                (usersData || []).forEach(u => {
                    usersMap[u.id] = { username: u.username, profile_pic: u.profile_pic };
                });
            }

            const enriched = (commentsData || []).map(c => ({
                ...c,
                users: usersMap[c.user_id] || { username: 'Unknown', profile_pic: null }
            }));
            
            setComments(enriched);
        }
        setLoadingComments(false);
    }, [service.id]);

    useEffect(() => {
        if (isExpanded && showComments) {
            fetchComments();
        }
    }, [isExpanded, showComments, fetchComments]);

    const handleSubmitComment = async () => {
        if (!newComment.trim() || !userId) {
            console.log('Submit blocked:', { hasComment: !!newComment.trim(), userId });
            return;
        }

        setSubmittingComment(true);
        console.log('Posting comment:', { service_id: service.id, user_id: userId, comment: newComment.trim() });
        
        const { data, error } = await supabase
            .from('service_comments')
            .insert({ service_id: service.id, user_id: userId, comment: newComment.trim() })
            .select();

        if (error) {
            console.error('Comment insert error:', error);
            toast.error(`Failed to post comment: ${error.message}`);
        } else {
            console.log('Comment inserted:', data);
            setNewComment('');
            await fetchComments();
            toast.success('Comment posted');
        }
        setSubmittingComment(false);
    };

    // Get the primary image or first image
    const getPrimaryImage = () => {
        const primary = service.service_images?.find(img => img.is_primary);
        return primary?.image_url || service.service_images?.[0]?.image_url;
    };

    // Get status badge
    const getStatusBadge = () => {
        if (!showStatus) return null;
        
        const statusStyles = {
            approved: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            rejected: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${statusStyles[service.status]}`}>
                {service.status}
            </span>
        );
    };

    return (
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
            {onToggleFavorite && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:scale-110 transition-all duration-200 shadow-sm"
                >
                    <Heart
                        size={18}
                        className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}
                    />
                </button>
            )}
            <div className="p-5">
                <div className="flex gap-4">
                    {/* Image Thumbnail */}
                    {getPrimaryImage() ? (
                        <div 
                            className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(getPrimaryImage()!)}
                        >
                            <img
                                src={getPrimaryImage()}
                                alt={service.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-28 h-28 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="text-gray-400" size={32} />
                        </div>
                    )}

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                                {service.categories?.name || 'Uncategorized'}
                            </span>
                            {getStatusBadge()}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {service.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-xl text-green-600">
                                ${service.price}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(service.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {!isExpanded && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {service.description}
                            </p>
                        )}

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline"
                        >
                            {isExpanded ? (
                                <>Hide details <ChevronUp size={16} /></>
                            ) : (
                                <>View details <ChevronDown size={16} /></>
                            )}
                        </button>
                    </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {/* Full Description */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-600 rounded"></span>
                                About This Service
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-3">
                                {service.description}
                            </p>
                        </div>

                        {/* Image Gallery */}
                        {service.service_images && service.service_images.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-purple-600 rounded"></span>
                                    Gallery
                                    <span className="text-sm font-normal text-gray-500">
                                        ({service.service_images.length} {service.service_images.length === 1 ? 'image' : 'images'})
                                    </span>
                                </h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pl-3">
                                    {service.service_images.map((img) => (
                                        <div
                                            key={img.id}
                                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all group"
                                            onClick={() => setSelectedImage(img.image_url)}
                                        >
                                            <img
                                                src={img.image_url}
                                                alt="Service"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                            />
                                            {img.is_primary && (
                                                <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                    PRIMARY
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Service Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Service Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <DollarSign size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Price</p>
                                        <p className="font-semibold text-gray-900">${service.price}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <Tag size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Category</p>
                                        <p className="font-semibold text-gray-900">{service.categories?.name || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <Calendar size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Created</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(service.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <ImageIcon size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Images</p>
                                        <p className="font-semibold text-gray-900">
                                            {service.service_images?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-green-600 rounded"></span>
                                    <MessageCircle size={16} className="text-green-600" />
                                    Comments
                                    <span className="text-sm font-normal text-gray-500">
                                        ({comments.length})
                                    </span>
                                </h4>

                                {loadingComments ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="animate-spin text-gray-400" size={24} />
                                    </div>
                                ) : (
                                    <div className="space-y-3 pl-3">
                                        {comments.length === 0 && (
                                            <p className="text-sm text-gray-400 italic">No comments yet.</p>
                                        )}
                                        {comments.map((c) => (
                                            <div key={c.id} className="bg-gray-50 rounded-lg p-3 flex gap-3">
                                                {c.users?.profile_pic ? (
                                                    <img
                                                        src={c.users.profile_pic}
                                                        alt={c.users.username}
                                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {c.users?.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {c.users?.username || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {formatTimeAgo(c.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{c.comment}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {userId && (
                                    <div className="flex gap-2 mt-3 pl-3">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
                                            placeholder="Write a comment..."
                                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                            disabled={submittingComment}
                                        />
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={submittingComment || !newComment.trim()}
                                            className="px-3 py-2 bg-lira-green-1k text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingComment ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg font-semibold"
                        >
                            ✕ Close
                        </button>
                        <img
                            src={selectedImage}
                            alt="Service"
                            className="w-full h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
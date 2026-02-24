'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Tag, Calendar, Image as ImageIcon } from 'lucide-react';
import { Service } from '@/lib/types';

interface ServiceCardProps {
    service: Service;
    showStatus?: boolean;
    topRated?: boolean;
    onContact?: (serviceId: string, freelancerId: string) => void;
    onView?: (serviceId: string) => void;
}

export default function ServiceCard({ service, showStatus = false, topRated = false, onContact, onView }: ServiceCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
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
                            {topRated && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">
                                    ⭐ Top Rated
                                </span>
                            )}
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
                            onClick={() => {
                                const willExpand = !isExpanded;
                                setIsExpanded(willExpand);
                                if (willExpand && onView) {
                                    onView(service.id);
                                }
                            }}
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

                        {/* Contact Freelancer Button */}
                        {onContact && (
                            <div className="pt-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onContact(service.id, service.freelancer_id);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Contact Freelancer
                                </button>
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
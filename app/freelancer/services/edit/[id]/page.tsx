'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import FreelancerNavbar from '../../../_components/FreelancerNavbar';
import { Button } from '@/components/ui/Button';
import { Upload, DollarSign, Tag, Type, FileText, Image as ImageIcon, X, Loader2, Check, ArrowLeft, Eye, Star, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
    id: number;
    name: string;
};

type ExistingImage = {
    id: string;
    image_url: string;
    is_primary: boolean;
    toDelete?: boolean;
};

type NewImage = {
    id: string;
    file: File;
    preview: string;
    isUploading: boolean;
    isPrimary: boolean;
};

type Service = {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    category_id: number;
    rejection_reason?: string;
    freelancer_id: string;
};

export default function EditServicePage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<NewImage[]>([]);
    const [service, setService] = useState<Service | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        price: '',
        description: '',
    });

    useEffect(() => {
        fetchServiceAndCategories();
    }, [serviceId]);

    const fetchServiceAndCategories = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const [serviceRes, categoriesRes] = await Promise.all([
                supabase
                    .from('services')
                    .select(`*, service_images (id, image_url, is_primary)`)
                    .eq('id', serviceId)
                    .eq('freelancer_id', user.id)
                    .single(),
                supabase.from('categories').select('*')
            ]);

            if (serviceRes.error) throw serviceRes.error;
            if (!serviceRes.data) {
                toast.error('Service not found');
                router.push('/freelancer/services');
                return;
            }

            setService(serviceRes.data);
            setFormData({
                title: serviceRes.data.title,
                category_id: serviceRes.data.category_id.toString(),
                price: serviceRes.data.price.toString(),
                description: serviceRes.data.description,
            });
            setExistingImages(serviceRes.data.service_images || []);

            if (!categoriesRes.error && categoriesRes.data) {
                setCategories(categoriesRes.data);
            }
        } catch (error) {
            console.error('Error fetching service:', error);
            toast.error('Failed to load service');
            router.push('/freelancer/services');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImgs: NewImage[] = [];
        
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) {
                toast.error(`File ${file.name} is not an image`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 5MB)`);
                return;
            }

            newImgs.push({
                id: Math.random().toString(36).substring(7),
                file,
                preview: URL.createObjectURL(file),
                isUploading: false,
                isPrimary: false
            });
        });

        const totalImages = [...newImages, ...newImgs].slice(0, 10 - existingImages.filter(i => !i.toDelete).length);
        setNewImages(totalImages);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const markExistingForDelete = (id: string) => {
        setExistingImages(prev => prev.map(img => 
            img.id === id ? { ...img, toDelete: !img.toDelete } : img
        ));
    };

    const setExistingAsPrimary = (id: string) => {
        setExistingImages(prev => prev.map(img => ({
            ...img,
            is_primary: img.id === id
        })));
        setNewImages(prev => prev.map(img => ({ ...img, isPrimary: false })));
    };

    const setNewAsPrimary = (id: string) => {
        setNewImages(prev => prev.map(img => ({
            ...img,
            isPrimary: img.id === id
        })));
        setExistingImages(prev => prev.map(img => ({ ...img, is_primary: false })));
    };

    const removeNewImage = (id: string) => {
        const imageToRemove = newImages.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
        setNewImages(prev => prev.filter(img => img.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const activeExistingImages = existingImages.filter(i => !i.toDelete);
            const totalImages = activeExistingImages.length + newImages.length;

            if (totalImages === 0) {
                toast.error('Please keep or upload at least one image');
                setSaving(false);
                return;
            }

            if (!formData.title.trim() || !formData.category_id || !formData.price || !formData.description.trim()) {
                toast.error('Please fill in all required fields');
                setSaving(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in');
                router.push('/login');
                return;
            }

            // Update service - status becomes pending again
            const { error: updateError } = await supabase
                .from('services')
                .update({
                    title: formData.title.trim(),
                    category_id: parseInt(formData.category_id),
                    price: parseFloat(formData.price),
                    description: formData.description.trim(),
                    status: 'pending',
                    rejection_reason: null
                })
                .eq('id', serviceId)
                .eq('freelancer_id', user.id);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            // Delete marked images
            const imagesToDelete = existingImages.filter(i => i.toDelete);
            for (const img of imagesToDelete) {
                const fileName = img.image_url.split('/').pop();
                if (fileName) {
                    await supabase.storage.from('service-images').remove([`${serviceId}/${fileName}`]);
                }
                await supabase.from('service_images').delete().eq('id', img.id);
            }

            // Update primary status for existing images
            for (const img of activeExistingImages) {
                await supabase
                    .from('service_images')
                    .update({ is_primary: img.is_primary })
                    .eq('id', img.id);
            }

            // Upload new images
            for (const image of newImages) {
                const fileExt = image.file.name.split('.').pop();
                const fileName = `${serviceId}/${image.id}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(fileName, image.file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('service-images')
                    .getPublicUrl(fileName);

                await supabase.from('service_images').insert({
                    service_id: serviceId,
                    image_url: publicUrl,
                    is_primary: image.isPrimary
                });

                URL.revokeObjectURL(image.preview);
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error('Error updating service:', error);
            toast.error('Failed to update service');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Delete images from storage
            for (const img of existingImages) {
                const fileName = img.image_url.split('/').pop();
                if (fileName) {
                    await supabase.storage.from('service-images').remove([`${serviceId}/${fileName}`]);
                }
            }

            // Delete from service_images table
            await supabase.from('service_images').delete().eq('service_id', serviceId);

            // Delete service
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId)
                .eq('freelancer_id', user.id);

            if (error) throw error;

            toast.success('Service deleted successfully');
            router.push('/freelancer/services');

        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-lebanese-pattern font-sans">
                <FreelancerNavbar />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lira-green-1k"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lebanese-pattern font-sans">
            <FreelancerNavbar />

            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className={`p-8 text-white ${service?.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
                                >
                                    <ArrowLeft size={20} />
                                    <span>Back</span>
                                </button>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    <RefreshCw className="text-white/80" />
                                    Edit & Resubmit Service
                                </h1>
                                <p className="text-white/90 mt-2">
                                    Update your service and submit for approval again.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Alert */}
                    {service?.status === 'rejected' && service?.rejection_reason && (
                        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-semibold text-red-800">Rejection Reason</h4>
                                    <p className="text-red-700 mt-1">{service.rejection_reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Type size={18} className="text-lira-green-1k" />
                                Service Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Category & Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Tag size={18} className="text-lira-green-1k" />
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none bg-white"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <DollarSign size={18} className="text-lira-green-1k" />
                                    Price (USD) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="1"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText size={18} className="text-lira-green-1k" />
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none resize-none"
                                required
                            />
                        </div>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <ImageIcon size={18} className="text-lira-green-1k" />
                                    Current Images
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {existingImages.map((image) => (
                                        <div
                                            key={image.id}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                                                image.toDelete 
                                                    ? 'border-red-500 opacity-50' 
                                                    : image.is_primary 
                                                        ? 'border-lira-green-1k ring-2 ring-lira-green-1k/30' 
                                                        : 'border-gray-200'
                                            }`}
                                        >
                                            <img src={image.image_url} alt="Service" className="w-full h-full object-cover" />
                                            
                                            {image.is_primary && !image.toDelete && (
                                                <div className="absolute top-2 left-2 bg-lira-green-1k text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <Star size={12} /> Primary
                                                </div>
                                            )}

                                            {image.toDelete && (
                                                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">Will be deleted</span>
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2 flex gap-1">
                                                {!image.toDelete && !image.is_primary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExistingAsPrimary(image.id)}
                                                        className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                                                        title="Set as primary"
                                                    >
                                                        <Star size={14} className="text-gray-600" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => markExistingForDelete(image.id)}
                                                    className={`p-1.5 rounded-full shadow ${image.toDelete ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                                >
                                                    {image.toDelete ? <RefreshCw size={14} className="text-white" /> : <X size={14} className="text-white" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Images Upload */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Upload size={18} className="text-lira-green-1k" />
                                Add New Images
                            </label>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-lira-green-1k hover:bg-lira-green-1k/5 transition-all"
                            >
                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600 font-medium">Click to upload new images</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>

                            {newImages.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {newImages.map((image) => (
                                        <div
                                            key={image.id}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                                                image.isPrimary ? 'border-lira-green-1k ring-2 ring-lira-green-1k/30' : 'border-gray-200'
                                            }`}
                                        >
                                            <img src={image.preview} alt="Preview" className="w-full h-full object-cover" />
                                            
                                            {image.isPrimary && (
                                                <div className="absolute top-2 left-2 bg-lira-green-1k text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <Star size={12} /> Primary
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2 flex gap-1">
                                                {!image.isPrimary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewAsPrimary(image.id)}
                                                        className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                                                    >
                                                        <Star size={14} className="text-gray-600" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(image.id)}
                                                    className="p-1.5 bg-red-500 rounded-full shadow hover:bg-red-600"
                                                >
                                                    <X size={14} className="text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <Trash2 size={18} className="mr-2" />
                                    Discard Service
                                </Button>
                                
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-lira-green-1k hover:bg-emerald-700 text-white px-8"
                                    >
                                        {saving ? (
                                            <><Loader2 className="animate-spin mr-2" size={18} /> Saving...</>
                                        ) : (
                                            <><RefreshCw size={18} className="mr-2" /> Resubmit for Approval</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <h3 className="text-2xl font-bold">Service Resubmitted!</h3>
                            <p className="text-white/90 mt-2">Your service is pending approval again</p>
                        </div>
                        
                        <div className="p-6 space-y-3">
                            <button
                                type="button"
                                onClick={() => router.push(`/freelancer/services/${serviceId}`)}
                                className="w-full py-3 bg-lira-green-1k hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                            >
                                <Eye size={18} className="inline mr-2" /> View Service
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    router.push('/freelancer/services');
                                }}
                                className="w-full py-3 bg-lira-green-1k hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Go to My Services
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Delete this service?</h3>
                            <p className="text-gray-600 mt-2">This action cannot be undone. All images will be permanently deleted.</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1"
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                disabled={deleting}
                            >
                                {deleting ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

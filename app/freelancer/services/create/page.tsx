'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import { Button } from '@/components/ui/Button';
import { Upload, DollarSign, Tag, Type, FileText, Image as ImageIcon, X, Loader2, Check, ArrowLeft, Eye, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
    id: number;
    name: string;
};

type ServiceImage = {
    id: string;
    file: File;
    preview: string;
    isUploading: boolean;
    isPrimary: boolean;
};

export default function CreateServicePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [images, setImages] = useState<ServiceImage[]>([]);
    const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        price: '',
        description: '',
    });

    useEffect(() => {
        async function fetchCategories() {
            const { data, error } = await supabase.from('categories').select('*');
            if (!error && data) {
                setCategories(data);
            }
        }
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ServiceImage[] = [];

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) {
                toast.error(`File ${file.name} is not an image`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 5MB)`);
                return;
            }

            const preview = URL.createObjectURL(file);
            const isPrimary = images.length === 0 && index === 0;

            newImages.push({
                id: Math.random().toString(36).substring(7),
                file,
                preview,
                isUploading: false,
                isPrimary
            });
        });

        const totalImages = [...images, ...newImages].slice(0, 10);
        const imagesWithPrimary = ensureSinglePrimary(totalImages);
        setImages(imagesWithPrimary);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const ensureSinglePrimary = (imagesArray: ServiceImage[]): ServiceImage[] => {
        const hasPrimaryAlready = imagesArray.some(img => img.isPrimary);
        if (hasPrimaryAlready) return imagesArray;

        return imagesArray.map((image, index) => ({
            ...image,
            isPrimary: index === 0
        }));
    };

    const setAsPrimary = (id: string) => {
        setImages(images.map(image => ({
            ...image,
            isPrimary: image.id === id
        })));
    };

    const removeImage = (id: string) => {
        const imageToRemove = images.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview);
        }

        const remainingImages = images.filter(img => img.id !== id);

        if (imageToRemove?.isPrimary && remainingImages.length > 0) {
            remainingImages[0].isPrimary = true;
        }

        setImages(remainingImages);
    };

    const uploadImagesToStorage = async (serviceId: string): Promise<void> => {
        if (images.length === 0) return;

        for (const image of images) {
            setImages(prev => prev.map(img =>
                img.id === image.id ? { ...img, isUploading: true } : img
            ));

            try {
                const fileExt = image.file.name.split('.').pop();
                const fileName = `${serviceId}/${image.id}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(fileName, image.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('service-images')
                    .getPublicUrl(fileName);

                const { error: dbError } = await supabase
                    .from('service_images')
                    .insert({
                        service_id: serviceId,
                        image_url: publicUrl,
                        is_primary: image.isPrimary
                    });

                if (dbError) throw dbError;

                URL.revokeObjectURL(image.preview);

            } catch (error) {
                console.error('Error uploading image:', error);
                throw error;
            } finally {
                setImages(prev => prev.map(img =>
                    img.id === image.id ? { ...img, isUploading: false } : img
                ));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (images.length === 0) {
                toast.error('Please upload at least one image for your service');
                setLoading(false);
                return;
            }

            if (!formData.title.trim() || !formData.category_id || !formData.price || !formData.description.trim()) {
                toast.error('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                toast.error('You must be logged in to create a service');
                router.push('/login');
                return;
            }

            const { data: service, error: serviceError } = await supabase
                .from('services')
                .insert({
                    freelancer_id: user.id,
                    title: formData.title.trim(),
                    category_id: parseInt(formData.category_id),
                    price: parseFloat(formData.price),
                    description: formData.description.trim(),
                    status: 'pending'
                })
                .select()
                .single();

            if (serviceError) {
                console.error('Service creation error:', serviceError);
                toast.error('Failed to create service');
                throw serviceError;
            }

            setUploadingImages(true);
            await uploadImagesToStorage(service.id);

            setCreatedServiceId(service.id);
            setShowSuccessModal(true);

        } catch (error: unknown) {
            console.error('Error in handleSubmit:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create service';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            setUploadingImages(false);
        }
    };

    useEffect(() => {
        return () => {
            images.forEach(image => {
                URL.revokeObjectURL(image.preview);
            });
        };
    }, []);

    return (

        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-cedar-dark p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('/patterns/cedar-pattern.png')]"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
                            >
                                <ArrowLeft size={20} />
                                <span>Back</span>
                            </button>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Upload className="text-white/80" />
                                Create New Service
                            </h1>
                            <p className="text-white/90 mt-2">
                                Share your talent with the world. Fill in the details below.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-white/80">Your service will be</div>
                            <div className="text-lg font-bold bg-white/20 px-4 py-2 rounded-full mt-1">
                                Pending Approval
                            </div>
                        </div>
                    </div>
                </div>

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
                            placeholder="e.g., Professional Logo Design"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none transition-all shadow-sm"
                            required
                        />
                    </div>

                    {/* Category & Price Row */}
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none transition-all shadow-sm"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
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
                                placeholder="e.g., 50"
                                min="1"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none transition-all shadow-sm"
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
                            placeholder="Describe your service in detail. What do clients get? What's your process?"
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none transition-all resize-none shadow-sm"
                            required
                        />
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <ImageIcon size={18} className="text-lira-green-1k" />
                            Service Images <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal">(Max 10 images, 5MB each)</span>
                        </label>

                        {/* Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-lira-green-1k hover:bg-lira-green-1k/5 transition-all"
                        >
                            <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600 font-medium">Click to upload images</p>
                            <p className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP up to 5MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 ${image.isPrimary ? 'border-lira-green-1k ring-2 ring-lira-green-1k/30' : 'border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={image.preview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />

                                        {image.isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-white" size={24} />
                                            </div>
                                        )}

                                        {image.isPrimary && (
                                            <div className="absolute top-2 left-2 bg-lira-green-1k text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <Star size={12} />
                                                Primary
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {!image.isPrimary && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAsPrimary(image.id)}
                                                    className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                                                    title="Set as primary"
                                                >
                                                    <Star size={14} className="text-gray-600" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(image.id)}
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

                    {/* Submit Section */}
                    <div className="pt-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-600">
                                <p className="font-medium">⚠️ Your service will be reviewed by admin</p>
                                <p className="text-xs">You'll be notified once approved or if changes are needed</p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                                    disabled={loading || uploadingImages}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || uploadingImages || images.length === 0}
                                    className="px-8 py-3 bg-lira-green-1k hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 min-w-[180px]"
                                >
                                    {loading || uploadingImages ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            {uploadingImages ? 'Uploading...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Submit for Approval
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>


            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <h3 className="text-2xl font-bold">Service Submitted!</h3>
                            <p className="text-white/90 mt-2">Your service is now pending admin approval</p>
                        </div>

                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Eye className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-800">What happens next?</p>
                                        <p className="text-sm text-blue-600">Admin will review within 24-48 hours</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push(`/freelancer/services/${createdServiceId}`)}
                                    className="w-full py-3 bg-lira-green-1k hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={18} />
                                    View Your Service
                                </button>

                                <button
                                    onClick={() => router.push('/freelancer/services')}
                                    className="w-full py-3 border-2 border-lira-green-1k text-lira-green-1k hover:bg-lira-green-1k/5 rounded-xl font-bold transition-all"
                                >
                                    Go to My Services
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

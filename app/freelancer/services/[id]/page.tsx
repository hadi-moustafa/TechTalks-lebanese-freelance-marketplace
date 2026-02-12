"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Eye,
  MessageCircle,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  category_id: number;
  categories?: {
    name: string;
  };
  service_images?: {
    id: string;
    image_url: string;
    is_primary: boolean;
    uploaded_at: string;
  }[];
  rejection_reason?: string;
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    views: 0,
    inquiries: 0,
    earnings: 0,
  });
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetchService();
    fetchServiceStats();
    fetchComments();
  }, [serviceId]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .select(
          `
                    *,
                    categories:category_id (name),
                    service_images (*)
                `,
        )
        .eq("id", serviceId)
        .eq("freelancer_id", user.id)
        .single();

      if (error) throw error;
      setService(data);

      // Set first image as selected
      if (data.service_images && data.service_images.length > 0) {
        setSelectedImage(
          data.service_images.find(
            (img: { is_primary: boolean; image_url: string }) => img.is_primary,
          )?.image_url || data.service_images[0].image_url,
        );
      }
    } catch (error) {
      console.error("Error fetching service:", error);
      toast.error("Service not found");
      router.push("/freelancer/services");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceStats = async () => {
    try {
      const { count: viewsCount } = await supabase
        .from("service_views")
        .select("*", { count: "exact", head: true })
        .eq("service_id", serviceId);

      // Fetch inquiries (messages)
      const { count: inquiriesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("service_id", serviceId);

      // Stats are placeholders for now - tables don't exist yet
      // TODO: Create service_views table and implement tracking
      setStats({
        views: viewsCount || 0,
        inquiries: inquiriesCount || 0,
        earnings: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const { data: commentsData } = await supabase
        .from('service_comments')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id))];
      let usersMap: Record<string, { username: string; profile_pic: string | null }> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, profile_pic')
          .in('id', userIds);

        (usersData || []).forEach((u: any) => {
          usersMap[u.id] = { username: u.username, profile_pic: u.profile_pic };
        });
      }

      const enriched = (commentsData || []).map((c: any) => ({
        ...c,
        users: usersMap[c.user_id] || { username: 'Unknown', profile_pic: null }
      }));

      setComments(enriched);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle size={20} />,
          color: "bg-green-100 text-green-800 border-green-200",
          text: "Approved & Live",
          description: "Your service is live and visible to clients",
          badgeColor: "bg-green-500",
        };
      case "rejected":
        return {
          icon: <XCircle size={20} />,
          color: "bg-red-100 text-red-800 border-red-200",
          text: "Rejected",
          description: "Your service needs revisions",
          badgeColor: "bg-red-500",
        };
      case "pending":
        return {
          icon: <Clock size={20} />,
          color: "bg-amber-100 text-amber-800 border-amber-200",
          text: "Pending Approval",
          description: "Your service is under review by admin",
          badgeColor: "bg-amber-500",
        };
      default:
        return {
          icon: null,
          color: "",
          text: "",
          description: "",
          badgeColor: "",
        };
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      // First delete images from storage
      if (service?.service_images) {
        const filePaths = service.service_images.map((img) => {
          const urlParts = img.image_url.split("/");
          return urlParts.slice(-2).join("/"); // Get bucket/path
        });

        await supabase.storage.from("service-images").remove(filePaths);
      }

      // Delete service images from database
      await supabase
        .from("service_images")
        .delete()
        .eq("service_id", serviceId);

      // Finally delete the service
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast.success("Service deleted successfully");
      router.push("/freelancer/services");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/services/${serviceId}`;
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  const viewPublicPage = () => {
    if (typeof window !== 'undefined') {
      window.open(`/services/${serviceId}`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lira-green-1k"></div>
      </div>

    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-gray-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Service not found
          </h2>
          <p className="text-gray-600 mb-6">
            The service you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/freelancer/services")}>
              Back to My Services
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/freelancer/services/create")}
            >
              Create New Service
            </Button>
          </div>
        </div>
      </div>

    );
  }

  const statusConfig = getStatusConfig(service.status);
  const primaryImage = service.service_images?.find((img) => img.is_primary);

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <button
          onClick={() => router.push("/freelancer")}
          className="hover:text-gray-900"
        >
          Dashboard
        </button>
        <span>/</span>
        <button
          onClick={() => router.push("/freelancer/services")}
          className="hover:text-gray-900"
        >
          My Services
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {service.title}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2 ${statusConfig.color}`}
            >
              {statusConfig.icon}
              {statusConfig.text}
            </div>
            {service.status === "approved" && (
              <button
                onClick={viewPublicPage}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye size={16} />
                View Public Page
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {service.title}
          </h1>
          <p className="text-gray-600 mt-2">
            Created {formatDate(service.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {service.status === "rejected" && (
            <Button
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() =>
                router.push(`/freelancer/services/edit/${service.id}`)
              }
            >
              <Edit size={18} className="mr-2" />
              Edit & Resubmit
            </Button>
          )}

          <Button
            variant="outline"
            className="border-gray-200"
            onClick={copyToClipboard}
          >
            <Copy size={18} className="mr-2" />
            Copy Link
          </Button>

          {service.status !== "approved" && (
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {service.status === "approved" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.views}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inquiries}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.earnings}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {statusConfig.description && (
        <div
          className={`p-5 rounded-xl border mb-8 ${statusConfig.color.replace("border-", "border-").split(" ")[0]} ${statusConfig.color.split(" ")[1]}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.color.split(" ")[1]}`}
            >
              {statusConfig.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">
                {statusConfig.description}
              </p>
              {service.status === "rejected" && service.rejection_reason && (
                <div className="bg-white/50 p-3 rounded-lg mt-3">
                  <p className="font-medium text-gray-900 mb-1">
                    Admin Feedback:
                  </p>
                  <p className="text-gray-700">{service.rejection_reason}</p>
                </div>
              )}
              {service.status === "pending" && (
                <p className="text-sm opacity-90">
                  ⏳ Typically reviewed within 24-48 hours. You'll receive a
                  notification when your service is approved.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Service Images</h3>
              <p className="text-sm text-gray-500">
                {service.service_images?.length || 0} image(s)
              </p>
            </div>

            <div className="p-4">
              {/* Main Image */}
              <div className="mb-6">
                <div className="h-80 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="Service"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon
                        size={64}
                        className="text-gray-400 mx-auto mb-4"
                      />
                      <p className="text-gray-500 font-medium">
                        No images available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Images */}
              {service.service_images &&
                service.service_images.length > 1 && (
                  <>
                    <h4 className="font-medium text-gray-700 mb-3">
                      All Images
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {service.service_images.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(image.image_url)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === image.image_url
                            ? "border-lira-green-1k ring-2 ring-lira-green-1k/20"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <img
                            src={image.image_url}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          {image.is_primary && (
                            <div className="absolute top-1 left-1 bg-lira-green-1k text-white text-xs px-1.5 py-0.5 rounded">
                              Main
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Service Description
              </h3>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {service.description}
                </div>
              </div>
            </div>
          </div>

          {/* Client Comments */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-gray-600" size={22} />
                <h3 className="text-xl font-bold text-gray-900">
                  Client Comments
                </h3>
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lira-green-1k"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="text-gray-400" size={28} />
                  </div>
                  <p className="text-gray-500 font-medium">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        {comment.users?.profile_pic ? (
                          <img
                            src={comment.users.profile_pic}
                            alt={comment.users?.username || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-lira-green-1k/10 flex items-center justify-center text-lira-green-1k font-semibold">
                            {(comment.users?.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {comment.users?.username || "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Quick Info</h3>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${service.price}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Tag className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">
                        {service.categories?.name || "Uncategorized"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Created */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(service.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          service.updated_at || service.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {service.status === "approved" && (
                  <>
                    <Button
                      className="w-full justify-center bg-lira-green-1k hover:bg-emerald-700"
                      onClick={viewPublicPage}
                    >
                      <ExternalLink size={18} className="mr-2" />
                      View Public Page
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-center border-lira-green-1k text-lira-green-1k hover:bg-lira-green-1k/5"
                      onClick={copyToClipboard}
                    >
                      <Copy size={18} className="mr-2" />
                      Share Service
                    </Button>
                  </>
                )}

                {service.status === "rejected" && (
                  <Button
                    className="w-full justify-center bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      router.push(`/freelancer/services/edit/${service.id}`)
                    }
                  >
                    <Edit size={18} className="mr-2" />
                    Edit & Resubmit
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => router.push("/freelancer/services")}
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to All Services
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-center text-lira-green-1k border-lira-green-1k hover:bg-lira-green-1k/5"
                  onClick={() => router.push("/freelancer/services/create")}
                >
                  Create New Service
                </Button>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${service.status === "approved" ? "bg-green-50 border-green-200" : service.status === "rejected" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${service.status === "approved" ? "bg-green-100 text-green-600" : service.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                >
                  {statusConfig.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Status</h4>
                  <p
                    className={`font-semibold ${service.status === "approved" ? "text-green-700" : service.status === "rejected" ? "text-red-700" : "text-amber-700"}`}
                  >
                    {statusConfig.text}
                  </p>
                </div>
              </div>

              {service.status === "pending" && (
                <div className="text-sm text-amber-700 space-y-2">
                  <p>✅ Your service has been submitted successfully</p>
                  <p>⏳ Admin review typically takes 24-48 hours</p>
                  <p>📧 You'll receive a notification when reviewed</p>
                </div>
              )}

              {service.status === "approved" && (
                <div className="text-sm text-green-700 space-y-2">
                  <p>🎉 Your service is live and visible to clients!</p>
                  <p>👁️ Clients can now view and order your service</p>
                  <p>📊 Track performance in your dashboard</p>
                </div>
              )}

              {service.status === "rejected" && (
                <div className="text-sm text-red-700 space-y-2">
                  <p>📝 Review the admin feedback above</p>
                  <p>✏️ Edit your service to address the issues</p>
                  <p>🔄 Resubmit for approval when ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

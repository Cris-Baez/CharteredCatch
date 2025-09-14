import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onSuccess?: (newImageUrl: string) => void;
  variant?: "full" | "compact";
}

export default function ProfileImageUpload({ 
  currentImageUrl, 
  onSuccess,
  variant = "full" 
}: ProfileImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Image Updated!",
        description: "Your profile picture has been updated successfully.",
      });
      
      // Clear preview
      setPreviewUrl(null);
      
      // Invalidate queries to refresh user data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      onSuccess?.(data.profileImageUrl);
    },
    onError: (error: any) => {
      console.error("Upload profile image error:", error);
      const errorMessage = error?.message || "Failed to upload profile image";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setPreviewUrl(null);
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB max, but recommend smaller)
    const maxSize = 10 * 1024 * 1024; // 10MB recommendation
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadImageMutation.mutate(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    return null;
  }

  // Get the image to display
  const displayImageUrl = previewUrl || currentImageUrl || user.profileImageUrl;

  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-ocean-blue/10 flex items-center justify-center overflow-hidden">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} className="text-ocean-blue" />
            )}
          </div>
          {uploadImageMutation.isPending && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="profile-image-input"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={uploadImageMutation.isPending}
            data-testid="upload-profile-image"
          >
            <Camera size={16} className="mr-2" />
            {currentImageUrl ? "Change Photo" : "Add Photo"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current/Preview Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-ocean-blue/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-ocean-blue" />
                )}
              </div>
              {uploadImageMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {previewUrl && !uploadImageMutation.isPending && (
                <button
                  onClick={clearPreview}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  data-testid="clear-preview"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-ocean-blue bg-ocean-blue/5"
                : "border-gray-300 hover:border-ocean-blue hover:bg-ocean-blue/5"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="profile-image-input"
            />
            
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your image here, or
            </p>
            <Button
              variant="outline"
              onClick={handleButtonClick}
              disabled={uploadImageMutation.isPending}
              data-testid="upload-profile-image"
            >
              <Camera size={16} className="mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Supports JPG, PNG, GIF. Maximum file size: 10MB
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import HeaderCaptain from "@/components/headercaptain";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Save,
  Camera,
  BadgeCheck,
  MapPin,
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Loader2,
} from "lucide-react";

/* ===========================
   Tipos
=========================== */
type CaptainMe = {
  id: number;
  userId: string;
  bio: string | null;
  experience: string | null;
  licenseNumber: string | null;
  location: string | null;
  avatar: string | null;
  verified: boolean | null;
  rating: string | number | null;
  reviewCount: number | null;
};

type UpdateUserPayload = {
  firstName?: string | null;
  lastName?: string | null;
};

type UpdateCaptainPayload = {
  bio?: string | null;
  experience?: string | null;
  licenseNumber?: string | null;
  location?: string | null;
};

/* ===========================
   Page
=========================== */
export default function CaptainProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // redirect si no logueado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // ======== FETCH: captain/me ========
  const {
    data: captain,
    isLoading: loadingCaptain,
  } = useQuery<CaptainMe>({
    queryKey: ["/api/captain/me"],
    queryFn: async () => {
      const r = await fetch("/api/captain/me", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load captain profile");
      return r.json();
    },
    enabled: !!isAuthenticated,
  });

  // ======== FORM STATE ========
  // user basics (firstName/lastName/email readonly)
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  // captain details
  const [bio, setBio] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [locationStr, setLocationStr] = useState<string>("");

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // avatar upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // inicializa form cuando carga
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user]);

  useEffect(() => {
    if (!captain) return;
    setBio(captain.bio ?? "");
    setExperience(captain.experience ?? "");
    setLicenseNumber(captain.licenseNumber ?? "");
    setLocationStr(captain.location ?? "");
  }, [captain]);

  // helpers UI
  const fullName = useMemo(
    () =>
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Captain",
    [user]
  );

  /* ===========================
     Mutations
  =========================== */

  // Save: user
  const updateUser = useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      const r = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || "Failed to update user");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Save: captain
  const updateCaptain = useMutation({
    mutationFn: async (payload: UpdateCaptainPayload) => {
      const r = await fetch("/api/captain/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || "Failed to update captain");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain/me"] });
    },
  });

  // Change password
  const changePassword = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const r = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || "Failed to change password");
      }
      return r.json();
    },
  });

  // Upload to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }
    
    const data = await response.json();
    return data.secure_url;
  };

  // Avatar
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed");
      }
      
      // Upload to Cloudinary
      const avatarUrl = await uploadToCloudinary(file);
      
      // Send URL to backend
      const r = await fetch("/api/captain/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar: avatarUrl }),
      });
      
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Avatar upload failed");
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/captain/me"] });
    } catch (e: any) {
      alert(e?.message || "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSaveAll = async () => {
    try {
      await Promise.all([
        updateUser.mutateAsync({
          firstName: firstName || null,
          lastName: lastName || null,
        }),
        updateCaptain.mutateAsync({
          bio: bio || null,
          experience: experience || null,
          licenseNumber: licenseNumber || null,
          location: locationStr || null,
        }),
      ]);
      alert("Profile updated ✔");
    } catch (e: any) {
      alert(e?.message || "Failed to save");
    }
  };

  if (authLoading || loadingCaptain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading profile…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header unificado */}
      <HeaderCaptain />

      {/* ======== CONTENT ======== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 lg:mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Profile
          </h1>
          <p className="text-gray-600">
            Keep your captain profile up to date — it helps guests book with confidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Avatar + Summary */}
          <section className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="w-28 h-28 ring-2 ring-white shadow">
                      <AvatarImage src={captain?.avatar || ""} useDefaultForCaptain />
                      <AvatarFallback className="text-xl">
                        {user?.firstName?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full h-9 w-9 p-0 bg-ocean-blue hover:bg-blue-800"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAvatarUpload(f);
                      }}
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-lg font-semibold">{fullName}</div>
                    <div className="text-sm text-gray-500 break-all">
                      {user?.email || "—"}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                      <span className="inline-flex items-center text-yellow-600">
                        <BadgeCheck className="w-4 h-4 mr-1" />
                        {Number(captain?.rating ?? 0).toFixed(1)} rating
                      </span>
                      <span className="text-gray-500">
                        {captain?.reviewCount ?? 0} reviews
                      </span>
                    </div>

                    {captain?.verified ? (
                      <span className="mt-3 inline-flex items-center text-green-600 text-xs">
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        Verified Captain
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Public Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="w-4 h-4" />
                  <span>{fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span className="break-all">{user?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span>{captain?.location || "Add your base location"}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Tip: Keep this info accurate — it appears on your public profile and helps guests discover you.
                </div>
              </CardContent>
            </Card>
          </section>

          {/* RIGHT: Editable sections */}
          <section className="lg:col-span-2 space-y-6">
            {/* Account */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (read-only)</Label>
                  <Input id="email" value={user?.email || ""} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* Captain Profile */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Captain Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">About you</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell guests about your experience, style, and what makes your charters special."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      placeholder="e.g., 12 years guiding offshore & inshore"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license">Captain License #</Label>
                    <Input
                      id="license"
                      placeholder="USCG-XXXX"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Base Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State (e.g., Key West, FL)"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!currentPassword || !newPassword) {
                          alert("Please fill both password fields.");
                          return;
                        }
                        await changePassword.mutateAsync({
                          currentPassword,
                          newPassword,
                        });
                        setCurrentPassword("");
                        setNewPassword("");
                        alert("Password updated ✔");
                      } catch (e: any) {
                        alert(e?.message || "Failed to change password");
                      }
                    }}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                  {changePassword.isPending && (
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save all */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={onSaveAll}
                className="bg-ocean-blue hover:bg-blue-800 text-white"
                disabled={updateUser.isPending || updateCaptain.isPending}
              >
                {updateUser.isPending || updateCaptain.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {(updateUser.isError || updateCaptain.isError) && (
                <span className="text-sm text-red-600">
                  Failed to save. Try again.
                </span>
              )}
              {(updateUser.isSuccess || updateCaptain.isSuccess) && (
                <span className="text-sm text-green-600">All set!</span>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Upload,
  FileText,
  Shield,
  User as UserIcon,
  Award,
  IdCard,
  MapPin,
  AlertCircle,
  MailCheck,
  MailWarning,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// ---------------- Env (Cloudinary + Stripe) ----------------
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// ---------------- Tipos alineados a tu backend ----------------
interface User {
  id: string;
  email: string | null;
  role?: "user" | "captain";
}

interface EmailVerificationStatus {
  email: string | null;
  verified: boolean;
  verifiedAt?: string | null;
}

interface Captain {
  id: number;
  userId: string;
  bio: string;
  experience: string;
  licenseNumber: string;
  location: string;
  avatar: string | null;
  verified: boolean;
  name: string;
  onboardingCompleted?: boolean;
  // docs
  licenseDocument: string | null;
  boatDocumentation: string | null;
  insuranceDocument: string | null;
  identificationPhoto: string | null;
  localPermit: string | null;
  cprCertification: string | null;
  drugTestingResults: string | null;
}

interface StripeSubscription {
  id: number;
  userId: string;
  status: string;        // p.ej. "trialing" | "active" | "none"
  planType: string;      // "captain_monthly" por defecto
  trialStartDate?: string | null;
  trialEndDate?: string | null;
}

// ---------------- Documentos requeridos ----------------
type DocKey =
  | "licenseDocument"
  | "boatDocumentation"
  | "insuranceDocument"
  | "identificationPhoto"
  | "localPermit"
  | "cprCertification"
  | "drugTestingResults";

const DOCS: { key: DocKey; name: string; description: string; required: boolean; icon: any }[] = [
  { key: "licenseDocument", name: "Captain License", description: "Valid license from maritime authority", required: true, icon: Award },
  { key: "boatDocumentation", name: "Boat Documentation", description: "Registration & proof of ownership", required: true, icon: FileText },
  { key: "insuranceDocument", name: "Liability Insurance", description: "Active commercial liability policy", required: true, icon: Shield },
  { key: "identificationPhoto", name: "Photo ID", description: "Government ID or passport", required: true, icon: IdCard },
  { key: "localPermit", name: "Local Permit", description: "Permit to operate in your area", required: true, icon: FileText },
  { key: "cprCertification", name: "CPR Certification", description: "First aid / CPR (optional)", required: false, icon: Award },
  { key: "drugTestingResults", name: "Drug Test", description: "Recent toxicology (optional)", required: false, icon: FileText },
];

// ---------------- Helpers ----------------
const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.22 },
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

async function uploadToCloudinary(file: File): Promise<string> {
  console.log("Cloudinary Config:", { CLOUD_NAME, UPLOAD_PRESET, hasCloudName: !!CLOUD_NAME, hasUploadPreset: !!UPLOAD_PRESET });
  
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(`Missing Cloudinary configuration: 
      - VITE_CLOUDINARY_CLOUD_NAME: ${CLOUD_NAME ? 'SET' : 'MISSING'}
      - VITE_CLOUDINARY_UPLOAD_PRESET: ${UPLOAD_PRESET ? 'SET' : 'MISSING'}
      
      Please check your environment variables in the Secrets tool.`);
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { 
      method: "POST", 
      body: form 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Cloudinary error response:", errorText);
      throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("Cloudinary upload success:", data);
    return data.secure_url as string;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// ---------------- Main component ----------------
export default function CaptainOnboarding() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Queries base
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: emailStatus, refetch: refetchEmail } = useQuery<EmailVerificationStatus>({
    queryKey: ["/api/email/verification-status"],
    // ARREGLADO: Eliminar polling automático para evitar crash de DB
    // refetchInterval: 8000,  // Removido - causaba loop infinito
  });
  const { data: captain } = useQuery<Captain>({ queryKey: ["/api/captain/me"] });
  const { data: sub } = useQuery<StripeSubscription>({ queryKey: ["/api/captain/subscription"] });

  // Perfil local
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    experience: "",
    location: "",
    licenseNumber: "",
  });

  useEffect(() => {
    if (captain) {
      setProfile({
        name: captain.name ?? "",
        bio: captain.bio ?? "",
        experience: captain.experience ?? "",
        location: captain.location ?? "",
        licenseNumber: captain.licenseNumber ?? "",
      });
    }
  }, [captain]);

  const emailVerified = !!emailStatus?.verified;

  // Mutations (alineadas a tus rutas)
  const sendVerification = useMutation({
    mutationFn: async () => {
      // tu backend espera email en body (según routes)
      // si prefieres por sesión, puedes omitir body
      const r = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, firstName: profile.name.split(" ")[0] || undefined }),
      });
      if (!r.ok) throw new Error("Failed to send verification");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Verification email sent" });
      refetchEmail();
    },
  });

  const saveProfile = useMutation({
    mutationFn: async (payload: Partial<Captain>) => {
      // tu routes expone PATCH /api/captain/me (si no lo tienes, usa /api/captains/:id)
      const r = await fetch("/api/captain/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed to save profile");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/captain/me"] });
      toast({ title: "Profile saved" });
    },
    onError: () => toast({ title: "Error saving profile", variant: "destructive" }),
  });

  const saveAvatar = useMutation({
    mutationFn: async (url: string) => {
      const r = await fetch("/api/captain/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      if (!r.ok) throw new Error("Failed to save avatar");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/captain/me"] });
      toast({ title: "Avatar updated" });
    },
  });

  const saveDocument = useMutation({
    mutationFn: async ({ key, url }: { key: DocKey; url: string }) => {
      const r = await fetch("/api/captain/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: key, documentURL: url }),
      });
      if (!r.ok) throw new Error("Failed to save document");
      return r.json();
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["/api/captain/me"] });
      toast({ title: `${v.key} uploaded` });
    },
  });

  // ---------- Reglas de avance: bloquear si falta algo ----------
  const requiredKeys = ["licenseDocument", "boatDocumentation", "insuranceDocument", "identificationPhoto", "localPermit"] as const;
  const docsFilled = requiredKeys.filter((k) => !!captain?.[k]).length;
  const docsProgress = Math.round((docsFilled / requiredKeys.length) * 100);

  const profileValid =
    profile.name.trim().length > 1 &&
    profile.licenseNumber.trim().length > 1 &&
    profile.location.trim().length > 1;

  // Debe estar verificado el email para pasar del Paso 0 al 1
  const canGoFromStep0 = emailVerified;

  // Debe estar el perfil válido y TODOS los docs requeridos para pasar al Paso 2
  const canGoFromStep1 = profileValid && docsFilled === requiredKeys.length;

  // UI general
  const steps = ["Account", "Profile & Docs", "Review", "Free Trial"];

  // Redirección final
  function goOverview() {
    window.location.href = "/captain/overview";
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3 sm:max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">Captain Onboarding</p>
              <p className="text-xs text-gray-500">Step {step + 1} of 4 · Blue · White · Black</p>
            </div>
            <Badge variant="secondary" className="bg-black text-white">Secure</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={[
                    "h-9 w-9 shrink-0 rounded-full grid place-items-center text-xs font-semibold",
                    i < step ? "bg-blue-600 text-white" : i === step ? "border-2 border-blue-600 text-blue-700" : "bg-gray-200 text-gray-600",
                  ].join(" ")}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`mx-1 h-1 flex-1 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-md px-4 py-6 sm:max-w-3xl sm:py-8">
        <AnimatePresence mode="wait">
          {/* STEP 0 — Email + Avatar */}
          {step === 0 && (
            <motion.div key="step0" initial="initial" animate="animate" exit="exit" variants={variants}>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-black">Welcome aboard 🎉</CardTitle>
                  <CardDescription>Verify your email and set your avatar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={`rounded-xl border p-4 ${emailVerified ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                    <div className="flex items-start gap-3">
                      {emailVerified ? (
                        <MailCheck className="mt-0.5 h-5 w-5 text-green-600" />
                      ) : (
                        <MailWarning className="mt-0.5 h-5 w-5 text-blue-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">
                          {emailVerified ? "Email verified" : "Verify your email"}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          {emailVerified
                            ? `Verified for ${emailStatus?.email ?? user?.email ?? "your account"}.`
                            : `We sent a verification link to ${emailStatus?.email ?? user?.email ?? "your email"}.`}
                        </p>
                        {!emailVerified && (
                          <div className="mt-3">
                            <Button size="sm" onClick={() => sendVerification.mutate()} className="bg-blue-600 hover:bg-blue-700">
                              {sendVerification.isPending ? "Sending…" : "Resend verification email"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-black">Profile Avatar</p>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <img
                        src={captain?.avatar || "https://res.cloudinary.com/demo/image/upload/w_128,h_128,c_fill,g_face/avatar.png"}
                        alt="avatar"
                        className="h-16 w-16 rounded-full border object-cover"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-600 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;

                            // Validate file type
                            if (!f.type.startsWith("image/")) {
                              toast({ title: "Invalid file type", description: "Please select an image file (JPG, PNG, etc.)", variant: "destructive" });
                              return;
                            }

                            // Validate file size (10MB max)
                            if (f.size > 10 * 1024 * 1024) {
                              toast({ title: "File too large", description: "Please select an image smaller than 10MB", variant: "destructive" });
                              return;
                            }

                            try {
                              const url = await uploadToCloudinary(f);
                              await saveAvatar.mutateAsync(url);
                            } catch (error: any) {
                              toast({ title: "Upload failed", description: error?.message || "Failed to upload avatar. Please try again.", variant: "destructive" });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>


                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 1 — Perfil + Documentos (bloqueado si falta algo) */}
          {step === 1 && (
            <motion.div key="step1" initial="initial" animate="animate" exit="exit" variants={variants} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-black">Captain Profile</CardTitle>
                  <CardDescription>Basic details required to verify your identity.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="license">Captain License Number</Label>
                    <Input
                      id="license"
                      value={profile.licenseNumber}
                      onChange={(e) => setProfile((p) => ({ ...p, licenseNumber: e.target.value }))}
                      placeholder="USCG-XXXX-123456"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="location" className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-blue-600" /> Location
                    </Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Key West, FL"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about your background and sea experience…"
                      className="min-h-[84px]"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={profile.experience}
                      onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))}
                      placeholder="Years captaining, specialties, certifications…"
                      className="min-h-[84px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        saveProfile.mutate({
                          name: profile.name,
                          licenseNumber: profile.licenseNumber,
                          location: profile.location,
                          bio: profile.bio,
                          experience: profile.experience,
                        })
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-black">Documents progress</span>
                    <span className="text-xs text-gray-600">
                      {docsFilled} / {requiredKeys.length} required
                    </span>
                  </div>
                  <Progress value={docsProgress} />
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                {DOCS.map((doc) => {
                  const Icon = doc.icon;
                  const currentUrl = captain?.[doc.key] as string | null | undefined;
                  const uploaded = !!currentUrl;
                  return (
                    <Card key={doc.key} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${uploaded ? "bg-green-100" : "bg-gray-100"}`}>
                            <Icon className={`h-5 w-5 ${uploaded ? "text-green-600" : "text-gray-700"}`} />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base text-black">
                              {doc.name} {doc.required && <span className="ml-1 text-red-500">*</span>}
                            </CardTitle>
                            <CardDescription className="text-xs">{doc.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {uploaded && (
                          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border">
                            <img src={currentUrl!} alt={doc.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        {!uploaded ? (
                          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-blue-600 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
                            <Upload className="h-4 w-4" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              hidden
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;

                                // Validate file type
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                                if (!allowedTypes.includes(f.type)) {
                                  toast({ title: "Invalid file type", description: "Please select a JPG, PNG, or PDF file", variant: "destructive" });
                                  return;
                                }

                                // Validate file size (10MB max)
                                if (f.size > 10 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Please select a file smaller than 10MB", variant: "destructive" });
                                  return;
                                }

                                try {
                                  toast({ title: "Uploading...", description: `Uploading ${doc.name}` });
                                  const url = await uploadToCloudinary(f);
                                  await saveDocument.mutateAsync({ key: doc.key, url });
                                } catch (error: any) {
                                  console.error("Upload error:", error);
                                  toast({
                                    title: "Upload failed",
                                    description: error?.message || `Failed to upload ${doc.name}. Please try again.`,
                                    variant: "destructive"
                                  });
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Uploaded</Badge>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => window.open(currentUrl!, "_blank")}>
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = ".jpg,.jpeg,.png,.pdf";
                                  input.onchange = async () => {
                                    const file = (input.files && input.files[0]) || null;
                                    if (!file) return;

                                    // Validate file type
                                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                                    if (!allowedTypes.includes(file.type)) {
                                      toast({ title: "Invalid file type", description: "Please select a JPG, PNG, or PDF file", variant: "destructive" });
                                      return;
                                    }

                                    // Validate file size (10MB max)
                                    if (file.size > 10 * 1024 * 1024) {
                                      toast({ title: "File too large", description: "Please select a file smaller than 10MB", variant: "destructive" });
                                      return;
                                    }

                                    try {
                                      const newUrl = await uploadToCloudinary(file);
                                      await saveDocument.mutateAsync({ key: doc.key, url: newUrl });
                                    } catch (error: any) {
                                      console.error("Upload error:", error);
                                      toast({ title: "Upload failed", description: error?.message || `Failed to replace ${doc.name}. Please try again.`, variant: "destructive" });
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                Replace
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canGoFromStep1}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  title={!canGoFromStep1 ? "Complete profile and all required docs" : undefined}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <motion.div key="step2" initial="initial" animate="animate" exit="exit" variants={variants}>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-black">Review & Verification</CardTitle>
                  <CardDescription>Make sure everything looks good before starting your free trial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-black">
                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Summary
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        <li>Name: {profile.name || "—"}</li>
                        <li>License: {profile.licenseNumber || "—"}</li>
                        <li>Location: {profile.location || "—"}</li>
                        <li>Required docs: {docsFilled} / {requiredKeys.length}</li>
                        <li>Email: {emailVerified ? "Verified" : "Not verified"}</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-black">
                        <AlertCircle className="h-4 w-4 text-blue-600" /> What happens next
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        <li>• Our team will review your documents (1–2 business days).</li>
                        <li>• Once approved, your profile gains the Verified badge.</li>
                        <li>• Start your 30-day free trial and publish charters.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700">
                      Proceed to Free Trial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3 — Free Trial + Stripe */}
          {step === 3 && (
            <motion.div key="step3" initial="initial" animate="animate" exit="exit" variants={variants}>
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl text-black">Activate Free Trial 🚀</CardTitle>
                  <CardDescription>
                    Plan: <b>{sub?.planType ?? "captain_monthly"}</b> · Status: <b>{sub?.status ?? "none"}</b>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border bg-blue-50 p-4 text-blue-900">
                    <div className="flex items-start gap-2">
                      <CreditCard className="mt-0.5 h-5 w-5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium">30-day free trial</p>
                        <p className="mt-1">
                          Add a payment method to start. You’ll be charged only after the trial ends. You can also do it later.
                        </p>
                      </div>
                    </div>
                  </div>

                  <PaymentSetupBlock onSuccess={goOverview} />

                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      onClick={async () => {
                        // Opción “hacerlo luego”: activa trial sin método, si tu backend lo permite
                        try {
                          const r = await fetch("/api/captain/subscription/create", { method: "POST" });
                          if (!r.ok) throw new Error();
                          // listo → overview
                          goOverview();
                        } catch {
                          // si tu endpoint necesita la tarjeta sí o sí, muestra aviso
                          // (tu routes.ts ya maneja Stripe y subscripciones; ajusta lógica ahí)
                          // :contentReference[oaicite:3]{index=3}
                          alert("We couldn't start the trial without a payment method. Please add a card above.");
                        }
                      }}
                      className="bg-gray-900 hover:bg-black"
                    >
                      Do it later
                    </Button>
                  </div>

                  <p className="text-center text-xs text-gray-500">
                    By continuing you agree to our Terms. Cancel anytime during the trial.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky mobile footer CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/90 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 sm:max-w-3xl">
          <div className="text-[11px] text-gray-600">
            {step === 1 ? `${docsFilled}/${requiredKeys.length} docs · ${profile.licenseNumber ? "License ✓" : "License —"}` : steps[step]}
          </div>
          {step < 3 && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={(step === 0 && !canGoFromStep0) || (step === 1 && !canGoFromStep1)}
              onClick={() => {
                if (step === 0 && !canGoFromStep0) return;
                if (step === 1 && !canGoFromStep1) return;
                setStep((s) => (s + 1) as any);
              }}
              title={
                step === 0 && !canGoFromStep0
                  ? "Verify your email to continue"
                  : step === 1 && !canGoFromStep1
                  ? "Complete profile and all required docs"
                  : undefined
              }
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Stripe Card Block (Setup Intent + attach) ----------------
function PaymentSetupBlock({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // 1) Pedimos un SetupIntent a tu backend (si no existe, intenta tu endpoint de create subscription que devuelva clientSecret)
  useEffect(() => {
    (async () => {
      try {
      } catch {
        /* ignore; el botón “Do it later” cubrirá */
      }
    })();
  }, []);

  const handleSubscribeWithCard = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/captain/create-checkout-session", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok && data.checkout_url) {
        // Redirect to secure Stripe checkout page
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to start payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrialLater = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/captain/subscription/create", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Trial Started!",
          description: "30-day free trial activated. Add payment method anytime during trial.",
        });
        onSuccess();
      } else {
        throw new Error(data.error || "Failed to create subscription");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Unable to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSubscribeWithCard}
        disabled={loading}
        className="w-full bg-ocean-blue hover:bg-deep-blue"
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Setting up payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment & Start Trial
          </>
        )}
      </Button>
      
      <Button
        onClick={handleStartTrialLater}
        disabled={loading}
        variant="outline"
        className="w-full border-ocean-blue text-ocean-blue hover:bg-ocean-50"
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-ocean-blue border-t-transparent rounded-full mr-2"></div>
            Starting trial...
          </>
        ) : (
          "Start Trial (Add Payment Later)"
        )}
      </Button>
    </div>
  );
}
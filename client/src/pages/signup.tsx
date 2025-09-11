// src/pages/signup.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Fish, Ship } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Signup() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const [role, setRole] = useState<"user" | "captain">("user");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const redirectTo = useMemo(() => {
    if (role === "captain") return "/captain/dashboard";
    return "/user/home";
  }, [role]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "captain") {
        window.location.replace("/captain/dashboard");
      } else if (user.role === "user") {
        window.location.replace("/user/home");
      }
    }
  }, [isAuthenticated, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);

      const res = await fetch("/api/auth/local/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role,
        }),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => null))?.message ||
          "Failed to create account";
        throw new Error(msg);
      }

      // refresca el hook useAuth
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.replace(redirectTo);
    } catch (err: any) {
      setBusy(false);
      setError(err?.message ?? "Something went wrong");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ocean-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-950">
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/90">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl font-bold text-black dark:text-white">
              Create your <span className="text-ocean-blue">Charterly</span> account
            </CardTitle>
            <p className="text-slate-700 dark:text-slate-400 text-sm">
              Join as an Angler or a Captain
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-around mb-4">
                <Button
                  type="button"
                  variant={role === "user" ? "default" : "outline"}
                  onClick={() => setRole("user")}
                  className="flex items-center gap-2"
                >
                  <Fish className="w-4 h-4" /> Angler
                </Button>
                <Button
                  type="button"
                  variant={role === "captain" ? "default" : "outline"}
                  onClick={() => setRole("captain")}
                  className="flex items-center gap-2"
                >
                  <Ship className="w-4 h-4" /> Captain
                </Button>
              </div>

              <div className="grid gap-2 text-black dark:text-white">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <div className="grid gap-2 text-black dark:text-white">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <div className="grid gap-2 text-black dark:text-white">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <div className="grid gap-2 text-black dark:text-white">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={busy}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-2 grid place-items-center text-slate-500 hover:text-slate-700"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full h-11 bg-gradient-to-r from-ocean-blue to-cyan-500 text-black font-semibold rounded-lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center text-xs text-black mt-6">
              Already have an account?{" "}
              <a href="/login" className="ml-1 underline hover:text-ocean-blue">
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

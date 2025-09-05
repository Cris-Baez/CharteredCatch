import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Login() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const redirectTo = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get("redirect");
    return r && r.startsWith("/") ? r : "/";
  }, []);

  // ✅ Redirige cuando ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "captain") {
        window.location.replace("/captain/dashboard");
      } else if (user.role === "user") {
        window.location.replace("/user/home");
      } else {
        window.location.replace(redirectTo);
      }
    }
  }, [isAuthenticated, user, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);

      const res = await fetch("/api/auth/local/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => null))?.message ||
          "Invalid email or password";
        throw new Error(msg);
      }

      // ✅ Forzar a que useAuth se refresque
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
              Welcome back to <span className="text-ocean-blue">Charterly</span>
            </CardTitle>
            <p className="text-slate-700 dark:text-slate-400 text-sm">
              Sign in to continue your adventure
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-black mt-6">
              <a href="/signup" className="underline hover:text-ocean-blue">
                Don’t have an account? Sign up
              </a>
              <a href="/forgot-password" className="underline hover:text-ocean-blue">
                Forgot password?
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}


/* Animaciones personalizadas */
const styles = `
@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.wave-animation {
  background: repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 20px, transparent 20px 40px);
  animation: wave 6s linear infinite;
}
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
.animate-fade-in { animation: fade-in-up 1s ease-out forwards; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = styles;
  document.head.appendChild(style);
}

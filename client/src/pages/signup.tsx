import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Fish, Ship } from "lucide-react";

export default function Signup() {
  const { isAuthenticated, isLoading } = useAuth();
  const [role, setRole] = useState<"angler" | "captain" | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    // Extra para capitanes
    bio: "",
    license_number: "",
    location: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: role === "angler" ? "user" : "captain",
      };

      // Si es capitán, añadir los campos extendidos
      if (role === "captain") {
        payload.bio = form.bio;
        payload.license_number = form.license_number;
        payload.location = form.location;
      }

      const res = await fetch("/api/auth/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error creating account");

      // Redirigir según el rol
      if (role === "captain") {
        window.location.href = "/captain/dashboard";
      } else {
        window.location.href = "/user/home";
      }
    } catch (err: any) {
      alert(err.message || "Registration failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ocean-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900"
          >
            Create your <span className="text-ocean-blue">Charterly</span> account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-3 md:mt-4 text-storm-gray text-base md:text-xl"
          >
            Choose your role and start your fishing journey today.
          </motion.p>
        </div>
      </section>

      {/* Options */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Angler */}
          <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                  <Fish className="text-ocean-blue" size={20} />
                </div>
                <CardTitle className="text-xl">I’m an Angler</CardTitle>
              </div>
              <p className="mt-3 text-sm text-storm-gray">
                Book fishing trips with verified captains worldwide.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setRole("angler")}
                    className="w-full bg-ocean-blue hover:bg-blue-800 text-white"
                  >
                    Sign up as Angler
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Sign up as Angler</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
                    <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                    <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" />
                    <Button onClick={handleRegister} className="w-full bg-ocean-blue hover:bg-blue-800 text-white">
                      Create Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Captain */}
          <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                  <Ship className="text-ocean-blue" size={20} />
                </div>
                <CardTitle className="text-xl">I’m a Captain</CardTitle>
              </div>
              <p className="mt-3 text-sm text-storm-gray">
                List your boat, manage bookings, and keep 100% of your earnings.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setRole("captain")}
                    className="w-full bg-ocean-blue hover:bg-blue-800 text-white"
                  >
                    Sign up as Captain
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Sign up as Captain</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
                    <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                    <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" />
                    <Input name="bio" value={form.bio} onChange={handleChange} placeholder="Short Bio" />
                    <Input name="license_number" value={form.license_number} onChange={handleChange} placeholder="License Number" />
                    <Input name="location" value={form.location} onChange={handleChange} placeholder="Location" />
                    <Button onClick={handleRegister} className="w-full bg-ocean-blue hover:bg-blue-800 text-white">
                      Create Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Already have account */}
        <div className="max-w-5xl mx-auto text-center mt-8">
          <p className="text-sm text-storm-gray">
            Already have an account?{" "}
            <Link href="/login" className="text-ocean-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

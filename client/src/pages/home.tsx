import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCharters } from "@/hooks/use-charters";
import { motion } from "framer-motion";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import FishingAssistant from "@/components/fishing-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  Users,
  Search,
  MessageCircle,
  Calendar,
  Shield,
  DollarSign,
  Headphones,
  Bot,
  Star,
  Trophy,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CharterWithCaptain } from "@shared/schema";

interface Captain {
  id: number;
  userId: number;
  avatar?: string;
  bio?: string;
  experience?: string;
  licenseNumber?: string;
  location?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  user: {
    firstName?: string;
    lastName?: string;
  };
}

// Placeholder gris para imágenes vacías
const GRAY_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23d1d5db' font-size='18' font-family='system-ui'%3ENo Image%3C/text%3E%3C/svg%3E";

function MobileImageCarousel({ images }: { images?: string[] | null }) {
  const pics = images && images.length > 0 ? images : [GRAY_PLACEHOLDER];
  const [idx, setIdx] = useState(0);
  if (pics.length <= 1) {
    return <img src={pics[0]} alt="charter" className="h-40 w-full object-cover" />;
  }
  const prev = () => setIdx((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIdx((i) => (i + 1) % pics.length);
  return (
    <div className="relative h-40 w-full overflow-hidden md:hidden">
      <img key={idx} src={pics[idx]} alt={`charter-${idx + 1}`} className="h-40 w-full object-cover transition-opacity duration-300" />
      <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white" aria-label="Prev image">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white" aria-label="Next image">
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {pics.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const fishingPhotos = [
    { src: "/attached_assets/image_1749589187411.png", alt: "Large wahoo with fishing lure" },
    { src: "/attached_assets/image_1749588943897.png", alt: "School of yellowtail fish underwater" },
    { src: "/attached_assets/image_1749589049214.png", alt: "Mahi mahi jumping out of water" },
    { src: "/attached_assets/image_1749589117238.png", alt: "Underwater view of mahi mahi" },
    { src: "/attached_assets/image_1749589265116.png", alt: "Marlin jumping and fighting" },
    { src: "/attached_assets/image_1749589578771.png", alt: "Large grouper underwater" },
    { src: "/attached_assets/image_1749589681877.png", alt: "Swordfish in deep blue water" },
    { src: "/attached_assets/image_1749589763057.png", alt: "Striped marlin hunting through baitfish" },
    { src: "/attached_assets/image_1749588712878.png", alt: "Deep sea fishing with trolling rods" },
    { src: "/attached_assets/image_1749588811332.png", alt: "Family with large barracuda catch" },
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % fishingPhotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [fishingPhotos.length]);
  const { data: featuredCharters, isLoading, error } = useCharters();
  const { data: captains, isLoading: isLoadingCaptains } = useQuery<Captain[]>({
    queryKey: ["captains"],
    queryFn: async () => {
      const res = await fetch("/api/captains");
      if (!res.ok) throw new Error("Failed to fetch captains");
      return res.json();
    },
  });
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden">
        <div className="h-96 md:h-[500px] relative">
          {fishingPhotos.map((photo, index) => (
            <motion.div key={index} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: index === currentSlide ? 1 : 0, scale: index === currentSlide ? 1 : 1.1 }} transition={{ duration: 1.8, ease: "easeInOut" }} className="absolute inset-0">
              <div className="h-full bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.2), rgba(30, 64, 175, 0.4)), url('${photo.src}')` }} />
            </motion.div>
          ))}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {fishingPhotos.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white/01" : "bg-white/01"}`} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white px-4 max-w-4xl">
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-4xl md:text-6xl font-bold mb-4">The Smarter Way to Book Fishing Charters</motion.h1>
              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="text-xl md:text-2xl mb-8 text-gray-100">Connect with verified captains. No hidden fees. Book your perfect fishing adventure.</motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-6">
                <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" variant="outline">
                      <Bot className="w-4 h-4 mr-2" />
                      Need Help Choosing? Ask Our Fishing Assistant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <FishingAssistant onClose={() => setAssistantOpen(false)} />
                  </DialogContent>
                </Dialog>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10"></div>
      <section className="py-20 bg-gradient-to-b from-sea-foam via-white to-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-ocean-blue/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Featured Charters</h2>
            <p className="text-lg md:text-xl text-storm-gray">Handpicked trips by our verified captains</p>
          </motion.div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-md">
                  <div className="h-48 w-full bg-gray-200 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-red-500">Failed to load charters</p>
          ) : !featuredCharters || featuredCharters.length === 0 ? (
            <p className="text-center text-gray-500">No charters available</p>
          ) : (
            <>
              <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {featuredCharters.slice(0, 6).map((charter, index) => (
                  <motion.div key={charter.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="flex-shrink-0 w-72 h-full" onClick={() => setLocation(`/charters/${charter.id}`)}>
                    <Card className="overflow-hidden shadow hover:shadow-lg transition h-full flex flex-col">
                      <MobileImageCarousel images={charter.images} />
                      <img src={charter.images?.[0] || GRAY_PLACEHOLDER} alt={charter.title} className="hidden md:block h-40 w-full object-cover" />
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="h-14 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">{charter.title}</h3>
                        </div>
                        <p className="flex items-center text-gray-600 text-sm line-clamp-1 mb-1">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          {charter.location}
                        </p>
                        <p className="text-ocean-blue font-medium text-sm flex items-center line-clamp-1 mb-3">
                          <UserIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                          Capt. {charter.captain?.name || "Unknown"}
                        </p>
                        <div className="flex justify-between items-center mt-auto pt-2">
                          <span className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                            {charter.captain?.rating || "New"}
                          </span>
                          <span className="font-semibold text-black ">${charter.price}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-10">
                {featuredCharters.slice(0, 6).map((charter, index) => (
                  <motion.div key={charter.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.15 }} viewport={{ once: true }} className="group cursor-pointer" onClick={() => setLocation(`/charters/${charter.id}`)}>
                    <Card className="overflow-hidden rounded-2xl border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2 h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden">
                        <img src={charter.images?.[0] || GRAY_PLACEHOLDER} alt={charter.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 text-ocean-blue border border-ocean-blue/20 font-semibold shadow-sm">{charter.targetSpecies || "Trip"}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="h-14 mb-3">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">{charter.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-2 flex items-center line-clamp-1">
                          <MapPin className="w-4 h-4 mr-1 text-ocean-blue flex-shrink-0" />
                          {charter.location}
                        </p>
                        <p className="text-ocean-blue font-medium mb-4 line-clamp-1">Capt. {charter.captain?.name || "Unknown Captain"}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.463a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.175 0l-3.39 2.462c-.785.57-1.84-.196-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.098 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
                            </svg>
                            <span className="font-semibold">{charter.captain?.rating || "New"}</span>
                          </div>
                          <div className="text-sm text-gray-600">${charter.price} / trip</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="text-center mt-12">
                <Button variant="outline" size="lg" onClick={() => setLocation("/search")} className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white transition">View All Charters</Button>
              </motion.div>
            </>
          )}
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Captains of the Month</h2>
          {isLoadingCaptains ? (
            <p className="text-center text-gray-500">Loading captains...</p>
          ) : !captains?.length ? (
            <p className="text-center text-gray-500">No captains available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {captains.slice(0, 3).map((captain) => (
                <Card key={captain.id} className="rounded-xl shadow hover:shadow-lg transition">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <img src={captain.avatar || "/placeholder.jpg"} alt={captain.user.firstName} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <h3 className="font-semibold text-lg text-black">{captain.user.firstName} {captain.user.lastName}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {captain.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 font-medium">{captain.rating || "New"}</span>
                        {captain.reviewCount !== undefined && <span className="text-gray-500 text-xs ml-1">({captain.reviewCount})</span>}
                      </div>
                      {captain.verified && <Badge className="bg-green-500 text-white flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{captain.bio || "No bio available."}</p>
                    <div className="flex justify-between mt-2">
                      <Button size="sm" className="bg-ocean-blue text-white" onClick={() => setLocation(`/captains/${captain.id}`)}>View Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Charterly Works</h2>
            <p className="text-xl text-storm-gray">Book your perfect fishing charter in three simple steps</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Search & Compare", description: "Find verified captains by location, species, and trip type. Compare ratings, prices, and availability." },
              { icon: MessageCircle, title: "Connect & Plan", description: "Message captains directly to ask questions, discuss your trip, and get personalized fishing advice." },
              { icon: Calendar, title: "Book & Fish", description: "Book instantly with real-time availability. Pay the captain directly with no hidden fees or commissions." },
            ].map((step, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.2 }} viewport={{ once: true }} className="text-center">
                <div className="w-16 h-16 ocean-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="text-white text-2xl" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-storm-gray">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 ocean-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose Charterly?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              {[
                { icon: Shield, title: "Verified Captains", description: "All captains are licensed, insured, and safety certified" },
                { icon: DollarSign, title: "No Hidden Fees", description: "What you see is what you pay - no booking fees or commissions" },
                { icon: Clock, title: "Real-Time Booking", description: "Instant availability and booking confirmation" },
                { icon: Headphones, title: "Direct Support", description: "Message captains directly and get expert fishing advice" },
              ].map((feature, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }} className="text-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest Catches</h2>
            <p className="text-xl text-storm-gray">See what our anglers are catching around the world</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fishingPhotos.slice(0, 8).map((photo, index) => (
              <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }} className="relative group cursor-pointer overflow-hidden rounded-lg">
                <img src={photo.src} alt={photo.alt} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white text-sm font-medium">{photo.alt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-ocean-blue/5 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-ocean-blue/5 rounded-full translate-x-24 translate-y-24"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <div className="inline-flex items-center bg-ocean-blue/10 text-ocean-blue px-4 py-2 rounded-full font-medium mb-6">
              <Trophy className="w-4 h-4 mr-2" />
              For Charter Captains
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Are You a Charter Captain?</h2>
            <p className="text-xl text-storm-gray mb-8">Join Charterly and keep 100% of your earnings. No commissions, just more bookings.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { value: "0%", title: "Commission", description: "Keep every dollar you earn", icon: DollarSign },
                { value: "3x", title: "More Customers", description: "Reach serious anglers nationwide", icon: Users },
                { value: "24/7", title: "Easy Management", description: "Simple tools for bookings & scheduling", icon: Clock },
              ].map((feature, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }}>
                  <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-ocean-blue/20">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-ocean-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="text-ocean-blue" size={24} />
                      </div>
                      <div className="text-ocean-blue text-2xl font-bold mb-2">{feature.value}</div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-storm-gray">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <Button size="lg" className="bg-ocean-blue hover:bg-blue-800 text-white px-8 py-4" onClick={() => setLocation("/signup")}>Join as a Captain</Button>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

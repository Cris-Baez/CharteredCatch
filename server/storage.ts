import { 
  users, captains, charters, bookings, messages, reviews,
  type User, type Captain, type Charter, type Booking, type Message, type Review,
  type InsertUser, type InsertCaptain, type InsertCharter, type InsertBooking, 
  type InsertMessage, type InsertReview, type CharterWithCaptain, type MessageThread
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Captains
  getCaptain(id: number): Promise<Captain | undefined>;
  getCaptainByUserId(userId: number): Promise<Captain | undefined>;
  createCaptain(captain: InsertCaptain): Promise<Captain>;
  getAllCaptains(): Promise<Captain[]>;

  // Charters
  getCharter(id: number): Promise<Charter | undefined>;
  getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined>;
  getChartersByCaptain(captainId: number): Promise<Charter[]>;
  searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string }): Promise<CharterWithCaptain[]>;
  getAllCharters(): Promise<CharterWithCaptain[]>;
  createCharter(charter: InsertCharter): Promise<Charter>;
  updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBookingsByCaptain(captainId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageThread(userId1: number, userId2: number, charterId?: number): Promise<Message[]>;
  getMessageThreads(userId: number): Promise<MessageThread[]>;
  markMessageAsRead(id: number): Promise<void>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByCaptain(captainId: number): Promise<Review[]>;
  updateCaptainRating(captainId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private captains: Map<number, Captain> = new Map();
  private charters: Map<number, Charter> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private messages: Map<number, Message> = new Map();
  private reviews: Map<number, Review> = new Map();

  private currentUserId = 1;
  private currentCaptainId = 1;
  private currentCharterId = 1;
  private currentBookingId = 1;
  private currentMessageId = 1;
  private currentReviewId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "mike_rodriguez",
        password: "hashed_password",
        email: "mike@example.com",
        firstName: "Mike",
        lastName: "Rodriguez",
        phone: "305-555-0123",
        isCaptin: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        username: "sarah_chen",
        password: "hashed_password",
        email: "sarah@example.com",
        firstName: "Sarah",
        lastName: "Chen",
        phone: "305-555-0124",
        isCaptin: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        username: "jake_thompson",
        password: "hashed_password",
        email: "jake@example.com",
        firstName: "Jake",
        lastName: "Thompson",
        phone: "305-555-0125",
        isCaptin: true,
        createdAt: new Date(),
      },
    ];

    const sampleCaptains: Captain[] = [
      {
        id: 1,
        userId: 1,
        bio: "Professional backcountry guide specializing in sight fishing for tarpon and permit in the pristine waters of Islamorada.",
        experience: "15+ years of guiding experience in the Florida Keys",
        licenseNumber: "FL-1234567",
        location: "Islamorada, FL",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        verified: true,
        rating: "4.9",
        reviewCount: 47,
      },
      {
        id: 2,
        userId: 2,
        bio: "20+ years experience targeting pelagics. Fully equipped 38ft Contender with all tackle provided. Fish the deep blue waters of the Atlantic.",
        experience: "20+ years offshore fishing experience",
        licenseNumber: "FL-2345678",
        location: "Key Largo, FL",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        verified: true,
        rating: "4.8",
        reviewCount: 63,
      },
      {
        id: 3,
        userId: 3,
        bio: "Expert flats guide with 15 years in the backcountry. Perfect for beginners and experienced anglers. Fly fishing and light tackle available.",
        experience: "15 years flats fishing in the backcountry",
        licenseNumber: "FL-3456789",
        location: "Marathon, FL",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        verified: true,
        rating: "5.0",
        reviewCount: 34,
      },
    ];

    const sampleCharters: Charter[] = [
      {
        id: 1,
        captainId: 1,
        title: "Tarpon & Permit Adventure",
        description: "Experience world-class sight fishing in the crystal clear waters of the Florida Keys backcountry.",
        location: "Islamorada, FL",
        targetSpecies: "Tarpon, Permit, Bonefish",
        duration: "8 hours",
        maxGuests: 4,
        price: "800.00",
        boatSpecs: "22ft Hell's Bay flats boat, perfect for shallow water fishing",
        included: "All tackle, bait, fishing licenses, water, and snacks",
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"],
        available: true,
      },
      {
        id: 2,
        captainId: 2,
        title: "Offshore Mahi & Tuna",
        description: "Target trophy mahi-mahi and yellowfin tuna in the deep blue waters of the Atlantic Ocean.",
        location: "Key Largo, FL",
        targetSpecies: "Mahi-Mahi, Yellowfin Tuna, Wahoo",
        duration: "10 hours",
        maxGuests: 6,
        price: "1200.00",
        boatSpecs: "38ft Contender with twin outboards, full electronics suite",
        included: "All tackle, bait, fishing licenses, cooler with ice, lunch",
        images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop"],
        available: true,
      },
      {
        id: 3,
        captainId: 3,
        title: "Bonefish & Redfish Flats",
        description: "Stalk bonefish and redfish in the pristine flats of the Florida Keys backcountry.",
        location: "Marathon, FL",
        targetSpecies: "Bonefish, Redfish, Snook",
        duration: "6 hours",
        maxGuests: 3,
        price: "650.00",
        boatSpecs: "18ft Maverick flats skiff, ultra-shallow draft",
        included: "All tackle, fly fishing gear, bait, licenses, water",
        images: ["https://images.unsplash.com/photo-1567499898351-17d8eeb04b0e?w=800&h=600&fit=crop"],
        available: true,
      },
    ];

    // Populate maps
    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      this.currentUserId = Math.max(this.currentUserId, user.id + 1);
    });

    sampleCaptains.forEach(captain => {
      this.captains.set(captain.id, captain);
      this.currentCaptainId = Math.max(this.currentCaptainId, captain.id + 1);
    });

    sampleCharters.forEach(charter => {
      this.charters.set(charter.id, charter);
      this.currentCharterId = Math.max(this.currentCharterId, charter.id + 1);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Captain methods
  async getCaptain(id: number): Promise<Captain | undefined> {
    return this.captains.get(id);
  }

  async getCaptainByUserId(userId: number): Promise<Captain | undefined> {
    return Array.from(this.captains.values()).find(captain => captain.userId === userId);
  }

  async createCaptain(insertCaptain: InsertCaptain): Promise<Captain> {
    const captain: Captain = {
      ...insertCaptain,
      id: this.currentCaptainId++,
      rating: "0.00",
      reviewCount: 0,
    };
    this.captains.set(captain.id, captain);
    return captain;
  }

  async getAllCaptains(): Promise<Captain[]> {
    return Array.from(this.captains.values());
  }

  // Charter methods
  async getCharter(id: number): Promise<Charter | undefined> {
    return this.charters.get(id);
  }

  async getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined> {
    const charter = this.charters.get(id);
    if (!charter) return undefined;

    const captain = this.captains.get(charter.captainId);
    if (!captain) return undefined;

    const user = this.users.get(captain.userId);
    if (!user) return undefined;

    const reviews = Array.from(this.reviews.values()).filter(r => r.captainId === captain.id);

    return {
      ...charter,
      captain: { ...captain, user },
      reviews,
    };
  }

  async getChartersByCaptain(captainId: number): Promise<Charter[]> {
    return Array.from(this.charters.values()).filter(charter => charter.captainId === captainId);
  }

  async searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string }): Promise<CharterWithCaptain[]> {
    let charters = Array.from(this.charters.values());

    if (filters.location) {
      charters = charters.filter(charter => 
        charter.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.targetSpecies) {
      charters = charters.filter(charter => 
        charter.targetSpecies.toLowerCase().includes(filters.targetSpecies!.toLowerCase())
      );
    }

    if (filters.duration) {
      charters = charters.filter(charter => charter.duration === filters.duration);
    }

    const chartersWithCaptains: CharterWithCaptain[] = [];
    for (const charter of charters) {
      const captain = this.captains.get(charter.captainId);
      if (captain) {
        const user = this.users.get(captain.userId);
        if (user) {
          const reviews = Array.from(this.reviews.values()).filter(r => r.captainId === captain.id);
          chartersWithCaptains.push({
            ...charter,
            captain: { ...captain, user },
            reviews,
          });
        }
      }
    }

    return chartersWithCaptains;
  }

  async getAllCharters(): Promise<CharterWithCaptain[]> {
    return this.searchCharters({});
  }

  async createCharter(insertCharter: InsertCharter): Promise<Charter> {
    const charter: Charter = {
      ...insertCharter,
      id: this.currentCharterId++,
    };
    this.charters.set(charter.id, charter);
    return charter;
  }

  async updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined> {
    const charter = this.charters.get(id);
    if (!charter) return undefined;

    const updatedCharter = { ...charter, ...updates };
    this.charters.set(id, updatedCharter);
    return updatedCharter;
  }

  // Booking methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      createdAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getBookingsByCaptain(captainId: number): Promise<Booking[]> {
    const charters = await this.getChartersByCaptain(captainId);
    const charterIds = charters.map(c => c.id);
    return Array.from(this.bookings.values()).filter(booking => 
      charterIds.includes(booking.charterId)
    );
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      read: false,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async getMessageThread(userId1: number, userId2: number, charterId?: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        ((message.senderId === userId1 && message.receiverId === userId2) ||
         (message.senderId === userId2 && message.receiverId === userId1)) &&
        (!charterId || message.charterId === charterId)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getMessageThreads(userId: number): Promise<MessageThread[]> {
    const userMessages = Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);

    const threadMap = new Map<number, Message[]>();

    userMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!threadMap.has(otherUserId)) {
        threadMap.set(otherUserId, []);
      }
      threadMap.get(otherUserId)!.push(message);
    });

    const threads: MessageThread[] = [];
    for (const [otherUserId, messages] of threadMap) {
      const participant = this.users.get(otherUserId);
      if (participant) {
        const sortedMessages = messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastMessage = sortedMessages[0];
        const unreadCount = messages.filter(m => m.receiverId === userId && !m.read).length;

        threads.push({
          participant,
          lastMessage,
          unreadCount,
        });
      }
    }

    return threads.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }

  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, read: true });
    }
  }

  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentReviewId++,
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);

    // Update captain rating
    await this.updateCaptainRating(insertReview.captainId);

    return review;
  }

  async getReviewsByCaptain(captainId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.captainId === captainId);
  }

  async updateCaptainRating(captainId: number): Promise<void> {
    const reviews = await this.getReviewsByCaptain(captainId);
    const captain = this.captains.get(captainId);

    if (captain && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const updatedCaptain = {
        ...captain,
        rating: avgRating.toFixed(2),
        reviewCount: reviews.length,
      };
      this.captains.set(captainId, updatedCaptain);
    }
  }
}

export const storage = new MemStorage();
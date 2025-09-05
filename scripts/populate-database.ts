import { db } from "../server/db";
import { users, captains, charters, bookings, availability } from "../shared/schema";
import bcrypt from "bcrypt";

async function populateDatabase() {
  try {
    console.log("🚀 Starting database population...");

    // ============= CREAR USUARIOS =============
    console.log("📝 Creating users...");

    const userPasswords = await Promise.all([
      bcrypt.hash("password123", 10),
      bcrypt.hash("password123", 10),
      bcrypt.hash("password123", 10),
      bcrypt.hash("captain123", 10),
      bcrypt.hash("captain123", 10),
      bcrypt.hash("captain123", 10),
      bcrypt.hash("captain123", 10),
    ]);

    const newUsers = await db.insert(users).values([
      // Regular users
      {
        id: `user_${Date.now()}_1`,
        email: "john.doe@example.com",
        password: userPasswords[0],
        firstName: "John",
        lastName: "Doe",
        role: "user",
      },
      {
        id: `user_${Date.now()}_2`,
        email: "sarah.wilson@example.com",
        password: userPasswords[1],
        firstName: "Sarah",
        lastName: "Wilson",
        role: "user",
      },
      {
        id: `user_${Date.now()}_3`,
        email: "mike.johnson@example.com",
        password: userPasswords[2],
        firstName: "Mike",
        lastName: "Johnson",
        role: "user",
      },
      // Captains
      {
        id: `captain_${Date.now()}_1`,
        email: "captain.rodriguez@example.com",
        password: userPasswords[3],
        firstName: "Carlos",
        lastName: "Rodriguez",
        role: "captain",
      },
      {
        id: `captain_${Date.now()}_2`,
        email: "captain.martinez@example.com",
        password: userPasswords[4],
        firstName: "Ana",
        lastName: "Martinez",
        role: "captain",
      },
      {
        id: `captain_${Date.now()}_3`,
        email: "captain.garcia@example.com",
        password: userPasswords[5],
        firstName: "Diego",
        lastName: "Garcia",
        role: "captain",
      },
      {
        id: `captain_${Date.now()}_4`,
        email: "captain.lopez@example.com",
        password: userPasswords[6],
        firstName: "Maria",
        lastName: "Lopez",
        role: "captain",
      },
    ]).returning();

    console.log(`✅ Created ${newUsers.length} users`);

    // ============= CREAR CAPTAINS =============
    console.log("⛵ Creating captains...");

    const captainUsers = newUsers.filter(u => u.role === "captain");

    const newCaptains = await db.insert(captains).values([
      {
        userId: captainUsers[0].id,
        name: "Captain Rodriguez",
        bio: "Experienced captain with over 15 years navigating Caribbean waters. Specialist in deep sea fishing and family tours.",
        experience: "15 years of experience in sport fishing, family tours and diving excursions. Certified in maritime first aid.",
        licenseNumber: "CAP-2024-001",
        location: "Miami, FL",
        avatar: "/attached_assets/image_1749589187411.png",
        verified: true,
        rating: "4.9",
        reviewCount: 147,
      },
      {
        userId: captainUsers[1].id,
        name: "Captain Martinez",
        bio: "Professional fishing guide specializing in inshore and offshore adventures. Expert in Mahi, Tuna, and Marlin fishing.",
        experience: "12 years guiding fishing expeditions in Florida Keys. Coast Guard licensed and insured.",
        licenseNumber: "CAP-2024-002",
        location: "Key West, FL",
        avatar: "/attached_assets/image_1749589049214.png",
        verified: true,
        rating: "4.8",
        reviewCount: 98,
      },
      {
        userId: captainUsers[2].id,
        name: "Captain Garcia",
        bio: "Sunset cruise specialist and fishing enthusiast. Perfect for romantic getaways and family adventures.",
        experience: "8 years providing memorable ocean experiences. Specialized in sunset tours and reef fishing.",
        licenseNumber: "CAP-2024-003",
        location: "Fort Lauderdale, FL",
        avatar: "/attached_assets/image_1749589265116.png",
        verified: true,
        rating: "4.7",
        reviewCount: 73,
      },
      {
        userId: captainUsers[3].id,
        name: "Captain Lopez",
        bio: "Charter boat captain focused on big game fishing. Tournaments winner with multiple records.",
        experience: "20+ years in sport fishing. Tournament champion and big game specialist.",
        licenseNumber: "CAP-2024-004",
        location: "Naples, FL",
        avatar: "/attached_assets/image_1749589117238.png",
        verified: true,
        rating: "5.0",
        reviewCount: 156,
      },
    ]).returning();

    console.log(`✅ Created ${newCaptains.length} captains`);

    // ============= CREAR CHARTERS =============
    console.log("🎣 Creating charters...");

    const newCharters = await db.insert(charters).values([
      // Captain 1 charters
      {
        captainId: newCaptains[0].id,
        title: "Deep Sea Mahi Adventure",
        description: "Join us for an unforgettable deep sea fishing experience targeting Mahi-Mahi, Tuna, and other pelagic species. Our 35ft sport fishing boat is fully equipped with top-of-the-line gear.",
        location: "Miami, FL",
        lat: "25.7617",
        lng: "-80.1918",
        targetSpecies: "Mahi-Mahi, Tuna, Wahoo",
        duration: "8 hours",
        maxGuests: 6,
        price: "850.00",
        boatSpecs: "35ft Sport Fisher, Twin 350HP Engines, Full Electronics",
        included: "All fishing gear, licenses, bait, ice, cleaning service",
        images: ["/attached_assets/image_1749589049214.png", "/attached_assets/image_1749589117238.png"],
        available: true,
        isListed: true,
      },
      {
        captainId: newCaptains[0].id,
        title: "Half Day Reef Fishing",
        description: "Perfect for families and beginners. Target Grouper, Snapper, and other reef fish in the beautiful waters off Miami.",
        location: "Miami, FL",
        lat: "25.7617",
        lng: "-80.1918",
        targetSpecies: "Grouper, Snapper, Amberjack",
        duration: "4 hours",
        maxGuests: 8,
        price: "450.00",
        boatSpecs: "35ft Sport Fisher, Comfortable seating, Shade",
        included: "Fishing gear, licenses, bait, snacks, drinks",
        images: ["/attached_assets/image_1749589187411.png", "/attached_assets/image_1749589265116.png"],
        available: true,
        isListed: true,
      },
      // Captain 2 charters
      {
        captainId: newCaptains[1].id,
        title: "Sunset Reef Adventure",
        description: "Experience the magic of Key West sunsets while fishing for Yellowtail Snapper and Grouper. Perfect for couples and small groups.",
        location: "Key West, FL",
        lat: "24.5551",
        lng: "-81.7800",
        targetSpecies: "Yellowtail, Grouper, Mutton Snapper",
        duration: "4 hours",
        maxGuests: 4,
        price: "520.00",
        boatSpecs: "28ft Center Console, Yamaha 300HP, GPS/Fishfinder",
        included: "All tackle, licenses, bait, sunset drinks, photos",
        images: ["/attached_assets/image_1749589503390.png", "/attached_assets/image_1749589520368.png"],
        available: true,
        isListed: true,
      },
      {
        captainId: newCaptains[1].id,
        title: "Tarpon Fishing Expedition",
        description: "Chase the Silver King in the pristine waters around Key West. Seasonal availability for the ultimate fishing challenge.",
        location: "Key West, FL",
        lat: "24.5551",
        lng: "-81.7800",
        targetSpecies: "Tarpon, Permit, Bonefish",
        duration: "6 hours",
        maxGuests: 3,
        price: "750.00",
        boatSpecs: "24ft Flats Boat, Shallow draft, Poling platform",
        included: "Fly fishing gear, spinning tackle, licenses, lunch",
        images: ["/attached_assets/image_1749589534565.png", "/attached_assets/image_1749589548395.png"],
        available: true,
        isListed: true,
      },
      // Captain 3 charters
      {
        captainId: newCaptains[2].id,
        title: "Family Friendly Fishing",
        description: "Perfect charter for families with kids. Learn fishing basics while catching Snapper, Grouper and having fun on the water.",
        location: "Fort Lauderdale, FL",
        lat: "26.1224",
        lng: "-80.1373",
        targetSpecies: "Snapper, Grouper, Triggerfish",
        duration: "4 hours",
        maxGuests: 6,
        price: "400.00",
        boatSpecs: "32ft Family Cruiser, Bathroom, Shade, Safety gear",
        included: "Kid-friendly gear, snacks, drinks, fish cleaning",
        images: ["/attached_assets/image_1749589560449.png", "/attached_assets/image_1749589578771.png"],
        available: true,
        isListed: true,
      },
      {
        captainId: newCaptains[2].id,
        title: "Romantic Sunset Cruise",
        description: "Intimate sunset cruise for couples. Includes champagne, appetizers, and the most beautiful sunset views in South Florida.",
        location: "Fort Lauderdale, FL",
        lat: "26.1224",
        lng: "-80.1373",
        targetSpecies: "Light fishing available",
        duration: "3 hours",
        maxGuests: 2,
        price: "350.00",
        boatSpecs: "Luxury yacht, Premium amenities, Sound system",
        included: "Champagne, appetizers, blankets, photography",
        images: ["/attached_assets/image_1749589593403.png", "/attached_assets/image_1749589611134.png"],
        available: true,
        isListed: true,
      },
      // Captain 4 charters
      {
        captainId: newCaptains[3].id,
        title: "Monster Marlin Hunt",
        description: "Big game fishing at its finest. Target Blue and White Marlin, Sailfish, and other billfish in the deep waters off Naples.",
        location: "Naples, FL",
        lat: "26.1420",
        lng: "-81.7948",
        targetSpecies: "Blue Marlin, White Marlin, Sailfish",
        duration: "10 hours",
        maxGuests: 4,
        price: "1200.00",
        boatSpecs: "42ft Sportfisher, Tower, Outriggers, Fighting chairs",
        included: "Premium tackle, lures, crew, lunch, drinks",
        images: ["/attached_assets/image_1749589681877.png", "/attached_assets/image_1749589763057.png"],
        available: true,
        isListed: true,
      },
      {
        captainId: newCaptains[3].id,
        title: "Offshore Tuna Trolling",
        description: "High-speed trolling for Yellowfin and Blackfin Tuna. Experience the thrill of big fish and open ocean fishing.",
        location: "Naples, FL",
        lat: "26.1420",
        lng: "-81.7948",
        targetSpecies: "Yellowfin Tuna, Blackfin Tuna, Wahoo",
        duration: "8 hours",
        maxGuests: 6,
        price: "950.00",
        boatSpecs: "38ft Express, Twin diesels, Full tower, Electronics",
        included: "All gear, licenses, ice, fish processing",
        images: ["/attached_assets/image_1751311608507.png", "/attached_assets/image_1749588943897.png"],
        available: true,
        isListed: true,
      },
    ]).returning();

    console.log(`✅ Created ${newCharters.length} charters`);

    // ============= CREAR AVAILABILITY =============
    console.log("📅 Creating availability slots...");

    const now = new Date();
    const availabilitySlots = [];

    // Crear disponibilidad para los próximos 60 días
    for (let i = 1; i <= 60; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Cada charter tiene disponibilidad aleatoria (no todos los días)
      for (const charter of newCharters) {
        if (Math.random() > 0.3) { // 70% de probabilidad de disponibilidad
          availabilitySlots.push({
            charterId: charter.id,
            date: date,
            slots: Math.floor(Math.random() * 3) + 1, // 1-3 slots disponibles
            bookedSlots: 0,
          });
        }
      }
    }

    await db.insert(availability).values(availabilitySlots);
    console.log(`✅ Created ${availabilitySlots.length} availability slots`);

    // ============= CREAR BOOKINGS =============
    console.log("📋 Creating sample bookings...");

    const regularUsers = newUsers.filter(u => u.role === "user");

    const sampleBookings = [
      {
        userId: regularUsers[0].id,
        charterId: newCharters[0].id,
        tripDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        guests: 4,
        totalPrice: "850.00",
        status: "confirmed",
        message: "Looking forward to the deep sea adventure! First time fishing for Mahi.",
      },
      {
        userId: regularUsers[1].id,
        charterId: newCharters[2].id,
        tripDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        guests: 2,
        totalPrice: "520.00",
        status: "confirmed",
        message: "Anniversary trip - hoping for a beautiful sunset!",
      },
      {
        userId: regularUsers[2].id,
        charterId: newCharters[4].id,
        tripDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        guests: 5,
        totalPrice: "400.00",
        status: "pending",
        message: "Family trip with 3 kids ages 8-14. They're all excited!",
      },
      {
        userId: regularUsers[0].id,
        charterId: newCharters[6].id,
        tripDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        guests: 3,
        totalPrice: "1200.00",
        status: "confirmed",
        message: "Bucket list trip - hoping to catch my first marlin!",
      },
    ];

    await db.insert(bookings).values(sampleBookings);
    console.log(`✅ Created ${sampleBookings.length} bookings`);

    // ============= SUMMARY =============
    console.log("\n🎉 Database populated successfully!");
    console.log("==========================================");
    console.log(`📊 SUMMARY:`);
    console.log(`   • Users: ${newUsers.length} (3 regular + 4 captains)`);
    console.log(`   • Captains: ${newCaptains.length}`);
    console.log(`   • Charters: ${newCharters.length}`);
    console.log(`   • Availability: ${availabilitySlots.length} slots`);
    console.log(`   • Bookings: ${sampleBookings.length}`);
    console.log("==========================================");

    console.log("\n👥 USER CREDENTIALS:");
    console.log("Regular Users:");
    console.log("  - john.doe@example.com / password123");
    console.log("  - sarah.wilson@example.com / password123");
    console.log("  - mike.johnson@example.com / password123");
    console.log("\nCaptains:");
    console.log("  - captain.rodriguez@example.com / captain123");
    console.log("  - captain.martinez@example.com / captain123");
    console.log("  - captain.garcia@example.com / captain123");
    console.log("  - captain.lopez@example.com / captain123");

  } catch (error) {
    console.error("❌ Error populating database:", error);
  } finally {
    process.exit(0);
  }
}

populateDatabase();
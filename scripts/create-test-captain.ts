
import { db } from "../server/db";
import { users, captains } from "../shared/schema";
import bcrypt from "bcrypt";

async function createTestCaptain() {
  try {
    // Crear usuario captain
    const hashedPassword = await bcrypt.hash("captain123", 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        id: `captain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: "captain1@example.com",
        password: hashedPassword,
        firstName: "Carlos",
        lastName: "Martinez",
        role: "captain",
      })
      .returning();

    console.log("Usuario creado:", newUser);

    // Crear perfil de captain
    const [newCaptain] = await db
      .insert(captains)
      .values({
        userId: newUser.id,
        bio: "Capitán experimentado con más de 15 años navegando las aguas del Caribe. Especialista en pesca deportiva y tours familiares.",
        experience: "15 años de experiencia en pesca deportiva, tours familiares y excursiones de buceo. Certificado en primeros auxilios marítimos.",
        licenseNumber: "CAP-2024-001",
        location: "Cancún, México",
        avatar: "/attached_assets/captain-avatar.jpg",
        verified: true,
        rating: "4.8",
        reviewCount: 127,
      })
      .returning();

    console.log("Captain creado:", newCaptain);
    console.log("\n=== CREDENCIALES DEL CAPTAIN ===");
    console.log("Email: captain1@example.com");
    console.log("Password: captain123");
    console.log("Nombre: Carlos Martinez");
    console.log("==================================");

  } catch (error) {
    console.error("Error creando captain:", error);
  } finally {
    process.exit(0);
  }
}

createTestCaptain();

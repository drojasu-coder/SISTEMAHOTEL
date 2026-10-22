import readline from "node:readline";
import { Writable } from "node:stream";
import process from "node:process";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número");

function askHidden(promptMessage: string): Promise<string> {
  return new Promise((resolve) => {
    let muted = false;
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: outputStream,
      terminal: true,
    });

    process.stdout.write(promptMessage);
    muted = true;

    rl.question("", (answer) => {
      muted = false;
      process.stdout.write("\n");
      rl.close();
      resolve(answer.replace(/[\r\n]+$/, ""));
    });
  });
}

async function main() {
  const db = require("../src/models");
  const { Usuario, sequelize } = db;

  const handleExit = async () => {
    try {
      await sequelize.close();
    } catch {}
  };

  process.on("SIGINT", async () => {
    process.stdout.write("\nOperación cancelada por el usuario.\n");
    await handleExit();
    process.exit(130);
  });

  process.on("SIGTERM", async () => {
    await handleExit();
    process.exit(143);
  });

  try {
    // 1. Confirmar conexión efectiva a hotel_db
    const [dbInfo] = await sequelize.query(
      "SELECT current_database() AS db_name, inet_server_port() AS port, current_user AS db_user;"
    );
    const currentDb = dbInfo[0]?.db_name;

    if (currentDb !== "hotel_db") {
      console.error(
        `Error: La base de datos conectada es '${currentDb}', pero se requiere 'hotel_db'. Operación cancelada.`
      );
      await handleExit();
      process.exit(1);
    }

    console.log(`Conexión confirmada: base de datos '${currentDb}'.`);

    // 2. Comprobar si admin@hunahpu.com ya existe
    const targetEmail = "admin@hunahpu.com";
    const existing = await Usuario.findOne({ where: { email: targetEmail } });

    if (existing) {
      console.log(
        `El usuario '${targetEmail}' ya existe en la base de datos (ID: ${existing.id}). No se aplicaron modificaciones ni duplicados.`
      );
      await handleExit();
      return;
    }

    console.log(
      `Creación de usuario administrador:\n  Nombre: Administrador HOTEL HUNAHPÚ\n  Correo: ${targetEmail}\n  Rol: admin\n  Estado: activo\n`
    );

    // 3. Solicitar contraseña con entrada oculta
    const password = await askHidden("Ingrese la contraseña: ");
    if (!password) {
      console.log("Operación cancelada: contraseña vacía. No se creó ningún usuario.");
      await handleExit();
      return;
    }

    const confirmPassword = await askHidden("Confirme la contraseña: ");

    if (password !== confirmPassword) {
      console.error("Error: Las contraseñas no coinciden. Operación cancelada.");
      await handleExit();
      process.exit(1);
    }

    // Validar contraseña según reglas del backend
    const validationResult = passwordSchema.safeParse(password);
    if (!validationResult.success) {
      console.error("Error en las reglas de validación de contraseña:");
      for (const issue of validationResult.error.issues) {
        console.error(` - ${issue.message}`);
      }
      await handleExit();
      process.exit(1);
    }

    // 4. Hash seguro con bcrypt (12 rondas como en el servicio de autenticación)
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Crear usuario en hotel_db
    const nuevoUsuario = await Usuario.create({
      nombre: "Administrador HOTEL HUNAHPÚ",
      email: targetEmail,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });

    // 6. Confirmar resultado mostrando únicamente ID, nombre, correo y rol
    console.log("\nUsuario administrador creado exitosamente:");
    console.log(`  ID: ${nuevoUsuario.id}`);
    console.log(`  Nombre: ${nuevoUsuario.nombre}`);
    console.log(`  Correo: ${nuevoUsuario.email}`);
    console.log(`  Rol: ${nuevoUsuario.rol}`);
    console.log(`  Activo: ${nuevoUsuario.activo ? "Sí" : "No"}`);
  } catch (err) {
    console.error("Ocurrió un error al procesar la creación:", err);
    await handleExit();
    process.exit(1);
  } finally {
    await handleExit();
  }
}

main();

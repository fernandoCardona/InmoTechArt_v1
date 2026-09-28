'use server';

import { db } from '../../lib/db';
import { users, authorizedDevices, userSessions, accessAuditLogs } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { encrypt } from '../../lib/auth';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function submitLogin(formData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();
  const deviceFingerprint = formData.get('deviceFingerprint')?.toString();

  // Variables mock para IP y UA (en prod lo ideal es pasarlas desde headers si se expone en Middleware)
  const ipAddress = '127.0.0.1'; // TODO: Obtener del request header de next
  const userAgent = 'NextJS App Router Server Action';

  if (!email || !password || !deviceFingerprint) {
    return { error: 'Datos incompletos.' };
  }

  try {
    // 1. Buscar al usuario
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      await logAudit(null, ipAddress, deviceFingerprint, 'LOGIN', false, 'USER_NOT_FOUND');
      return { error: 'Credenciales inválidas.' };
    }

    if (!user.isActive) {
      await logAudit(user.id, ipAddress, deviceFingerprint, 'LOGIN', false, 'USER_INACTIVE');
      return { error: 'Usuario inactivo. Contacta con el administrador.' };
    }

    // 2. Validar contraseña
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await logAudit(user.id, ipAddress, deviceFingerprint, 'LOGIN', false, 'WRONG_PASSWORD');
      return { error: 'Credenciales inválidas.' };
    }

    // 3. Validar Dispositivo (Device Fingerprint)
    let deviceResult = await db.select()
      .from(authorizedDevices)
      .where(
        and(
          eq(authorizedDevices.userId, user.id),
          eq(authorizedDevices.deviceFingerprint, deviceFingerprint)
        )
      ).limit(1);
    
    let device = deviceResult[0];

    // Si el dispositivo no existe para este usuario, lo insertamos como PENDING
    if (!device) {
      const [newDevice] = await db.insert(authorizedDevices).values({
        userId: user.id,
        deviceFingerprint: deviceFingerprint,
        deviceLabel: 'Intento de login nuevo dispositivo',
        status: 'PENDING'
      }).returning();
      device = newDevice;
      await logAudit(user.id, ipAddress, deviceFingerprint, 'DEVICE_REGISTERED', true, null);
    }

    // Si es el SuperAdmin creador inicial, excepcionalmente se auto-aprueba si estaba pending
    if (user.role === 'SUPERADMIN' && device.status === 'PENDING') {
      const [updatedDevice] = await db.update(authorizedDevices)
        .set({ status: 'APPROVED', approvedBy: user.id, approvedAt: new Date() })
        .where(eq(authorizedDevices.id, device.id))
        .returning();
      device = updatedDevice;
    }

    // Comprobamos estado final del dispositivo
    if (device.status !== 'APPROVED') {
      await logAudit(user.id, ipAddress, deviceFingerprint, 'LOGIN', false, 'DEVICE_PENDING');
      return { pending: true };
    }

    // 4. Login Exitoso: Inyectar Sesión Segura
    // Invalida sesiones anteriores
    await db.update(userSessions).set({ isActive: false }).where(eq(userSessions.userId, user.id));

    // Crear nueva sesión en BD
    const sessionTokenHex = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas

    const [newSession] = await db.insert(userSessions).values({
      userId: user.id,
      deviceId: device.id,
      sessionToken: sessionTokenHex,
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt
    }).returning();

    // Crear JWT con JOSE
    const payload = {
      userId: user.id,
      role: user.role,
      sessionId: newSession.id
    };

    const token = await encrypt(payload);

    // Inyectar en cookies HTTP Only (desde Next 15 no hace falta await si es sync, pero es asíncrono para el map en server context)
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 // 8 horas en segundos
    });

    await logAudit(user.id, ipAddress, deviceFingerprint, 'LOGIN', true, null);

    return { success: true };
  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'Error del servidor. Vuelve a intentarlo.' };
  }
}

// Función auxiliar de auditoría
async function logAudit(userId, ip, fp, action, success, reason) {
  try {
    await db.insert(accessAuditLogs).values({
      userId,
      ipAddress: ip,
      deviceFingerprint: fp,
      action,
      wasSuccessful: success,
      failureReason: reason
    });
  } catch (e) {
    console.error('Error insertando log de auditoría', e);
  }
}

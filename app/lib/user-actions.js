'use server';

import { cookies } from 'next/headers';
import { db } from './db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './auth';
import bcrypt from 'bcryptjs';

// Helper para Auth
async function getAuthPayload() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  return await decrypt(sessionToken);
}

export async function updateUserProfile(data) {
  const payload = await getAuthPayload();
  if (!payload?.userId) return { success: false, error: 'No autorizado' };

  try {
    // Validar email si cambia
    if (data.email) {
      const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
      if (existing.length > 0 && existing[0].id !== payload.userId) {
        return { success: false, error: 'El email ya está en uso por otra cuenta' };
      }
    }

    await db.update(users)
      .set({
        fullName: data.fullName,
        email: data.email
      })
      .where(eq(users.id, payload.userId));

    return { success: true };
  } catch (err) {
    console.error('Error updating profile:', err);
    return { success: false, error: 'Error al actualizar el perfil' };
  }
}

export async function updateUserPassword(data) {
  const payload = await getAuthPayload();
  if (!payload?.userId) return { success: false, error: 'No autorizado' };

  const { currentPassword, newPassword } = data;

  try {
    const userRows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (userRows.length === 0) return { success: false, error: 'Usuario no encontrado' };
    const user = userRows[0];

    // Verificar password actual
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return { success: false, error: 'La contraseña actual es incorrecta' };

    // Hashear nueva
    const hashed = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ passwordHash: hashed })
      .where(eq(users.id, payload.userId));

    return { success: true };
  } catch (err) {
    console.error('Error updating password:', err);
    return { success: false, error: 'Error al actualizar la contraseña' };
  }
}

// ==========================================
// ACCIONES PARA SUPERADMIN
// ==========================================

async function isSuperAdmin() {
  const payload = await getAuthPayload();
  return payload?.role === 'SUPERADMIN';
}

export async function getAllUsers() {
  if (!(await isSuperAdmin())) return { success: false, error: 'Acceso denegado', data: [] };

  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    }).from(users);
    return { success: true, data: allUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Error al obtener usuarios', data: [] };
  }
}

export async function createNewUser(data) {
  if (!(await isSuperAdmin())) return { success: false, error: 'Acceso denegado' };

  try {
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0) return { success: false, error: 'El email ya existe' };

    const hashed = await bcrypt.hash(data.password, 12);

    await db.insert(users).values({
      email: data.email,
      fullName: data.fullName,
      passwordHash: hashed,
      role: data.role || 'AGENT'
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Error al crear usuario' };
  }
}

export async function updateUserAccess(userId, updates) {
  if (!(await isSuperAdmin())) return { success: false, error: 'Acceso denegado' };

  try {
    const updateData = {};
    if (updates.role) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    if (updates.newPassword) {
      updateData.passwordHash = await bcrypt.hash(updates.newPassword, 12);
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user access:', error);
    return { success: false, error: 'Error al actualizar usuario' };
  }
}

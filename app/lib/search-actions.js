'use server';

import { cookies } from 'next/headers';
import { db } from './db';
import { searchHistory, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { decrypt } from './auth';

// Middleware privado auxiliar
async function getAuthPayload() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  return await decrypt(sessionToken);
}

/**
 * Guarda una nueva búsqueda en el historial del usuario.
 */
export async function saveSearchQuery(query) {
  if (!query || query.trim() === '') return { success: false };
  
  const payload = await getAuthPayload();
  if (!payload?.userId) return { success: false, error: 'No autorizado' };

  try {
    await db.insert(searchHistory).values({
      userId: payload.userId,
      searchQuery: query.trim()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving search history:', error);
    return { success: false, error: 'Error interno' };
  }
}

/**
 * Obtiene las últimas 10 búsquedas del usuario activo.
 */
export async function getMySearchHistory() {
  const payload = await getAuthPayload();
  if (!payload?.userId) return { success: false, error: 'No autorizado', data: [] };

  try {
    const history = await db.select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, payload.userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(10);
      
    // Solo devolveremos las querys únicas para evitar "casa", "casa", "casa"
    const uniqueQueries = [...new Set(history.map(h => h.searchQuery))];
    
    return { success: true, data: uniqueQueries.slice(0, 10) };
  } catch (error) {
    console.error('Error fetching user search history:', error);
    return { success: false, error: 'Error interno', data: [] };
  }
}

/**
 * Obtiene el historial global de TODOS los usuarios.
 * SOLO para SUPERADMIN.
 */
export async function getAllSearchHistory() {
  const payload = await getAuthPayload();
  if (!payload?.userId || payload.role !== 'SUPERADMIN') {
    return { success: false, error: 'Acceso denegado', data: [] };
  }

  try {
    const history = await db.select({
        id: searchHistory.id,
        searchQuery: searchHistory.searchQuery,
        createdAt: searchHistory.createdAt,
        userEmail: users.email,
        userName: users.fullName
      })
      .from(searchHistory)
      .leftJoin(users, eq(searchHistory.userId, users.id))
      .orderBy(desc(searchHistory.createdAt))
      .limit(100);
      
    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching global search history:', error);
    return { success: false, error: 'Error interno', data: [] };
  }
}

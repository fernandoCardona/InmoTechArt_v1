'use server';

import { cookies } from 'next/headers';
import { db } from '../../../lib/db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../../../lib/auth';

export async function updateUserLocale(newLocale) {
  if (!['es', 'ca'].includes(newLocale)) {
    return { error: 'Idioma no soportado' };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (sessionCookie) {
    const payload = await decrypt(sessionCookie);
    if (payload?.userId) {
      // Actualizamos la base de datos
      await db.update(users)
        .set({ locale: newLocale })
        .where(eq(users.id, payload.userId));
    }
  }

  // Establecemos la cookie (la usará la app al instante, logueado o no)
  // Duración 1 año (31536000 segundos)
  cookieStore.set('NEXT_LOCALE', newLocale, { path: '/', maxAge: 31536000 });
  
  return { success: true };
}

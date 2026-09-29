import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { providers } from '../../../db/schema';
import { desc } from 'drizzle-orm';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return false;
  const payload = await decrypt(sessionToken);
  return payload?.role === 'SUPERADMIN';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
       return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await db.select().from(providers).orderBy(desc(providers.createdAt));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Error del servidor al obtener proveedores.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acceso Denegado. Se requiere rol SUPERADMIN.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, contactEmail, notes } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'El nombre y el código son obligatorios.' }, { status: 400 });
    }

    const newProvider = await db.insert(providers).values({
      name,
      code: code.toUpperCase(),
      contactEmail,
      notes
    }).returning();

    return NextResponse.json({ success: true, data: newProvider[0] });
  } catch (error) {
    console.error('Error creating provider:', error);
    if (error.code === '23505') { // Postgres unique violation
      return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre o código.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor al crear proveedor.' }, { status: 500 });
  }
}

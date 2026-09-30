import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { providers } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';

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

export async function PUT(req) {
  try {
    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acceso Denegado. Se requiere rol SUPERADMIN.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, code, contactEmail, notes, isActive } = body;

    if (!id || !name || !code) {
      return NextResponse.json({ error: 'ID, nombre y código son obligatorios.' }, { status: 400 });
    }

    const updatedProvider = await db.update(providers)
      .set({
        name,
        code: code.toUpperCase(),
        contactEmail,
        notes,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(providers.id, id))
      .returning();

    if (updatedProvider.length === 0) {
      return NextResponse.json({ error: 'Proveedor no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedProvider[0] });
  } catch (error) {
    console.error('Error updating provider:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre o código.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor al actualizar proveedor.' }, { status: 500 });
  }
}

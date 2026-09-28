import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authorizedDevices, accessAuditLogs, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';

// Middleware integrado para proteger API Admin
async function isSuperAdmin(req) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return false;
  
  const payload = await decrypt(sessionCookie);
  if (!payload || payload.role !== 'SUPERADMIN') return false;
  return payload;
}

export async function GET(req) {
  const session = await isSuperAdmin(req);
  if (!session) return NextResponse.json({ error: 'Acceso Denegado (SuperAdmin Only)' }, { status: 403 });

  try {
    // Recuperar dispositivos pendientes (y algunos aprobados para lista general)
    const devices = await db.select({
      id: authorizedDevices.id,
      fingerprint: authorizedDevices.deviceFingerprint,
      label: authorizedDevices.deviceLabel,
      status: authorizedDevices.status,
      createdAt: authorizedDevices.createdAt,
      userEmail: users.email,
    })
    .from(authorizedDevices)
    .innerJoin(users, eq(authorizedDevices.userId, users.id))
    .orderBy(desc(authorizedDevices.createdAt))
    .limit(20);

    // Recuperar últimos 50 logs de acceso
    const logs = await db.select({
      id: accessAuditLogs.id,
      ip: accessAuditLogs.ipAddress,
      action: accessAuditLogs.action,
      success: accessAuditLogs.wasSuccessful,
      reason: accessAuditLogs.failureReason,
      createdAt: accessAuditLogs.createdAt,
      userEmail: users.email,
    })
    .from(accessAuditLogs)
    .leftJoin(users, eq(accessAuditLogs.userId, users.id))
    .orderBy(desc(accessAuditLogs.createdAt))
    .limit(50);

    return NextResponse.json({ devices, logs });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await isSuperAdmin(req);
  if (!session) return NextResponse.json({ error: 'Acceso Denegado' }, { status: 403 });

  try {
    const { deviceId, status } = await req.json();

    if (!deviceId || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await db.update(authorizedDevices)
      .set({ 
        status, 
        approvedBy: session.userId, 
        approvedAt: new Date() 
      })
      .where(eq(authorizedDevices.id, deviceId));

    return NextResponse.json({ success: true, message: `Dispositivo ${status}` });
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Fallo actualizando estado' }, { status: 500 });
  }
}

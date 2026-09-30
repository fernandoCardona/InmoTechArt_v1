import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importBatches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
  }

  try {
    const result = await db.select().from(importBatches).where(eq(importBatches.id, batchId)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const batch = result[0];
    return NextResponse.json({
      status: batch.status,
      inserted: batch.recordsInserted,
      updated: batch.recordsUpdated,
      failed: batch.recordsFailed,
      total: batch.recordsReceived || 1,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

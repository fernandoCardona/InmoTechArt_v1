import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { properties } from '../../../db/schema';
import { ilike, or, and, desc, sql } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Construcción dinámica de filtros
    let filters = undefined;
    if (search) {
      const searchTerm = `%${search}%`;
      filters = or(
        ilike(properties.cadastralReference, searchTerm),
        ilike(properties.assetCodeProvider, searchTerm),
        ilike(properties.municipality, searchTerm),
        ilike(properties.address, searchTerm)
      );
    }

    // Consulta de datos
    const data = await db
      .select()
      .from(properties)
      .where(filters)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(properties.createdAt));

    // Contador total optimizado
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(properties)
      .where(filters);
    
    const totalRecords = Number(countResult[0].count);

    return NextResponse.json({
      data,
      metadata: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Fallo al obtener activos' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { properties, providers } from '../../../db/schema';
import { ilike, or, and, desc, sql, eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const providerId = searchParams.get('providerId');
    
    const offset = (page - 1) * limit;

    // Construcción dinámica de filtros
    let searchFilter = undefined;
    if (search) {
      const searchTerm = `%${search}%`;
      searchFilter = or(
        ilike(properties.cadastralReference, searchTerm),
        ilike(properties.assetCodeProvider, searchTerm),
        ilike(properties.municipality, searchTerm),
        ilike(properties.address, searchTerm)
      );
    }
    
    let filters = undefined;
    if (searchFilter && providerId) {
      filters = and(searchFilter, eq(properties.providerId, providerId));
    } else if (searchFilter) {
      filters = searchFilter;
    } else if (providerId) {
      filters = eq(properties.providerId, providerId);
    }

    // Consulta de datos con JOIN a providers
    const rawData = await db
      .select()
      .from(properties)
      .leftJoin(providers, eq(properties.providerId, providers.id))
      .where(filters)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(properties.createdAt));

    // Aplanar el resultado para mantener retrocompatibilidad con la UI
    const data = rawData.map(row => ({
      ...row.properties,
      providerName: row.providers?.name || 'Desconocido',
    }));

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
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}


export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Falta providerId' }, { status: 400 });
    }

    const result = await db.delete(properties).where(eq(properties.providerId, providerId)).returning();

    return NextResponse.json({ success: true, deletedCount: result.length });
  } catch (error) {
    console.error('Error al borrar activos del proveedor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

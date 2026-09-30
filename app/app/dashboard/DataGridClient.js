'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { flexRender, createCoreRowModel, useTable } from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Clock } from 'lucide-react';
import PropertyDrawer from './PropertyDrawer';
import { saveSearchQuery, getMySearchHistory } from '../../lib/search-actions';

export default function DataGridClient() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get('providerId');
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States para Paginación y Búsqueda Controlada por Servidor
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // States para Historial de Búsqueda
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef(null);

  // Drawer State
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch de datos al backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties?page=${pageIndex}&limit=${pageSize}&search=${encodeURIComponent(globalFilter)}${providerId ? `&providerId=${providerId}` : ''}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setMetadata(json.metadata);
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const res = await getMySearchHistory();
    if (res.success) {
      setSearchHistory(res.data);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchHistory();
    };
    init();
  }, []);

  // Efecto para ocultar el historial si clico fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efecto para recargar datos si cambia página, tamaño o búsqueda
  useEffect(() => {
    // Debounce manual simple para la búsqueda
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, globalFilter]);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && globalFilter.trim() !== '') {
      setShowHistory(false);
      await saveSearchQuery(globalFilter);
      fetchHistory(); // Recargar el historial tras guardar
    }
  };

  const selectHistoryItem = (query) => {
    setGlobalFilter(query);
    setPageIndex(1);
    setShowHistory(false);
  };

  const handleRowClick = (property) => {
    setSelectedProperty(property);
    setIsDrawerOpen(true);
  };

  // Columnas para TanStack Table
  const columns = [
    {
      accessorKey: 'providerId',
      header: 'Provider UUID',
      cell: info => <span className="text-slate-500 font-mono text-[9px] truncate max-w-[80px] block" title={info.getValue()}>{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'providerName',
      header: 'Proveedor',
      cell: info => <span className="text-emerald-400 font-semibold text-xs tracking-wide uppercase">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: info => <span className="text-slate-400 text-[10px]">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '--'}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Actualizado',
      cell: info => <span className="text-slate-400 text-[10px]">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '--'}</span>,
    },
    {
      accessorKey: 'cadastralReference',
      header: 'Catastro',
      cell: info => <span className="font-mono text-slate-300">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'registryCode',
      header: 'Fincas',
      cell: info => <span className="text-slate-400 font-mono text-[11px] truncate max-w-[120px] block" title={info.getValue()}>{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'assetType',
      header: 'Tipo',
      cell: info => <span className="text-slate-300">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'usage',
      header: 'Uso',
      cell: info => <span className="text-slate-400 text-xs">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: info => <span className="text-slate-400 truncate max-w-[180px] block" title={info.getValue()}>{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'municipality',
      header: 'Municipio',
      cell: info => <span className="text-slate-300">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'modalidadComercial',
      header: 'Modalidad',
      cell: info => <span className="text-slate-400 text-xs">{info.getValue() || '--'}</span>,
    },
    {
      accessorKey: 'superficieSueloM2',
      header: 'Superficie',
      cell: info => <span className="text-slate-300 text-xs">{info.getValue() ? `${info.getValue()} m²` : '--'}</span>,
    },
    {
      accessorKey: 'precioVenta',
      header: 'Precio',
      cell: info => <span className="font-dm-sans font-medium text-emerald-400">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(info.getValue() || 0)}</span>,
    },
    {
      accessorKey: 'faseJudicialOcupacion',
      header: 'Estado Posesorio',
      cell: info => {
        const val = info.getValue() || 'DESCONOCIDO';
        const isFree = val.toUpperCase().includes('LIBRE');
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider border ${
            isFree 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {val}
          </span>
        );
      }
    },
    {
      id: 'actions',
      cell: () => (
        <button className="p-1 text-slate-500 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      ),
    }
  ];

  const table = useTable({
    data,
    columns,
    getCoreRowModel: createCoreRowModel(),
    manualPagination: true,
    pageCount: metadata?.totalPages || -1,
  });

  return (
    <div className="space-y-4">
      
      {/* Barra de Búsqueda Premium con Historial Privado */}
      <div className="relative group w-full md:w-1/2" ref={historyRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => { setGlobalFilter(e.target.value); setPageIndex(1); }}
          onFocus={() => setShowHistory(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por catastro, dirección o municipio... (Presiona Enter para guardar)"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 outline-none transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 shadow-inner"
        />

        {/* Panel de Historial de Búsqueda */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden font-inter">
            <div className="px-4 py-2 bg-slate-800/50 text-xs font-semibold text-slate-400 flex items-center gap-2 border-b border-slate-700/50">
              <Clock size={12} /> Búsquedas Recientes
            </div>
            <ul className="py-1 max-h-60 overflow-y-auto">
              {searchHistory.map((query, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => selectHistoryItem(query)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 transition-colors flex items-center gap-2"
                  >
                    <Search size={14} className="text-slate-500" />
                    {query}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contenedor de la Tabla Glassmorphism */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                    <span className="animate-pulse">Cargando base de datos...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron activos para los filtros actuales.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id} 
                    onClick={() => handleRowClick(row.original)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    
                    {(typeof row.getVisibleCells === 'function' ? row.getVisibleCells() : (typeof row.getAllCells === 'function' ? row.getAllCells() : row.cells || [])).map(cell => (
                      <td key={cell.id} className="px-6 py-4 group-hover:text-white transition-colors">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {metadata && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Página {metadata.page} de {metadata.totalPages} ({metadata.total} resultados)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                disabled={pageIndex === 1 || loading}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPageIndex(p => Math.min(metadata.totalPages, p + 1))}
                disabled={pageIndex === metadata.totalPages || metadata.totalPages === 0 || loading}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Overlay Component */}
      <PropertyDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        property={selectedProperty} 
      />

    </div>
  );
}

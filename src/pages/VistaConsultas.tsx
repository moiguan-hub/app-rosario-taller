import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, ArrowLeft, Filter, RefreshCw, CheckCircle, Factory, PackageCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function VistaConsultas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<'FLAMENCA' | 'COMUNION' | 'TODOS'>('FLAMENCA');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'FABRICA' | 'TIENDA' | 'ENTREGADO'>('TODOS');
  const [filtroFabricante, setFiltroFabricante] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { data: pgData }] = await Promise.all([
        supabase.from('pedidos').select('*, clientes(*)'),
        supabase.from('pagos').select('*')
      ]);

      const list = (pData || []).map((p: any) => {
        const pagosOrd = (pgData || []).filter((pg: any) => pg.pedido_id === p.id);
        const cobrado = pagosOrd.reduce((acc: number, pg: any) => acc + Number(pg.monto_entrega_cuenta || 0), 0);
        const total = Number(p.precio_total || 0);
        return { ...p, cobrado, restante: total - cobrado };
      });

      // Ordenar alfabéticamente por apellidos del cliente
      list.sort((a, b) => {
        const apA = (a.clientes?.apellidos || '').toLowerCase();
        const apB = (b.clientes?.apellidos || '').toLowerCase();
        return apA.localeCompare(apB, 'es', { sensitivity: 'base' });
      });

      setPedidos(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getDesc = (p: any) => {
    if (!p) return '';
    let raw = p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || 'Sin descripción';
    return raw.replace(/^\[(SENORA|NINA)\]\s*Modelo:\s*\[(SENORA|NINA)\]\s*/i, '[$1] ')
              .replace(/^\[(SENORA|NINA)\]\s*Modelo:\s*/i, '[$1] ')
              .replace(/^Modelo:\s*/i, '');
  };

  const fabricantes = Array.from(new Set(pedidos.map(p => p.fabricante).filter(Boolean)));

  const pedidosFiltrados = pedidos.filter(p => {
    // Filtro categoría
    if (filtroCategoria !== 'TODOS') {
      if (filtroCategoria === 'FLAMENCA') {
        if (p.categoria && p.categoria !== 'FLAMENCA') return false;
      } else if (filtroCategoria === 'COMUNION') {
        if (p.categoria !== 'COMUNION') return false;
      }
    }

    if (filtroEstado === 'FABRICA') {
      if (p.estado_proceso === 'ENTREGADO' || p.estado_ubicacion !== 'PEDIDO') return false;
    } else if (filtroEstado === 'TIENDA') {
      if (p.estado_proceso === 'ENTREGADO' || p.estado_ubicacion !== 'STOCK') return false;
    } else if (filtroEstado === 'ENTREGADO') {
      if (p.estado_proceso !== 'ENTREGADO') return false;
    }

    if (filtroFabricante !== 'TODOS') {
      if ((p.fabricante || 'Sin especificar') !== filtroFabricante) return false;
    }

    if (busqueda.trim().length > 0) {
      const term = busqueda.toLowerCase();
      const clienteNom = `${p.clientes?.nombre || ''} ${p.clientes?.apellidos || ''}`.toLowerCase();
      const desc = getDesc(p).toLowerCase();
      const fab = (p.fabricante || '').toLowerCase();
      if (!clienteNom.includes(term) && !desc.includes(term) && !fab.includes(term)) {
        return false;
      }
    }

    return true;
  });

  const totalImporte = pedidosFiltrados.reduce((acc, p) => acc + Number(p.precio_total || 0), 0);
  const totalCobrado = pedidosFiltrados.reduce((acc, p) => acc + (p.cobrado || 0), 0);
  const totalRestante = totalImporte - totalCobrado;

  const resetFiltros = () => {
    setFiltroCategoria('FLAMENCA');
    setFiltroEstado('TODOS');
    setFiltroFabricante('TODOS');
    setBusqueda('');
  };

  const irAPedido = (p: any) => {
    if (p.cliente_id && p.id) {
      localStorage.setItem('paso', '3');
      localStorage.setItem('clienteId', p.cliente_id);
      localStorage.setItem('pedidoId', p.id);
      navigate('/pedidos');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <style>{`
        @media print {
          header, nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 11pt; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
      {/* Cabecera Pantalla */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-500 hover:text-rose-600 flex items-center gap-1 mb-1">
            <ArrowLeft size={16} /> Volver al Inicio
          </button>
          <h2 className="text-2xl font-black text-gray-900">Consultas de Pedidos</h2>
          <p className="text-xs text-gray-500 font-medium">Pedidos ordenados por apellidos y análisis económico</p>
        </div>

        <button onClick={() => window.print()} className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md">
          <Printer size={18} /> Informe / Imprimir PDF
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="no-print bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm space-y-3">
        {/* Selección de Categoría */}
        <div className="flex gap-2 border-b pb-3">
          <button onClick={() => setFiltroCategoria('FLAMENCA')} className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${filtroCategoria === 'FLAMENCA' ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            💃 Flamenca
          </button>
          <button onClick={() => setFiltroCategoria('COMUNION')} className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${filtroCategoria === 'COMUNION' ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ⛪ Comunión <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-extrabold ml-1">Próximamente</span>
          </button>
          <button onClick={() => setFiltroCategoria('TODOS')} className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${filtroCategoria === 'TODOS' ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Todas
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Filter size={14} /> Filtros Rápidos
          </span>
          <button onClick={resetFiltros} className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <RefreshCw size={12} /> Mostrar Todos
          </button>
        </div>

        {/* Botones de Filtro Estado */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltroEstado('TODOS')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filtroEstado === 'TODOS' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Todos ({pedidos.length})
          </button>
          <button onClick={() => setFiltroEstado('FABRICA')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filtroEstado === 'FABRICA' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
            En Fábrica
          </button>
          <button onClick={() => setFiltroEstado('TIENDA')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filtroEstado === 'TIENDA' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}>
            En Tienda
          </button>
          <button onClick={() => setFiltroEstado('ENTREGADO')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filtroEstado === 'ENTREGADO' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>
            Entregados
          </button>
        </div>

        {/* Filtro Fabricante y Buscador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-gray-500 mr-2 whitespace-nowrap">Fabricante:</span>
            <select value={filtroFabricante} onChange={e => setFiltroFabricante(e.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none">
              <option value="TODOS">Todos los fabricantes</option>
              {fabricantes.map((f: any) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-1.5">
            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
            <input type="text" placeholder="Buscar cliente o modelo..." className="w-full bg-transparent text-xs font-medium outline-none" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tarjeta Resumen Económico */}
      <div className="bg-rose-50/70 border-2 border-rose-100 p-4 rounded-2xl shadow-sm space-y-2">
        <div className="flex justify-between items-center border-b border-rose-200 pb-2">
          <span className="text-xs font-black text-rose-800 uppercase">Análisis Económico ({pedidosFiltrados.length} pedidos)</span>
          <span className="text-xs text-rose-600 font-bold">Total Selección</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-white p-2.5 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total</p>
            <p className="text-sm sm:text-lg font-black text-gray-900">{totalImporte.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-green-600 uppercase">Cobrado</p>
            <p className="text-sm sm:text-lg font-black text-green-600">+{totalCobrado.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-600 uppercase">Restante</p>
            <p className="text-sm sm:text-lg font-black text-rose-600">{totalRestante.toFixed(2)} €</p>
          </div>
        </div>
      </div>
      {/* Cabecera Exclusiva para Informe PDF / Impresión */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-black text-gray-900 border-b-2 border-gray-900 pb-2">APP Rosario - Informe Económico de Pedidos</h1>
        <p className="text-xs text-gray-600 mt-1">Fecha del informe: {new Date().toLocaleDateString('es-ES')}</p>
        <p className="text-xs text-gray-600">Filtro Estado: {filtroEstado} | Fabricante: {filtroFabricante}</p>
        
        <div className="my-4 p-3 border border-gray-300 bg-gray-50 rounded">
          <p className="font-bold text-sm">Resumen: {pedidosFiltrados.length} pedidos | Total Pedidos: {totalImporte.toFixed(2)} € | Cobrado: {totalCobrado.toFixed(2)} € | Restante Pendiente: {totalRestante.toFixed(2)} €</p>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">Cargando consultas...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border p-6 text-gray-500 font-medium">
          No hay pedidos que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((p) => {
            const clienteNombre = p.clientes ? `${p.clientes.apellidos}, ${p.clientes.nombre}` : 'Cliente no asignado';
            const desc = getDesc(p);
            
            return (
              <div key={p.id} onClick={() => irAPedido(p)} className="p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-rose-300 cursor-pointer shadow-sm transition-all space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-gray-900 text-base sm:text-lg truncate">{clienteNombre}</p>
                    <p className="font-bold text-rose-600 text-sm">{desc}</p>
                  </div>
                  {/* Badge Estado */}
                  <div className="shrink-0">
                    {p.estado_proceso === 'ENTREGADO' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                        <PackageCheck size={12} /> ENTREGADO
                      </span>
                    ) : p.estado_ubicacion === 'STOCK' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <CheckCircle size={12} /> EN TIENDA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                        <Factory size={12} /> EN FÁBRICA
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 font-medium pt-1 border-t border-gray-100">
                  <span>Fabricante: <strong className="text-gray-700">{p.fabricante || 'Sin especificar'}</strong></span>
                  <span>Fecha: <strong>{p.fecha_pedido || '-'}</strong></span>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs font-bold bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-700">Total: {Number(p.precio_total || 0).toFixed(2)} €</span>
                  <span className="text-green-600">Cobrado: {p.cobrado.toFixed(2)} €</span>
                  <span className={p.restante > 0 ? "text-rose-600" : "text-gray-500"}>Restante: {p.restante.toFixed(2)} €</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
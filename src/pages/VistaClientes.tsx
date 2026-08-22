import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Edit3, Save, X, Trash2, User, Plus, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Pedido } from '../types/database.types';
import { useNavigate } from 'react-router-dom';

export function VistaClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Cliente>>({});
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);
  const [pedidosCliente, setPedidosCliente] = useState<{ [key: string]: Pedido[] }>({});
  const [loadingPedidos, setLoadingPedidos] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, [busqueda]);

  const fetchClientes = async () => {
    let q = supabase.from('clientes').select('*').order('apellidos', { ascending: true });
    if (busqueda.length > 1) {
      q = q.or(`apellidos.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`);
    }
    const { data } = await q;
    if (data) setClientes(data);
  };

  const eliminar = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente? Se borrarán todos sus pedidos y pagos asociados.")) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchClientes();
  };

  const guardar = async (id: string) => {
    const { error } = await supabase.from('clientes').update({
      nombre: editForm.nombre?.replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
      apellidos: editForm.apellidos?.replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
      telefono: editForm.telefono,
      direccion: editForm.direccion
    }).eq('id', id);
    
    if (error) alert("Error al guardar: " + error.message);
    else {
      setEditandoId(null);
      fetchClientes();
    }
  };

  const toggleCliente = async (cliente: Cliente) => {
    if (clienteExpandido === cliente.id) {
      setClienteExpandido(null);
      return;
    }
    setClienteExpandido(cliente.id);
    if (!pedidosCliente[cliente.id]) {
      setLoadingPedidos(cliente.id);
      const { data } = await supabase.from('pedidos').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
      setPedidosCliente(prev => ({ ...prev, [cliente.id]: data || [] }));
      setLoadingPedidos(null);
    }
  };

  const irACrearPedido = (e: React.MouseEvent, cliente: Cliente) => {
    e.stopPropagation();
    localStorage.setItem('paso', '2');
    localStorage.setItem('clienteId', cliente.id);
    localStorage.removeItem('pedidoId');
    navigate('/nuevo-pedido');
  };

  const irAVerPedido = (cliente: Cliente, pedidoId: string) => {
    localStorage.setItem('paso', '3');
    localStorage.setItem('clienteId', cliente.id);
    localStorage.setItem('pedidoId', pedidoId);
    navigate('/pedidos');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto min-h-[60vh]">
      <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
        <button onClick={() => navigate('/')} className="p-2 mr-4 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Search size={20} /></div>
        <input type="text" placeholder="Buscar cliente..." className="w-full pl-12 p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-rose-300" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="space-y-3">
        {clientes.map(c => {
          const isExpanded = clienteExpandido === c.id;
          const pedidos = pedidosCliente[c.id] || [];

          return (
            <div key={c.id} className="border-2 border-gray-100 rounded-xl overflow-hidden transition-all">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                {editandoId === c.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input type="text" className="p-2 border rounded" value={editForm.apellidos || ''} onChange={e => setEditForm({...editForm, apellidos: e.target.value})} placeholder="Apellidos" />
                    <input type="text" className="p-2 border rounded" value={editForm.nombre || ''} onChange={e => setEditForm({...editForm, nombre: e.target.value})} placeholder="Nombre" />
                    <input type="tel" className="p-2 border rounded" value={editForm.telefono || ''} onChange={e => setEditForm({...editForm, telefono: e.target.value})} placeholder="Teléfono" />
                    <input type="text" className="p-2 border rounded" value={editForm.direccion || ''} onChange={e => setEditForm({...editForm, direccion: e.target.value})} placeholder="Dirección" />
                  </div>
                ) : (
                  <div className="flex items-center cursor-pointer flex-1" onClick={() => toggleCliente(c)}>
                    <div className="bg-rose-50 p-3 rounded-full mr-4 text-rose-500"><User size={24} /></div>
                    <div>
                      <p className="font-bold text-gray-800 hover:text-rose-600 transition-colors">{c.apellidos?.replace(/(^\w|\s\w)/g, m => m.toUpperCase())}, {c.nombre?.replace(/(^\w|\s\w)/g, m => m.toUpperCase())}</p>
                      <p className="text-sm text-gray-500">Tel: {c.telefono} {c.direccion ? `| Dir: ${c.direccion}` : ''}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 shrink-0">
                  {editandoId === c.id ? (
                    <>
                      <button onClick={() => setEditandoId(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                      <button onClick={() => guardar(c.id)} className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg"><Save size={20} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => irACrearPedido(e, c)} title="Crear Pedido para este cliente" className="flex items-center gap-1 text-xs font-bold text-white bg-rose-600 px-3 py-2 rounded-lg hover:bg-rose-700 shadow-sm">
                        <Plus size={16} /> Crear Pedido
                      </button>
                      <button onClick={() => { setEditandoId(c.id); setEditForm(c); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Edit3 size={20} /></button>
                      <button onClick={() => eliminar(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20} /></button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Histórico de Pedidos de este Cliente</h4>
                    <button onClick={(e) => irACrearPedido(e, c)} className="text-xs font-bold text-rose-600 hover:underline flex items-center">
                      <Plus size={14} className="mr-1" /> Nuevo Pedido
                    </button>
                  </div>

                  {loadingPedidos === c.id ? (
                    <p className="text-xs text-gray-400 italic">Cargando pedidos...</p>
                  ) : pedidos.length === 0 ? (
                    <p className="text-sm text-gray-500 italic bg-white p-3 rounded-lg border border-gray-100">Este cliente aún no tiene ningún pedido guardado.</p>
                  ) : (
                    <div className="space-y-2">
                      {pedidos.map(p => (
                        <div key={p.id} onClick={() => irAVerPedido(c, p.id)} className="bg-white p-3 rounded-xl border border-gray-200 hover:border-rose-300 cursor-pointer flex justify-between items-center transition-all shadow-sm hover:shadow">
                          <div className="flex items-center space-x-3">
                            <div className="bg-rose-50 text-rose-600 p-2 rounded-lg"><FileText size={18} /></div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || 'Pedido sin título'}</p>
                              <p className="text-xs text-gray-500">{p.categoria} {p.fabricante ? `• ${p.fabricante}` : ''} • {p.fecha_pedido || 'Sin fecha'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-700 text-sm">{Number(p.precio_total).toFixed(2)} €</span>
                            <ChevronRight size={18} className="text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {clientes.length === 0 && <p className="text-center text-gray-500">No hay clientes registrados.</p>}
      </div>
    </div>
  );
}
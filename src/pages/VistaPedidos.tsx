import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, User, FileText, CheckCircle, Plus, Edit3, Save, X, Factory } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Pedido, Pago } from '../types/database.types';

export function VistaPedidos() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [todosLosPedidos, setTodosLosPedidos] = useState<any[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [nuevoPago, setNuevoPago] = useState('');
  const [loadingPago, setLoadingPago] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '', detalles_tejido: '', precio_total: '' });

  useEffect(() => {
    const loadPersisted = async () => {
      const sPaso = localStorage.getItem('paso');
      const sCliente = localStorage.getItem('clienteId');
      const sPedido = localStorage.getItem('pedidoId');
      if (sCliente) {
        const { data: cData } = await supabase.from('clientes').select('*').eq('id', sCliente).single();
        if (cData) {
          setClienteSeleccionado(cData);
          const { data: pData } = await supabase.from('pedidos').select('*').eq('cliente_id', cData.id).order('created_at', { ascending: false });
          setPedidos(pData || []);
          if (sPedido) {
            const { data: oData } = await supabase.from('pedidos').select('*').eq('id', sPedido).single();
            if (oData) {
              setPedidoSeleccionado(oData);
              const { data: payData } = await supabase.from('pagos').select('*').eq('pedido_id', sPedido).order('fecha', { ascending: true });
              setPagos(payData || []);
            }
          }
          if (sPaso) setPaso(Number(sPaso) as 1|2|3);
        }
      }
    };
    loadPersisted();
  }, []);

  useEffect(() => {
    localStorage.setItem('paso', paso.toString());
    if (clienteSeleccionado) localStorage.setItem('clienteId', clienteSeleccionado.id);
    else localStorage.removeItem('clienteId');
    if (pedidoSeleccionado) localStorage.setItem('pedidoId', pedidoSeleccionado.id);
    else localStorage.removeItem('pedidoId');
  }, [paso, clienteSeleccionado, pedidoSeleccionado]);

  useEffect(() => {
    if (paso !== 1) return;
    const buscar = async () => {
      if (busqueda.length < 2) return setClientes([]);
      const { data } = await supabase.from('clientes').select('*').or(`apellidos.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`).limit(10);
      if (data) setClientes(data);
    };
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [busqueda, paso]);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase.from('pedidos').select('*, clientes(nombre, apellidos)').order('created_at', { ascending: false });
      if (data) setTodosLosPedidos(data);
    };
    fetchTodos();
  }, []);

  const seleccionarPedidoDirecto = async (p: any) => {
    if (p.clientes) {
      setClienteSeleccionado({ id: p.cliente_id, nombre: p.clientes.nombre, apellidos: p.clientes.apellidos } as Cliente);
    }
    setPedidoSeleccionado(p);
    setIsEditing(false);
    const { data } = await supabase.from('pagos').select('*').eq('pedido_id', p.id).order('fecha', { ascending: true });
    setPagos(data || []);
    setPaso(3);
  };

  const seleccionarCliente = async (c: Cliente) => {
    setClienteSeleccionado(c);
    const { data } = await supabase.from('pedidos').select('*').eq('cliente_id', c.id).order('created_at', { ascending: false });
    setPedidos(data || []);
    setPaso(2);
  };

  const seleccionarPedido = async (p: Pedido) => {
    setPedidoSeleccionado(p);
    setIsEditing(false);
    const { data } = await supabase.from('pagos').select('*').eq('pedido_id', p.id).order('fecha', { ascending: true });
    setPagos(data || []);
    setPaso(3);
  };


  const toggleEstadoUbicacion = async () => {
    if (!pedidoSeleccionado) return;
    const isStock = pedidoSeleccionado.estado_ubicacion === 'STOCK';
    const newState = isStock ? 'PEDIDO' : 'STOCK';
    if (isStock) {
      if (!window.confirm("¡Atención! Vas a poner el pedido de nuevo en FÁBRICA. ¿Deseas continuar?")) return;
    }
    const { error } = await supabase.from('pedidos').update({ estado_ubicacion: newState }).eq('id', pedidoSeleccionado.id);
    if (!error) {
      setPedidoSeleccionado({ ...pedidoSeleccionado, estado_ubicacion: newState });
      setPedidos(pedidos.map(p => p.id === pedidoSeleccionado.id ? { ...p, estado_ubicacion: newState } : p));
    } else alert('Error al actualizar: ' + error.message);
  };

  const iniciarEdicion = () => {
    if (!pedidoSeleccionado) return;
    setEditForm({
      pecho: pedidoSeleccionado.medidas?.pecho || '', cintura: pedidoSeleccionado.medidas?.cintura || '',
      cadera: pedidoSeleccionado.medidas?.cadera || '', manga: pedidoSeleccionado.medidas?.manga || '',
      talle: pedidoSeleccionado.medidas?.talle || '', largo_total: pedidoSeleccionado.medidas?.largo_total || '',
      detalles_tejido: pedidoSeleccionado.detalles_tejido || '', precio_total: pedidoSeleccionado.precio_total.toString()
    });
    setIsEditing(true);
  };

  const guardarEdicion = async () => {
    if (!pedidoSeleccionado) return;
    if (!window.confirm("¡Atención! Vas a modificar los datos de este pedido. ¿Confirmas los cambios?")) return;
    const upMed = { ...pedidoSeleccionado.medidas, pecho: editForm.pecho, cintura: editForm.cintura, cadera: editForm.cadera, manga: editForm.manga, talle: editForm.talle, largo_total: editForm.largo_total };
    const upPrecio = parseFloat(editForm.precio_total) || 0;
    const { error } = await supabase.from('pedidos').update({ medidas: upMed, detalles_tejido: editForm.detalles_tejido, precio_total: upPrecio }).eq('id', pedidoSeleccionado.id);
    if (!error) {
      const pNew = { ...pedidoSeleccionado, medidas: upMed, detalles_tejido: editForm.detalles_tejido, precio_total: upPrecio };
      setPedidoSeleccionado(pNew);
      setPedidos(pedidos.map(p => p.id === pNew.id ? pNew : p));
      setIsEditing(false);
      alert("Cambios guardados con éxito.");
    } else alert('Error: ' + error.message);
  };

  const guardarNuevoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoSeleccionado || !nuevoPago || parseFloat(nuevoPago) <= 0) return;
    setLoadingPago(true);
    try {
      const { data, error } = await supabase.from('pagos').insert([{ pedido_id: pedidoSeleccionado.id, monto_entrega_cuenta: parseFloat(nuevoPago), fecha: new Date().toISOString().split('T')[0] }]).select().single();
      if (error) throw error;
      setPagos([...pagos, data]);
      setNuevoPago('');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingPago(false); }
  };

  const handleAtras = () => { if (paso === 3) setPaso(2); else if (paso === 2) setPaso(1); else { localStorage.clear(); navigate('/'); } };
  const handleAdelante = () => { if (paso === 1 && clienteSeleccionado) setPaso(2); else if (paso === 2 && pedidoSeleccionado) setPaso(3); };
  
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto_entrega_cuenta), 0);
  const restante = pedidoSeleccionado ? Number(isEditing ? editForm.precio_total : pedidoSeleccionado.precio_total) - totalPagado : 0;

  const getDesc = (p: Pedido | null) => {
    if (!p) return '';
    return p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || 'Sin descripción';
  };

  const getObs = (p: Pedido | null) => {
    if (!p || !p.detalles_tejido) return '';
    if (p.detalles_tejido.includes(' | ')) return p.detalles_tejido.split(' | ').slice(1).join(' | ');
    if (p.descripcion && p.detalles_tejido === p.descripcion) return ''; // Es la misma descripción
    return p.detalles_tejido;
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto min-h-[60vh]">
      <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
        <button onClick={handleAtras} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors"><ArrowLeft size={24} /></button>
        {((paso === 1 && clienteSeleccionado) || (paso === 2 && pedidoSeleccionado)) && (
          <button onClick={handleAdelante} className="p-2 mr-4 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors"><ArrowRight size={24} /></button>
        )}
        <h2 className="text-2xl font-bold text-gray-800 ml-2">{paso === 1 ? 'Buscar Cliente' : paso === 2 ? 'Pedidos del Cliente' : 'Detalle del Pedido'}</h2>
      </div>

      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Search size={24} /></div><input type="text" placeholder="Buscar..." className="w-full pl-12 p-4 border-2 border-gray-100 rounded-xl outline-none text-lg focus:border-rose-300" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
          <div className="space-y-2">{clientes.length > 0 ? clientes.map(c => (<div key={c.id} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex items-center" onClick={() => seleccionarCliente(c)}><div className="bg-rose-50 p-3 rounded-full mr-4 text-rose-500"><User size={24} /></div><div><p className="font-bold text-gray-800 text-lg">{c.apellidos}, {c.nombre}</p><p className="text-gray-500 text-sm">{c.telefono}</p></div></div>)) : busqueda.length > 2 && <p className="text-center text-gray-500 py-8">No se encontraron clientes.</p>}</div>
          
          {!busqueda && todosLosPedidos.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-4">Todos los Pedidos ({todosLosPedidos.length})</h3>
              <div className="space-y-3">
                {todosLosPedidos.map(p => (
                  <div key={p.id} onClick={() => seleccionarPedidoDirecto(p)} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center">
                      <FileText className="text-rose-400 mr-4" size={28} />
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{p.clientes?.nombre} {p.clientes?.apellidos}</p>
                        <p className="text-sm text-gray-600 font-medium">{p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || p.categoria}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">Fabricante: {p.fabricante}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {paso === 2 && clienteSeleccionado && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gray-900 p-4 rounded-xl shadow-md text-white"><p className="text-xs text-gray-400 font-semibold uppercase mb-1">Cliente</p><p className="font-bold text-xl">{clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}</p></div>
          <h3 className="font-bold text-gray-700 uppercase text-sm border-b pb-2">Historial ({pedidos.length})</h3>
          <div className="space-y-3">{pedidos.length === 0 ? <p className="text-center text-gray-500">Sin pedidos.</p> : pedidos.map(p => (<div key={p.id} onClick={() => seleccionarPedido(p)} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex justify-between items-center"><div className="flex items-center"><FileText className="text-rose-400 mr-4" size={28} /><div><p className="font-bold text-gray-800 text-lg">{p.categoria}</p><p className="text-xs text-gray-500 font-medium mt-1">{p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || 'Sin descripción'} | {p.fecha_pedido}</p></div></div><div><span className={`text-xs font-bold px-3 py-1 rounded-full ${p.estado_ubicacion === 'STOCK' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.estado_ubicacion === 'STOCK' ? 'EN TIENDA' : 'EN FÁBRICA'}</span></div></div>))}</div>
        </div>
      )}

      {paso === 3 && pedidoSeleccionado && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border-b-2 border-gray-100 pb-4 flex justify-between items-start">
            <div><h3 className="text-2xl font-black text-gray-800">{getDesc(pedidoSeleccionado)}</h3><p className="text-gray-500 font-medium">{pedidoSeleccionado.categoria} | Pedido el {pedidoSeleccionado.fecha_pedido}</p></div>
            <button onClick={toggleEstadoUbicacion} className={`flex items-center px-4 py-2 rounded-xl font-bold shadow-md transition-colors ${pedidoSeleccionado.estado_ubicacion === 'STOCK' ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
              {pedidoSeleccionado.estado_ubicacion === 'STOCK' ? <><CheckCircle size={20} className="mr-2" /> EN TIENDA</> : <><Factory size={20} className="mr-2" /> FÁBRICA</>}
            </button>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h4 className="font-bold text-gray-700 uppercase text-sm">Medidas y Detalles</h4>
              {!isEditing ? (
                <button onClick={iniciarEdicion} className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg flex items-center hover:bg-rose-100"><Edit3 size={16} className="mr-1"/> Editar</button>
              ) : (
                <div className="flex space-x-2">
                  <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg flex items-center"><X size={16} className="mr-1"/> Cancelar</button>
                  <button onClick={guardarEdicion} className="text-sm font-bold text-white bg-green-600 px-3 py-1 rounded-lg flex items-center hover:bg-green-700"><Save size={16} className="mr-1"/> Guardar</button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['pecho', 'cintura', 'cadera', 'manga', 'talle', 'largo_total'].map(m => (
                <div key={m} className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-center flex flex-col items-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase w-full">{m.replace('_', ' ')}</p>
                  {isEditing ? <input type="number" inputMode="decimal" className="w-full text-center mt-1 p-1 border rounded font-bold text-gray-800 outline-none focus:border-rose-300" value={(editForm as any)[m]} onChange={e => setEditForm({...editForm, [m]: e.target.value})} /> : <p className="text-lg font-black text-gray-800">{pedidoSeleccionado.medidas?.[m] || '-'}</p>}
                </div>
              ))}
            </div>
            {isEditing ? (
              <textarea className="mt-4 w-full p-3 border rounded-xl text-sm text-gray-700 outline-none focus:border-rose-300 h-24" value={editForm.detalles_tejido} onChange={e => setEditForm({...editForm, detalles_tejido: e.target.value})} placeholder="Observaciones..."></textarea>
            ) : getObs(pedidoSeleccionado) ? (
              <div className="mt-4 bg-gray-50 p-4 rounded-xl text-sm text-gray-700 border border-gray-100"><span className="font-bold block mb-1">Observaciones:</span>{getObs(pedidoSeleccionado)}</div>
            ) : null}
          </div>

          <div className="bg-rose-50/50 border-2 border-rose-100 rounded-2xl p-6">
            <h4 className="font-bold text-rose-800 uppercase text-sm border-b border-rose-200 pb-2 mb-4">Control Económico</h4>
            <div className="flex justify-between text-gray-600 mb-4 items-center">
              <span>Precio Total:</span>
              {isEditing ? <input type="number" step="0.01" className="p-1 border-b-2 border-rose-200 bg-transparent text-right font-bold text-gray-800 text-lg outline-none focus:border-rose-500" value={editForm.precio_total} onChange={e => setEditForm({...editForm, precio_total: e.target.value})} /> : <span className="font-bold text-gray-800">{Number(pedidoSeleccionado.precio_total).toFixed(2)} €</span>}
            </div>
            <div className="border-t border-rose-200 pt-3">
              <p className="text-xs font-bold text-rose-600 uppercase mb-2">Entregas a cuenta:</p>
              {pagos.length === 0 ? <p className="text-sm text-gray-500 italic">Sin pagos registrados.</p> : pagos.map((p, i) => <div key={p.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-rose-100 mb-2"><span className="text-gray-500">#{i + 1} - {p.fecha}</span><span className="font-bold text-green-600">+{Number(p.monto_entrega_cuenta).toFixed(2)} €</span></div>)}
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-rose-200 mt-4"><span className="font-black text-rose-900 uppercase">Restante:</span><span className="text-3xl font-black text-rose-600">{restante.toFixed(2)} €</span></div>
            {restante > 0 && (
              <form onSubmit={guardarNuevoPago} className="flex flex-col gap-3 mt-4 pt-4 border-t border-rose-200"><input type="number" step="0.01" inputMode="decimal" placeholder="Abono (€)" className="w-full p-3 border-2 border-rose-200 rounded-xl outline-none font-bold focus:border-rose-400 text-center" value={nuevoPago} onChange={e => setNuevoPago(e.target.value)} /><button type="submit" disabled={loadingPago} className="w-full bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 flex items-center justify-center"><Plus size={20} className="mr-1"/> Añadir</button></form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

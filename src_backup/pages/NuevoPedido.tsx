import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, CategoriaPedido } from '../types/database.types';

export function NuevoPedido() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState<1 | 2>(1);
  
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({ apellidos: '', nombre: '', telefono: '', direccion: '' });
  const [pedido, setPedido] = useState({
    categoria: 'FLAMENCA' as CategoriaPedido,
    fecha_pedido: new Date().toISOString().split('T')[0],
    fabricante: '', 
    pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '',
    observaciones: '', precio_total: '', entrega_cuenta: ''
  });

  useEffect(() => {
    const buscar = async () => {
      if (busqueda.length < 2) return setClientes([]);
      const { data } = await supabase.from('clientes')
        .select('*')
        .or(`apellidos.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
        .limit(5);
      if (data) setClientes(data);
    };
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c);
    setBusqueda(c.nombre + ' ' + c.apellidos);
    setClientes([]);
    setPaso(2);
  };


  const handleContinuar = () => {
    if (clienteSeleccionado) {
      setPaso(2);
    } else if (nuevoCliente.nombre && nuevoCliente.apellidos) {
      setPaso(2);
    } else {
      alert('Por favor, ingresa Nombre y Apellidos del cliente para continuar.');
    }
  };

  const guardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let clientId = clienteSeleccionado?.id;

      if (!clientId) {
        const { data: newC, error: errC } = await supabase.from('clientes').insert([nuevoCliente]).select().single();
        if (errC) throw errC;
        clientId = newC.id;
      }

      const { data: ord, error: errO } = await supabase.from('pedidos').insert([{
        cliente_id: clientId, 
        categoria: pedido.categoria, 
        fabricante: pedido.fabricante,
        fecha_pedido: pedido.fecha_pedido, 
        medidas: {
          pecho: pedido.pecho, cintura: pedido.cintura, cadera: pedido.cadera,
          manga: pedido.manga, talle: pedido.talle, largo_total: pedido.largo_total
        },
        detalles_tejido: pedido.observaciones, 
        precio_total: parseFloat(pedido.precio_total) || 0
      }]).select().single();
      if (errO) throw errO;

      const entrega = parseFloat(pedido.entrega_cuenta);
      if (entrega > 0) {
        const { error: errP } = await supabase.from('pagos').insert([{
          pedido_id: ord.id, monto_entrega_cuenta: entrega, fecha: new Date().toISOString().split('T')[0]
        }]);
        if (errP) throw errP;
      }

      alert('¡Pedido guardado con éxito!');
      navigate('/');
    } catch (err: any) {
      console.error('Error detallado:', err);
      alert('Error al guardar: ' + (err.message || err));
    } finally { 
      setLoading(false); 
    }
  };

  const handleAtras = () => {
    if (paso === 2) {
      setPaso(1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto min-h-[60vh]">
      <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
        <button onClick={handleAtras} className="p-2 mr-4 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {paso === 1 ? 'Paso 1: Identificar Cliente' : 'Paso 2: Detalles del Pedido'}
        </h2>
      </div>
      
      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-2">Buscar cliente por Apellidos, Nombre o Teléfono</label>
            <input type="text" placeholder="Escribe para buscar..." className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-rose-300 outline-none text-lg bg-gray-50 focus:bg-white" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {clientes.length > 0 && (
              <div className="absolute z-10 w-full bg-white mt-2 border-2 border-rose-100 rounded-xl shadow-xl overflow-hidden">
                {clientes.map(c => (
                  <div key={c.id} className="p-4 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => seleccionarCliente(c)}>
                    <p className="font-bold text-gray-800 text-lg">{c.apellidos}, {c.nombre}</p>
                    <p className="text-sm text-gray-500">{c.telefono} {c.direccion ? `- ${c.direccion}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!clienteSeleccionado && busqueda.length > 2 && clientes.length === 0 && (
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 space-y-4">
              <p className="text-rose-800 font-semibold text-center mb-2">No se encontró al cliente. ¡Completa sus datos para registrarlo!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-rose-700 uppercase">Apellidos</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.apellidos} onChange={e => setNuevoCliente({...nuevoCliente, apellidos: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Nombre</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Teléfono</label><input type="tel" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Dirección</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} /></div>
              </div>
              <button onClick={handleContinuar} className="w-full mt-4 bg-rose-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-rose-700">Guardar y Continuar al Pedido</button>
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <form onSubmit={guardarPedido} className="space-y-6 animate-fadeIn">
          <div className="bg-gray-900 p-4 rounded-xl flex justify-between items-center shadow-md">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Cliente Asignado</p>
              <p className="font-bold text-white text-lg">{clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos}` : `${nuevoCliente.nombre} ${nuevoCliente.apellidos}`}</p>
              <p className="text-gray-300 text-sm">Tel: {clienteSeleccionado ? clienteSeleccionado.telefono : nuevoCliente.telefono}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.categoria} onChange={e => setPedido({...pedido, categoria: e.target.value as CategoriaPedido})}>
              <option value="FLAMENCA">Traje de FLAMENCA</option><option value="COMUNION">Traje de COMUNIÓN</option><option value="OTRO">OTRO</option>
            </select>
            <input type="date" className="p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.fecha_pedido} onChange={e => setPedido({...pedido, fecha_pedido: e.target.value})} />
          </div>
          <input type="text" placeholder="Fabricante" className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.fabricante} onChange={e => setPedido({...pedido, fabricante: e.target.value})} />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            {['pecho', 'cintura', 'cadera', 'manga', 'talle', 'largo_total'].map(medida => (
              <div key={medida} className="flex flex-col bg-white border border-gray-100 p-2 rounded-lg"><label className="text-[10px] font-bold text-rose-600 uppercase mb-1">{medida.replace('_', ' ')}</label><input type="number" inputMode="decimal" className="w-full p-1 outline-none text-lg font-medium" value={(pedido as any)[medida]} onChange={e => setPedido({...pedido, [medida]: e.target.value})} /></div>
            ))}
          </div>
          
          <textarea placeholder="Observaciones / Detalles..." className="w-full p-4 border-2 border-gray-100 rounded-xl h-24 outline-none" value={pedido.observaciones} onChange={e => setPedido({...pedido, observaciones: e.target.value})}></textarea>
          
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-sm border-b pb-2">Importes y Pago a Cuenta</h4>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Total (€)</label><input type="number" step="0.01" inputMode="decimal" className="w-full p-3 border rounded-lg outline-none text-lg font-semibold" value={pedido.precio_total} onChange={e => setPedido({...pedido, precio_total: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrega a Cuenta (€)</label><input type="number" step="0.01" inputMode="decimal" className="w-full p-3 border rounded-lg outline-none text-lg font-semibold text-rose-600" value={pedido.entrega_cuenta} onChange={e => setPedido({...pedido, entrega_cuenta: e.target.value})} /></div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="font-bold text-gray-600 uppercase text-sm">Restante por pagar:</span>
              <span className="text-2xl font-black text-rose-600">{((parseFloat(pedido.precio_total) || 0) - (parseFloat(pedido.entrega_cuenta) || 0)).toFixed(2)} €</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-rose-600 text-white p-5 rounded-xl font-bold text-xl hover:bg-rose-700 disabled:bg-rose-300">
            {loading ? 'Guardando...' : 'Finalizar y Guardar'}
          </button>
        </form>
      )}
    </div>
  );
}

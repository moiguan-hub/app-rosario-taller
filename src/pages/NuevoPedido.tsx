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
    descripcion: '',
    categoria: 'FLAMENCA' as CategoriaPedido,
    tipo_articulo: 'SENORA' as 'NINA' | 'SENORA' | null,
    fecha_pedido: new Date().toISOString().split('T')[0],
    fabricante: '', 
    pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '', contorno_brazo: '', talla: '',
    observaciones: '', precio_total: '', entrega_cuenta: ''
  });

  useEffect(() => {
    const sPaso = localStorage.getItem('paso');
    const sCliente = localStorage.getItem('clienteId');
    if (sCliente && sPaso === '2') {
      supabase.from('clientes').select('*').eq('id', sCliente).single().then(({ data }) => {
        if (data) {
          setClienteSeleccionado(data);
          setPaso(2);
        }
      });
    }
  }, []);
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


  const handleContinuar = async () => {
    if (clienteSeleccionado) {
      setPaso(2);
    } else if (nuevoCliente.nombre && nuevoCliente.apellidos) {
      setLoading(true);
      try {
        const { data: newC, error: errC } = await supabase.from('clientes').insert([nuevoCliente]).select().single();
        if (errC) throw errC;
        setClienteSeleccionado(newC);
        setPaso(2);
      } catch (err: any) {
        console.error('Error al guardar cliente:', err);
        alert('Error al guardar el cliente: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
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

      if (!pedido.descripcion.trim()) {
        alert('Por favor, ingresa un Nombre o Descripción para el pedido.');
        setLoading(false);
        return;
      }
      if (!pedido.fabricante) {
        alert('Por favor, selecciona un Fabricante.');
        setLoading(false);
        return;
      }

      const { data: ord, error: errO } = await supabase.from('pedidos').insert([{
        cliente_id: clientId,
        categoria: pedido.categoria,
        fabricante: pedido.fabricante,
        fecha_pedido: pedido.fecha_pedido, 
        medidas: {
          tipo_articulo: pedido.categoria === 'FLAMENCA' ? pedido.tipo_articulo : null, pecho: pedido.pecho, cintura: pedido.cintura, cadera: pedido.cadera,
          manga: pedido.manga, talle: pedido.talle, largo_total: pedido.largo_total,
          contorno_brazo: pedido.contorno_brazo, talla: pedido.talla
        },
        detalles_tejido: (pedido.categoria === 'FLAMENCA' ? '[' + pedido.tipo_articulo + '] ' : '') + pedido.descripcion + (pedido.observaciones ? ' | ' + pedido.observaciones : ''), 
        precio_total: parseFloat(pedido.precio_total) || 0
      }] as any).select().single();
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

  const getSugerenciaTalla = (medida: string, valor: string) => {
    const v = parseFloat(valor) || 0;
    if (!v) return null;

    if (pedido.fabricante?.includes('Aires de Ferias') || pedido.fabricante?.includes('Aires de Feria')) {
      if (pedido.tipo_articulo === 'SENORA') {
        const tallas = [
          { t: '32', p: 77, c: 56, ca: 84, l: 140 },
          { t: '34', p: 81, c: 60, ca: 88, l: 146 },
          { t: '36', p: 85, c: 65, ca: 92, l: 146 },
          { t: '38', p: 88, c: 70, ca: 97, l: 146 },
          { t: '40', p: 93, c: 74, ca: 101, l: 146 },
          { t: '42', p: 97, c: 78, ca: 105, l: 146 },
          { t: '44', p: 102, c: 82, ca: 108, l: 146 },
          { t: '46', p: 106, c: 87, ca: 112, l: 146 },
          { t: '48', p: 110, c: 91, ca: 116, l: 146 },
          { t: '50', p: 114, c: 96, ca: 120, l: 146 },
          { t: '52', p: 118, c: 100, ca: 124, l: 146 },
          { t: '54', p: 122, c: 105, ca: 128, l: 146 },
          { t: '56', p: 126, c: 109, ca: 132, l: 146 },
          { t: '58', p: 130, c: 114, ca: 136, l: 146 },
          { t: '60', p: 134, c: 118, ca: 140, l: 146 }
        ];
        const prop = medida === 'pecho' ? 'p' : medida === 'cintura' ? 'c' : medida === 'cadera' ? 'ca' : medida === 'largo_total' ? 'l' : null;
        if (!prop) return null;
        for (const size of tallas) {
          if (v <= (size as any)[prop]) return size.t;
        }
        return 'TEspecial';
      } else if (pedido.tipo_articulo === 'NINA') {
        const tallas = [
          { t: '1', p: 50, c: 47, ca: 52, l: 63 },
          { t: '2', p: 54, c: 49, ca: 57, l: 69 },
          { t: '3', p: 58, c: 53, ca: 62, l: 77 },
          { t: '4', p: 60, c: 56, ca: 66, l: 85 },
          { t: '5', p: 64, c: 59, ca: 70, l: 95 },
          { t: '6', p: 66, c: 62, ca: 72, l: 105 },
          { t: '7', p: 71, c: 64, ca: 74, l: 113 },
          { t: '8', p: 75, c: 66, ca: 84, l: 120 },
          { t: '9', p: 78, c: 68, ca: 86, l: 127 },
          { t: '14', p: 82, c: 68, ca: 86, l: 135 }
        ];
        const prop = medida === 'pecho' ? 'p' : medida === 'cintura' ? 'c' : medida === 'cadera' ? 'ca' : medida === 'largo_total' ? 'l' : null;
        if (!prop) return null;
        for (const size of tallas) {
          if (v <= (size as any)[prop]) return size.t;
        }
        return 'TEspecial';
      }
    } else if (pedido.fabricante?.includes('Ana Barroso') && pedido.tipo_articulo === 'SENORA') {
      const tallas = [
        { t: '36', p: 80, c: 61, ca: 85 },
        { t: '38', p: 84, c: 65, ca: 89 },
        { t: '40', p: 87, c: 69, ca: 92 },
        { t: '42', p: 91, c: 73, ca: 97 },
        { t: '44', p: 94, c: 76, ca: 100 },
        { t: '46', p: 98, c: 80, ca: 105 },
        { t: '48', p: 103, c: 85, ca: 109 },
        { t: '50', p: 108, c: 90, ca: 115 },
        { t: '52', p: 114, c: 96, ca: 120 }
      ];
      const prop = medida === 'pecho' ? 'p' : medida === 'cintura' ? 'c' : medida === 'cadera' ? 'ca' : null;
      if (!prop) return null;
      for (const size of tallas) {
        if (v <= (size as any)[prop]) return size.t;
      }
      return 'TEspecial';
    } else if (pedido.fabricante?.includes('Ana Barroso') && pedido.tipo_articulo === 'NINA') {
      const tallas = [
        { t: '1', p: 52, c: 46, ca: 54, l: 71 },
        { t: '2', p: 55, c: 49, ca: 57, l: 79 },
        { t: '3', p: 58, c: 52, ca: 60, l: 87 },
        { t: '4', p: 61, c: 55, ca: 63, l: 94 },
        { t: '5', p: 64, c: 58, ca: 66, l: 101 },
        { t: '6', p: 67, c: 61, ca: 69, l: 110 },
        { t: '7', p: 70, c: 64, ca: 72, l: 119 },
        { t: '9', p: 76, c: 67, ca: 76, l: 132 },
        { t: '12', p: 84, c: 71, ca: 82, l: 140 }
      ];
      const prop = medida === 'pecho' ? 'p' : medida === 'cintura' ? 'c' : medida === 'cadera' ? 'ca' : medida === 'largo_total' ? 'l' : null;
      if (!prop) return null;
      for (const size of tallas) {
        if (v <= (size as any)[prop]) return size.t;
      }
      return 'TEspecial';
    }
    return null;
  };

  const handleAtras = () => {
    if (paso === 2) {
      setPaso(1);
    } else {
      localStorage.removeItem('paso');
      localStorage.removeItem('clienteId');
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

          {!clienteSeleccionado && (
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 space-y-4">
              <p className="text-rose-800 font-semibold text-center mb-2">Dar de alta un nuevo cliente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-rose-700 uppercase">Apellidos</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.apellidos} onChange={e => setNuevoCliente({...nuevoCliente, apellidos: e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase())})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Nombre</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase())})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Teléfono</label><input type="tel" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Dirección</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} /></div>
              </div>
              <button onClick={handleContinuar} disabled={loading} className="w-full mt-4 bg-rose-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-rose-700 disabled:bg-rose-300">
                {loading ? 'Guardando...' : 'Guardar y Continuar al Pedido'}
              </button>
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
            <div className="col-span-2">
              <input type="text" placeholder="Nombre / Descripción del Pedido (Ej. Traje de lunares rojo)*" className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none font-bold text-gray-800 focus:border-rose-300" value={pedido.descripcion} onChange={e => setPedido({...pedido, descripcion: e.target.value})} required />
            </div>
            <select className="p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.categoria} onChange={e => setPedido({...pedido, categoria: e.target.value as CategoriaPedido, fabricante: ''})}>
              <option value="FLAMENCA">Traje de FLAMENCA</option><option value="COMUNION">Traje de COMUNIÓN</option><option value="OTRO">OTRO</option>
            </select>
            <input type="date" className="p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.fecha_pedido} onChange={e => setPedido({...pedido, fecha_pedido: e.target.value})} />
          </div>
          <select className="w-full mb-4 p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-rose-300 bg-white" value={pedido.fabricante} onChange={e => setPedido({...pedido, fabricante: e.target.value})} required>
            <option value="" disabled>Selecciona Fabricante*</option>
            {pedido.categoria === 'FLAMENCA' && ['Ana Barroso', 'Aires de Ferias', 'Carmen Moda'].map(f => <option key={f} value={f}>{f}</option>)}
            {pedido.categoria === 'COMUNION' && ['Perla', 'Blanca', 'Angeles'].map(f => <option key={f} value={f}>{f}</option>)}
            {pedido.categoria === 'OTRO' && <option value="Varios">Varios / Otros</option>}
          </select>

          {pedido.categoria === 'FLAMENCA' && (
            <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-xl border-2 border-gray-100 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="tipo_articulo" value="NINA" checked={pedido.tipo_articulo === 'NINA'} onChange={() => setPedido({...pedido, tipo_articulo: 'NINA'})} className="w-5 h-5 text-rose-600" />
                <span className="font-bold text-gray-700">Niña</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="tipo_articulo" value="SENORA" checked={pedido.tipo_articulo === 'SENORA'} onChange={() => setPedido({...pedido, tipo_articulo: 'SENORA'})} className="w-5 h-5 text-rose-600" />
                <span className="font-bold text-gray-700">Señora</span>
              </label>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            {['pecho', 'cintura', 'cadera', 'manga', 'talle', 'largo_total', 'contorno_brazo'].map(medida => {
              const sug = getSugerenciaTalla(medida, (pedido as any)[medida]);
              return (
                <div key={medida} className="flex flex-col bg-white border border-gray-100 p-2 rounded-lg">
                  <label className="text-[10px] font-bold text-rose-600 uppercase mb-1">
                    {medida.replace('_', ' ')} {sug && <span className="text-blue-500 ml-1">(Sugerida: {sug})</span>}
                  </label>
                  <input type="number" inputMode="decimal" className="w-full p-1 outline-none text-lg font-medium" value={(pedido as any)[medida]} onChange={e => setPedido({...pedido, [medida]: e.target.value})} />
                </div>
              );
            })}
            <div className="flex flex-col bg-white border border-gray-100 p-2 rounded-lg">
              <label className="text-[10px] font-bold text-rose-600 uppercase mb-1">
                TALLA DEFINITIVA
              </label>
              <select className="w-full p-1 outline-none text-lg font-medium bg-transparent" value={pedido.talla} onChange={e => setPedido({...pedido, talla: e.target.value})}>
                <option value="">-</option>
                {pedido.tipo_articulo === 'SENORA' ? (
                  <>
                    {['32','34','36','38','40','42','44','46','48','50','52','54','56','58','60','TEspecial'].map(t => (
                      <option key={t} value={t}>T{t}</option>
                    ))}
                  </>
                ) : (
                  <>
                    {['1','2','3','4','5','6','7','8','9','12','14','TEspecial'].map(t => (
                      <option key={t} value={t}>T{t}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
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

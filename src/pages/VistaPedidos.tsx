import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, User, FileText, CheckCircle, Plus, Edit3, Save, X, Factory, Phone, MessageCircle, PackageCheck } from 'lucide-react';
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
  const [editForm, setEditForm] = useState({
    descripcion: '', fabricante: '', tipo_articulo: 'SENORA',
    pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '', contorno_brazo: '', talla: '',
    numTejidos: 1, tejido1: '', tejido2: '', tejido3: '', tejidoCancan: '', colorCordoncillo: '',
    precioTraje: '', cargosExtra: [] as Array<{ concepto: string; precio: string }>,
    detalles_tejido: '', precio_total: ''
  });
  const [nuevoCargoConcepto, setNuevoCargoConcepto] = useState('');
  const [nuevoCargoPrecio, setNuevoCargoPrecio] = useState('');
  const [loadingCargo, setLoadingCargo] = useState(false);
  const [editPagos, setEditPagos] = useState<{[key: string]: string}>({});

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
      const { data } = await supabase.from('pedidos').select('*, clientes(nombre, apellidos, telefono)');
      if (data) {
        const sortedData = data.sort((a, b) => {
          const apA = (a.clientes?.apellidos || '').toLowerCase();
          const apB = (b.clientes?.apellidos || '').toLowerCase();
          return apA.localeCompare(apB);
        });
        setTodosLosPedidos(sortedData);
      }
    };
    fetchTodos();
  }, []);

  const seleccionarPedidoDirecto = async (p: any) => {
    if (p.clientes) {
      setClienteSeleccionado({ id: p.cliente_id, nombre: p.clientes.nombre, apellidos: p.clientes.apellidos, telefono: p.clientes.telefono } as Cliente);
      const { data: pData } = await supabase.from('pedidos').select('*').eq('cliente_id', p.cliente_id).order('created_at', { ascending: false });
      setPedidos(pData || []);
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
      setTodosLosPedidos(todosLosPedidos.map(p => p.id === pedidoSeleccionado.id ? { ...p, estado_ubicacion: newState } : p));
    } else alert('Error al actualizar: ' + error.message);
  };

  const toggleEstadoProceso = async () => {
    if (!pedidoSeleccionado) return;
    const isEntregado = pedidoSeleccionado.estado_proceso === 'ENTREGADO';
    const newState = isEntregado ? 'PENDIENTE_LLEGADA' : 'ENTREGADO';
    if (isEntregado) {
      if (!window.confirm("¿Deseas desmarcar este pedido como ENTREGADO y ponerlo de nuevo en proceso?")) return;
    } else {
      if (!window.confirm("¿Confirmas que el pedido ha sido ENTREGADO / LLEVADO por el cliente?")) return;
    }
    const { error } = await supabase.from('pedidos').update({ estado_proceso: newState }).eq('id', pedidoSeleccionado.id);
    if (!error) {
      setPedidoSeleccionado({ ...pedidoSeleccionado, estado_proceso: newState });
      setPedidos(pedidos.map(p => p.id === pedidoSeleccionado.id ? { ...p, estado_proceso: newState } : p));
      setTodosLosPedidos(todosLosPedidos.map(p => p.id === pedidoSeleccionado.id ? { ...p, estado_proceso: newState } : p));
    } else alert('Error al actualizar estado de entrega: ' + error.message);
  };

  const iniciarEdicion = () => {
    if (!pedidoSeleccionado) return;
    const m = pedidoSeleccionado.medidas || {};
    setEditForm({
      descripcion: pedidoSeleccionado.descripcion || m.modelo || (pedidoSeleccionado.detalles_tejido && pedidoSeleccionado.detalles_tejido.split(' | ')[0]) || '',
      fabricante: pedidoSeleccionado.fabricante || '',
      tipo_articulo: m.tipo_articulo || 'SENORA',
      pecho: m.pecho || '', cintura: m.cintura || '',
      cadera: m.cadera || '', manga: m.manga || '',
      talle: m.talle || '', largo_total: m.largo_total || '',
      contorno_brazo: m.contorno_brazo || '', talla: m.talla || '',
      numTejidos: m.numTejidos || 1,
      tejido1: m.tejido1 || '',
      tejido2: m.tejido2 || '',
      tejido3: m.tejido3 || '',
      tejidoCancan: m.tejidoCancan || '',
      colorCordoncillo: m.colorCordoncillo || '',
      precioTraje: m.precioTraje !== undefined ? m.precioTraje.toString() : pedidoSeleccionado.precio_total.toString(),
      cargosExtra: Array.isArray(m.cargosExtra) ? m.cargosExtra : [],
      detalles_tejido: getObs(pedidoSeleccionado),
      precio_total: pedidoSeleccionado.precio_total.toString()
    });
    const pMap: any = {};
    pagos.forEach(p => pMap[p.id] = p.monto_entrega_cuenta.toString());
    setEditPagos(pMap);
    setIsEditing(true);
  };

  const guardarEdicion = async () => {
    if (!pedidoSeleccionado) return;
    if (!window.confirm("¡Atención! Vas a modificar los datos de este pedido. ¿Confirmas los cambios?")) return;

    const tejidosList = [];
    if (editForm.tejido1.trim()) tejidosList.push(`Tejido 1: ${editForm.tejido1.trim()}`);
    if (editForm.numTejidos >= 2 && editForm.tejido2.trim()) tejidosList.push(`Tejido 2: ${editForm.tejido2.trim()}`);
    if (editForm.numTejidos >= 3 && editForm.tejido3.trim()) tejidosList.push(`Tejido 3: ${editForm.tejido3.trim()}`);
    if (editForm.tejidoCancan.trim()) tejidosList.push(`Tejido Can Can: ${editForm.tejidoCancan.trim()}`);
    if (editForm.colorCordoncillo.trim()) tejidosList.push(`Color Cordoncillo: ${editForm.colorCordoncillo.trim()}`);
    const tejidosStr = tejidosList.join(' | ');

    const upMed = {
      ...pedidoSeleccionado.medidas,
      modelo: editForm.descripcion,
      tipo_articulo: editForm.tipo_articulo,
      pecho: editForm.pecho, cintura: editForm.cintura, cadera: editForm.cadera,
      manga: editForm.manga, talle: editForm.talle, largo_total: editForm.largo_total,
      contorno_brazo: editForm.contorno_brazo, talla: editForm.talla,
      numTejidos: editForm.numTejidos,
      tejido1: editForm.tejido1,
      tejido2: editForm.tejido2,
      tejido3: editForm.tejido3,
      tejidoCancan: editForm.tejidoCancan,
      colorCordoncillo: editForm.colorCordoncillo,
      observaciones: editForm.detalles_tejido
    };
    const upPrecio = parseFloat(editForm.precio_total) || 0;
    const combinedDetalles = (editForm.tipo_articulo === 'SENORA' || editForm.tipo_articulo === 'NINA' ? '[' + editForm.tipo_articulo + '] ' : '') + (editForm.descripcion ? 'Modelo: ' + editForm.descripcion : '') + (tejidosStr ? ' | ' + tejidosStr : '') + (editForm.detalles_tejido ? ' | ' + editForm.detalles_tejido : '');

    const { error } = await supabase.from('pedidos').update({
      fabricante: editForm.fabricante,
      medidas: upMed,
      detalles_tejido: combinedDetalles,
      precio_total: upPrecio
    }).eq('id', pedidoSeleccionado.id);
    
    // Update pagos
    for (const p of pagos) {
      const newVal = parseFloat(editPagos[p.id]);
      if (!isNaN(newVal) && newVal !== Number(p.monto_entrega_cuenta)) {
        await supabase.from('pagos').update({ monto_entrega_cuenta: newVal }).eq('id', p.id);
      }
    }
    const { data: updatedPagos } = await supabase.from('pagos').select('*').eq('pedido_id', pedidoSeleccionado.id).order('fecha', { ascending: true });
    if (updatedPagos) setPagos(updatedPagos);

    if (!error) {
      const pNew = { ...pedidoSeleccionado, fabricante: editForm.fabricante, medidas: upMed, detalles_tejido: combinedDetalles, precio_total: upPrecio };
      setPedidoSeleccionado(pNew);
      setPedidos(pedidos.map(p => p.id === pNew.id ? pNew : p));
      setIsEditing(false);
      alert("Cambios guardados con éxito.");
    } else alert('Error: ' + error.message);
  };

  const guardarNuevoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoSeleccionado || !nuevoPago || parseFloat(nuevoPago) <= 0) return;
    if (!window.confirm(`¿Confirmas que deseas añadir un abono de ${nuevoPago} € a este pedido?`)) return;
    setLoadingPago(true);
    try {
      const { data, error } = await supabase.from('pagos').insert([{ pedido_id: pedidoSeleccionado.id, monto_entrega_cuenta: parseFloat(nuevoPago), fecha: new Date().toISOString().split('T')[0] }]).select().single();
      if (error) throw error;
      setPagos([...pagos, data]);
      setNuevoPago('');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingPago(false); }
  };
  const guardarNuevoCargoExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoSeleccionado || !nuevoCargoConcepto.trim() || !nuevoCargoPrecio) return;
    const precioNum = parseFloat(nuevoCargoPrecio);
    if (isNaN(precioNum) || precioNum <= 0) return;

    setLoadingCargo(true);
    try {
      const med = pedidoSeleccionado.medidas || {};
      const cargosActuales = Array.isArray(med.cargosExtra) ? med.cargosExtra : [];
      const nuevosCargos = [...cargosActuales, { concepto: nuevoCargoConcepto.trim(), precio: precioNum.toString() }];

      const pTraje = parseFloat(med.precioTraje) || Number(pedidoSeleccionado.precio_total);
      const sumaExtras = nuevosCargos.reduce((acc: number, c: any) => acc + (parseFloat(c.precio) || 0), 0);
      const nuevoPrecioTotal = pTraje + sumaExtras;

      const nuevasMedidas = {
        ...med,
        precioTraje: med.precioTraje !== undefined && med.precioTraje !== '' ? med.precioTraje : pTraje.toString(),
        cargosExtra: nuevosCargos
      };

      const { error } = await supabase.from('pedidos').update({
        medidas: nuevasMedidas,
        precio_total: nuevoPrecioTotal
      }).eq('id', pedidoSeleccionado.id);

      if (error) throw error;

      const pUpdated = {
        ...pedidoSeleccionado,
        medidas: nuevasMedidas,
        precio_total: nuevoPrecioTotal
      };
      setPedidoSeleccionado(pUpdated);
      setPedidos(pedidos.map(p => p.id === pUpdated.id ? pUpdated : p));
      setNuevoCargoConcepto('');
      setNuevoCargoPrecio('');
    } catch (err: any) {
      alert('Error al añadir cargo: ' + err.message);
    } finally {
      setLoadingCargo(false);
    }
  };

  const eliminarCargoExtra = async (idx: number) => {
    if (!pedidoSeleccionado) return;
    if (!window.confirm("¿Deseas eliminar este cargo adicional?")) return;
    const med = pedidoSeleccionado.medidas || {};
    const cargosActuales = Array.isArray(med.cargosExtra) ? med.cargosExtra : [];
    const nuevosCargos = cargosActuales.filter((_: any, i: number) => i !== idx);

    const pTraje = parseFloat(med.precioTraje) || Number(pedidoSeleccionado.precio_total);
    const sumaExtras = nuevosCargos.reduce((acc: number, c: any) => acc + (parseFloat(c.precio) || 0), 0);
    const nuevoPrecioTotal = pTraje + sumaExtras;

    const nuevasMedidas = { ...med, cargosExtra: nuevosCargos };

    const { error } = await supabase.from('pedidos').update({
      medidas: nuevasMedidas,
      precio_total: nuevoPrecioTotal
    }).eq('id', pedidoSeleccionado.id);

    if (!error) {
      const pUpdated = { ...pedidoSeleccionado, medidas: nuevasMedidas, precio_total: nuevoPrecioTotal };
      setPedidoSeleccionado(pUpdated);
      setPedidos(pedidos.map(p => p.id === pUpdated.id ? pUpdated : p));
    }
  };

  const handleAtras = () => { if (paso === 3) setPaso(2); else if (paso === 2) setPaso(1); else { localStorage.clear(); navigate('/'); } };
  const handleAdelante = () => { if (paso === 1 && clienteSeleccionado) setPaso(2); else if (paso === 2 && pedidoSeleccionado) setPaso(3); };
  
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto_entrega_cuenta), 0);
  const totalPrecioCalculado = isEditing ? ((parseFloat(editForm.precioTraje) || 0) + editForm.cargosExtra.reduce((a: number, b: any) => a + (parseFloat(b.precio) || 0), 0)) : (pedidoSeleccionado ? Number(pedidoSeleccionado.precio_total) : 0);
  const restante = pedidoSeleccionado ? totalPrecioCalculado - totalPagado : 0;

  const getDesc = (p: Pedido | null) => {
    if (!p) return '';
    let raw = p.descripcion || (p.detalles_tejido && p.detalles_tejido.split(' | ')[0]) || 'Sin descripción';
    let formatted = raw.replace(/^\[(SENORA|NINA)\]\s*Modelo:\s*\[(SENORA|NINA)\]\s*/i, '[$1] ')
                       .replace(/^\[(SENORA|NINA)\]\s*Modelo:\s*/i, '[$1] ')
                       .replace(/^Modelo:\s*/i, '');
    const tallaVal = p.medidas?.talla === 'TEspecial' ? 'TEsp' : p.medidas?.talla;
    if (tallaVal && tallaVal !== '-' && !formatted.toLowerCase().includes('talla')) {
      return `${formatted} (Talla: ${tallaVal})`;
    }
    return formatted;
  };

  const getObs = (p: Pedido | null) => {
    if (!p) return '';
    if (p.medidas?.observaciones !== undefined) return p.medidas.observaciones;
    if (!p.detalles_tejido) return '';
    const parts = p.detalles_tejido.split(' | ');
    const last = parts[parts.length - 1];
    if (parts.length > 1 && !last.startsWith('Tejido') && !last.startsWith('Color') && !last.startsWith('[')) {
      return last;
    }
    return '';
  };
  const getSugerenciaTallaVista = (medida: string, valor: any, p: Pedido | null) => {
    const v = parseFloat(valor) || 0;
    if (!v || !p) return null;
    const fab = p.fabricante || '';
    const tipo = p.medidas?.tipo_articulo || (p.detalles_tejido?.includes('[NINA]') ? 'NINA' : 'SENORA');

    if (fab.includes('Aires de Ferias') || fab.includes('Aires de Feria')) {
      if (tipo === 'SENORA') {
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
        for (const size of tallas) { if (v <= (size as any)[prop]) return size.t; }
        return 'TEsp';
      } else if (tipo === 'NINA') {
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
        for (const size of tallas) { if (v <= (size as any)[prop]) return size.t; }
        return 'TEsp';
      }
    } else if (fab.includes('Ana Barroso')) {
      if (tipo === 'SENORA') {
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
        for (const size of tallas) { if (v <= (size as any)[prop]) return size.t; }
        return 'TEsp';
      } else if (tipo === 'NINA') {
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
        for (const size of tallas) { if (v <= (size as any)[prop]) return size.t; }
        return 'TEsp';
      }
    }
    return null;
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center">
          <button onClick={handleAtras} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors shrink-0"><ArrowLeft size={24} /></button>
          {((paso === 1 && clienteSeleccionado) || (paso === 2 && pedidoSeleccionado)) && (
            <button onClick={handleAdelante} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors shrink-0"><ArrowRight size={24} /></button>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 ml-1 leading-tight">
            <span>{paso === 1 ? 'Buscar' : paso === 2 ? 'Pedidos del Cliente' : clienteSeleccionado ? `Pedido de ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos}` : 'Detalle del Pedido'}</span>
          </h2>
        </div>
        {paso === 3 && (clienteSeleccionado?.telefono || (pedidoSeleccionado as any)?.clientes?.telefono) && (
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 mt-3 md:mt-0">
            <a href={`tel:${clienteSeleccionado?.telefono || (pedidoSeleccionado as any)?.clientes?.telefono}`} onClick={(e) => { if(!window.confirm(`¿Llamar al cliente al número ${clienteSeleccionado?.telefono || (pedidoSeleccionado as any)?.clientes?.telefono}?`)) e.preventDefault(); }} className="flex items-center justify-center w-full px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl text-lg font-bold transition-colors shadow-sm">
              <Phone size={24} className="mr-2" /> Llamar
            </a>
            <a href={`https://wa.me/34${(clienteSeleccionado?.telefono || (pedidoSeleccionado as any)?.clientes?.telefono || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-2 border-emerald-100 rounded-xl text-lg font-bold transition-colors shadow-sm">
              <MessageCircle size={24} className="mr-2" /> WhatsApp
            </a>
          </div>
        )}
      </div>

      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Search size={24} /></div><input type="text" placeholder="Buscar..." className="w-full pl-12 p-4 border-2 border-gray-100 rounded-xl outline-none text-lg focus:border-rose-300" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
          <div className="space-y-2">{clientes.length > 0 ? clientes.map(c => (<div key={c.id} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex items-center" onClick={() => seleccionarCliente(c)}><div className="bg-rose-50 p-3 rounded-full mr-4 text-rose-500"><User size={24} /></div><div><p className="font-bold text-gray-800 text-lg">{c.apellidos}, {c.nombre}</p><p className="text-gray-500 text-sm">{c.telefono}</p></div></div>)) : busqueda.trim().length >= 2 && <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium text-center">⚠️ No se encontró ningún cliente con "{busqueda}".</div>}</div>
          
          {!busqueda && todosLosPedidos.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-4">Todos los Pedidos ({todosLosPedidos.length})</h3>
              <div className="space-y-3">
                {todosLosPedidos.map(p => (
                  <div key={p.id} onClick={() => seleccionarPedidoDirecto(p)} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex items-start bg-white shadow-sm">
                    <FileText className="text-rose-400 mr-3 flex-shrink-0 mt-1" size={28} />
                    <div className="flex-1 w-full min-w-0">
                      <p className="font-bold text-gray-800 text-lg break-words">{(p as any).clientes?.apellidos?.replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())}, {(p as any).clientes?.nombre?.replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())}</p>
                      <p className="text-lg text-gray-600 font-medium mt-1 leading-tight break-words">{getDesc(p)}</p>
                      <p className="text-base text-gray-500 mt-1 w-full truncate">Fabricante: {p.fabricante || 'Sin especificar'}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {p.estado_proceso === 'ENTREGADO' ? (
                          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-purple-100 text-purple-700">
                            ENTREGADO
                          </span>
                        ) : (
                          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${p.estado_ubicacion === 'STOCK' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.estado_ubicacion === 'STOCK' ? 'EN TIENDA' : 'EN FÁBRICA'}
                          </span>
                        )}
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
          <div className="space-y-3">{pedidos.length === 0 ? <p className="text-center text-gray-500">Sin pedidos.</p> : pedidos.map(p => (<div key={p.id} onClick={() => seleccionarPedido(p)} className="p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 cursor-pointer flex items-start bg-white shadow-sm"><FileText className="text-rose-400 mr-3 flex-shrink-0 mt-1" size={28} /><div className="flex-1 w-full min-w-0"><p className="font-bold text-gray-800 text-lg">{p.categoria}</p><p className="text-lg text-gray-600 font-medium mt-1 leading-tight break-words">{getDesc(p)}</p><p className="text-base text-gray-500 mt-1">Pedido el {p.fecha_pedido}</p><p className="text-base text-gray-500 w-full truncate">Fabricante: {p.fabricante || 'Sin especificar'}</p><div className="flex flex-wrap gap-2 mt-2">{p.estado_proceso === 'ENTREGADO' ? <span className="inline-block text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-purple-100 text-purple-700">ENTREGADO</span> : <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${p.estado_ubicacion === 'STOCK' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.estado_ubicacion === 'STOCK' ? 'EN TIENDA' : 'EN FÁBRICA'}</span>}</div></div></div>))}</div>
        </div>
      )}

      {paso === 3 && pedidoSeleccionado && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border-b-2 border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:pr-4">
              {isEditing ? (
                <>
                  <input type="text" className="text-2xl font-black text-gray-800 border-b-2 border-rose-300 outline-none w-full mb-1" value={editForm.descripcion} onChange={e => setEditForm({...editForm, descripcion: e.target.value})} placeholder="Descripción del pedido..." />
                  <div className="flex items-center text-gray-500 font-medium mt-2">
                    <span className="mr-2">{pedidoSeleccionado.categoria} | Pedido el {pedidoSeleccionado.fecha_pedido} | Fabricante: </span>
                    <select className="border-b-2 border-rose-300 outline-none bg-transparent" value={editForm.fabricante} onChange={e => setEditForm({...editForm, fabricante: e.target.value})}>
                      <option value="">Sin especificar</option>
                      <option value="Ana Barroso">Ana Barroso</option>
                      <option value="Aires de Ferias">Aires de Ferias</option>
                      <option value="Carmen Moda">Carmen Moda</option>
                      <option value="OTRO">Otro...</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-black text-gray-800 break-words">{getDesc(pedidoSeleccionado)}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 leading-tight">{pedidoSeleccionado.categoria} | Pedido el {pedidoSeleccionado.fecha_pedido}{pedidoSeleccionado.fabricante ? ` | Fabricante: ${pedidoSeleccionado.fabricante}` : ''}</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
              <button onClick={toggleEstadoUbicacion} className={`flex-1 md:flex-initial flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors ${pedidoSeleccionado.estado_ubicacion === 'STOCK' ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                {pedidoSeleccionado.estado_ubicacion === 'STOCK' ? <><CheckCircle size={18} className="mr-1.5 flex-shrink-0" /> EN TIENDA</> : <><Factory size={18} className="mr-1.5 flex-shrink-0" /> FÁBRICA</>}
              </button>

              <button onClick={toggleEstadoProceso} className={`flex-1 md:flex-initial flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors ${pedidoSeleccionado.estado_proceso === 'ENTREGADO' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                <PackageCheck size={18} className="mr-1.5 flex-shrink-0" />
                {pedidoSeleccionado.estado_proceso === 'ENTREGADO' ? 'ENTREGADO' : 'MARCAR ENTREGADO'}
              </button>
            </div>
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
            
            <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2.5">
              {['pecho', 'cintura', 'cadera', 'manga', 'talle', 'largo_total', 'contorno_brazo'].map((m: string) => {
                const sug = getSugerenciaTallaVista(m, isEditing ? (editForm as any)[m] : pedidoSeleccionado.medidas?.[m], pedidoSeleccionado);
                return (
                  <div key={m} className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-center flex flex-col items-center justify-between min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase w-full flex items-center justify-center gap-1 text-center">
                      <span className="truncate">{m.replace('_', ' ')}</span>
                      {sug && <span className="text-xs font-black text-blue-600 flex-shrink-0">(T{sug})</span>}
                    </p>
                    {isEditing ? <input type="number" inputMode="decimal" className="w-full text-center mt-1 p-1 border rounded font-bold text-gray-800 outline-none focus:border-rose-300 text-lg" value={(editForm as any)[m]} onChange={e => setEditForm({...editForm, [m]: e.target.value})} /> : <p className="text-xl md:text-2xl font-black text-gray-800 mt-1">{pedidoSeleccionado.medidas?.[m] || '-'}</p>}
                  </div>
                );
              })}
              
              <div className="bg-rose-100/60 border border-rose-200 p-2.5 rounded-xl text-center flex flex-col items-center justify-between min-w-0">
                <p className="text-xs font-bold text-rose-800 uppercase w-full text-center">TALLA</p>
                {isEditing ? (
                  <select className="w-full text-center mt-1 p-1 border rounded font-bold text-rose-900 bg-white outline-none focus:border-rose-400 text-xs md:text-sm" value={editForm.talla} onChange={e => setEditForm({...editForm, talla: e.target.value})}>
                    <option value="">-</option>
                    {editForm.tipo_articulo === 'NINA' ? (
                      <>
                        {['1','2','3','4','5','6','7','8','9','12','14','TEsp'].map(t => <option key={t} value={t}>{t === 'TEsp' ? 'TEsp' : `T${t}`}</option>)}
                      </>
                    ) : (
                      <>
                        {['32','34','36','38','40','42','44','46','48','50','52','54','56','58','60','TEsp'].map(t => <option key={t} value={t}>{t === 'TEsp' ? 'TEsp' : `T${t}`}</option>)}
                      </>
                    )}
                  </select>
                ) : (
                  <p className="text-xl md:text-2xl font-black text-rose-700 mt-1">
                    {pedidoSeleccionado.medidas?.talla === 'TEspecial' ? 'TEsp' : pedidoSeleccionado.medidas?.talla || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Sección Tejidos */}
            <div className="mt-4 bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3">
              <span className="text-xs md:text-sm font-bold text-rose-800 uppercase block">Tejidos y Detalle</span>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido del traje</label>
                    <select
                      className="w-full p-2 border border-rose-200 rounded-lg outline-none font-semibold bg-white"
                      value={editForm.numTejidos}
                      onChange={e => setEditForm({...editForm, numTejidos: Number(e.target.value)})}
                    >
                      <option value={1}>1 Tejido</option>
                      <option value={2}>2 Tejidos</option>
                      <option value={3}>3 Tejidos</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 1</label>
                      <input type="text" className="w-full p-2 border rounded-lg bg-white" value={editForm.tejido1} onChange={e => setEditForm({...editForm, tejido1: e.target.value})} placeholder="Tejido 1..." />
                    </div>
                    {editForm.numTejidos >= 2 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 2</label>
                        <input type="text" className="w-full p-2 border rounded-lg bg-white" value={editForm.tejido2} onChange={e => setEditForm({...editForm, tejido2: e.target.value})} placeholder="Tejido 2..." />
                      </div>
                    )}
                    {editForm.numTejidos >= 3 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 3</label>
                        <input type="text" className="w-full p-2 border rounded-lg bg-white" value={editForm.tejido3} onChange={e => setEditForm({...editForm, tejido3: e.target.value})} placeholder="Tejido 3..." />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-rose-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido del Can Can</label>
                      <input type="text" className="w-full p-2 border rounded-lg bg-white" value={editForm.tejidoCancan} onChange={e => setEditForm({...editForm, tejidoCancan: e.target.value})} placeholder="Can Can..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Color del Cordoncillo</label>
                      <input type="text" className="w-full p-2 border rounded-lg bg-white" value={editForm.colorCordoncillo} onChange={e => setEditForm({...editForm, colorCordoncillo: e.target.value})} placeholder="Cordoncillo..." />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-800 font-medium">
                  <div>
                    <span className="font-bold text-rose-900">Tejido 1: </span>
                    <span>{pedidoSeleccionado.medidas?.tejido1 || '-'}</span>
                  </div>
                  {(pedidoSeleccionado.medidas?.numTejidos >= 2 || pedidoSeleccionado.medidas?.tejido2) && (
                    <div>
                      <span className="font-bold text-rose-900">Tejido 2: </span>
                      <span>{pedidoSeleccionado.medidas?.tejido2 || '-'}</span>
                    </div>
                  )}
                  {(pedidoSeleccionado.medidas?.numTejidos >= 3 || pedidoSeleccionado.medidas?.tejido3) && (
                    <div>
                      <span className="font-bold text-rose-900">Tejido 3: </span>
                      <span>{pedidoSeleccionado.medidas?.tejido3 || '-'}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-rose-900">Tejido Can Can: </span>
                    <span>{pedidoSeleccionado.medidas?.tejidoCancan || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-rose-900">Color Cordoncillo: </span>
                    <span>{pedidoSeleccionado.medidas?.colorCordoncillo || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {isEditing ? (
              <textarea className="mt-4 w-full p-3 border rounded-xl text-xl md:text-2xl font-normal text-gray-800 outline-none focus:border-rose-300 h-32" value={editForm.detalles_tejido} onChange={e => setEditForm({...editForm, detalles_tejido: e.target.value})} placeholder="Observaciones..."></textarea>
            ) : getObs(pedidoSeleccionado) ? (
              <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100"><span className="text-xs md:text-sm font-bold text-gray-500 uppercase block mb-1">Observaciones</span><p className="text-xl md:text-2xl font-normal text-gray-800">{getObs(pedidoSeleccionado)}</p></div>
            ) : null}
          </div>

          <div className="bg-rose-50/50 border-2 border-rose-100 rounded-2xl p-4 sm:p-6 space-y-3">
            <h4 className="font-bold text-rose-800 uppercase text-sm border-b border-rose-200 pb-2">Control Económico</h4>
            
            <div className="flex justify-between text-gray-700 items-center text-sm font-semibold gap-2">
              <span>Precio Traje:</span>
              {isEditing ? (
                <input type="number" step="0.01" className="p-1 border-b-2 border-rose-300 bg-white rounded text-right font-bold text-gray-800 outline-none focus:border-rose-500 w-24" value={editForm.precioTraje} onChange={e => setEditForm({...editForm, precioTraje: e.target.value})} />
              ) : (
                <span className="font-bold text-gray-800 whitespace-nowrap">{Number(pedidoSeleccionado.medidas?.precioTraje !== undefined && pedidoSeleccionado.medidas?.precioTraje !== '' ? pedidoSeleccionado.medidas.precioTraje : pedidoSeleccionado.precio_total).toFixed(2)} €</span>
              )}
            </div>

            {/* Cargos Adicionales */}
            <div className="border-t border-rose-200 pt-2 space-y-2">
              <span className="text-xs font-bold text-rose-700 uppercase block">Cargos Adicionales (Mantoncillo, etc.)</span>

              {isEditing ? (
                <>
                  {editForm.cargosExtra.map((cargo, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" placeholder="Ej. Mantoncillo..." className="flex-1 p-1.5 border rounded text-xs outline-none bg-white" value={cargo.concepto} onChange={e => { const newC = [...editForm.cargosExtra]; newC[idx].concepto = e.target.value; setEditForm({...editForm, cargosExtra: newC}); }} />
                      <input type="number" step="0.01" placeholder="€" className="w-20 p-1.5 border rounded text-xs outline-none font-semibold text-right bg-white" value={cargo.precio} onChange={e => { const newC = [...editForm.cargosExtra]; newC[idx].precio = e.target.value; setEditForm({...editForm, cargosExtra: newC}); }} />
                      <button type="button" onClick={() => { const newC = editForm.cargosExtra.filter((_, i) => i !== idx); setEditForm({...editForm, cargosExtra: newC}); }} className="text-red-500 font-bold text-xs">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditForm({...editForm, cargosExtra: [...editForm.cargosExtra, { concepto: '', precio: '' }]})} className="text-xs font-bold text-rose-600 bg-white hover:bg-rose-100 px-2 py-1 rounded border border-rose-200 flex items-center gap-1 w-full justify-center mt-1">+ Añadir concepto</button>
                </>
              ) : (
                <>
                  {(pedidoSeleccionado.medidas?.cargosExtra || []).map((cargo: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-gray-700 font-medium px-2 py-1.5 bg-white rounded-lg border border-rose-100 gap-2">
                      <span className="truncate">+ {cargo.concepto || 'Cargo adicional'}:</span>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{Number(cargo.precio || 0).toFixed(2)} €</span>
                        <button type="button" onClick={() => eliminarCargoExtra(idx)} className="text-red-400 hover:text-red-600 font-bold ml-1 p-1">✕</button>
                      </div>
                    </div>
                  ))}
                  <form onSubmit={guardarNuevoCargoExtra} className="flex flex-col gap-2 pt-1">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Ej. Mantoncillo..." className="flex-1 min-w-0 p-2 border rounded-lg text-xs outline-none bg-white focus:border-rose-400 font-medium" value={nuevoCargoConcepto} onChange={e => setNuevoCargoConcepto(e.target.value)} />
                      <input type="number" step="0.01" inputMode="decimal" placeholder="Precio (€)" className="w-24 min-w-[90px] p-2 border rounded-lg text-xs outline-none font-semibold text-right bg-white focus:border-rose-400" value={nuevoCargoPrecio} onChange={e => setNuevoCargoPrecio(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loadingCargo || !nuevoCargoConcepto.trim() || !nuevoCargoPrecio} className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white p-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1">
                      + Añadir concepto
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-rose-200 items-center gap-2">
              <span className="text-xs sm:text-sm uppercase">Precio Total Pedido:</span>
              <span className="text-base sm:text-lg whitespace-nowrap font-black">{isEditing ? ((parseFloat(editForm.precioTraje) || 0) + editForm.cargosExtra.reduce((a: number, b: any) => a + (parseFloat(b.precio) || 0), 0)).toFixed(2) : Number(pedidoSeleccionado.precio_total).toFixed(2)} €</span>
            </div>
            <div className="border-t border-rose-200 pt-3">
              <p className="text-xs font-bold text-rose-600 uppercase mb-2">Entregas a cuenta:</p>
              {pagos.length === 0 ? <p className="text-sm text-gray-500 italic">Sin pagos registrados.</p> : pagos.map((p, i) => <div key={p.id} className="flex justify-between items-center text-xs sm:text-sm bg-white p-2 rounded-lg border border-rose-100 mb-2 gap-2"><span className="text-gray-500 truncate">#{i + 1} - {p.fecha}</span>{isEditing ? <input type="number" step="0.01" className="p-1 border border-rose-200 rounded outline-none text-right font-bold focus:border-rose-500 w-20 sm:w-24" value={editPagos[p.id] || ''} onChange={e => setEditPagos({...editPagos, [p.id]: e.target.value})} /> : <span className="font-bold text-green-600 whitespace-nowrap">+{Number(p.monto_entrega_cuenta).toFixed(2)} €</span>}</div>)}
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-rose-200 mt-4 gap-2"><span className="font-black text-rose-900 uppercase text-xs sm:text-sm">Restante:</span><span className="text-2xl sm:text-3xl font-black text-rose-600 whitespace-nowrap">{restante.toFixed(2)} €</span></div>
            {restante > 0 && (
              <form onSubmit={guardarNuevoPago} className="flex flex-col gap-3 mt-4 pt-4 border-t border-rose-200"><input type="number" step="0.01" inputMode="decimal" placeholder="Abono (€)" className="w-full p-3 border-2 border-rose-200 rounded-xl outline-none font-bold focus:border-rose-400 text-center" value={nuevoPago} onChange={e => setNuevoPago(e.target.value)} /><button type="submit" disabled={loadingPago} className="w-full bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 flex items-center justify-center"><Plus size={20} className="mr-1"/> Añadir</button></form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

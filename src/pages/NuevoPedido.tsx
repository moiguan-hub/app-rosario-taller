import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, CategoriaPedido } from '../types/database.types';
import { FABRICANTES_POR_CATEGORIA } from '../constants/fabricantes';
import { TALLAS_NOVADRIMA_NINO, TALLAS_ANA_ROSILLO_NINA, TALLAS_ANAVIG_NINA } from '../constants/tallas';
import { obtenerConfiguracionCampana } from '../config/campanas';

export function NuevoPedido() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState<1 | 2>(1);
  
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({ apellidos: '', nombre: '', telefono: '', telefono2: '', contacto2: '', direccion: '' });
  const [pedidosActivosCliente, setPedidosActivosCliente] = useState<any[]>([]);
  const [pedidoPrincipalId, setPedidoPrincipalId] = useState<string>('');

  const getInitialCategoria = (): CategoriaPedido => {
    const c = localStorage.getItem('campana_activa') || 'FLAMENCA';
    return (c === 'COMUNION' || c === 'Comunión' || c === 'COMUNIÓN') ? 'COMUNION' : 'FLAMENCA';
  };

  const [pedido, setPedido] = useState({
    descripcion: '',
    categoria: getInitialCategoria(),
    tipo_articulo: (getInitialCategoria() === 'COMUNION' ? 'NINA' : 'SENORA') as 'NINA' | 'SENORA' | 'NINO' | null,
    estilo_comunion: 'Calle' as 'Calle' | 'Marinero' | 'Almirante' | null,
    fecha_pedido: new Date().toISOString().split('T')[0],
    fabricante: '', 
    pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '', contorno_brazo: '', espalda: '', talla: '', talla_especial_detalle: '',
    chaqueta: '', chaquetaOrigen: 'fabrica' as 'fabrica' | 'tienda',
    pantalon: '', pantalonOrigen: 'fabrica' as 'fabrica' | 'tienda',
    chalequillo: '', chalequilloOrigen: 'fabrica' as 'fabrica' | 'tienda',
    camisa: '', camisaOrigen: 'fabrica' as 'fabrica' | 'tienda',
    camisaTEsp: '',
    incluirCorbata: false,
    precioCorbata: '0',
    incluirCancan: false,
    precioCancan: '0',
    incluirAdornoPelo: false,
    precioAdornoPelo: '0',
    incluirConjuntoInterior: false,
    precioConjuntoInterior: '0',
    numTejidos: 1,
    tejido1: '',
    tejido2: '',
    tejido3: '',
    tejidoCancan: '',
    colorCordoncillo: '',
    observaciones: '',
    precioTraje: '',
    cargosExtra: [] as Array<{ concepto: string; precio: string }>,
    entrega_cuenta: ''
  });

  const config = obtenerConfiguracionCampana(pedido.categoria, pedido.fabricante);

  const handleFabricanteChange = (fabNombre: string) => {
    const conf = obtenerConfiguracionCampana(pedido.categoria, fabNombre);
    const fabList = FABRICANTES_POR_CATEGORIA[pedido.categoria] || [];
    const fabObj = fabList.find(f => f.nombre === fabNombre || f.id === fabNombre);
    let nuevoTipo = pedido.tipo_articulo;

    if (pedido.categoria === 'COMUNION') {
      if (conf.genero === 'NINO') {
        nuevoTipo = 'NINO';
      } else if (conf.genero === 'NINA') {
        nuevoTipo = 'NINA';
      } else if (fabObj && (fabObj.genero === 'Nina' || fabObj.genero === 'Nino')) {
        nuevoTipo = fabObj.genero === 'Nina' ? 'NINA' : 'NINO';
      }
    }

    setPedido(prev => ({
      ...prev,
      fabricante: fabNombre,
      tipo_articulo: nuevoTipo,
    }));
  };

  useEffect(() => {
    const syncCampana = () => {
      const campanaActiva = localStorage.getItem('campana_activa') || 'FLAMENCA';
      const catNorm: CategoriaPedido = (campanaActiva === 'COMUNION' || campanaActiva === 'Comunión' || campanaActiva === 'COMUNIÓN')
        ? 'COMUNION'
        : 'FLAMENCA';

      setPedido(prev => {
        if (prev.categoria !== catNorm) {
          const defaultTipo = catNorm === 'COMUNION' ? 'NINA' : 'SENORA';
          return {
            ...prev,
            categoria: catNorm,
            fabricante: '',
            tipo_articulo: defaultTipo
          };
        }
        return prev;
      });
    };

    syncCampana();
    window.addEventListener('storage', syncCampana);
    const interval = setInterval(syncCampana, 300);

    return () => {
      window.removeEventListener('storage', syncCampana);
      clearInterval(interval);
    };
  }, []);

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
    if (clienteSeleccionado?.id) {
      supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', clienteSeleccionado.id)
        .or('archivado.is.null,archivado.eq.false')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setPedidosActivosCliente(data || []);
        });
    } else {
      setPedidosActivosCliente([]);
      setPedidoPrincipalId('');
    }
  }, [clienteSeleccionado]);

  const handleSelectPedidoPrincipal = (pId: string) => {
    setPedidoPrincipalId(pId);
    if (pId) {
      setPedido(prev => ({
        ...prev,
        precioTraje: '0',
        entrega_cuenta: '0',
        cargosExtra: []
      }));
    }
  };

  useEffect(() => {
    const buscar = async () => {
      if (busqueda.trim().length < 2) {
        setClientes([]);
        setBusquedaRealizada(false);
        setBuscando(false);
        return;
      }
      setBuscando(true);
      const { data, error } = await supabase.from('clientes')
        .select('*')
        .or(`apellidos.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,telefono2.ilike.%${busqueda}%,contacto2.ilike.%${busqueda}%`)
        .limit(5);
      if (error) {
        const { data: data2 } = await supabase.from('clientes')
          .select('*')
          .or(`apellidos.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
          .limit(5);
        if (data2) setClientes(data2);
      } else if (data) setClientes(data);
      setBuscando(false);
      setBusquedaRealizada(true);
    };
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c);
    setBusqueda(c.nombre + ' ' + c.apellidos);
    setClientes([]);
    setBusquedaRealizada(false);
    setPaso(2);
  };


  const handleContinuar = async () => {
    if (clienteSeleccionado) {
      setPaso(2);
    } else if (nuevoCliente.nombre && nuevoCliente.apellidos) {
      setLoading(true);
      try {
        let payload: any = { ...nuevoCliente };
        let { data: newC, error: errC } = await supabase.from('clientes').insert([payload]).select().single();
        if (errC && (errC.message.includes('contacto2') || errC.message.includes('telefono2') || errC.message.includes('schema cache'))) {
          delete payload.contacto2;
          delete payload.telefono2;
          const res = await supabase.from('clientes').insert([payload]).select().single();
          newC = res.data;
          errC = res.error;
        }
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
        let payload: any = { ...nuevoCliente };
        let { data: newC, error: errC } = await supabase.from('clientes').insert([payload]).select().single();
        if (errC && (errC.message.includes('contacto2') || errC.message.includes('telefono2') || errC.message.includes('schema cache'))) {
          delete payload.contacto2;
          delete payload.telefono2;
          const res = await supabase.from('clientes').insert([payload]).select().single();
          newC = res.data;
          errC = res.error;
        }
        if (errC) throw errC;
        clientId = newC.id;
      }

      if (!pedido.descripcion.trim()) {
        alert('Por favor, ingresa el Modelo del pedido.');
        setLoading(false);
        return;
      }
      if (!pedido.fabricante) {
        alert('Por favor, selecciona un Fabricante.');
        setLoading(false);
        return;
      }

      const tejidosList = [];
      if (config.soportaTejidos) {
        if (pedido.tejido1.trim()) tejidosList.push(`Tejido 1: ${pedido.tejido1.trim()}`);
        if (pedido.numTejidos >= 2 && pedido.tejido2.trim()) tejidosList.push(`Tejido 2: ${pedido.tejido2.trim()}`);
        if (pedido.numTejidos >= 3 && pedido.tejido3.trim()) tejidosList.push(`Tejido 3: ${pedido.tejido3.trim()}`);
        if (pedido.tejidoCancan.trim()) tejidosList.push(`Tejido Can Can: ${pedido.tejidoCancan.trim()}`);
        if (pedido.colorCordoncillo.trim()) tejidosList.push(`Color Cordoncillo: ${pedido.colorCordoncillo.trim()}`);
      }
      const tejidosStr = tejidosList.join(' | ');

      const isNovadrima = config.tipoCaptura === 'PIEZAS_VESTUARIO_NOVADRIMA';
      const isComunionNina = config.tipoCaptura === 'MEDIDAS_CORPORALES_COMUNION_NINA';

      let medidasPayload: any = {
        modelo: pedido.descripcion,
        tipo_articulo: pedido.categoria === 'FLAMENCA' ? pedido.tipo_articulo : null,
        numTejidos: config.soportaTejidos ? pedido.numTejidos : null,
        tejido1: config.soportaTejidos ? pedido.tejido1 : '',
        tejido2: config.soportaTejidos ? pedido.tejido2 : '',
        tejido3: config.soportaTejidos ? pedido.tejido3 : '',
        tejidoCancan: config.soportaTejidos ? pedido.tejidoCancan : '',
        colorCordoncillo: config.soportaTejidos ? pedido.colorCordoncillo : '',
        observaciones: pedido.observaciones,
        precioTraje: pedidoPrincipalId ? '0' : pedido.precioTraje,
        cargosExtra: pedidoPrincipalId ? [] : pedido.cargosExtra
      };

      if (isNovadrima) {
        medidasPayload = {
          ...medidasPayload,
          chaqueta: pedido.chaqueta,
          chaqueta_origen: pedido.chaquetaOrigen || 'fabrica',
          pantalon: pedido.pantalon,
          pantalon_origen: pedido.pantalonOrigen || 'fabrica',
          chalequillo: pedido.chalequillo,
          chalequillo_origen: pedido.chalequilloOrigen || 'fabrica',
          camisa: pedido.camisa,
          camisa_origen: pedido.camisaOrigen || 'fabrica',
          camisa_tesp: pedido.camisa === 'TEsp' ? pedido.camisaTEsp : '',
          incluir_corbata: pedido.incluirCorbata,
          precio_corbata: pedido.incluirCorbata ? Number(pedido.precioCorbata || 0) : 0,
          incluir_conjunto_interior: pedido.incluirConjuntoInterior,
          precio_conjunto_interior: pedido.incluirConjuntoInterior ? Number(pedido.precioConjuntoInterior || 0) : 0,
        };
      } else if (isComunionNina) {
        medidasPayload = {
          ...medidasPayload,
          espalda: pedido.espalda,
          pecho: pedido.pecho,
          cintura: pedido.cintura,
          talle: pedido.talle,
          largo_total: pedido.largo_total,
          contorno_brazo: pedido.contorno_brazo,
          talla: pedido.talla,
          talla_especial_detalle: pedido.talla === 'TEsp' ? pedido.talla_especial_detalle : '',
          incluir_cancan: pedido.incluirCancan,
          precio_cancan: pedido.incluirCancan ? Number(pedido.precioCancan || 0) : 0,
          incluir_adorno_pelo: pedido.incluirAdornoPelo,
          precio_adorno_pelo: pedido.incluirAdornoPelo ? Number(pedido.precioAdornoPelo || 0) : 0,
          incluir_conjunto_interior: pedido.incluirConjuntoInterior,
          precio_conjunto_interior: pedido.incluirConjuntoInterior ? Number(pedido.precioConjuntoInterior || 0) : 0,
        };
      } else {
        medidasPayload = {
          ...medidasPayload,
          pecho: pedido.pecho, cintura: pedido.cintura, cadera: pedido.cadera,
          manga: pedido.manga, talle: pedido.talle, largo_total: pedido.largo_total,
          contorno_brazo: pedido.contorno_brazo, talla: pedido.talla,
          espalda: pedido.espalda,
          talla_especial_detalle: pedido.talla === 'TEsp' ? pedido.talla_especial_detalle : '',
        };
      }

      let insertData: any = {
        cliente_id: clientId,
        categoria: pedido.categoria,
        fabricante: pedido.fabricante,
        estilo_comunion: isNovadrima ? pedido.estilo_comunion : null,
        fecha_pedido: pedido.fecha_pedido, 
        medidas: medidasPayload,
        detalles_tejido: (pedido.categoria === 'FLAMENCA' ? '[' + pedido.tipo_articulo + '] ' : '') + (pedido.descripcion ? 'Modelo: ' + pedido.descripcion : '') + (tejidosStr ? ' | ' + tejidosStr : '') + (pedido.observaciones ? ' | ' + pedido.observaciones : ''), 
        precio_total: pedidoPrincipalId ? 0 : calcularPrecioTotal(),
        pedido_principal_id: pedidoPrincipalId || null
      };

      let { data: ord, error: errO } = await supabase.from('pedidos').insert([insertData] as any).select().single();
      if (errO && (errO.message.includes('pedido_principal_id') || errO.message.includes('schema cache'))) {
        delete insertData.pedido_principal_id;
        const res = await supabase.from('pedidos').insert([insertData] as any).select().single();
        ord = res.data;
        errO = res.error;
      }
      if (errO) throw errO;

      const entrega = pedidoPrincipalId ? 0 : parseFloat(pedido.entrega_cuenta);
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

    if (pedido.categoria === 'COMUNION' && pedido.fabricante === 'Novadrima') {
      if (medida === 'pecho') {
        for (const row of TALLAS_NOVADRIMA_NINO) {
          if (v <= row.pecho) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'cintura') {
        for (const row of TALLAS_NOVADRIMA_NINO) {
          if (v <= row.cintura_max) return `T${row.talla}`;
        }
        return 'TEspecial';
      }
    }

    if (pedido.categoria === 'COMUNION' && (pedido.fabricante === 'Ana Rosillo' || pedido.fabricante?.includes('Ana Rosillo'))) {
      if (medida === 'pecho') {
        for (const row of TALLAS_ANA_ROSILLO_NINA) {
          if (v <= row.pecho) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'cintura') {
        for (const row of TALLAS_ANA_ROSILLO_NINA) {
          if (v <= row.cintura) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'largo_total') {
        for (const row of TALLAS_ANA_ROSILLO_NINA) {
          if (v <= row.largo) return `T${row.talla}`;
        }
        return 'TEspecial';
      }
    }

    if (pedido.categoria === 'COMUNION' && (pedido.fabricante === 'Anavig' || pedido.fabricante?.includes('Anavig'))) {
      if (medida === 'pecho') {
        for (const row of TALLAS_ANAVIG_NINA) {
          if (v <= row.pecho) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'cintura') {
        for (const row of TALLAS_ANAVIG_NINA) {
          if (v <= row.cintura) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'talle') {
        for (const row of TALLAS_ANAVIG_NINA) {
          if (v <= row.talle) return `T${row.talla}`;
        }
        return 'TEspecial';
      } else if (medida === 'largo_total') {
        for (const row of TALLAS_ANAVIG_NINA) {
          if (v <= row.largo_total) return `T${row.talla}`;
        }
        return 'TEspecial';
      }
    }

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

  const limpiarFormulario = () => {
    setPedidoPrincipalId('');
    setPedido({
      descripcion: '',
      categoria: 'FLAMENCA' as CategoriaPedido,
      tipo_articulo: 'SENORA' as 'NINA' | 'SENORA' | 'NINO' | null,
      estilo_comunion: 'Calle' as 'Calle' | 'Marinero' | 'Almirante' | null,
      fecha_pedido: new Date().toISOString().split('T')[0],
      fabricante: '', 
      pecho: '', cintura: '', cadera: '', manga: '', talle: '', largo_total: '', contorno_brazo: '', espalda: '', talla: '', talla_especial_detalle: '',
      chaqueta: '', chaquetaOrigen: 'fabrica' as 'fabrica' | 'tienda',
      pantalon: '', pantalonOrigen: 'fabrica' as 'fabrica' | 'tienda',
      chalequillo: '', chalequilloOrigen: 'fabrica' as 'fabrica' | 'tienda',
      camisa: '', camisaOrigen: 'fabrica' as 'fabrica' | 'tienda',
      camisaTEsp: '',
      incluirCorbata: false,
      precioCorbata: '0',
      incluirCancan: false,
      precioCancan: '0',
      incluirAdornoPelo: false,
      precioAdornoPelo: '0',
      incluirConjuntoInterior: false,
      precioConjuntoInterior: '0',
      numTejidos: 1,
      tejido1: '',
      tejido2: '',
      tejido3: '',
      tejidoCancan: '',
      colorCordoncillo: '',
      observaciones: '',
      precioTraje: '',
      cargosExtra: [],
      entrega_cuenta: ''
    });
  };
  const calcularPrecioTotal = () => {
    if (pedidoPrincipalId) return 0;
    let total = parseFloat(pedido.precioTraje) || 0;

    for (const comp of config.complementos || []) {
      if (comp.claveIncluir === 'incluir_corbata' && pedido.incluirCorbata) {
        total += parseFloat(pedido.precioCorbata) || 0;
      } else if (comp.claveIncluir === 'incluir_cancan' && pedido.incluirCancan) {
        total += parseFloat(pedido.precioCancan) || 0;
      } else if (comp.claveIncluir === 'incluir_adorno_pelo' && pedido.incluirAdornoPelo) {
        total += parseFloat(pedido.precioAdornoPelo) || 0;
      } else if (comp.claveIncluir === 'incluir_conjunto_interior' && pedido.incluirConjuntoInterior) {
        total += parseFloat(pedido.precioConjuntoInterior) || 0;
      }
    }

    for (const extra of pedido.cargosExtra) {
      total += parseFloat(extra.precio) || 0;
    }

    return total;
  };

  const renderComplementosSegunConfig = () => {
    if (!config.complementos || config.complementos.length === 0) return null;

    return (
      <div className="pt-3 border-t border-rose-200/80 space-y-3">
        <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">Complementos Opcionales</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {config.complementos.map(c => {
            let active = false;
            let priceVal = '0';
            let onCheck = (_v: boolean) => {};
            let onPrice = (_p: string) => {};

            if (c.claveIncluir === 'incluir_corbata') {
              active = pedido.incluirCorbata;
              priceVal = pedido.precioCorbata;
              onCheck = v => setPedido({...pedido, incluirCorbata: v});
              onPrice = p => setPedido({...pedido, precioCorbata: p});
            } else if (c.claveIncluir === 'incluir_cancan') {
              active = pedido.incluirCancan;
              priceVal = pedido.precioCancan;
              onCheck = v => setPedido({...pedido, incluirCancan: v});
              onPrice = p => setPedido({...pedido, precioCancan: p});
            } else if (c.claveIncluir === 'incluir_adorno_pelo') {
              active = pedido.incluirAdornoPelo;
              priceVal = pedido.precioAdornoPelo;
              onCheck = v => setPedido({...pedido, incluirAdornoPelo: v});
              onPrice = p => setPedido({...pedido, precioAdornoPelo: p});
            } else if (c.claveIncluir === 'incluir_conjunto_interior') {
              active = pedido.incluirConjuntoInterior;
              priceVal = pedido.precioConjuntoInterior;
              onCheck = v => setPedido({...pedido, incluirConjuntoInterior: v});
              onPrice = p => setPedido({...pedido, precioConjuntoInterior: p});
            }

            return (
              <div key={c.claveIncluir} className="bg-white p-3 rounded-lg border border-rose-200 flex flex-col justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-rose-600 rounded"
                    checked={active}
                    onChange={e => onCheck(e.target.checked)}
                  />
                  <span>{c.etiqueta}</span>
                </label>
                {active && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Precio (€):</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 p-1.5 border rounded-lg font-bold text-gray-800 bg-rose-50/50 text-right text-sm"
                      value={priceVal}
                      onChange={e => onPrice(e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCamposSegunConfig = () => {
    if (config.tipoCaptura === 'PIEZAS_VESTUARIO_NOVADRIMA') {
      const piezas = config.piezasVestuario || [];
      return (
        <div className="bg-amber-50/60 p-4 rounded-xl border-2 border-amber-200 space-y-4">
          <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">Tallas y Piezas Novadrima</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {piezas.map(p => {
              const val = (pedido as any)[p.clave];
              const orig = (pedido as any)[p.claveOrigen] || 'fabrica';

              if (p.clave === 'camisa') {
                return (
                  <div key={p.clave} className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col justify-between space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 uppercase mb-1">Camisa</label>
                      <select
                        className="w-full p-2 border rounded-lg font-bold text-gray-800 bg-white text-sm outline-none"
                        value={val}
                        onChange={e => setPedido({...pedido, camisa: e.target.value})}
                      >
                        <option value="">Seleccionar...</option>
                        {['29','30','31','32','33','34','35','36','TEsp'].map(t => (
                          <option key={t} value={t}>{t === 'TEsp' ? 'TEsp' : `T${t}`}</option>
                        ))}
                      </select>
                      {val === 'TEsp' && (
                        <input
                          type="text"
                          placeholder="Especificación a mano..."
                          className="w-full mt-2 p-2 border rounded-lg font-medium text-gray-800 bg-amber-50/50 text-xs outline-none"
                          value={pedido.camisaTEsp}
                          onChange={e => setPedido({...pedido, camisaTEsp: e.target.value})}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Origen / Estado</label>
                      <select
                        className="w-full p-1.5 border rounded-lg text-xs font-semibold bg-gray-50 text-gray-800 outline-none"
                        value={orig}
                        onChange={e => setPedido({...pedido, camisaOrigen: e.target.value as any})}
                      >
                        <option value="fabrica">🏭 Pedir a Fábrica</option>
                        <option value="tienda">🏬 En Tienda</option>
                      </select>
                    </div>
                  </div>
                );
              }

              return (
                <div key={p.clave} className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col justify-between space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase mb-1">{p.etiqueta}</label>
                    <select
                      className="w-full p-2 border rounded-lg font-bold text-gray-800 bg-white text-sm outline-none"
                      value={val}
                      onChange={e => setPedido({ ...pedido, [p.clave]: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {['T6','T7','T8','T9','T10','T11','T12','T13','T14'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Origen / Estado</label>
                    <select
                      className="w-full p-1.5 border rounded-lg text-xs font-semibold bg-gray-50 text-gray-800 outline-none"
                      value={orig}
                      onChange={e => setPedido({ ...pedido, [p.claveOrigen]: e.target.value })}
                    >
                      <option value="fabrica">🏭 Pedir a Fábrica</option>
                      <option value="tienda">🏬 En Tienda</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {renderComplementosSegunConfig()}
        </div>
      );
    }
    if (config.tipoCaptura === 'MEDIDAS_CORPORALES_COMUNION_NINA') {
      const campos = config.camposMedidas || [];
      return (
        <div className="bg-rose-50/60 p-4 rounded-xl border-2 border-rose-200 space-y-4">
          <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wide">
            Medidas Vestido Comunión Niña ({pedido.fabricante})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {campos.map(campo => {
              const val = (pedido as any)[campo.clave];
              const sug = getSugerenciaTalla(campo.clave, val);
              return (
                <div key={campo.clave} className="flex flex-col bg-white border border-rose-200 p-2.5 rounded-lg">
                  <label className="text-xs font-bold text-rose-900 uppercase mb-1">
                    {campo.etiqueta} {sug && <span className="text-blue-500 ml-1">(Sugerida: {sug})</span>}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full p-1 border rounded-lg outline-none text-lg font-bold text-gray-800 focus:border-rose-400"
                    value={val}
                    onChange={e => setPedido({ ...pedido, [campo.clave]: e.target.value })}
                  />
                </div>
              );
            })}

            <div className={`flex flex-col bg-white border border-rose-200 p-2.5 rounded-lg ${pedido.talla === 'TEsp' ? 'col-span-2 md:col-span-2' : ''}`}>
              <label className="text-xs font-bold text-rose-900 uppercase mb-1">Talla Definitiva</label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full p-1 border rounded-lg outline-none text-lg font-bold text-gray-800 bg-white focus:border-rose-400"
                  value={pedido.talla}
                  onChange={e => setPedido({ ...pedido, talla: e.target.value })}
                >
                  <option value="">-</option>
                  {(config.tallasDisponibles || []).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {pedido.talla === 'TEsp' && (
                  <input
                    type="text"
                    placeholder="Escribir talla especial..."
                    className="w-full p-1.5 border border-rose-300 rounded-lg outline-none text-sm font-bold text-gray-800 bg-white focus:border-rose-400"
                    value={pedido.talla_especial_detalle || ''}
                    onChange={e => setPedido({ ...pedido, talla_especial_detalle: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>

          {renderComplementosSegunConfig()}
        </div>
      );
    }

    // Por defecto / Flamenca
    const campos = config.camposMedidas || [
      { clave: 'pecho', etiqueta: 'Pecho' },
      { clave: 'cintura', etiqueta: 'Cintura' },
      { clave: 'cadera', etiqueta: 'Cadera' },
      { clave: 'manga', etiqueta: 'Manga' },
      { clave: 'talle', etiqueta: 'Talle' },
      { clave: 'largo_total', etiqueta: 'Largo Total' },
      { clave: 'contorno_brazo', etiqueta: 'Contorno Brazo' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
        {campos.map(campo => {
          const sug = getSugerenciaTalla(campo.clave, (pedido as any)[campo.clave]);
          return (
            <div key={campo.clave} className="flex flex-col bg-white border border-gray-100 p-2 rounded-lg">
              <label className="text-[10px] font-bold text-rose-600 uppercase mb-1">
                {campo.etiqueta} {sug && <span className="text-blue-500 ml-1">(Sugerida: {sug})</span>}
              </label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full p-1 outline-none text-lg font-medium"
                value={(pedido as any)[campo.clave]}
                onChange={e => setPedido({...pedido, [campo.clave]: e.target.value})}
              />
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
    );
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
      <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
        <div className="flex items-center">
          <button onClick={handleAtras} className="p-2 mr-4 bg-gray-50 rounded-full hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {paso === 1 ? 'Paso 1: Identificar Cliente' : 'Paso 2: Detalles del Pedido'}
          </h2>
        </div>
        {paso === 2 && (
          <button
            type="button"
            onClick={limpiarFormulario}
            className="px-3 py-1.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={16} />
            Limpiar
          </button>
        )}
      </div>
      
      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-2">Buscar cliente por Apellidos, Nombre o Teléfono</label>
            <input type="text" placeholder="Escribe para buscar..." className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-rose-300 outline-none text-lg bg-gray-50 focus:bg-white" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            
            {buscando && (
              <p className="mt-2 text-sm text-gray-500 italic flex items-center gap-2">
                <span className="animate-pulse">🔍</span> Buscando cliente...
              </p>
            )}

            {!buscando && clientes.length > 0 && (
              <div className="absolute z-10 w-full bg-white mt-2 border-2 border-rose-100 rounded-xl shadow-xl overflow-hidden">
                {clientes.map(c => (
                  <div key={c.id} className="p-4 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => seleccionarCliente(c)}>
                    <p className="font-bold text-gray-800 text-lg">{c.apellidos}, {c.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {c.telefono || ''}
                      {c.telefono2 ? ` | Tel 2: ${c.telefono2}${c.contacto2 ? ` (${c.contacto2})` : ''}` : ''}
                      {c.direccion ? ` - ${c.direccion}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!buscando && busquedaRealizada && clientes.length === 0 && busqueda.trim().length >= 2 && !clienteSeleccionado && (
              <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3 shadow-sm">
                <span className="text-xl leading-none">⚠️</span>
                <div>
                  <p className="font-bold text-amber-900">Cliente no encontrado</p>
                  <p className="mt-0.5 text-amber-800">No se encontró ningún cliente registrado con <strong>"{busqueda}"</strong>. Completa los datos a continuación para darlo de alta.</p>
                </div>
              </div>
            )}
          </div>

          {!clienteSeleccionado && (
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 space-y-4">
              <p className="text-rose-800 font-semibold text-center mb-2">Dar de alta un nuevo cliente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-rose-700 uppercase">Apellidos</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.apellidos} onChange={e => setNuevoCliente({...nuevoCliente, apellidos: e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase())})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Nombre</label><input type="text" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase())})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Teléfono Principal</label><input type="tel" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Teléfono 2 (Opcional)</label><input type="tel" className="w-full p-3 border border-rose-200 rounded-lg outline-none" value={nuevoCliente.telefono2} onChange={e => setNuevoCliente({...nuevoCliente, telefono2: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-rose-700 uppercase">Persona Contacto 2 (Opcional)</label><input type="text" placeholder="Ej. Madre, Juan..." className="w-full p-3 border border-rose-200 rounded-lg outline-none bg-white" value={nuevoCliente.contacto2} onChange={e => setNuevoCliente({...nuevoCliente, contacto2: e.target.value})} /></div>
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
              <p className="text-gray-300 text-sm">
                Tel: {clienteSeleccionado ? clienteSeleccionado.telefono : nuevoCliente.telefono}
                {(clienteSeleccionado?.telefono2 || nuevoCliente.telefono2) && ` | Tel 2: ${clienteSeleccionado ? clienteSeleccionado.telefono2 : nuevoCliente.telefono2}${(clienteSeleccionado?.contacto2 || nuevoCliente.contacto2) ? ` (${clienteSeleccionado ? clienteSeleccionado.contacto2 : nuevoCliente.contacto2})` : ''}`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-rose-300 bg-white">
                <span className="pl-4 pr-1 font-bold text-gray-700 select-none">Modelo:</span>
                <input type="text" placeholder="Escribe el modelo *" className="w-full p-3 outline-none font-bold text-gray-800" value={pedido.descripcion} onChange={e => setPedido({...pedido, descripcion: e.target.value})} required />
              </div>
            </div>
            <select
              className="p-3 border-2 border-gray-100 rounded-xl outline-none"
              value={pedido.categoria}
              onChange={e => {
                const cat = e.target.value as CategoriaPedido;
                const defaultTipo = cat === 'COMUNION' ? 'NINA' : 'SENORA';
                setPedido({ ...pedido, categoria: cat, fabricante: '', tipo_articulo: defaultTipo });
              }}
            >
              <option value="FLAMENCA">Traje de FLAMENCA</option>
              <option value="COMUNION">Traje de COMUNIÓN</option>
              <option value="OTRO">OTRO</option>
            </select>
            <input type="date" className="p-3 border-2 border-gray-100 rounded-xl outline-none" value={pedido.fecha_pedido} onChange={e => setPedido({...pedido, fecha_pedido: e.target.value})} />
          </div>
          <select
            className="w-full mb-4 p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-rose-300 bg-white"
            value={pedido.fabricante}
            onChange={e => handleFabricanteChange(e.target.value)}
            required
          >
            <option value="" disabled>Selecciona Fabricante*</option>
            {(FABRICANTES_POR_CATEGORIA[pedido.categoria] || FABRICANTES_POR_CATEGORIA.OTRO || []).map(f => (
              <option key={f.id} value={f.nombre}>{f.nombre}</option>
            ))}
          </select>

          {pedido.fabricante === 'Novadrima' && (
            <div className="mb-4 p-3 bg-amber-50 rounded-xl border-2 border-amber-200">
              <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                Estilo Comunión
              </label>
              <select
                className="w-full p-3 border-2 border-amber-300 rounded-xl outline-none font-bold text-gray-800 bg-white"
                value={pedido.estilo_comunion || 'Calle'}
                onChange={e => setPedido({...pedido, estilo_comunion: e.target.value as any})}
              >
                <option value="Calle">Calle</option>
                <option value="Marinero">Marinero</option>
                <option value="Almirante">Almirante</option>
              </select>
            </div>
          )}

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
          
          {renderCamposSegunConfig()}
          
          {pedido.categoria !== 'COMUNION' && (
            <div className="bg-rose-50/50 p-5 rounded-xl border-2 border-rose-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-rose-800 uppercase mb-2">Tejido del traje</label>
                <select
                  className="w-full p-3 border-2 border-rose-100 rounded-xl outline-none font-semibold bg-white focus:border-rose-300"
                  value={pedido.numTejidos}
                  onChange={e => setPedido({...pedido, numTejidos: Number(e.target.value)})}
                >
                  <option value={1}>1 Tejido</option>
                  <option value={2}>2 Tejidos</option>
                  <option value={3}>3 Tejidos</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 1</label>
                  <input
                    type="text"
                    placeholder="Tipo de tejido 1..."
                    className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white focus:border-rose-300"
                    value={pedido.tejido1}
                    onChange={e => setPedido({...pedido, tejido1: e.target.value})}
                  />
                </div>

                {pedido.numTejidos >= 2 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 2</label>
                    <input
                      type="text"
                      placeholder="Tipo de tejido 2..."
                      className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white focus:border-rose-300"
                      value={pedido.tejido2}
                      onChange={e => setPedido({...pedido, tejido2: e.target.value})}
                    />
                  </div>
                )}

                {pedido.numTejidos >= 3 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido 3</label>
                    <input
                      type="text"
                      placeholder="Tipo de tejido 3..."
                      className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white focus:border-rose-300"
                      value={pedido.tejido3}
                      onChange={e => setPedido({...pedido, tejido3: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-rose-100">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tejido del Can Can</label>
                  <input
                    type="text"
                    placeholder="Tipo de tejido can can..."
                    className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white focus:border-rose-300"
                    value={pedido.tejidoCancan}
                    onChange={e => setPedido({...pedido, tejidoCancan: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Color del Cordoncillo</label>
                  <input
                    type="text"
                    placeholder="Color del cordoncillo..."
                    className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white focus:border-rose-300"
                    value={pedido.colorCordoncillo}
                    onChange={e => setPedido({...pedido, colorCordoncillo: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          <textarea placeholder="Observaciones / Detalles..." className="w-full p-4 border-2 border-gray-100 rounded-xl h-24 outline-none" value={pedido.observaciones} onChange={e => setPedido({...pedido, observaciones: e.target.value})}></textarea>
          
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-sm border-b pb-2">Importes y Pago a Cuenta</h4>

            {pedidosActivosCliente.length > 0 && (
              <div className="p-4 bg-amber-50/90 border-2 border-amber-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-amber-900 uppercase">
                  Vincular cobro a pedido anterior de este cliente
                </label>
                <select
                  value={pedidoPrincipalId}
                  onChange={(e) => handleSelectPedidoPrincipal(e.target.value)}
                  className="w-full p-3 border-2 border-amber-200 rounded-xl outline-none font-semibold text-sm bg-white text-amber-950 focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Sin vincular (Pedido independiente con cobro propio) --</option>
                  {pedidosActivosCliente.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.descripcion || 'Pedido'} ({p.categoria}) - {p.fecha_pedido || ''} - Total: {Number(p.precio_total || 0).toFixed(2)}€
                    </option>
                  ))}
                </select>
                {pedidoPrincipalId && (
                  <p className="text-xs font-semibold text-amber-800">
                    ⓘ Al vincular este pedido a un pedido anterior, el precio se establece en 0 € y el saldo se gestiona en el pedido principal seleccionado.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Traje (€)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  disabled={!!pedidoPrincipalId}
                  className={`w-full p-3 border rounded-lg outline-none text-lg font-semibold ${pedidoPrincipalId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  value={pedidoPrincipalId ? '0' : pedido.precioTraje}
                  onChange={e => setPedido({...pedido, precioTraje: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrega a Cuenta (€)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  disabled={!!pedidoPrincipalId}
                  className={`w-full p-3 border rounded-lg outline-none text-lg font-semibold text-rose-600 ${pedidoPrincipalId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  value={pedidoPrincipalId ? '0' : pedido.entrega_cuenta}
                  onChange={e => setPedido({...pedido, entrega_cuenta: e.target.value})}
                />
              </div>
            </div>

            {/* Desglose de complementos seleccionados */}
            {!pedidoPrincipalId && config.complementos && config.complementos.length > 0 && (
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                <span className="block text-xs font-bold text-gray-500 uppercase">Complementos Seleccionados:</span>
                {config.complementos.map(c => {
                  let active = false;
                  let price = 0;
                  if (c.claveIncluir === 'incluir_corbata' && pedido.incluirCorbata) {
                    active = true;
                    price = parseFloat(pedido.precioCorbata) || 0;
                  } else if (c.claveIncluir === 'incluir_cancan' && pedido.incluirCancan) {
                    active = true;
                    price = parseFloat(pedido.precioCancan) || 0;
                  } else if (c.claveIncluir === 'incluir_adorno_pelo' && pedido.incluirAdornoPelo) {
                    active = true;
                    price = parseFloat(pedido.precioAdornoPelo) || 0;
                  } else if (c.claveIncluir === 'incluir_conjunto_interior' && pedido.incluirConjuntoInterior) {
                    active = true;
                    price = parseFloat(pedido.precioConjuntoInterior) || 0;
                  }

                  if (!active || price <= 0) return null;

                  return (
                    <div key={c.claveIncluir} className="flex justify-between items-center text-sm bg-rose-50/60 p-2 rounded-lg border border-rose-200">
                      <span className="font-bold text-rose-900">{c.etiqueta}</span>
                      <span className="font-black text-rose-950">+{price.toFixed(2)} €</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cargos Adicionales */}
            {!pedidoPrincipalId && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 uppercase">Cargos Adicionales (Mantoncillo, etc.)</span>
                  <button
                    type="button"
                    onClick={() => setPedido({...pedido, cargosExtra: [...pedido.cargosExtra, { concepto: '', precio: '' }]})}
                    className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    + Añadir concepto
                  </button>
                </div>

                {pedido.cargosExtra.map((cargo, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Concepto (Ej. Mantoncillo)..."
                      className="flex-1 p-2 border rounded-lg text-sm outline-none bg-white"
                      value={cargo.concepto}
                      onChange={e => {
                        const newC = [...pedido.cargosExtra];
                        newC[idx].concepto = e.target.value;
                        setPedido({...pedido, cargosExtra: newC});
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="€"
                      className="w-28 p-2 border rounded-lg text-sm outline-none font-semibold text-right bg-white"
                      value={cargo.precio}
                      onChange={e => {
                        const newC = [...pedido.cargosExtra];
                        newC[idx].precio = e.target.value;
                        setPedido({...pedido, cargosExtra: newC});
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newC = pedido.cargosExtra.filter((_, i) => i !== idx);
                        setPedido({...pedido, cargosExtra: newC});
                      }}
                      className="text-red-500 font-bold text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
                <span>PRECIO TOTAL DEL PEDIDO:</span>
                <span className="text-lg font-bold text-gray-900">{calcularPrecioTotal().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-600 uppercase text-sm">Restante por pagar:</span>
                <span className="text-2xl font-black text-rose-600">{(calcularPrecioTotal() - (parseFloat(pedido.entrega_cuenta) || 0)).toFixed(2)} €</span>
              </div>
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

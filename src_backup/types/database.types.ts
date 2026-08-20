export type CategoriaPedido = 'FLAMENCA' | 'COMUNION' | 'OTRO';
export type EstadoUbicacion = 'PEDIDO' | 'STOCK';
export type EstadoProceso = 'PENDIENTE_LLEGADA' | 'EN_PRUEBAS' | 'EN_ARREGLOS' | 'LISTO' | 'ENTREGADO';

export interface Cliente {
  id: string;
  apellidos: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  categoria: CategoriaPedido;
  estado_ubicacion: EstadoUbicacion;
  estado_proceso: EstadoProceso;
  fabricante: string | null;
  fecha_pedido: string | null;
  medidas: any | null; // jsonb
  detalles_tejido: string | null;
  precio_total: number;
  foto_ficha_url: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  pedido_id: string;
  monto_entrega_cuenta: number;
  fecha: string;
  metodo: string | null;
  created_at: string;
}

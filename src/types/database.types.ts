export type CategoriaPedido = 'FLAMENCA' | 'COMUNION' | 'OTRO';
export type EstadoUbicacion = 'PEDIDO' | 'STOCK';
export type EstadoProceso = 'PENDIENTE_LLEGADA' | 'EN_PRUEBAS' | 'EN_ARREGLOS' | 'LISTO' | 'ENTREGADO';

export interface Cliente {
  id: string;
  apellidos: string;
  nombre: string;
  telefono: string | null;
  telefono2?: string | null;
  contacto2?: string | null;
  direccion: string | null;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  descripcion: string;
  categoria: CategoriaPedido;
  tipo_articulo?: 'NINA' | 'SENORA' | null;
  estilo_comunion?: 'Calle' | 'Marinero' | 'Almirante' | null;

  estado_ubicacion: EstadoUbicacion;
  estado_proceso: EstadoProceso;
  fabricante: string | null;
  fecha_pedido: string | null;
  numero_talon?: string | null;
  medidas: any | null;
  detalles_tejido: string | null;
  precio_total: number;
  foto_ficha_url: string | null;
  qr_code: string | null;
  archivado?: boolean;
  pedido_principal_id?: string | null;
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

export type CategoriaCampana = 'FLAMENCA' | 'COMUNION' | 'OTRO';

export type TipoCapturaCampana = 
  | 'MEDIDAS_CORPORALES_FLAMENCA'
  | 'PIEZAS_VESTUARIO_NOVADRIMA'
  | 'MEDIDAS_CORPORALES_COMUNION_NINA'
  | 'ESTANDAR';

export type OrigenPieza = 'fabrica' | 'tienda';

export interface PiezaVestuarioConfig {
  clave: string;               // ej: 'chaqueta', 'pantalon', 'chalequillo', 'camisa'
  etiqueta: string;            // ej: 'Chaqueta', 'Pantalón', 'Chalequillo', 'Camisa'
  claveOrigen: string;         // ej: 'chaqueta_origen', 'pantalon_origen', etc.
}

export interface CampoMedidaConfig {
  clave: string;               // ej: 'pecho', 'cintura', 'cadera', 'manga', 'talle', 'largo_total', 'contorno_brazo', 'espalda'
  etiqueta: string;
  requerido?: boolean;
}

export interface ComplementoConfig {
  claveIncluir: string;        // ej: 'incluir_corbata', 'incluir_cancan', 'incluir_adorno_pelo', 'incluir_conjunto_interior'
  clavePrecio: string;         // ej: 'precio_corbata', 'precio_cancan', 'precio_adorno_pelo', 'precio_conjunto_interior'
  etiqueta: string;
}

export interface ConfiguracionCampana {
  id: string;
  nombre: string;
  categoria: CategoriaCampana;
  tipoCaptura: TipoCapturaCampana;
  genero: 'SENORA' | 'NINA' | 'NINO' | 'AMBOS';
  
  // Tallas
  tallasDisponibles?: string[];
  
  // Medidas corporales
  camposMedidas?: CampoMedidaConfig[];
  
  // Configuración de tejidos
  soportaTejidos?: boolean;
  maxTejidos?: number;
  soportaTejidoCancan?: boolean;
  soportaCordoncillo?: boolean;
  
  // Novadrima (Piezas)
  piezasVestuario?: PiezaVestuarioConfig[];
  soportaCamisaTEsp?: boolean;
  claveCamisaTEsp?: string;
  
  // Comunión Niña (Anavig / Ana Rosillo / Lola Rosillo)
  soportaTallaEspecialDetalle?: boolean;
  claveTallaEspecialDetalle?: string;
  
  // Complementos
  complementos?: ComplementoConfig[];
}

// Constantes de tallas para Comunión Niña (Anavig / Ana Rosillo / Lola Rosillo)
export const TALLAS_COMUNION_NINA_ROS_ANA = [
  '100', '105', '110', '115', '120', '125', '130', '135', 'TEsp'
];

// Configuración FLAMENCA
export const CONFIGURACION_FLAMENCA: ConfiguracionCampana = {
  id: 'flamenca',
  nombre: 'Flamenca (Señora / Niña)',
  categoria: 'FLAMENCA',
  tipoCaptura: 'MEDIDAS_CORPORALES_FLAMENCA',
  genero: 'AMBOS',
  camposMedidas: [
    { clave: 'pecho', etiqueta: 'Pecho' },
    { clave: 'cintura', etiqueta: 'Cintura' },
    { clave: 'cadera', etiqueta: 'Cadera' },
    { clave: 'manga', etiqueta: 'Manga' },
    { clave: 'talle', etiqueta: 'Talle' },
    { clave: 'largo_total', etiqueta: 'Largo Total' },
    { clave: 'contorno_brazo', etiqueta: 'Contorno Brazo' },
    { clave: 'espalda', etiqueta: 'Espalda' },
  ],
  soportaTejidos: true,
  maxTejidos: 3,
  soportaTejidoCancan: true,
  soportaCordoncillo: true,
  soportaTallaEspecialDetalle: true,
  claveTallaEspecialDetalle: 'talla_especial_detalle',
};

// Configuración NOVADRIMA (Comunión Niño)
export const CONFIGURACION_NOVADRIMA: ConfiguracionCampana = {
  id: 'novadrima',
  nombre: 'Novadrima (Comunión Niño)',
  categoria: 'COMUNION',
  tipoCaptura: 'PIEZAS_VESTUARIO_NOVADRIMA',
  genero: 'NINO',
  piezasVestuario: [
    { clave: 'chaqueta', etiqueta: 'Chaqueta', claveOrigen: 'chaqueta_origen' },
    { clave: 'pantalon', etiqueta: 'Pantalón', claveOrigen: 'pantalon_origen' },
    { clave: 'chalequillo', etiqueta: 'Chalequillo', claveOrigen: 'chalequillo_origen' },
    { clave: 'camisa', etiqueta: 'Camisa', claveOrigen: 'camisa_origen' },
  ],
  soportaCamisaTEsp: true,
  claveCamisaTEsp: 'camisa_tesp',
  complementos: [
    { claveIncluir: 'incluir_corbata', clavePrecio: 'precio_corbata', etiqueta: 'Corbata' },
    { claveIncluir: 'incluir_conjunto_interior', clavePrecio: 'precio_conjunto_interior', etiqueta: 'Conjunto Interior' },
  ],
};

// Configuración ANAVIG / ANA ROSILLO / LOLA ROSILLO (Comunión Niña)
export const CONFIGURACION_COMUNION_NINA_ROS_ANA: ConfiguracionCampana = {
  id: 'comunion_nina_rosillo_anavig',
  nombre: 'Anavig / Ana Rosillo / Lola Rosillo (Comunión Niña)',
  categoria: 'COMUNION',
  tipoCaptura: 'MEDIDAS_CORPORALES_COMUNION_NINA',
  genero: 'NINA',
  tallasDisponibles: TALLAS_COMUNION_NINA_ROS_ANA,
  camposMedidas: [
    { clave: 'espalda', etiqueta: 'Espalda' },
    { clave: 'pecho', etiqueta: 'Pecho' },
    { clave: 'cintura', etiqueta: 'Cintura' },
    { clave: 'talle', etiqueta: 'Talle' },
    { clave: 'largo_total', etiqueta: 'Largo Total' },
    { clave: 'contorno_brazo', etiqueta: 'Contorno Brazo' },
  ],
  soportaTallaEspecialDetalle: true,
  claveTallaEspecialDetalle: 'talla_especial_detalle',
  complementos: [
    { claveIncluir: 'incluir_cancan', clavePrecio: 'precio_cancan', etiqueta: 'Cancán' },
    { claveIncluir: 'incluir_adorno_pelo', clavePrecio: 'precio_adorno_pelo', etiqueta: 'Adorno Pelo' },
    { claveIncluir: 'incluir_conjunto_interior', clavePrecio: 'precio_conjunto_interior', etiqueta: 'Conjunto Interior' },
  ],
};

// Configuración Estándar / Fallback
export const CONFIGURACION_ESTANDAR: ConfiguracionCampana = {
  id: 'estandar',
  nombre: 'Estándar',
  categoria: 'OTRO',
  tipoCaptura: 'ESTANDAR',
  genero: 'AMBOS',
  camposMedidas: [
    { clave: 'pecho', etiqueta: 'Pecho' },
    { clave: 'cintura', etiqueta: 'Cintura' },
    { clave: 'cadera', etiqueta: 'Cadera' },
    { clave: 'manga', etiqueta: 'Manga' },
    { clave: 'talle', etiqueta: 'Talle' },
    { clave: 'largo_total', etiqueta: 'Largo Total' },
    { clave: 'contorno_brazo', etiqueta: 'Contorno Brazo' },
  ],
};

/**
 * Helper para verificar si un fabricante y categoría corresponden a Comunión Niña (Anavig / Ana Rosillo / Lola Rosillo)
 */
export const isComunionNinaRosilloAnavig = (categoria?: string | null, fabricante?: string | null): boolean => {
  const cat = (categoria || '').toUpperCase();
  if (cat !== 'COMUNION') return false;
  const fab = (fabricante || '').toLowerCase();
  return fab.includes('anavig') || fab.includes('ana rosillo') || fab.includes('lola rosillo') || fab.includes('rosillo');
};

/**
 * Obtiene la configuración correspondiente según la categoría y fabricante del pedido.
 */
export const obtenerConfiguracionCampana = (categoria: string, fabricante?: string | null): ConfiguracionCampana => {
  const cat = (categoria || '').toUpperCase();
  const fab = (fabricante || '').trim().toLowerCase();

  if (cat === 'COMUNION') {
    if (fab.includes('novadrima')) {
      return CONFIGURACION_NOVADRIMA;
    }
    if (isComunionNinaRosilloAnavig(cat, fab)) {
      return CONFIGURACION_COMUNION_NINA_ROS_ANA;
    }
    return {
      ...CONFIGURACION_ESTANDAR,
      categoria: 'COMUNION',
    };
  }

  if (cat === 'FLAMENCA') {
    return CONFIGURACION_FLAMENCA;
  }

  return CONFIGURACION_ESTANDAR;
};

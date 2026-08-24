export interface Fabricante {
  id: string;
  nombre: string;
  genero: 'Nina' | 'Nino' | 'ambos' | string;
}

export const FABRICANTES_POR_CATEGORIA: Record<string, Fabricante[]> = {
  FLAMENCA: [
    { id: 'ana_barroso', nombre: 'Ana Barroso', genero: 'ambos' },
    { id: 'aires_ferias', nombre: 'Aires de Ferias', genero: 'ambos' },
    { id: 'carmen_moda', nombre: 'Carmen Moda', genero: 'ambos' },
  ],
  COMUNION: [
    { id: 'anavig', nombre: 'Anavig', genero: 'Nina' },
    { id: 'ana_rosillo', nombre: 'Ana Rosillo', genero: 'Nina' },
    { id: 'novadrima', nombre: 'Novadrima', genero: 'Nino' },
    { id: 'pendiente', nombre: 'Proveedor Pendiente', genero: 'ambos' },
  ],
  OTRO: [
    { id: 'varios', nombre: 'Varios / Otros', genero: 'ambos' },
  ],
};

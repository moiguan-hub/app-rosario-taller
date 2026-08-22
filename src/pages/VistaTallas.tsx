import { useState } from 'react';
import { ArrowLeft, Ruler, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TALLAS_DATA: Record<string, Record<string, Array<{t: string; p: number; c: number; ca: number; l?: number}>>> = {
  'Ana Barroso': {
    SENORA: [
      { t: '36', p: 80, c: 61, ca: 85 },
      { t: '38', p: 84, c: 65, ca: 89 },
      { t: '40', p: 87, c: 69, ca: 92 },
      { t: '42', p: 91, c: 73, ca: 97 },
      { t: '44', p: 94, c: 76, ca: 100 },
      { t: '46', p: 98, c: 80, ca: 105 },
      { t: '48', p: 103, c: 85, ca: 109 },
      { t: '50', p: 108, c: 90, ca: 115 },
      { t: '52', p: 114, c: 96, ca: 120 }
    ],
    NINA: [
      { t: '1', p: 52, c: 46, ca: 54, l: 71 },
      { t: '2', p: 55, c: 49, ca: 57, l: 79 },
      { t: '3', p: 58, c: 52, ca: 60, l: 87 },
      { t: '4', p: 61, c: 55, ca: 63, l: 94 },
      { t: '5', p: 64, c: 58, ca: 66, l: 101 },
      { t: '6', p: 67, c: 61, ca: 69, l: 110 },
      { t: '7', p: 70, c: 64, ca: 72, l: 119 },
      { t: '9', p: 76, c: 67, ca: 76, l: 132 }
    ]
  },
  'Aires de Feria': {
    SENORA: [
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
    ],
    NINA: [
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
    ]
  }
};

export function VistaTallas() {
  const [cat, setCat] = useState<'FLAMENCA' | 'COMUNION' | null>(null);
  const [fab, setFab] = useState<'Ana Barroso' | 'Aires de Feria' | null>(null);
  const [tipo, setTipo] = useState<'SENORA' | 'NINA' | null>(null);

  const back = () => tipo ? setTipo(null) : fab ? setFab(null) : setCat(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          {cat ? (
            <button onClick={back} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={24} className="text-gray-600" /></button>
          ) : (
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={24} className="text-gray-600" /></Link>
          )}
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Ruler className="text-rose-600" size={28} />Guía de Tallas</h2>
        </div>
        {(cat || fab || tipo) && <button onClick={() => { setCat(null); setFab(null); setTipo(null); }} className="text-sm font-semibold text-rose-600 hover:underline">Reiniciar</button>}
      </div>

      {!cat && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setCat('FLAMENCA')} className="p-8 bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl shadow-lg hover:shadow-xl text-left flex flex-col justify-between h-48 transition-transform hover:-translate-y-1">
            <Sparkles className="self-end opacity-80" size={32} />
            <div><span className="block text-2xl font-black">FLAMENCA</span><span className="text-rose-100 text-sm mt-1 block">Tablas por fabricante</span></div>
          </button>
          <button disabled className="p-8 bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400 rounded-2xl cursor-not-allowed text-left flex flex-col justify-between h-48">
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full self-end">Próximamente</span>
            <div><span className="block text-2xl font-black">COMUNIÓN</span><span className="text-gray-400 text-sm mt-1 block">Próximamente</span></div>
          </button>
        </div>
      )}

      {cat === 'FLAMENCA' && !fab && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700">Selecciona Fabricante:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setFab('Ana Barroso')} className="p-8 bg-white border-2 border-rose-100 hover:border-rose-500 rounded-2xl shadow-md text-left flex flex-col justify-between h-40 transition-transform hover:-translate-y-1">
              <span className="text-xs font-bold text-rose-500 uppercase">Fabricante</span>
              <span className="text-2xl font-black text-gray-800">Ana Barroso</span>
            </button>
            <button onClick={() => setFab('Aires de Feria')} className="p-8 bg-white border-2 border-rose-100 hover:border-rose-500 rounded-2xl shadow-md text-left flex flex-col justify-between h-40 transition-transform hover:-translate-y-1">
              <span className="text-xs font-bold text-rose-500 uppercase">Fabricante</span>
              <span className="text-2xl font-black text-gray-800">Aires de Feria</span>
            </button>
          </div>
        </div>
      )}

      {cat === 'FLAMENCA' && fab && !tipo && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 font-semibold">Fabricante: <span className="text-rose-600 font-bold">{fab}</span></p>
          <h3 className="text-lg font-bold text-gray-700">Selecciona Tipo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setTipo('SENORA')} className="p-8 bg-white border-2 border-rose-100 hover:border-rose-500 rounded-2xl shadow-md text-center transition-transform hover:-translate-y-1"><span className="text-2xl font-black text-gray-800">SEÑORA</span></button>
            <button onClick={() => setTipo('NINA')} className="p-8 bg-white border-2 border-rose-100 hover:border-rose-500 rounded-2xl shadow-md text-center transition-transform hover:-translate-y-1"><span className="text-2xl font-black text-gray-800">NIÑA</span></button>
          </div>
        </div>
      )}

      {cat === 'FLAMENCA' && fab && tipo && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          <div className="border-b pb-4 flex justify-between items-center">
            <div><span className="text-xs font-bold text-rose-600 uppercase">Tabla de Medidas</span><h3 className="text-2xl font-black text-gray-800">{fab} — {tipo === 'SENORA' ? 'Señora' : 'Niña'}</h3></div>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">Medidas en cm</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-sm font-bold border-b border-gray-200">
                  <th className="py-3 px-4">Talla</th>
                  <th className="py-3 px-4">Pecho (cm)</th>
                  <th className="py-3 px-4">Cintura (cm)</th>
                  <th className="py-3 px-4">Cadera (cm)</th>
                  {'l' in (TALLAS_DATA[fab][tipo][0] || {}) && <th className="py-3 px-4">Largo (cm)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {TALLAS_DATA[fab][tipo].map((row) => (
                  <tr key={row.t} className="hover:bg-rose-50 transition-colors">
                    <td className="py-3 px-4 font-black text-rose-600 text-lg">{row.t}</td>
                    <td className="py-3 px-4 font-semibold">{row.p}</td>
                    <td className="py-3 px-4 font-semibold">{row.c}</td>
                    <td className="py-3 px-4 font-semibold">{row.ca}</td>
                    {row.l !== undefined && <td className="py-3 px-4 font-semibold">{row.l}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

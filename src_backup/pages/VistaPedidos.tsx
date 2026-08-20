import { useState } from 'react';

export function VistaPedidos() {
  const [tab, setTab] = useState<'PEDIDO' | 'STOCK'>('PEDIDO');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Estado de los Pedidos</h2>
      
      {/* Pestañas */}
      <div className="flex space-x-2 border-b">
        <button 
          onClick={() => setTab('PEDIDO')}
          className={`py-3 px-6 font-medium text-sm transition-colors ${tab === 'PEDIDO' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          EN PEDIDO (Fábrica)
        </button>
        <button 
          onClick={() => setTab('STOCK')}
          className={`py-3 px-6 font-medium text-sm transition-colors ${tab === 'STOCK' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          EN STOCK (Tienda)
        </button>
      </div>

      {/* Contenido de prueba */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
        Aquí se cargará la lista de trajes que actualmente están en 
        <span className="font-bold text-gray-700 ml-1">
          {tab === 'PEDIDO' ? 'espera de llegada del fabricante' : 'la tienda para pruebas/entregas'}
        </span>.
      </div>
    </div>
  );
}

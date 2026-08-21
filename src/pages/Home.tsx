import { QrCode, PlusCircle, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        <Link to="/nuevo-pedido" className="flex flex-col items-center justify-center p-8 bg-rose-600 text-white rounded-2xl shadow-lg hover:bg-rose-700 transition-colors transform hover:-translate-y-1">
          <PlusCircle size={48} className="mb-4" />
          <span className="font-bold text-xl mb-1">ALTA</span>
          <span className="text-rose-200 text-sm">Nuevo Pedido</span>
        </Link>
        
        <Link to="/pedidos" onClick={() => { localStorage.removeItem('paso'); localStorage.removeItem('clienteId'); localStorage.removeItem('pedidoId'); }} className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl shadow-lg hover:bg-gray-50 hover:border-rose-100 transition-colors transform hover:-translate-y-1">
          <Search size={48} className="mb-4 text-rose-500" />
          <span className="font-bold text-xl mb-1">BUSCAR</span>
          <span className="text-gray-400 text-sm">Consultar base de datos</span>
        </Link>

        <Link to="/clientes" className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl shadow-lg hover:bg-gray-50 hover:border-rose-100 transition-colors transform hover:-translate-y-1">
          <Users size={48} className="mb-4 text-blue-500" />
          <span className="font-bold text-xl mb-1">CLIENTES</span>
          <span className="text-gray-400 text-sm">Gestionar fichas</span>
        </Link>
        
        <button className="flex flex-col items-center justify-center p-8 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-gray-800 transition-colors transform hover:-translate-y-1">
          <QrCode size={48} className="mb-4" />
          <span className="font-bold text-xl mb-1">CÓDIGO QR</span>
          <span className="text-gray-400 text-sm">Escanear ficha</span>
        </button>
      </section>
    </div>
  );
}

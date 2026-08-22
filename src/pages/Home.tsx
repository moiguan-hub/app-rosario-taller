import { QrCode, PlusCircle, Search, Users, Ruler, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {/* 1. ALTA */}
        <Link to="/nuevo-pedido" onClick={() => { localStorage.removeItem('paso'); localStorage.removeItem('clienteId'); }} className="flex items-center p-3.5 bg-rose-600 text-white rounded-2xl shadow-md hover:bg-rose-700 transition-colors gap-3.5">
          <div className="p-2 bg-rose-500/50 rounded-xl shrink-0">
            <PlusCircle size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">ALTA</span>
            <span className="text-rose-200 text-xs truncate">Nuevo Pedido</span>
          </div>
        </Link>
        
        {/* 2. BUSCAR */}
        <Link to="/pedidos" onClick={() => { localStorage.removeItem('paso'); localStorage.removeItem('clienteId'); localStorage.removeItem('pedidoId'); }} className="flex items-center p-3.5 bg-white border-2 border-gray-100 text-gray-800 rounded-2xl shadow-md hover:bg-gray-50 hover:border-rose-200 transition-colors gap-3.5">
          <div className="p-2 bg-rose-50 rounded-xl shrink-0 text-rose-500">
            <Search size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">BUSCAR</span>
            <span className="text-gray-400 text-xs truncate">Gestión individual</span>
          </div>
        </Link>

        {/* 3. CONSULTAS */}
        <Link to="/consultas" className="flex items-center p-3.5 bg-white border-2 border-gray-100 text-gray-800 rounded-2xl shadow-md hover:bg-gray-50 hover:border-rose-200 transition-colors gap-3.5">
          <div className="p-2 bg-purple-50 rounded-xl shrink-0 text-purple-600">
            <FileSpreadsheet size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">CONSULTAS</span>
            <span className="text-gray-400 text-xs truncate">Listado e informes</span>
          </div>
        </Link>

        {/* 4. CLIENTES */}
        <Link to="/clientes" className="flex items-center p-3.5 bg-white border-2 border-gray-100 text-gray-800 rounded-2xl shadow-md hover:bg-gray-50 hover:border-rose-200 transition-colors gap-3.5">
          <div className="p-2 bg-blue-50 rounded-xl shrink-0 text-blue-500">
            <Users size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">CLIENTES</span>
            <span className="text-gray-400 text-xs truncate">Gestionar fichas</span>
          </div>
        </Link>

        {/* 5. TALLAS */}
        <Link to="/tallas" className="flex items-center p-3.5 bg-white border-2 border-gray-100 text-gray-800 rounded-2xl shadow-md hover:bg-gray-50 hover:border-rose-200 transition-colors gap-3.5">
          <div className="p-2 bg-amber-50 rounded-xl shrink-0 text-amber-500">
            <Ruler size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">TALLAS</span>
            <span className="text-gray-400 text-xs truncate">Guía de medidas</span>
          </div>
        </Link>
        
        {/* 6. CÓDIGO QR */}
        <button className="flex items-center p-3.5 bg-gray-900 text-white rounded-2xl shadow-md hover:bg-gray-800 transition-colors gap-3.5 text-left w-full">
          <div className="p-2 bg-gray-800 rounded-xl shrink-0 text-white">
            <QrCode size={28} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight">CÓDIGO QR</span>
            <span className="text-gray-400 text-xs truncate">Escanear ficha</span>
          </div>
        </button>
      </section>
    </div>
  );
}


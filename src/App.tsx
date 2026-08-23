import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { NuevoPedido } from './pages/NuevoPedido';
import { VistaPedidos } from './pages/VistaPedidos';
import { VistaClientes } from './pages/VistaClientes';
import { VistaTallas } from './pages/VistaTallas';
import { VistaConsultas } from './pages/VistaConsultas';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
            <h1 className="text-2xl font-black text-rose-600">APP Rosario</h1>
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <a href="/" className="text-sm md:text-base font-bold text-gray-600 hover:text-rose-600">Inicio</a>
              <a href="/pedidos" onClick={() => { localStorage.removeItem('paso'); localStorage.removeItem('clienteId'); localStorage.removeItem('pedidoId'); }} className="text-sm md:text-base font-bold text-gray-600 hover:text-rose-600">Pedidos</a>
              <a href="/clientes" className="text-sm md:text-base font-bold text-gray-600 hover:text-rose-600">Clientes</a>
              <a href="/tallas" className="text-sm md:text-base font-bold text-gray-600 hover:text-rose-600">Tallas</a>
              <a href="/consultas" className="text-sm md:text-base font-bold text-gray-600 hover:text-rose-600">Consultas</a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/consultas" element={<VistaConsultas />} />
            <Route path="/nuevo-pedido" element={<NuevoPedido />} />
            <Route path="/pedidos" element={<VistaPedidos />} />
            <Route path="/clientes" element={<VistaClientes />} />
            <Route path="/tallas" element={<VistaTallas />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

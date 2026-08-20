import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { NuevoPedido } from './pages/NuevoPedido';
import { VistaPedidos } from './pages/VistaPedidos';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-rose-600">APP Rosario</h1>
            <nav className="space-x-4">
              <a href="/" className="text-sm font-medium text-gray-600 hover:text-rose-600">Inicio</a>
              <a href="/pedidos" className="text-sm font-medium text-gray-600 hover:text-rose-600">Consultas y Pedidos</a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nuevo-pedido" element={<NuevoPedido />} />
            <Route path="/pedidos" element={<VistaPedidos />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

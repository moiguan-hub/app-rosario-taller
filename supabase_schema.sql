-- ENUMS
CREATE TYPE categoria_pedido AS ENUM ('FLAMENCA', 'COMUNION', 'OTRO');
CREATE TYPE estado_ubicacion_pedido AS ENUM ('PEDIDO', 'STOCK');
CREATE TYPE estado_proceso_pedido AS ENUM ('PENDIENTE_LLEGADA', 'EN_PRUEBAS', 'EN_ARREGLOS', 'LISTO', 'ENTREGADO');

-- TABLA: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apellidos TEXT NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    categoria categoria_pedido NOT NULL DEFAULT 'FLAMENCA',
    tipo_articulo TEXT,
    estado_ubicacion estado_ubicacion_pedido NOT NULL DEFAULT 'PEDIDO',
    estado_proceso estado_proceso_pedido NOT NULL DEFAULT 'PENDIENTE_LLEGADA',
    fabricante TEXT,
    fecha_pedido DATE,
    medidas JSONB,
    detalles_tejido TEXT,
    precio_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    foto_ficha_url TEXT,
    qr_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: pagos
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    monto_entrega_cuenta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) - Políticas por defecto (opcional para proteger tus datos si expones la API)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Por defecto permitiremos que usuarios autenticados realicen acciones, o dejas abierto si es de uso interno sin auth por ahora.
-- Reemplazar 'true' con reglas de 'auth.uid() = ...' si agregas sistema de autenticación de Supabase (Login)
CREATE POLICY "Permitir todo a anonimos/autenticados - Clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos/autenticados - Pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos/autenticados - Pagos" ON pagos FOR ALL USING (true);

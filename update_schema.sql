ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_pedidos_archivado ON pedidos (categoria, archivado);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pedido_principal_id UUID REFERENCES pedidos(id) ON DELETE SET NULL;
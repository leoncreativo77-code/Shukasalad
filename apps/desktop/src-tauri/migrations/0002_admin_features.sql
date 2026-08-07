-- Soporte para el módulo de administración: imagen por producto y
-- posicionamiento libre (snap a cuadrícula) por categoría en la pantalla de
-- venta. NULL en grid_col/grid_row significa "sin posición asignada": el
-- producto sigue apareciendo en el flujo automático de siempre (ver
-- ProductGrid.tsx).
ALTER TABLE products ADD COLUMN image_path TEXT;
ALTER TABLE products ADD COLUMN grid_col INTEGER;
ALTER TABLE products ADD COLUMN grid_row INTEGER;

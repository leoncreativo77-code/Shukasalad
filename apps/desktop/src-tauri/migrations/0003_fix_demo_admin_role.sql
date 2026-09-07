-- El usuario demo (PIN 1234) debía sembrarse con rol 'admin' para poder
-- entrar a la pestaña Admin, pero la migración 0001 lo dejó como 'cashier'
-- por error. Esta migración corrige el dato en bases ya creadas; 0001 ya
-- quedó corregida para instalaciones nuevas.
UPDATE users SET role = 'admin' WHERE id = '1685762f-b276-4057-939e-8d7a066d6860';

// Hash del PIN de cajero via Web Crypto (disponible en el webview de Tauri).
// No es para proteger datos sensibles de alto riesgo -- es solo para no
// guardar el PIN en texto plano en SQLite. Suficiente para esta etapa;
// si se requiere mayor seguridad más adelante, se puede migrar a un hash
// con sal (ej. PBKDF2/argon2 vía un comando Rust) sin tocar el resto del
// código, ya que solo se usa a través de findUserByPin.
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

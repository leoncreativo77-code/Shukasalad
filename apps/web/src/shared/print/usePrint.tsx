import { useEffect, useState } from "react";

// Área invisible en pantalla (ver .print-area en index.css) que solo se
// muestra dentro del diálogo de impresión -- así el ticket/comanda sale con
// el formato angosto de recibo en vez de la interfaz completa de la app.
function PrintArea({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="print-area hidden print:block">
      <pre className="font-mono text-xs leading-snug whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}

// Imprimir desde Safari/iOS siempre abre el diálogo nativo del sistema (no
// existe impresión silenciosa desde una página web) -- lo más rápido que se
// puede lograr es un botón -> diálogo -> confirmar, con una impresora
// AirPrint ya emparejada en la red del restaurante.
export function usePrint() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;
    window.print();
    setText(null);
  }, [text]);

  return { print: setText, printArea: <PrintArea text={text} /> };
}

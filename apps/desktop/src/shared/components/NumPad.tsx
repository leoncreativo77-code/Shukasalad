import { TouchButton } from "./TouchButton";

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

// Teclado numérico grande para PIN de cajero y captura de efectivo. Sin
// campo de texto con teclado físico de por medio -- todo son botones
// grandes para operar con el dedo bajo presión.
export function NumPad({ value, onChange, maxLength = 6 }: NumPadProps) {
  function press(key: string) {
    if (key === "clear") {
      onChange("");
    } else if (key === "back") {
      onChange(value.slice(0, -1));
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((key) => (
        <TouchButton
          key={key}
          type="button"
          variant={key === "clear" || key === "back" ? "secondary" : "primary"}
          className="text-2xl"
          onClick={() => press(key)}
        >
          {key === "clear" ? "Borrar" : key === "back" ? "⌫" : key}
        </TouchButton>
      ))}
    </div>
  );
}

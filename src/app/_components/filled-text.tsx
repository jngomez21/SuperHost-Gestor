// Texto de un mensaje ya relleno, con los datos que faltan a la vista: "[falta: clave del wifi]".
export function FilledText({ text }: { text: string }) {
  return text
    .split(/(\[falta: [^\]]+\])/)
    .map((part, i) => (i % 2 ? <mark key={i} className="preview-missing">{part}</mark> : part));
}

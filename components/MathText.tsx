"use client";

import katex from "katex";

/**
 * Renderar en textsträng där matte står inom $...$ som typsatt KaTeX.
 * Vanlig text lämnas orörd. **fetstil** stöds också.
 * Används för frågetext och svarsalternativ (kvant har LaTeX, verbala inte).
 */
export default function MathText({ children }: { children: string }) {
  const text = children ?? "";
  // Dela på $...$ (matte) och **...** (fet) utan att tappa avgränsarna
  const parts = text.split(/(\$[^$]*\$|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
          const latex = part.slice(1, -1);
          const html = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
          });
          return (
            <span
              key={i}
              // KaTeX-genererad HTML — säker, kommer från våra egna frågedata
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

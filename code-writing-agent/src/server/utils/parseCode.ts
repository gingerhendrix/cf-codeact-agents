export function parseCode(text: string): string | null {
  const lines = text.split("\n");
  const codeStart = lines.findIndex((line) => line.trim().includes("```js"));
  const codeEnd = lines.findIndex(
    (line, index) => index > codeStart && line.trim().includes("```"),
  );
  if (codeStart === -1 || codeEnd === -1 || codeEnd <= codeStart) {
    return null;
  }
  const code = lines.slice(codeStart + 1, codeEnd).join("\n");
  return code;
}

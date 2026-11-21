// Reads a server setting. Values pasted through Windows PowerShell or a dashboard can carry an
// invisible byte-order mark, zero-width characters, quotes or a trailing newline; Google then
// rejects "﻿gemini-3.5-flash" as a bad model name, and an admin email would never match.
export function env(name: string): string {
  return (process.env[name] ?? "")
    .replace(/[﻿​-‍⁠]/g, "")
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .trim();
}

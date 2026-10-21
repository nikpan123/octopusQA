export class DebuggerFrame {
  constructor() { this.clear(); }
  clear() { this.runId = null; this.image = null; }
  update(runId, encoded) {
    if (typeof encoded !== "string" || encoded.length > 900_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))
      throw new Error("Niepoprawny obraz debuggera.");
    const image = Buffer.from(encoded, "base64");
    if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9)
      throw new Error("Debugger przyjmuje wyłącznie obraz JPEG.");
    this.runId = runId;
    this.image = image;
  }
  get(runId) { return this.runId === runId ? this.image : null; }
}

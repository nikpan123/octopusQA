import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// Stały zestaw edukacyjny na podstawie docs/cart-api-scenarios.json w Hurtowni.
// Nie ładujemy konfiguracji, sesji ani danych dostępowych żadnego projektu.
const scenarios = [
  { id: 'AUTH-001', title: 'Poprawne logowanie hurtownika', priority: 'P0' },
  { id: 'AUTH-002', title: 'Niepoprawne hasło API', priority: 'P1' },
  { id: 'AUTH-003', title: 'Żądanie chronione bez ważnego JWT', priority: 'P1' },
  { id: 'CART-001', title: 'Utworzenie i odczyt pustego koszyka', priority: 'P0' },
  { id: 'CART-002', title: 'Dodanie pojedynczego produktu', priority: 'P0' },
];
const assets = {
  '/': ['app/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app/app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['app/style.css', 'text/css; charset=utf-8'],
};
const server = createServer(async (req, res) => {
  // Ten serwer obsługuje wyłącznie lokalny odczyt; nie wykonuje żądań do DEV.
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const pathname = new URL(req.url, 'http://127.0.0.1:18879').pathname;
  if (pathname === '/api/scenarios') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(scenarios));
    return;
  }
  const asset = assets[pathname];
  if (!asset) { res.writeHead(404); res.end(); return; }
  try {
    const data = await readFile(new URL(asset[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(500); res.end('Nie udało się wczytać pliku szkolenia.'); }
});
server.listen(18879, '127.0.0.1', () => console.log('Szkolenie: http://127.0.0.1:18879'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });

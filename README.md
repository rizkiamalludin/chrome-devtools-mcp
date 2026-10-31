# Chrome DevTools MCP

Konfigurasi untuk menjalankan [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) melalui klien yang mendukung MCP, seperti Claude Code.

## Isi repository

- `.mcp.json` — konfigurasi server MCP menggunakan `npx`.
  
## Prasyarat

- Node.js dan npm terpasang.
- Google Chrome terpasang.
- Klien MCP yang mendukung konfigurasi `.mcp.json`.

## Konfigurasi

File `.mcp.json` menjalankan paket resmi `chrome-devtools-mcp` melalui:

```bash
npx -y chrome-devtools-mcp@latest
```

Saat pertama dijalankan, npm dapat mengunduh paket yang diperlukan. Ikuti instruksi klien MCP yang kamu gunakan untuk mengaktifkan server.

## Catatan

Repository ini hanya menyediakan konfigurasi. Ia tidak otomatis menghubungkan ChatGPT dengan Claude, dan tidak menjalankan browser secara mandiri.

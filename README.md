# Chrome DevTools MCP

Repository ini menyimpan konfigurasi MCP lokal dan panduan untuk memakai browser cloud dari Claude Web.

## Pilihan penggunaan

### 1. Claude Web — browser online

Ikuti [panduan Claude Web](./CLAUDE-WEB.md). Panduan tersebut memakai **Browserbase Remote MCP** agar Claude Web dapat mengakses browser yang berjalan di cloud melalui Custom Connector.

Alurnya: Claude Web → Custom Connector → Browserbase Remote MCP → browser cloud.

**Catatan:** ini bukan menjalankan paket Chrome DevTools MCP lokal di server. Browser berjalan di cloud dan memiliki sesi terpisah dari Chrome di laptopmu.

### 2. Klien MCP lokal — Chrome DevTools MCP

File `.mcp.json` menjalankan paket resmi [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) melalui:

```bash
npx -y chrome-devtools-mcp@latest
```

Prasyarat:
- Node.js dan npm.
- Google Chrome.
- Klien MCP yang mendukung konfigurasi lokal, misalnya Claude Code.

File ini bukan konfigurasi untuk Claude Web. Mengunggahnya ke GitHub tidak otomatis memasang konektor di akun Claude.

## Keamanan

Jangan pernah menyimpan API key, token, atau kredensial pribadi di repository publik. Ikuti panduan keamanan pada [CLAUDE-WEB.md](./CLAUDE-WEB.md).

## Dokumentasi

- [Panduan menghubungkan Claude Web ke browser cloud](./CLAUDE-WEB.md)
- [Chrome DevTools MCP resmi](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Browserbase MCP](https://www.browserbase.com/mcp)

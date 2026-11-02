# Menghubungkan Claude Web ke browser online

Panduan ini memakai **Browserbase MCP Server** sebagai browser cloud yang sudah menyediakan endpoint Remote MCP. Ini adalah jalur paling sederhana untuk Claude Web; bukan menjalankan paket lokal `chrome-devtools-mcp` di server.

## Gambaran

Claude Web → Custom Connector → Browserbase Remote MCP → browser Chrome di cloud.

Browser berjalan di infrastruktur Browserbase, bukan di laptop pengguna.

## Prasyarat

- Akun Claude yang mendukung Custom Connector.
- Akun Browserbase dan API key Browserbase.
- Periksa ketentuan usia, privasi, dan batas penggunaan layanan sebelum membuat akun atau mengaktifkannya.

Browserbase menyediakan paket gratis dengan kuota terbatas. Kuota dan harga dapat berubah; periksa halaman harga resminya sebelum digunakan.

## Langkah koneksi di Claude Web

1. Masuk ke Claude Web.
2. Buka **Customize → Connectors**.
3. Pilih **Add** atau **Add custom connector**.
4. Beri nama, misalnya `Browser Cloud`.
5. Masukkan URL Remote MCP berikut, ganti placeholder dengan API key milik sendiri:

   `https://mcp.browserbase.com/mcp?browserbaseApiKey=YOUR_BROWSERBASE_API_KEY`

6. Lanjutkan proses deteksi autentikasi dan simpan konektor.
7. Aktifkan konektor pada percakapan melalui menu **+ → Connectors**.
8. Uji dengan meminta Claude membuka halaman publik yang tidak memerlukan login, lalu merangkum judul dan isi utamanya.

## Keamanan

- **Jangan** commit API key ke GitHub.
- Jangan kirim API key melalui chat, screenshot, atau issue publik.
- Simpan API key hanya di pengaturan konektor privat. Jika pernah terlanjur terekspos, cabut/ganti key dari dashboard penyedia.
- Mulai dari situs publik. Jangan gunakan browser cloud untuk akun pribadi, data sensitif, pembayaran, atau tindakan yang tidak kamu pahami.
- Tinjau setiap permintaan tindakan Claude sebelum menyetujuinya.
- Browser cloud memiliki sesi dan penyimpanan tersendiri; jangan menganggapnya memakai login atau profil Chrome laptopmu.

## Apa yang ada di repository ini?

- `.mcp.json`: konfigurasi **lokal** untuk klien MCP yang dapat menjalankan proses Node.js.
- Dokumen ini: panduan menghubungkan Claude Web ke **Remote MCP** Browserbase.

Keduanya berbeda. Mengunggah `.mcp.json` ke GitHub tidak otomatis memasang konektor pada Claude Web.

## Referensi resmi

- Browserbase MCP: https://www.browserbase.com/mcp
- Browserbase pricing: https://www.browserbase.com/pricing
- Claude custom connectors: https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- Claude Remote MCP setup: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

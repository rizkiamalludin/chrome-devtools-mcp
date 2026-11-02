# Menghubungkan Claude Web ke Rizki Browser MCP

Dokumen ini menjelaskan cara menghubungkan Claude Web ke **server MCP milik repository ini** setelah server dipasang pada host Node.js yang mendukung koneksi HTTPS persisten.

## Arsitektur

Claude Web → Custom Remote MCP Connector → Rizki Browser MCP → Playwright → Browserbase Cloud Browser.

Server ini berbeda dari Browserbase Remote MCP bawaan. Browserbase menyediakan infrastruktur browser; kode MCP dan daftar alat pada proyek ini kita kelola sendiri.

## Sebelum mulai

- Server sudah dibangun dan dijalankan pada host Node.js persisten.
- Host menyediakan URL HTTPS yang dapat dijangkau Claude Web.
- Environment server sudah diatur: `TRANSPORT=http`, `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, dan `MCP_AUTH_TOKEN`.
- Jangan menaruh API key Browserbase atau bearer token di GitHub, screenshot, atau chat.

## Pengaturan konektor

1. Buka Claude Web → Settings/Customize → Connectors.
2. Pilih **Add custom connector**.
3. Name: `Rizki Browser MCP`.
4. URL: `https://DOMAIN-HOST-MILIKMU/mcp`.
5. Pilih opsi autentikasi tanpa OAuth jika tersedia bagian request headers.
6. Tambahkan fixed request header:

   ```http
   Authorization: Bearer YOUR_MCP_AUTH_TOKEN
   ```

7. Pilih transport **Streamable HTTP**.
8. Simpan dan aktifkan konektor.

Jangan gunakan URL Browserbase yang memuat API key. Browserbase API key hanya disimpan pada environment server.

## Uji aman

Minta Claude:
- memulai browser;
- membuka `https://example.com`;
- membaca URL, judul, heading, dan tautan;
- mengambil screenshot;
- menutup sesi.

Gunakan situs publik. Jangan login, memasukkan kredensial, mengirim formulir, melakukan pembayaran, atau mengakses data pribadi.

## Catatan hosting

Endpoint remote menggunakan state browser dalam memori proses. Karena itu, gunakan host Node.js persisten yang menjaga satu proses tetap hidup. Jangan deploy versi awal ini ke fungsi serverless yang dapat berpindah instance atau mati di antara pemanggilan alat.

Lihat [README.md](./README.md) untuk menjalankan server dan [SECURITY.md](./SECURITY.md) untuk batasan keamanan.

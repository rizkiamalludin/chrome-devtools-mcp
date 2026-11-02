# Rizki Browser MCP

A small TypeScript MCP server that controls a Browserbase cloud browser through Playwright. This repository now contains a real server implementation, not only configuration and documentation.

## What it does

The server uses deterministic Playwright locators instead of LLM-generated element IDs. It reads the browser's actual URL and page title directly from Playwright.

| MCP tool | Purpose |
|---|---|
| `browser_start` | Start one Browserbase cloud browser session |
| `browser_navigate` | Open a public HTTP/HTTPS URL and report the final URL, title, and HTTP status |
| `browser_inspect` | Read the current URL, title, headings, and links |
| `browser_click_link` | Click one visible link by exact accessible name and verify the result |
| `browser_screenshot` | Capture the current viewport |
| `browser_close` | Close the browser session |

The first version intentionally does not expose arbitrary JavaScript execution, credential entry, form submission, or payment actions.

## Requirements

- Node.js 20 or newer
- Browserbase API key and Project ID
- A private MCP client for local use, or a private persistent Node.js host for remote HTTP use

Check the provider's current terms, eligibility requirements, and pricing before use. Do not bypass age or account requirements.

## Run locally on Windows

1. Install Node.js LTS.
2. Clone or download this repository.
3. Open PowerShell in the repository folder.
4. Install dependencies:

   ```powershell
   npm install
   ```

5. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

6. Open `.env` in a text editor and fill in `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`. Keep both private.
7. Build:

   ```powershell
   npm run build
   ```

8. Configure your local MCP client to run `node dist/index.js` from this repository folder. The default transport is stdio.

Your laptop does not need to install or run Chromium; the browser itself runs on Browserbase.

## Remote Claude Web

The server includes a bearer-protected Streamable HTTP endpoint at `/mcp`. It is designed for a persistent Node.js host, not a serverless function that may discard in-memory browser sessions between requests.

Set these environment variables in the host dashboard:

- `TRANSPORT=http`
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`
- `MCP_AUTH_TOKEN` (at least 32 random characters)
- `PORT` (provided automatically by many hosts)

Start command:

```bash
npm run build && npm start
```

Health check: `/health`

MCP endpoint: `/mcp`

In Claude Web, add a custom remote MCP connector using the server's HTTPS `/mcp` URL and configure a fixed request header:

```http
Authorization: Bearer YOUR_MCP_AUTH_TOKEN
```

Never put Browserbase credentials in the connector URL. Never paste secrets into chat or commit them to GitHub.

## Security

- The remote endpoint requires bearer authentication.
- Browserbase API keys and CDP connection URLs are never returned by tools.
- Local/private IP destinations and common internal hostnames are blocked; DNS results are checked before navigation and requests.
- Clicks are limited to visible links; form submission and arbitrary code execution are not exposed.
- Keep the remote service private and review browser actions.

These application checks reduce risk but do not replace network-level egress controls. See [SECURITY.md](./SECURITY.md).

## Development

```powershell
npm run dev
npm run typecheck
npm run build
```

The project uses the official MCP TypeScript SDK, Browserbase Node SDK, and Playwright Core. Remote MCP uses Streamable HTTP; local MCP uses stdio.

## References

- [Claude Web connector guide](./CLAUDE-WEB.md)
- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Browserbase Playwright quickstart](https://www.browserbase.com/templates/playwright)
- [Playwright locator documentation](https://playwright.dev/docs/api/class-locator)

import "dotenv/config";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import Browserbase from "@browserbasehq/sdk";
import { chromium, type Browser, type Page, type Route } from "playwright-core";
import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";

type BrowserSession = {
  browser: Browser;
  page: Page;
};

const sessions = new Map<string, BrowserSession>();
let activeSessionId: string | undefined;

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Browser MCP error: ${message}` }],
  };
}

function getSession(sessionId?: string): { id: string; session: BrowserSession } {
  const id = sessionId ?? activeSessionId;
  if (!id) throw new Error("No browser session. Call browser_start first.");
  const session = sessions.get(id);
  if (!session) throw new Error("Browser session not found or already closed. Call browser_start again.");
  return { id, session };
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPrivateOrReservedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIPv4(address);
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized === "::" || normalized === "::1" || normalized.startsWith("fc") ||
        normalized.startsWith("fd") || normalized.startsWith("fe8") ||
        normalized.startsWith("fe9") || normalized.startsWith("fea") ||
        normalized.startsWith("feb") || normalized.startsWith("::ffff:")) return true;
    const first = Number.parseInt(normalized.split(":")[0] || "0", 16);
    return first < 0x2000 || first > 0x3fff || normalized.startsWith("2001:db8:");
  }
  return true;
}

function parsePublicHttpUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only public HTTP and HTTPS websites are allowed.");
  }
  if (url.username || url.password) throw new Error("URLs containing embedded credentials are not allowed.");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" || host.endsWith(".localhost") ||
    host.endsWith(".local") || host.endsWith(".internal") ||
    host.endsWith(".test") || host === "metadata.google.internal"
  ) {
    throw new Error("Local and internal network addresses are blocked.");
  }
  if (isIP(host)) throw new Error("Direct IP-address navigation is blocked. Use a public website hostname.");
  return url;
}

async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  const url = parsePublicHttpUrl(rawUrl);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateOrReservedAddress(address))) {
    throw new Error("The website resolves to a local, private, or reserved network address and is blocked.");
  }
  return url;
}

async function guardRoute(route: Route): Promise<void> {
  const requestUrl = route.request().url();
  if (/^(data|blob|about):/i.test(requestUrl)) {
    await route.continue();
    return;
  }
  try {
    await assertPublicHttpUrl(requestUrl);
    await route.continue();
  } catch {
    await route.abort("blockedbyclient");
  }
}

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "rizki-browser-mcp",
    version: "0.1.0",
  });

  server.tool(
    "browser_start",
    "Start one isolated Browserbase cloud browser session. Returns a private local session handle, never the CDP connection URL.",
    {},
    async () => {
      try {
        if (sessions.size > 0) {
          throw new Error("A browser session is already active. Call browser_close before starting another.");
        }
        const apiKey = process.env.BROWSERBASE_API_KEY;
        const projectId = process.env.BROWSERBASE_PROJECT_ID;
        if (!apiKey || !projectId) throw new Error("Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in the server environment.");

        const client = new Browserbase({ apiKey });
        const remoteSession = await client.sessions.create({ projectId });
        const browser = await chromium.connectOverCDP(remoteSession.connectUrl);
        const context = browser.contexts()[0];
        if (!context) {
          await browser.close();
          throw new Error("Browserbase connected but did not provide a browser context.");
        }
        const page = context.pages()[0] ?? await context.newPage();
        await page.route("**/*", guardRoute);

        const id = randomUUID();
        sessions.set(id, {
          browser,
          page,
        });
        activeSessionId = id;
        return textResult({
          success: true,
          sessionId: id,
          note: "Browser session ready. The Browserbase connection URL and credentials are intentionally hidden.",
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "browser_navigate",
    "Navigate the active browser to a public HTTP or HTTPS URL and verify the final URL, page title, and HTTP status.",
    { url: z.string().url(), sessionId: z.string().optional() },
    async ({ url, sessionId }) => {
      try {
        const safeUrl = await assertPublicHttpUrl(url);
        const { session } = getSession(sessionId);
        const response = await session.page.goto(safeUrl.toString(), {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        return textResult({
          success: true,
          requestedUrl: safeUrl.toString(),
          finalUrl: session.page.url(),
          title: await session.page.title(),
          httpStatus: response?.status() ?? null,
          redirected: session.page.url() !== safeUrl.toString(),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "browser_inspect",
    "Read the current page's actual URL and title plus visible headings and links. Does not click or submit anything.",
    { sessionId: z.string().optional() },
    async ({ sessionId }) => {
      try {
        const { session } = getSession(sessionId);
        const page = session.page;
        const headings = await page.locator("h1, h2, h3").evaluateAll((elements) =>
          elements.slice(0, 30).map((element) => ({
            level: element.tagName.toLowerCase(),
            text: (element.textContent ?? "").trim().replace(/\s+/g, " "),
          })).filter((item) => item.text.length > 0),
        );
        const links = await page.locator("a[href]").evaluateAll((elements) =>
          elements.slice(0, 40).map((element) => ({
            text: (element.textContent ?? element.getAttribute("aria-label") ?? "").trim().replace(/\s+/g, " "),
            href: (element as HTMLAnchorElement).href,
          })).filter((item) => item.text.length > 0),
        );
        return textResult({
          success: true,
          url: page.url(),
          title: await page.title(),
          headings,
          links,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "browser_click_link",
    "Click exactly one visible link by its exact accessible name. This tool cannot click buttons or submit forms. Verifies the resulting URL and title.",
    { text: z.string().min(1).max(200), sessionId: z.string().optional() },
    async ({ text, sessionId }) => {
      try {
        const { session } = getSession(sessionId);
        const page = session.page;
        const link = page.getByRole("link", { name: text, exact: true });
        const count = await link.count();
        if (count !== 1) throw new Error(`Expected exactly one link named "${text}", found ${count}.`);
        if (!(await link.isVisible())) throw new Error("The matching link is not visible.");
        const href = await link.getAttribute("href");
        if (!href) throw new Error("The matching link has no href destination.");
        await assertPublicHttpUrl(new URL(href, page.url()).toString());

        const beforeUrl = page.url();
        await link.click({ timeout: 10000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => undefined);
        const afterUrl = page.url();
        return textResult({
          success: true,
          clickedLinkText: text,
          destinationHref: new URL(href, beforeUrl).toString(),
          beforeUrl,
          finalUrl: afterUrl,
          title: await page.title(),
          urlChanged: beforeUrl !== afterUrl,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "browser_screenshot",
    "Capture the current browser viewport as a PNG image.",
    { sessionId: z.string().optional() },
    async ({ sessionId }) => {
      try {
        const { session } = getSession(sessionId);
        const image = await session.page.screenshot({ type: "png", fullPage: false });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ success: true, url: session.page.url(), title: await session.page.title() }) },
            { type: "image" as const, data: image.toString("base64"), mimeType: "image/png" },
          ],
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "browser_close",
    "Close the active cloud browser session and release its browser connection.",
    { sessionId: z.string().optional() },
    async ({ sessionId }) => {
      try {
        const { id, session } = getSession(sessionId);
        await session.browser.close();
        sessions.delete(id);
        if (activeSessionId === id) activeSessionId = undefined;
        return textResult({ success: true, closed: true });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}

function safeTokenEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.MCP_AUTH_TOKEN;
  const header = req.header("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !provided || !safeTokenEqual(provided, expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function startHttpServer(): Promise<void> {
  const authToken = process.env.MCP_AUTH_TOKEN;
  if (!authToken || authToken.length < 32) {
    throw new Error("HTTP mode requires MCP_AUTH_TOKEN with at least 32 characters.");
  }

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  const allowedHosts = (process.env.ALLOWED_HOSTS ?? "")
    .split(",").map((host) => host.trim()).filter(Boolean);
  app.use((req, res, next) => {
    if (allowedHosts.length > 0 && !allowedHosts.includes(req.header("host") ?? "")) {
      res.status(403).json({ error: "Host not allowed" });
      return;
    }
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true, service: "rizki-browser-mcp" }));

  app.post("/mcp", authenticate, async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createMcpServer();
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
    } finally {
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    }
  });

  app.all("/mcp", (_req, res) => res.status(405).json({ error: "Use POST for the stateless MCP endpoint." }));

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, "0.0.0.0", () => {
    console.error(`Rizki Browser MCP listening on port ${port} (protected Streamable HTTP)`);
  });
}

async function closeAllSessions(): Promise<void> {
  const active = [...sessions.entries()];
  sessions.clear();
  activeSessionId = undefined;
  await Promise.allSettled(active.map(([, session]) => session.browser.close()));
}

async function main(): Promise<void> {
  const transportMode = (process.env.TRANSPORT ?? "stdio").toLowerCase();
  if (transportMode === "http") {
    await startHttpServer();
    return;
  }
  if (transportMode !== "stdio") throw new Error("TRANSPORT must be either stdio or http.");

  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rizki Browser MCP connected over stdio.");
}

process.on("SIGINT", () => { void closeAllSessions().finally(() => process.exit(0)); });
process.on("SIGTERM", () => { void closeAllSessions().finally(() => process.exit(0)); });

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`Rizki Browser MCP failed to start: ${message}`);
  process.exit(1);
});

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const portValue = Number.parseInt(process.env.TANDEM_PUBLIC_PORT ?? "4173", 10);
const port = Number.isInteger(portValue) && portValue > 0 && portValue < 65536 ? portValue : 4173;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

function respond(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(`${message}\n`);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    respond(response, 405, "Method not allowed");
    return;
  }

  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  } catch {
    respond(response, 400, "Invalid request path");
    return;
  }

  if (pathname === "/") pathname = "/index.html";
  if (pathname.split("/").some((segment) => segment.startsWith("."))) {
    respond(response, 404, "Not found");
    return;
  }

  let filePath = resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    respond(response, 403, "Forbidden");
    return;
  }

  try {
    const details = await stat(filePath);
    if (details.isDirectory()) {
      filePath = resolve(filePath, "index.html");
    }
    const finalDetails = await stat(filePath);
    if (!finalDetails.isFile()) throw new Error("not a file");

    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": finalDetails.size,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    respond(response, 404, "Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Tandem public site: http://127.0.0.1:${port}\n`);
});

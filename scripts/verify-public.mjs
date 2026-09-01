import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const approvedPaths = new Set([
  ".gitattributes",
  ".node-version",
  ".nvmrc",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/documentation.yml",
  ".github/ISSUE_TEMPLATE/idea.yml",
  ".github/ISSUE_TEMPLATE/product.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/workflows/verify-public.yml",
  ".gitignore",
  "assets/dossier.css",
  "assets/pair-check.js",
  "assets/site.css",
  "assets/site.js",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "docs.manifest.json",
  "docs/conformance.html",
  "docs/considerations.html",
  "docs/faq.md",
  "docs/getting-started.md",
  "docs/how-it-works.md",
  "docs/guide.html",
  "docs/index.html",
  "docs/indexing.html",
  "docs/integrations.md",
  "docs/pair-check.html",
  "docs/protocol.html",
  "docs/roadmap.md",
  "docs/safety.md",
  "docs/schemas.html",
  "docs/specification.html",
  "docs/use-cases.md",
  "docs/vectors.html",
  "docs/verifier.html",
  "docs/what-is-tandem.md",
  "index.html",
  "LICENSE",
  "llms.txt",
  "protocol/README.md",
  "README.md",
  "robots.txt",
  "release/spec.json",
  "REPOSITORY_BOUNDARY.md",
  "schemas/agreement-envelope.schema.json",
  "schemas/chapter.schema.json",
  "schemas/close.schema.json",
  "scripts/serve.mjs",
  "scripts/verify-public.mjs",
  "SECURITY.md",
  "sitemap-index.xml",
  "sitemap.xml",
  "tandem.md",
  "vectors/create-marker.example.json",
  "vectors/generated/golden.json",
  "vectors/generated/manifest.json",
]);

const approvedArtifacts = new Map([
  ["LICENSE", { bytes: 1073, sha256: "51a7d46a33e097f032b3433d5b950f78222336c377e1c59d5e25b6327ec2a030" }],
  ["tandem.md", { bytes: 47343, sha256: "caa77ce0122c0b833fc5f099191b54280b0481be325bdc98f2b48b0b905b923f" }],
  ["release/spec.json", { bytes: 381, sha256: "f07dd12c63995dd4a40e50e6a8a2c7634561184caa9b421e2d4bcdbe5892d332" }],
  ["schemas/agreement-envelope.schema.json", { bytes: 2546, sha256: "1d5493758b1cc358b02491b675b9e7cb64c51fe3ce2e3f0cde9669882717faa1" }],
  ["schemas/chapter.schema.json", { bytes: 2557, sha256: "9fa613d576b2aeb95b52140c89180f05f65ecd7f4266797f41a1e685610dfc17" }],
  ["schemas/close.schema.json", { bytes: 2195, sha256: "e6645b4ec1eeb44996a37847d4318168959a905fb334b48f4f3298cc6340bc59" }],
  ["vectors/create-marker.example.json", { bytes: 135, sha256: "49ee02bc45526953c8fd2e5e71b35fc73458ce4c33811870119113d194308cc8" }],
  ["vectors/generated/golden.json", { bytes: 24236, sha256: "fc4bee2c20fe94a66a9849f1dc3d73bc407179474e936de29eddef85dcfb5856" }],
  ["vectors/generated/manifest.json", { bytes: 369, sha256: "d443d9b6e178b95b707620593e471b2146c2747be0f7789dc06f54ce133c33ac" }],
]);

const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".xml", ".yaml", ".yml"]);
const forbiddenTopLevel = new Set([
  "backend",
  "deployments",
  "evidence",
  "indexer",
  "infrastructure",
  "node_modules",
  "operations",
  "ops",
  "src",
  "test",
  "tests",
  "workers",
]);
const forbiddenFilePatterns = [
  /^package(?:-lock)?\.json$/i,
  /^tsconfig(?:\..+)?\.json$/i,
  /^vitest(?:\..+)?\.(?:js|ts)$/i,
  /^biome\.json$/i,
  /^dockerfile$/i,
  /^\.env(?:\..+)?$/i,
  /implementation-baseline/i,
  /deviations/i,
  /launch-gates/i,
  /spec-freeze/i,
];
const forbiddenProtocolLabel = new RegExp("\\b" + "v" + "1\\b", "i");
const forbiddenInternalRepository = new RegExp("tandem-" + "internal", "i");
const sensitiveValuePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/i,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  new RegExp("\\b" + "github" + "_pat_[A-Za-z0-9_]{20,}\\b"),
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\b(?:xprv|tprv)[1-9A-HJ-NP-Za-km-z]{80,}\b/,
  /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/,
  /\b(?:password|passwd|private[_-]?key|access[_-]?token|api[_-]?key|client[_-]?secret)\s*[:=]\s*["']?[A-Za-z0-9/+_.-]{8,}/i,
];

function fail(message) {
  failures.push(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

async function collectFiles(directory = root) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const fullPath = resolve(directory, entry.name);
    const path = normalizePath(relative(root, fullPath));
    const details = await lstat(fullPath);
    if (details.isSymbolicLink()) {
      fail(`symbolic links are not allowed: ${path}`);
      continue;
    }
    if (entry.isDirectory()) files.push(...(await collectFiles(fullPath)));
    if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

async function parseJson(path) {
  try {
    return JSON.parse(await readFile(resolve(root, path), "utf8"));
  } catch (error) {
    fail(`invalid JSON ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function localTarget(sourcePath, value) {
  const cleaned = value.trim().replace(/^<|>$/g, "");
  if (!cleaned || cleaned.startsWith("#")) return undefined;
  if (/^(?:https?:|mailto:|data:|ipfs:|ar:|sha256:)/i.test(cleaned)) return undefined;
  const withoutFragment = cleaned.split("#", 1)[0].split("?", 1)[0];
  if (!withoutFragment) return undefined;
  try {
    return normalizePath(relative(root, resolve(root, dirname(sourcePath), decodeURIComponent(withoutFragment))));
  } catch {
    return "__INVALID_LINK__";
  }
}

async function verifyLocalLinks(files, fileSet) {
  for (const path of files) {
    if (extname(path).toLowerCase() !== ".md" && extname(path).toLowerCase() !== ".html") continue;
    const text = await readFile(resolve(root, path), "utf8");
    const values = [];
    if (path.endsWith(".md")) {
      for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) values.push(match[1]);
    } else {
      for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) values.push(match[1]);
      const ids = new Set(Array.from(text.matchAll(/\sid="([^"]+)"/g), (match) => match[1]));
      for (const value of values.filter((candidate) => candidate.startsWith("#"))) {
        if (!ids.has(value.slice(1))) fail(`missing HTML anchor ${value} in ${path}`);
      }
    }
    for (const value of values) {
      const target = localTarget(path, value);
      if (target && !fileSet.has(target)) fail(`broken local link in ${path}: ${value}`);
    }
  }
}

async function verifyText(files) {
  for (const path of files) {
    if (!textExtensions.has(extname(path).toLowerCase()) && !["LICENSE", ".gitignore", ".gitattributes", ".github/CODEOWNERS"].includes(path)) continue;
    const text = await readFile(resolve(root, path), "utf8");
    if (text.includes("\u2014")) fail(`em dash found in ${path}`);
    if (forbiddenProtocolLabel.test(text)) fail(`forbidden protocol label found in ${path}`);
    if (forbiddenInternalRepository.test(text)) fail(`internal repository reference found in ${path}`);
    if (/[\u00c2\u00c3\ufffd]/u.test(text)) fail(`possible encoding artifact found in ${path}`);
    for (const pattern of sensitiveValuePatterns) {
      if (pattern.test(text)) fail(`possible sensitive value found in ${path}`);
    }
  }
}

async function verifyBoundary(files) {
  for (const path of files) {
    const segments = path.toLowerCase().split("/");
    if (forbiddenTopLevel.has(segments[0])) fail(`internal-only path found: ${path}`);
    if (segments.some((segment) => forbiddenFilePatterns.some((pattern) => pattern.test(segment)))) {
      fail(`forbidden engineering path found: ${path}`);
    }
    if (forbiddenProtocolLabel.test(path)) fail(`forbidden protocol label found in path: ${path}`);
  }

  const scripts = files.filter((path) => path.startsWith("scripts/"));
  const approvedScripts = new Set(["scripts/serve.mjs", "scripts/verify-public.mjs"]);
  for (const path of scripts) if (!approvedScripts.has(path)) fail(`unapproved public script found: ${path}`);

  const workflows = files.filter((path) => path.startsWith(".github/workflows/"));
  if (workflows.length !== 1 || workflows[0] !== ".github/workflows/verify-public.yml") {
    fail("the public repository must contain only the minimal verification workflow");
  }
}

async function verifyArtifacts() {
  for (const [path, expected] of approvedArtifacts) {
    const bytes = await readFile(resolve(root, path));
    if (bytes.length !== expected.bytes) fail(`${path} byte count changed: ${bytes.length}`);
    const digest = sha256(bytes);
    if (digest !== expected.sha256) fail(`${path} digest changed: ${digest}`);
  }

  const specificationBytes = await readFile(resolve(root, "tandem.md"));
  const specificationText = new TextDecoder("utf-8", { fatal: true }).decode(specificationBytes);
  const release = await parseJson("release/spec.json");
  if (release) {
    if (release.artifact !== "tandem.md") fail("release record points to the wrong specification artifact");
    if (release.sha256 !== sha256(specificationBytes)) fail("release record specification digest mismatch");
    if (release.bytes !== specificationBytes.length) fail("release record specification byte mismatch");
    if (release.lines !== specificationText.split("\n").length - 1) fail("release record specification line mismatch");
  }
  if (specificationBytes[0] === 0xef && specificationBytes[1] === 0xbb && specificationBytes[2] === 0xbf) fail("specification contains a UTF-8 BOM");
  if (specificationBytes.includes(0x0d)) fail("specification contains a carriage return");
  if (specificationBytes.at(-1) !== 0x0a || specificationBytes.at(-2) === 0x0a) fail("specification must end in exactly one LF");
  if (specificationText.slice(0, -1).split("\n").some((line) => /[ \t]$/.test(line))) fail("specification contains trailing horizontal whitespace");

  const vectorManifest = await parseJson("vectors/generated/manifest.json");
  const goldenBytes = await readFile(resolve(root, "vectors/generated/golden.json"));
  if (vectorManifest) {
    if (vectorManifest.specification !== "tandem.md") fail("vector manifest points to the wrong specification");
    if (vectorManifest.specHash !== sha256(specificationBytes)) fail("vector manifest specification digest mismatch");
    if (vectorManifest.fixtureFile !== "golden.json") fail("vector manifest points to the wrong fixture file");
    if (vectorManifest.fixtureSha256 !== sha256(goldenBytes)) fail("golden fixture digest mismatch");
    if (!/^[0-9a-f]{64}$/.test(vectorManifest.vectorRoot ?? "")) fail("vector manifest has an invalid vector root");
  }
}

async function verifySite() {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const css = await readFile(resolve(root, "assets/site.css"), "utf8");
  const script = await readFile(resolve(root, "assets/site.js"), "utf8");
  const essentials = [
    [/<html lang="en">/i, "site language"],
    [/name="viewport"/i, "responsive viewport"],
    [/class="skip-link"/i, "skip link"],
    [/<main\b/i, "main landmark"],
    [/role="tablist"/i, "journey tab list"],
    [/role="tabpanel"/i, "journey tab panel"],
    [/aria-live="polite"/i, "journey live region"],
    [/mainnet is not active/i, "mainnet status"],
    [/Content-Security-Policy/i, "content security policy"],
  ];
  for (const [pattern, label] of essentials) if (!pattern.test(html)) fail(`site is missing ${label}`);

  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(css)) fail("site is missing reduced-motion behavior");
  if (!/:focus-visible/i.test(css)) fail("site is missing visible keyboard focus");
  if (!/@media\s*\(max-width:/i.test(css)) fail("site is missing responsive behavior");
  if (/gradient\s*\(/i.test(css)) fail("site uses a forbidden gradient");
  if (/<svg\b/i.test(html) || /<style\b/i.test(html)) fail("site contains inline visual or style markup");

  for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
    if (!script.includes(key)) fail(`journey keyboard support is missing ${key}`);
  }
  if (!script.includes("aria-selected") || !script.includes("dataset.activeStage")) fail("journey state management is incomplete");

  if (/href="(?:(?:docs|protocol)\/[^"#?]+|README|SECURITY|CONTRIBUTING|REPOSITORY_BOUNDARY)\.md(?:[#?][^"]*)?"/i.test(html)) {
    fail("product site links directly to unrendered documentation");
  }

  for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/gi)) {
    if (/^(?:https?:)?\/\//i.test(match[1])) fail(`external runtime dependency found in index.html: ${match[1]}`);
  }
}

async function verifyDocumentationPage() {
  const html = await readFile(resolve(root, "docs/index.html"), "utf8");
  const essentials = [
    [/<html lang="en">/i, "documentation language"],
    [/name="viewport"/i, "documentation responsive viewport"],
    [/class="skip-link"/i, "documentation skip link"],
    [/<main\b[^>]*id="docs-main"/i, "documentation main landmark"],
    [/id="getting-started"/i, "getting-started section"],
    [/id="safety"/i, "safety section"],
    [/id="integrations"/i, "integration section"],
    [/id="protocol"/i, "public-contract section"],
    [/id="security"/i, "security section"],
    [/mainnet is not active/i, "documentation mainnet status"],
    [/Content-Security-Policy/i, "documentation content security policy"],
  ];
  for (const [pattern, label] of essentials) if (!pattern.test(html)) fail(`site is missing ${label}`);
  if (/<script\b/i.test(html) || /<style\b/i.test(html)) fail("documentation contains inline runtime or style markup");
}

async function verifyDependabot() {
  const config = await readFile(resolve(root, ".github/dependabot.yml"), "utf8");
  const essentials = [
    [/^version:\s*2\s*$/m, "Dependabot configuration format"],
    [/package-ecosystem:\s*github-actions\s*$/m, "GitHub Actions ecosystem"],
    [/directory:\s*["']?\/["']?\s*$/m, "repository-root update directory"],
    [/interval:\s*weekly\s*$/m, "weekly update interval"],
  ];
  for (const [pattern, label] of essentials) if (!pattern.test(config)) fail(`Dependabot is missing ${label}`);
  if (/registries\s*:/i.test(config)) fail("public Dependabot configuration must not declare private registries");
}

async function verifyWorkflow() {
  const workflow = await readFile(resolve(root, ".github/workflows/verify-public.yml"), "utf8");
  const uses = Array.from(workflow.matchAll(/uses:\s*([^\s@]+)@([^\s]+)/g));
  if (uses.length !== 2) fail("public workflow must use exactly two pinned actions");
  const expected = new Map([
    ["actions/checkout", "3d3c42e5aac5ba805825da76410c181273ba90b1"],
    ["actions/setup-node", "820762786026740c76f36085b0efc47a31fe5020"],
  ]);
  for (const match of uses) {
    const [, action, reference] = match;
    if (!/^[0-9a-f]{40}$/.test(reference)) fail(`action is not pinned to a commit: ${action}`);
    if (expected.get(action) !== reference) fail(`unexpected action or commit: ${action}@${reference}`);
  }
  if (/\bsecrets\s*\./i.test(workflow)) fail("public workflow must not reference repository secrets");
  if (/\b(?:deploy|publish|release)\b/i.test(workflow)) fail("public workflow must not deploy, publish, or release");
}

const dossierPages = [
  "docs/protocol.html",
  "docs/specification.html",
  "docs/guide.html",
  "docs/pair-check.html",
  "docs/indexing.html",
  "docs/schemas.html",
  "docs/vectors.html",
  "docs/verifier.html",
  "docs/conformance.html",
  "docs/considerations.html",
];

async function verifyDossier() {
  for (const path of dossierPages) {
    const html = await readFile(resolve(root, path), "utf8");
    const essentials = [
      [/<html lang="en">/i, "language"],
      [/name="viewport"/i, "responsive viewport"],
      [/name="description"\s*\n?\s*content="[^"]{80,}"/i, "a description of at least 80 characters"],
      [/class="skip-link"/i, "skip link"],
      [/<main\b[^>]*id="dossier-main"/i, "main landmark"],
      [/Content-Security-Policy/i, "content security policy"],
      [/mainnet is not active/i, "mainnet status"],
      [/assets\/dossier\.css/i, "dossier stylesheet"],
      [/<title>[^<]+<\/title>/i, "title"],
      [/property="og:title"/i, "Open Graph title"],
    ];
    for (const [pattern, label] of essentials) if (!pattern.test(html)) fail(`${path} is missing ${label}`);

    const headings = html.match(/<h1\b/gi) ?? [];
    if (headings.length !== 1) fail(`${path} must have exactly one h1, found ${headings.length}`);
    if (/<style\b/i.test(html)) fail(`${path} contains inline style markup`);

    for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/gi)) {
      if (/^(?:https?:)?\/\//i.test(match[1])) fail(`external runtime dependency found in ${path}: ${match[1]}`);
    }
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt=/i.test(match[0])) fail(`image without alt text in ${path}`);
    }
    for (const match of html.matchAll(/<svg\b[^>]*>/gi)) {
      if (!/\brole="img"/i.test(match[0]) || !/\baria-labelledby=/i.test(match[0])) {
        fail(`inline svg without an accessible name in ${path}`);
      }
    }
  }

  // The pair check tool is the only page permitted to make a request, and only to this origin.
  const tool = await readFile(resolve(root, "docs/pair-check.html"), "utf8");
  if (!/connect-src 'self'/.test(tool)) fail("the pair check page must declare connect-src 'self'");
  if (!/<noscript>/i.test(tool)) fail("the pair check page must degrade without scripting");

  const toolScript = await readFile(resolve(root, "assets/pair-check.js"), "utf8");
  for (const forbidden of ["XMLHttpRequest", "WebSocket", "sendBeacon", "eval(", "localStorage", "document.cookie"]) {
    if (toolScript.includes(forbidden)) fail(`the pair check script must not use ${forbidden}`);
  }
  for (const match of toolScript.matchAll(/fetch\(\s*"([^"]+)"/g)) {
    if (!match[1].startsWith("../vectors/")) fail(`the pair check script must only read published vectors: ${match[1]}`);
  }
}

async function verifySiteFiles(fileSet) {
  const site = "https://bitcoinuniverseio.github.io/tandem/";

  const robots = await readFile(resolve(root, "robots.txt"), "utf8");
  if (!/^User-agent: \*/m.test(robots)) fail("robots.txt is missing a user-agent rule");
  if (!robots.includes(`${site}sitemap.xml`)) fail("robots.txt does not point at the sitemap");

  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) fail("sitemap.xml is missing its XML declaration");
  if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) fail("sitemap.xml has the wrong namespace");

  const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  if (locations.length === 0) fail("sitemap.xml lists no locations");
  for (const location of locations) {
    if (!location.startsWith(site)) {
      fail(`sitemap.xml location is outside the published site: ${location}`);
      continue;
    }
    const path = location.slice(site.length);
    if (path === "" || path.endsWith("/")) continue;
    if (!fileSet.has(path)) fail(`sitemap.xml lists a path that is not published: ${path}`);
  }
  for (const path of dossierPages) {
    if (!locations.includes(site + path)) fail(`sitemap.xml does not list ${path}`);
  }

  const sitemapIndex = await readFile(resolve(root, "sitemap-index.xml"), "utf8");
  if (!sitemapIndex.includes(`${site}sitemap.xml`)) fail("sitemap-index.xml does not reference sitemap.xml");

  const llms = await readFile(resolve(root, "llms.txt"), "utf8");
  if (!/^# Tandem/m.test(llms)) fail("llms.txt is missing its heading");
  if (!/mainnet is NOT active/i.test(llms)) fail("llms.txt must state the mainnet status");
  for (const match of llms.matchAll(/\]\((https:\/\/bitcoinuniverseio\.github\.io\/tandem\/[^)]*)\)/g)) {
    const path = match[1].slice(site.length);
    if (path === "" || path.endsWith("/")) continue;
    if (!fileSet.has(path)) fail(`llms.txt links to a path that is not published: ${path}`);
  }
}

const files = await collectFiles();
const fileSet = new Set(files);

for (const path of approvedPaths) if (!fileSet.has(path)) fail(`required path is missing: ${path}`);
for (const path of files) if (!approvedPaths.has(path)) fail(`unapproved public path found: ${path}`);
for (const path of files.filter((path) => path.endsWith(".json"))) await parseJson(path);

await verifyBoundary(files);
await verifyText(files);
await verifyLocalLinks(files, fileSet);
await verifyArtifacts();
await verifySite();
await verifyDocumentationPage();
await verifyDossier();
await verifySiteFiles(fileSet);
await verifyWorkflow();
await verifyDependabot();

if (failures.length > 0) {
  for (const message of failures) process.stderr.write(`FAIL ${message}\n`);
  process.stderr.write(`${failures.length} public verification check${failures.length === 1 ? "" : "s"} failed.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ valid: true, files: files.length, jsonFiles: files.filter((path) => path.endsWith(".json")).length, approvedArtifacts: approvedArtifacts.size, localLinks: "valid", publicBoundary: "valid", site: "valid" })}\n`);
}

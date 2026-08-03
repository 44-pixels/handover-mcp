#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import {
  basename,
  dirname,
  extname,
  join,
  resolve,
  sep,
} from "node:path";
import {
  chmod,
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import process from "node:process";

const VERSION = "0.1.1";
const COMMANDS = new Set([
  "login",
  "logout",
  "whoami",
  "list",
  "search",
  "show",
  "access",
  "share",
  "archive",
  "restore",
  "trash",
  "purge",
  "create",
  "continue",
  "sources",
  "source-add",
  "import",
  "destinations",
  "destination-add",
  "exports",
  "export",
  "activity",
  "download",
  "pull",
  "publish",
  "republish",
  "folders",
  "okf-export",
  "okf-import",
]);

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`handover: ${message}\n`);
  process.exitCode = 1;
});

async function main() {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.options.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (parsed.options.help || !parsed.command) {
    printHelp(parsed.command);
    return;
  }
  if (!COMMANDS.has(parsed.command)) {
    throw new Error(`Unknown command "${parsed.command}". Run handover --help.`);
  }
  assertAllowedOptions(parsed.command, parsed.options);

  const savedConfig = await readConfig();
  if (parsed.command === "login") {
    const baseUrl =
      lastOption(parsed.options.url) ??
      environmentValue("HANDOVER_URL") ??
      savedConfig.url ??
      "https://handover.sh";
    const token =
      lastOption(parsed.options.token) ??
      environmentValue("HANDOVER_TOKEN") ??
      (await promptCredential());
    if (!token) {
      throw new Error("A Handover credential is required.");
    }
    const loginClient = createClient({ baseUrl, token });
    const actor = await loginClient.json("/me");
    await writeConfig({ url: baseUrl, token });
    process.stdout.write(
      `Signed in as ${actor.displayName ?? actor.email ?? "Handover user"}.\nCredential saved to ${configPath()}.\n`,
    );
    return;
  }
  if (parsed.command === "logout") {
    await rm(configPath(), { force: true });
    process.stdout.write("Signed out. Saved Handover credential removed.\n");
    return;
  }

  const client = createClient({
    baseUrl:
      lastOption(parsed.options.url) ??
      environmentValue("HANDOVER_URL") ??
      savedConfig.url ??
      "https://handover.sh",
    token:
      lastOption(parsed.options.token) ??
      environmentValue("HANDOVER_TOKEN") ??
      savedConfig.token ??
      "",
  });
  const json = Boolean(parsed.options.json);

  switch (parsed.command) {
    case "whoami": {
      const actor = await client.json("/me");
      output(actor, json, formatIdentity);
      break;
    }
    case "list": {
      const limit = integerOption(parsed.options.limit, 30, 1, 100);
      const status = lifecycleStatusOption(parsed.options.status);
      const page = await client.json(
        `/handovers?limit=${limit}&status=${status}`,
      );
      output(page, json, formatHandoverList);
      break;
    }
    case "search": {
      const query = positionalText(parsed, 0, "Search query");
      const limit = integerOption(parsed.options.limit, 30, 1, 100);
      const status = lifecycleStatusOption(parsed.options.status);
      const mode = searchModeOption(parsed.options.mode);
      const page = await client.json(
        `/handovers?q=${encodeURIComponent(query)}&limit=${limit}&status=${status}&mode=${mode}`,
      );
      output(page, json, formatHandoverList);
      break;
    }
    case "show": {
      const id = positionalText(parsed, 0, "Handover ID");
      const revision = lastOption(parsed.options.revision);
      const suffix = revision
        ? `?revision=${encodeURIComponent(revision)}`
        : "";
      const handover = await client.json(`/handovers/${id}${suffix}`);
      output(handover, json, formatHandover);
      break;
    }
    case "access": {
      const id = positionalText(parsed, 0, "Handover ID");
      const access = await client.json(`/handovers/${id}/access`);
      output(access, json, formatAccess);
      break;
    }
    case "archive":
    case "restore":
    case "trash": {
      const id = positionalText(parsed, 0, "Handover ID");
      const handover = await client.json(`/handovers/${id}/lifecycle`, {
        method: "POST",
        body: { action: parsed.command },
      });
      output(handover, json, formatSaved);
      break;
    }
    case "purge": {
      const id = positionalText(parsed, 0, "Handover ID");
      if (!parsed.options.yes) {
        throw new Error(
          "Permanent purge requires --yes and is allowed only after retention.",
        );
      }
      await client.raw(`/handovers/${id}`, { method: "DELETE" });
      output(
        { handoverId: id, purged: true },
        json,
        (value) => `Purged ${value.handoverId}`,
      );
      break;
    }
    case "share": {
      const id = positionalText(parsed, 0, "Handover ID");
      if (parsed.options.workspace && parsed.options.restricted) {
        throw new Error("Choose either --workspace or --restricted.");
      }
      const current = await client.json(`/handovers/${id}/access`);
      const grants = new Map(
        current.participants.flatMap((participant) =>
          participant.grantRole
            ? [[participant.principalId, participant.grantRole]]
            : [],
        ),
      );
      for (const value of optionValues(parsed.options.grant)) {
        const [principalId, role, extra] = value.split("=");
        if (
          extra !== undefined ||
          !principalId ||
          !["viewer", "editor", "owner"].includes(role)
        ) {
          throw new Error(
            "--grant must use principal-id=viewer|editor|owner.",
          );
        }
        grants.set(principalId, role);
      }
      for (const principalId of optionValues(parsed.options.revoke)) {
        grants.delete(principalId);
      }
      const visibility = parsed.options.workspace
        ? "workspace"
        : parsed.options.restricted
          ? "restricted"
          : current.visibility;
      const access = await client.json(`/handovers/${id}/access`, {
        method: "PUT",
        body: {
          visibility,
          grants: [...grants].map(([principalId, role]) => ({
            principalId,
            role,
          })),
        },
      });
      output(access, json, formatAccess);
      break;
    }
    case "create": {
      const title = requiredOption(parsed.options, "title");
      const brief = briefFromCreateOptions(parsed.options);
      const artifacts = await artifactInputs(parsed.options);
      assertContext(artifacts, lastOption(parsed.options.note), brief);
      const handover = await client.json("/handovers", {
        method: "POST",
        body: {
          title,
          summary: lastOption(parsed.options.summary) ?? "",
          note: lastOption(parsed.options.note) ?? "",
          brief,
          artifacts,
        },
      });
      output(handover, json, formatSaved);
      break;
    }
    case "continue": {
      const id = positionalText(parsed, 0, "Handover ID");
      const current = await client.json(`/handovers/${id}`);
      const brief = briefFromContinuationOptions(
        current.currentRevision.brief,
        parsed.options,
      );
      const artifacts = await artifactInputs(parsed.options);
      const note = lastOption(parsed.options.note) ?? "";
      assertContext(artifacts, note, brief.changed ? brief.value : undefined);
      const handover = await client.json(`/handovers/${id}/revisions`, {
        method: "POST",
        body: {
          expectedRevisionId:
            lastOption(parsed.options.expected) ?? current.currentRevisionId,
          note,
          ...(brief.changed ? { brief: brief.value } : {}),
          artifacts,
        },
      });
      output(handover, json, formatSaved);
      break;
    }
    case "sources": {
      const state = await client.json("/imports");
      output(state, json, formatSources);
      break;
    }
    case "source-add": {
      const provider = requiredOption(parsed.options, "provider");
      if (!["github", "http"].includes(provider)) {
        throw new Error("--provider must be github or http.");
      }
      const config =
        provider === "github"
          ? {
              owner: requiredOption(parsed.options, "owner"),
              repository: requiredOption(parsed.options, "repository"),
              branch: lastOption(parsed.options.branch) ?? "main",
              path: lastOption(parsed.options.path) ?? "",
            }
          : {
              secretEnv:
                lastOption(parsed.options["secret-env"]) ??
                "HANDOVER_IMPORT_SECRET",
            };
      const source = await client.json("/imports", {
        method: "POST",
        body: {
          provider,
          displayName: requiredOption(parsed.options, "name"),
          workspaceId: lastOption(parsed.options.workspace),
          config,
        },
      });
      output(source, json, (value) =>
        formatSources({ sources: [value], jobs: [] }),
      );
      break;
    }
    case "import": {
      const sourceId = positionalText(parsed, 0, "Source ID");
      const state = await client.json(`/imports/${sourceId}/run`, {
        method: "POST",
      });
      output(state, json, formatImports);
      break;
    }
    case "destinations": {
      const destinations = await client.json("/connectors");
      output(destinations, json, formatDestinations);
      break;
    }
    case "destination-add": {
      const provider = requiredOption(parsed.options, "provider");
      if (!["github", "http"].includes(provider)) {
        throw new Error("--provider must be github or http.");
      }
      const config =
        provider === "github"
          ? {
              owner: requiredOption(parsed.options, "owner"),
              repository: requiredOption(parsed.options, "repository"),
              branch: lastOption(parsed.options.branch) ?? "main",
              basePath: lastOption(parsed.options.path) ?? "handovers",
            }
          : {
              url: requiredOption(parsed.options, "endpoint"),
              secretEnv:
                lastOption(parsed.options["secret-env"]) ??
                "HANDOVER_WEBHOOK_SECRET",
            };
      const destination = await client.json("/connectors", {
        method: "POST",
        body: {
          provider,
          displayName: requiredOption(parsed.options, "name"),
          workspaceId: lastOption(parsed.options.workspace),
          config,
        },
      });
      output(destination, json, (value) => formatDestinations([value]));
      break;
    }
    case "exports": {
      const id = positionalText(parsed, 0, "Handover ID");
      const state = await client.json(`/handovers/${id}/exports`);
      output(state, json, formatExports);
      break;
    }
    case "export": {
      const id = positionalText(parsed, 0, "Handover ID");
      const destinationId = requiredOption(parsed.options, "destination");
      const state = await client.json(`/handovers/${id}/exports`, {
        method: "POST",
        body: {
          destinationId,
          revisionId: lastOption(parsed.options.revision),
        },
      });
      output(state, json, formatExports);
      break;
    }
    case "activity": {
      const limit = integerOption(parsed.options.limit, 50, 1, 100);
      const events = await client.json(`/activity?limit=${limit}`);
      output(events, json, formatActivity);
      break;
    }
    case "download": {
      const id = positionalText(parsed, 0, "Artifact ID");
      const response = await client.raw(`/artifacts/${id}`);
      const requested = lastOption(parsed.options.out);
      const filename = responseFilename(response) ?? id;
      const destination = requested ?? filename;
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (destination === "-") {
        process.stdout.write(bytes);
      } else {
        const path = resolve(destination);
        await writeFile(path, bytes);
        if (json) {
          process.stdout.write(
            `${JSON.stringify({ artifactId: id, path, bytes: bytes.length })}\n`,
          );
        } else {
          process.stdout.write(`Downloaded ${filename} to ${path}\n`);
        }
      }
      break;
    }
    case "pull": {
      const slug = positionalText(parsed, 0, "Report slug or URL");
      const destination = requiredOption(parsed.options, "out");
      const data = await client.json(
        `/reports/${encodeURIComponent(extractReportSlug(slug))}/pull`,
        { method: "POST", body: {} },
      );
      const result = await materializePulledReport(data, destination);
      output(result, json, (value) =>
        `Pulled ${value.files.length} files to ${value.outputDir}`,
      );
      break;
    }
    case "publish": {
      const directory = positionalText(parsed, 0, "Directory");
      const title = requiredOption(parsed.options, "title");
      const files = await readDirectoryFiles(directory);
      const report = await client.json("/reports", {
        method: "POST",
        body: {
          name: title,
          ...(lastOption(parsed.options.slug)
            ? { slug: lastOption(parsed.options.slug) }
            : {}),
          ...(lastOption(parsed.options.entry)
            ? { entry_file: lastOption(parsed.options.entry) }
            : {}),
          access: parsed.options.public ? "public" : "organization",
          files,
        },
      });
      output(report, json, (value) =>
        `Published ${value.name ?? title} at ${value.url ?? value.slug}`,
      );
      break;
    }
    case "republish": {
      const directory = positionalText(parsed, 0, "Directory");
      const manifest = await readManifest(directory);
      const files = await readDirectoryFiles(directory);
      const slug = requiredManifestText(manifest.slug, "slug");
      const report = await client.json(
        `/reports/${encodeURIComponent(slug)}`,
        {
          method: "PUT",
          body: {
            name: manifest.title,
            ...(lastOption(parsed.options.entry)
              ? { entry_file: lastOption(parsed.options.entry) }
              : manifest.entryFile
                ? { entry_file: manifest.entryFile }
                : {}),
            access: parsed.options.public ? "public" : "organization",
            expected_revision_id: manifest.revision,
            files,
          },
        },
      );
      output(report, json, (value) =>
        `Republished ${value.name ?? slug} at ${value.url ?? slug}`,
      );
      break;
    }
    case "okf-export": {
      const id = positionalText(parsed, 0, "Handover ID");
      const destination = resolve(requiredOption(parsed.options, "out"));
      const revision = lastOption(parsed.options.revision);
      const response = await client.raw(
        `/handovers/${encodeURIComponent(id)}/okf${
          revision ? `?revision=${encodeURIComponent(revision)}` : ""
        }`,
        { headers: { accept: "application/x-tar" } },
      );
      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(destination, bytes);
      output(
        {
          handoverId: id,
          revisionId: response.headers.get("x-handover-revision"),
          okfVersion: response.headers.get("x-handover-okf-version"),
          path: destination,
          bytes: bytes.byteLength,
        },
        json,
        (value) => `Exported OKF bundle to ${value.path}`,
      );
      break;
    }
    case "okf-import": {
      const id = positionalText(parsed, 0, "Handover ID");
      const source = resolve(positionalText(parsed, 1, "OKF tar archive"));
      const mode = lastOption(parsed.options.mode) ?? "merge";
      if (!["merge", "replace"].includes(mode)) {
        throw new Error("--mode must be merge or replace.");
      }
      const expected = lastOption(parsed.options.expected);
      const query = new URLSearchParams({ mode });
      if (expected) query.set("expectedRevisionId", expected);
      const response = await client.raw(
        `/handovers/${encodeURIComponent(id)}/okf?${query}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/x-tar",
          },
          body: new Uint8Array(await readFile(source)),
        },
      );
      const envelope = await response.json();
      if (!("data" in envelope)) {
        throw new Error("The Handover response did not contain data.");
      }
      output(envelope.data, json, (value) =>
        value.idempotent
          ? `OKF bundle already imported at ${value.handover.currentRevision.id}`
          : `Imported OKF bundle as ${value.handover.currentRevision.id}`,
      );
      break;
    }
    case "folders": {
      const action = positionalText(parsed, 0, "Folder action").toLowerCase();
      if (action === "list") {
        const folders = await client.json("/folders");
        output(folders, json, formatFolders);
        break;
      }
      if (action === "create") {
        const name = requiredOption(parsed.options, "name");
        const folder = await client.json("/folders", {
          method: "POST",
          body: {
            name,
            ...(lastOption(parsed.options.slug)
              ? { slug: lastOption(parsed.options.slug) }
              : {}),
            ...(lastOption(parsed.options.description)
              ? { description: lastOption(parsed.options.description) }
              : {}),
          },
        });
        output(folder, json, (value) => `Created folder ${value.name}`);
        break;
      }
      if (action === "add") {
        const slug = positionalText(parsed, 1, "Folder slug");
        const handoverIds = parsed.positionals.slice(2);
        if (!handoverIds.length) throw new Error("At least one handover ID is required.");
        const result = await client.json(
          `/folders/${encodeURIComponent(slug)}/handovers`,
          { method: "POST", body: { handoverIds } },
        );
        output(result, json, formatFolderChange);
        break;
      }
      if (action === "remove") {
        const slug = positionalText(parsed, 1, "Folder slug");
        const handoverId = positionalText(parsed, 2, "Handover ID");
        await client.raw(
          `/folders/${encodeURIComponent(slug)}/handovers/${encodeURIComponent(handoverId)}`,
          { method: "DELETE" },
        );
        output({ folder: slug, handoverId, removed: true }, json, (value) =>
          `Removed ${value.handoverId} from ${value.folder}`,
        );
        break;
      }
      throw new Error("Folder action must be list, create, add, or remove.");
    }
  }
}

function createClient({ baseUrl, token }) {
  const root = normalizeApiRoot(baseUrl);
  async function raw(path, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("accept")) headers.set("accept", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    let body = init.body;
    if (
      body &&
      typeof body === "object" &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof Uint8Array)
    ) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(body);
    }
    let response;
    try {
      response = await fetch(`${root}${path}`, {
        ...init,
        headers,
        body,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not reach ${root}: ${reason}`);
    }
    if (!response.ok) {
      let detail;
      try {
        detail = await response.json();
      } catch {
        detail = null;
      }
      const code = detail?.error?.code
        ? ` (${detail.error.code})`
        : "";
      const message =
        detail?.error?.message ?? `${response.status} ${response.statusText}`;
      if (response.status === 401 && !token) {
        throw new Error(
          `${message}${code}. Set HANDOVER_TOKEN or pass --token.`,
        );
      }
      throw new Error(`${message}${code}`);
    }
    return response;
  }
  return {
    raw,
    async json(path, init) {
      const response = await raw(path, init);
      const envelope = await response.json();
      if (!("data" in envelope)) {
        throw new Error("The Handover response did not contain data.");
      }
      return envelope.data;
    },
  };
}

function normalizeApiRoot(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`HANDOVER_URL is invalid: ${input}`);
  }
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  if (!url.pathname.endsWith("/api/v1")) {
    url.pathname = `${url.pathname}/api/v1`.replace(/\/+/g, "/");
  }
  return url.toString().replace(/\/$/, "");
}

function parseArguments(argv) {
  const options = {};
  const positionals = [];
  let command = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (value.startsWith("--")) {
      const [rawName, inline] = value.slice(2).split(/=(.*)/s, 2);
      const name = optionName(rawName);
      if (inline !== undefined) {
        addOption(options, name, inline);
      } else if (
        ![
          "help",
          "json",
          "version",
          "workspace",
          "restricted",
          "yes",
          "clear-questions",
          "clear-decisions",
        ].includes(name) &&
        argv[index + 1] !== undefined &&
        !argv[index + 1].startsWith("--")
      ) {
        addOption(options, name, argv[index + 1]);
        index += 1;
      } else {
        addOption(options, name, true);
      }
    } else if (!command) {
      command = value;
    } else {
      positionals.push(value);
    }
  }
  return { command, positionals, options };
}

function optionName(name) {
  const aliases = {
    q: "query",
    o: "out",
    f: "file",
    h: "help",
  };
  return aliases[name] ?? name;
}

function assertAllowedOptions(command, options) {
  const global = ["url", "token", "json"];
  const commandOptions = {
    login: [],
    logout: [],
    whoami: [],
    list: ["limit", "status"],
    search: ["limit", "status", "mode"],
    show: ["revision"],
    access: [],
    share: ["workspace", "restricted", "grant", "revoke"],
    archive: [],
    restore: [],
    trash: [],
    purge: ["yes"],
    create: [
      "title",
      "summary",
      "note",
      "file",
      "stdin",
      "objective",
      "state",
      "decision",
      "question",
      "next",
    ],
    continue: [
      "note",
      "file",
      "stdin",
      "expected",
      "objective",
      "state",
      "decision",
      "question",
      "next",
      "done",
      "clear-questions",
      "clear-decisions",
    ],
    sources: [],
    "source-add": [
      "provider",
      "name",
      "workspace",
      "owner",
      "repository",
      "branch",
      "path",
      "secret-env",
    ],
    import: [],
    destinations: [],
    "destination-add": [
      "provider",
      "name",
      "workspace",
      "owner",
      "repository",
      "branch",
      "path",
      "endpoint",
      "secret-env",
    ],
    exports: [],
    export: ["destination", "revision"],
    activity: ["limit"],
    download: ["out"],
    pull: ["out"],
    publish: ["title", "slug", "entry", "public"],
    republish: ["entry", "public", "organization"],
    folders: ["name", "slug", "description"],
    "okf-export": ["out", "revision"],
    "okf-import": ["expected", "mode"],
  };
  const allowed = new Set([...global, ...commandOptions[command]]);
  const unknown = Object.keys(options).find((name) => !allowed.has(name));
  if (unknown) {
    throw new Error(
      `Unknown option --${unknown} for ${command}. Run handover ${command} --help.`,
    );
  }
}

function configPath() {
  if (process.env.HANDOVER_CONFIG) return resolve(process.env.HANDOVER_CONFIG);
  const root =
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(root, "handover", "config.json");
}

function environmentValue(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

async function readConfig() {
  try {
    const parsed = JSON.parse(await readFile(configPath(), "utf8"));
    return {
      url: typeof parsed.url === "string" ? parsed.url : undefined,
      token: typeof parsed.token === "string" ? parsed.token : undefined,
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    if (error instanceof SyntaxError) {
      throw new Error(`Saved configuration is invalid: ${configPath()}`);
    }
    throw error;
  }
}

async function writeConfig(config) {
  const path = configPath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(path, 0o600);
}

async function promptCredential() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8").trim();
  }
  process.stdout.write("Handover credential: ");
  return new Promise((resolvePrompt, rejectPrompt) => {
    let value = "";
    const input = process.stdin;
    const finish = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      resolvePrompt(value);
    };
    const onData = (chunk) => {
      for (const byte of chunk) {
        if (byte === 3) {
          input.setRawMode(false);
          process.stdout.write("\n");
          rejectPrompt(new Error("Login cancelled."));
          return;
        }
        if (byte === 13 || byte === 10) {
          finish();
          return;
        }
        if (byte === 127 || byte === 8) {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += String.fromCharCode(byte);
        process.stdout.write("*");
      }
    };
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function addOption(options, name, value) {
  const current = options[name];
  if (current === undefined) {
    options[name] = value;
  } else if (Array.isArray(current)) {
    current.push(value);
  } else {
    options[name] = [current, value];
  }
}

function lastOption(value) {
  if (Array.isArray(value)) return String(value.at(-1));
  if (typeof value === "string") return value;
  return undefined;
}

function optionValues(value) {
  if (value === undefined || value === true) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

function requiredOption(options, name) {
  const value = lastOption(options[name])?.trim();
  if (!value) throw new Error(`--${name} is required.`);
  return value;
}

function positionalText(parsed, index, label) {
  const value = parsed.positionals[index]?.trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function integerOption(value, fallback, minimum, maximum) {
  const raw = lastOption(value);
  if (raw === undefined) return fallback;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new Error(`Expected an integer between ${minimum} and ${maximum}.`);
  }
  return number;
}

function lifecycleStatusOption(value) {
  const status = lastOption(value) ?? "active";
  if (!["active", "archived", "trashed"].includes(status)) {
    throw new Error("--status must be active, archived, or trashed.");
  }
  return status;
}

function searchModeOption(value) {
  const mode = lastOption(value) ?? "hybrid";
  if (!["hybrid", "semantic", "lexical"].includes(mode)) {
    throw new Error("--mode must be hybrid, semantic, or lexical.");
  }
  return mode;
}

async function artifactInputs(options) {
  const artifacts = [];
  for (const filename of optionValues(options.file)) {
    const path = resolve(filename);
    const content = await readFile(path);
    const name = basename(path);
    artifacts.push({
      name,
      mediaType: mediaTypeFor(name),
      content: content.toString("base64"),
      encoding: "base64",
    });
  }
  const stdinName = lastOption(options.stdin);
  if (stdinName) {
    const content = await readStdin();
    artifacts.push({
      name: stdinName,
      mediaType: mediaTypeFor(stdinName),
      content: content.toString("base64"),
      encoding: "base64",
    });
  }
  return artifacts;
}

const IGNORED_DIRECTORY_NAMES = new Set([".git", "node_modules"]);

async function readDirectoryFiles(directory) {
  const root = resolve(directory);
  await assertDirectory(root, "Directory");
  const files = [];

  async function visit(current, prefix = "") {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (shouldIgnoreLocalName(entry.name)) continue;
      const fullPath = join(current, entry.name);
      const relativePath = toPortablePath(join(prefix, entry.name));
      const stat = await lstat(fullPath);
      if (stat.isDirectory()) {
        await visit(fullPath, relativePath);
      } else if (stat.isFile()) {
        files.push(await localFile(fullPath, relativePath));
      } else if (stat.isSymbolicLink()) {
        throw new Error(`Symlinks are not supported in published folders: ${relativePath}`);
      }
    }
  }

  await visit(root);
  if (!files.length) throw new Error("The directory contains no publishable files.");
  return files;
}

function shouldIgnoreLocalName(name) {
  return (
    IGNORED_DIRECTORY_NAMES.has(name) ||
    name === ".DS_Store" ||
    name === ".handover.json" ||
    name.startsWith(".") ||
    name.endsWith("~") ||
    /\.(bak|backup|swp|swo)$/i.test(name)
  );
}

async function localFile(filePath, relativePath) {
  const content = await readFile(filePath);
  return {
    path: validateLocalPath(relativePath),
    content: content.toString("base64"),
    content_type: mediaTypeFor(relativePath),
    encoding: "base64",
  };
}

async function assertDirectory(directory, label) {
  let stat;
  try {
    stat = await lstat(directory);
  } catch {
    throw new Error(`${label} not found: ${directory}`);
  }
  if (stat.isSymbolicLink()) throw new Error(`${label} cannot be a symlink: ${directory}`);
  if (!stat.isDirectory()) throw new Error(`${label} is not a directory: ${directory}`);
}

function extractReportSlug(value) {
  const trimmed = value.trim();
  let pathname = trimmed;
  try {
    pathname = new URL(trimmed).pathname;
  } catch {
    // A plain slug is the normal CLI form.
  }
  const match = /(?:^|\/)r\/([^/?#]+)(?:\/|$)/i.exec(pathname);
  const slug = match?.[1] ?? trimmed;
  if (!slug || /[\\/\0]/.test(slug)) throw new Error("Report slug is invalid.");
  return decodeURIComponent(slug).toLowerCase();
}

function validateLocalPath(value) {
  const path = toPortablePath(String(value));
  if (
    !path ||
    path.startsWith("/") ||
    /^[A-Za-z]:\//.test(path) ||
    path.includes("\0") ||
    path.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`Unsafe file path rejected: ${value}`);
  }
  return path;
}

function toPortablePath(value) {
  return String(value).replaceAll("\\", "/");
}

async function materializePulledReport(data, destination) {
  const outputDir = resolve(destination);
  await ensureSafeDirectory(outputDir);
  const report = data?.report ?? {};
  const files = Array.isArray(data?.files) ? data.files : [];
  const manifestFiles = [];

  for (const file of files) {
    const path = validateLocalPath(file?.path);
    const bytes = decodePulledContent(file?.content, file?.encoding, path);
    await writeSafeFile(outputDir, path, bytes);
    manifestFiles.push({
      path,
      sha256: file.sha256 ?? sha256(bytes),
      contentType: file.content_type ?? mediaTypeFor(path),
      size: file.size ?? bytes.length,
    });
  }

  const manifest = {
    version: 1,
    slug: report.slug ?? "",
    handover: report.handover_id ?? report.id ?? "",
    revision: data.revisionId ?? report.revision_id ?? "",
    title: report.name ?? "",
    entryFile: report.entry_file ?? null,
    files: manifestFiles,
  };
  await writeSafeFile(
    outputDir,
    ".handover.json",
    Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"),
  );
  return { ...manifest, outputDir, files: manifestFiles };
}

function decodePulledContent(content, encoding, path) {
  if (typeof content !== "string") throw new Error(`Missing content for ${path}.`);
  if (encoding === "utf-8" || encoding === "text" || !encoding) {
    if (content.startsWith("data:") && content.includes(";base64,")) {
      return Buffer.from(content.slice(content.indexOf(",") + 1), "base64");
    }
    return Buffer.from(content, "utf8");
  }
  if (encoding !== "base64") throw new Error(`Unsupported encoding for ${path}: ${encoding}`);
  const data = content.startsWith("data:") ? content.slice(content.indexOf(",") + 1) : content;
  return Buffer.from(data, "base64");
}

async function ensureSafeDirectory(directory) {
  const root = resolve(directory);
  const existing = await lstat(root).catch(() => null);
  if (existing?.isSymbolicLink()) throw new Error(`Output directory cannot be a symlink: ${root}`);
  if (existing && !existing.isDirectory()) throw new Error(`Output path is not a directory: ${root}`);
  if (!existing) await mkdir(root, { recursive: true });
}

async function writeSafeFile(root, relativePath, bytes) {
  const path = validateLocalPath(relativePath);
  const target = join(root, ...path.split("/"));
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Unsafe file path rejected: ${relativePath}`);
  }
  await ensureSafeDirectory(root);
  const parts = path.split("/");
  let current = resolvedRoot;
  for (const part of parts.slice(0, -1)) {
    current = join(current, part);
    const stat = await lstat(current).catch(() => null);
    if (stat?.isSymbolicLink()) throw new Error(`Symlink escape rejected: ${relativePath}`);
    if (stat && !stat.isDirectory()) throw new Error(`Path component is not a directory: ${relativePath}`);
    if (!stat) await mkdir(current);
  }
  const existing = await lstat(target).catch(() => null);
  if (existing?.isSymbolicLink()) throw new Error(`Symlink escape rejected: ${relativePath}`);
  if (existing?.isDirectory()) throw new Error(`File path is a directory: ${relativePath}`);
  await writeFile(target, bytes);
}

async function readManifest(directory) {
  const root = resolve(directory);
  await assertDirectory(root, "Directory");
  let value;
  try {
    value = JSON.parse(await readFile(join(root, ".handover.json"), "utf8"));
  } catch {
    throw new Error("Republish requires a valid .handover.json manifest.");
  }
  if (!value || typeof value !== "object") {
    throw new Error("Republish requires a valid .handover.json manifest.");
  }
  requiredManifestText(value.slug, "slug");
  requiredManifestText(value.handover, "handover");
  requiredManifestText(value.revision, "revision");
  return value;
}

function requiredManifestText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`The .handover.json manifest is missing ${label}.`);
  }
  return value.trim();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function mediaTypeFor(name) {
  const types = {
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".txt": "text/plain",
    ".sql": "text/x-sql",
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".sh": "text/x-shellscript",
    ".bash": "text/x-shellscript",
    ".cjs": "text/javascript",
    ".jsx": "text/javascript",
    ".json": "application/json",
    ".csv": "text/csv",
    ".tsv": "text/tab-separated-values",
    ".yaml": "application/yaml",
    ".yml": "application/yaml",
    ".xml": "application/xml",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".ts": "text/typescript",
    ".tsx": "text/tsx",
    ".py": "text/x-python",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".zip": "application/zip",
  };
  return types[extname(name).toLowerCase()] ?? "application/octet-stream";
}

function briefFromCreateOptions(options) {
  return {
    objective: lastOption(options.objective) ?? "",
    currentState: lastOption(options.state) ?? "",
    decisions: optionValues(options.decision),
    openQuestions: optionValues(options.question),
    nextSteps: optionValues(options.next).map(newStep),
  };
}

function briefFromContinuationOptions(current, options) {
  const objective = lastOption(options.objective);
  const state = lastOption(options.state);
  const decisions = optionValues(options.decision);
  const questions = optionValues(options.question);
  const next = optionValues(options.next);
  const done = new Set(optionValues(options.done));
  const changed = Boolean(
    objective !== undefined ||
      state !== undefined ||
      decisions.length ||
      questions.length ||
      next.length ||
      done.size ||
      options["clear-questions"] ||
      options["clear-decisions"],
  );
  if (!changed) return { changed: false, value: current };
  const knownSteps = new Set(current.nextSteps.map((step) => step.id));
  for (const id of done) {
    if (!knownSteps.has(id)) {
      throw new Error(`Next step ${id} does not exist on this handover.`);
    }
  }
  return {
    changed: true,
    value: {
      objective: objective ?? current.objective,
      currentState: state ?? current.currentState,
      decisions: options["clear-decisions"]
        ? decisions
        : [...current.decisions, ...decisions],
      openQuestions: options["clear-questions"]
        ? questions
        : [...current.openQuestions, ...questions],
      nextSteps: [
        ...current.nextSteps.map((step) =>
          done.has(step.id) ? { ...step, status: "done" } : step,
        ),
        ...next.map(newStep),
      ],
    },
  };
}

function newStep(text) {
  return {
    id: `step_${randomUUID().replaceAll("-", "")}`,
    text,
    status: "open",
  };
}

function assertContext(artifacts, note, brief) {
  const hasBrief = Boolean(
    brief &&
      (brief.objective ||
        brief.currentState ||
        brief.decisions.length ||
        brief.openQuestions.length ||
        brief.nextSteps.length),
  );
  if (!artifacts.length && !note?.trim() && !hasBrief) {
    throw new Error(
      "Add --file, --stdin, --note, or continuation brief fields.",
    );
  }
}

function responseFilename(response) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return disposition.match(/filename="([^"]+)"/i)?.[1] ?? null;
}

function output(value, json, formatter) {
  process.stdout.write(
    json ? `${JSON.stringify(value, null, 2)}\n` : `${formatter(value)}\n`,
  );
}

function formatIdentity(actor) {
  return [
    `${actor.displayName} (${actor.type})`,
    `${actor.organizationName} / ${actor.workspaceName}`,
    `Role: ${actor.role}`,
    `Scopes: ${actor.scopes.join(", ")}`,
  ].join("\n");
}

function formatHandoverList(page) {
  if (!page.items.length) return "No handovers found.";
  return page.items
    .map((item) => {
      const context = item.matchExcerpt || item.summary || "No summary";
      return [
        `${item.id}  ${item.title}`,
        `  ${context.replace(/\s+/g, " ").trim()}`,
        `  v${item.revisionCount} · ${item.artifactCount} artifacts · ${item.updatedAt}`,
      ].join("\n");
    })
    .join("\n\n");
}

function formatHandover(handover) {
  const revision = handover.currentRevision;
  const brief = revision.brief;
  const lines = [
    `${handover.title} (${handover.id})`,
    handover.summary,
    `Revision ${revision.sequence} · ${revision.id}`,
    `By ${revision.authorName} · ${revision.createdAt}`,
  ].filter(Boolean);
  if (brief.objective) lines.push(`\nObjective\n  ${brief.objective}`);
  if (brief.currentState) lines.push(`\nCurrent state\n  ${brief.currentState}`);
  appendList(lines, "Decisions", brief.decisions);
  appendList(lines, "Open questions", brief.openQuestions);
  if (brief.nextSteps.length) {
    lines.push(
      "\nNext steps",
      ...brief.nextSteps.map(
        (step) =>
          `  ${step.status === "done" ? "[x]" : "[ ]"} ${step.id}  ${step.text}`,
      ),
    );
  }
  if (revision.artifacts.length) {
    lines.push(
      "\nArtifacts",
      ...revision.artifacts.map(
        (artifact) =>
          `  ${artifact.id}  ${artifact.name} · ${artifact.mediaType} · ${artifact.byteSize} bytes`,
      ),
    );
  }
  return lines.join("\n");
}

function appendList(lines, title, items) {
  if (items.length) lines.push(`\n${title}`, ...items.map((item) => `  - ${item}`));
}

function formatSaved(handover) {
  return [
    `Saved ${handover.title}`,
    `Handover: ${handover.id}`,
    `Revision: ${handover.currentRevisionId}`,
  ].join("\n");
}

function formatAccess(access) {
  const lines = [
    `${access.visibility === "restricted" ? "Restricted" : "Workspace"} access`,
    `Manage: ${access.canManage ? "yes" : "no"}`,
  ];
  for (const participant of access.participants) {
    const role =
      participant.isCreator || participant.organizationRole === "owner"
        ? "owner"
        : participant.grantRole || "none";
    lines.push(
      `${participant.principalId}  ${participant.displayName} (${participant.type})  ${role}`,
    );
  }
  return lines.join("\n");
}

function formatActivity(events) {
  if (!events.length) return "No activity.";
  return events
    .map((event) => {
      const target = event.handoverTitle ? ` · ${event.handoverTitle}` : "";
      return `${event.createdAt}  ${event.actorName}  ${event.action}${target}`;
    })
    .join("\n");
}

function formatDestinations(destinations) {
  if (!destinations.length) return "No export destinations.";
  return destinations
    .map((destination) => {
      const target =
        destination.provider === "github"
          ? `${destination.config.owner}/${destination.config.repository} · ${destination.config.branch}`
          : `${destination.config.url} · ${destination.config.secretEnv}`;
      return (
        `${destination.id}  ${destination.displayName}\n` +
        `  ${target} · ${destination.status}`
      );
    })
    .join("\n\n");
}

function formatSources(state) {
  if (!state.sources.length) return "No import sources.";
  return state.sources
    .map((source) => {
      const target =
        source.provider === "github"
          ? `${source.config.owner}/${source.config.repository} · ${source.config.branch}:${source.config.path || "/"}`
          : `signed HTTP · ${source.config.secretEnv}`;
      const imported = source.lastImportedAt
        ? ` · last imported ${source.lastImportedAt}`
        : "";
      return (
        `${source.id}  ${source.displayName}\n` +
        `  ${target} · ${source.status}${imported}`
      );
    })
    .join("\n\n");
}

function formatImports(state) {
  if (!state.jobs.length) return "No imports yet.";
  return state.jobs
    .map((job) => {
      const handover = job.handoverId ? ` · ${job.handoverId}` : "";
      const error = job.lastErrorMessage ? `\n  ${job.lastErrorMessage}` : "";
      return (
        `${job.id}  ${job.status}  ${job.sourceName}` +
        ` · ${job.providerRef}${handover}${error}`
      );
    })
    .join("\n");
}

function formatExports(state) {
  if (!state.jobs.length) return "No exports for this handover.";
  return state.jobs
    .map((job) => {
      const provider = job.providerRef ? ` · ${job.providerRef}` : "";
      const error = job.lastErrorMessage ? `\n  ${job.lastErrorMessage}` : "";
      return (
        `${job.id}  ${job.status}  ${job.destination.displayName}` +
        ` · ${job.revisionId}${provider}${error}`
      );
    })
    .join("\n");
}

function formatFolders(value) {
  const folders = Array.isArray(value) ? value : value.folders ?? [];
  if (!folders.length) return "No folders.";
  return folders
    .map((folder) => `${folder.slug}  ${folder.name} · ${folder.handoverCount ?? 0} handovers`)
    .join("\n");
}

function formatFolderChange(value) {
  const added = value.added?.length ? `Added: ${value.added.join(", ")}` : "No handovers added.";
  const missing = value.notFound?.length || value.not_found?.length
    ? `\nNot found: ${(value.notFound ?? value.not_found).join(", ")}`
    : "";
  return added + missing;
}

function printHelp(command) {
  if (command && COMMANDS.has(command)) {
    process.stdout.write(`${commandHelp(command)}\n`);
    return;
  }
  process.stdout.write(`Handover ${VERSION}

Create, find, inspect, and continue shared context.

Usage:
  handover <command> [arguments] [options]

Commands:
  login                   Save and verify a Handover connection
  logout                  Remove the saved connection
  whoami                 Show the authenticated identity
  list                    List recent handovers
  search <query>          Search all indexed context
  show <handover-id>      Show current context and resume brief
  access <handover-id>    Show item visibility and eligible principals
  share <handover-id>     Change visibility and explicit grants
  archive <handover-id>   Remove from active work
  restore <handover-id>   Return archived or trashed work to active
  trash <handover-id>     Start the 30-day retention window
  purge <handover-id>     Permanently delete after retention
  create                  Create a handover
  continue <handover-id>  Add an immutable revision
  sources                 List configured import sources
  source-add              Create an import source
  import <source-id>      Import the current GitHub version
  destinations            List configured export destinations
  destination-add         Create an export destination
  exports <handover-id>   Show durable export delivery history
  export <handover-id>    Export an immutable revision
  activity                Show organization activity
  download <artifact-id>  Download an artifact
  pull <slug-or-url>      Pull a published report into a local folder
  publish <directory>     Publish a local folder as a report
  republish <directory>   Replace a report from a pulled folder
  folders <action>        List, create, add, or remove folder members
  okf-export <handover-id> Export an Open Knowledge Format tar bundle
  okf-import <handover-id> Import an OKF tar as a new revision

Global options:
  --url <url>              Handover site or API URL
  --token <credential>     Agent bearer credential
  --json                   Emit machine-readable JSON
  --help                   Show help
  --version                Show version

Environment:
  HANDOVER_URL
  HANDOVER_TOKEN
  HANDOVER_CONFIG

Run handover <command> --help for command examples.
`);
}

function commandHelp(command) {
  const help = {
    login: `Usage: handover login [--url https://handover.sh] [--token <credential>]

Prompts for the credential when --token and HANDOVER_TOKEN are absent, verifies
the identity, and stores the connection in a user-only configuration file.`,
    logout: `Usage: handover logout

Removes the saved Handover connection from this computer.`,
    whoami: `Usage: handover whoami [--json]`,
    list: `Usage: handover list [--status active|archived|trashed] [--limit 30] [--json]`,
    search: `Usage: handover search <query> [--mode hybrid|semantic|lexical] [--status active|archived|trashed] [--limit 30] [--json]`,
    show: `Usage: handover show <handover-id> [--revision <id>] [--json]`,
    access: `Usage: handover access <handover-id> [--json]`,
    share: `Usage:
  handover share <handover-id> [options]

Options:
  --workspace                    Make visible to the workspace
  --restricted                   Require an explicit grant
  --grant <principal-id>=<role>  Set viewer, editor, or owner; repeatable
  --revoke <principal-id>        Remove an explicit grant; repeatable

Existing grants are preserved unless changed or revoked.`,
    "destination-add": `Usage:
  handover destination-add --provider github --name <name> --owner <owner> --repository <repo>
  handover destination-add --provider http --name <name> --endpoint <https-url> [--secret-env HANDOVER_WEBHOOK_SECRET]

Only organization owners with tokens:manage can create destinations. HTTP secret values remain deployment runtime variables.`,
    "source-add": `Usage:
  handover source-add --provider github --name <name> --owner <owner> --repository <repo> [--path <folder>]
  handover source-add --provider http --name <name> [--secret-env HANDOVER_IMPORT_SECRET]

Only organization owners with tokens:manage can create sources. Secret values remain deployment runtime variables.`,
    sources: `Usage: handover sources [--json]`,
    import: `Usage: handover import <source-id> [--json]

Pins the current GitHub commit and imports it idempotently.`,
    archive: `Usage: handover archive <handover-id> [--json]`,
    restore: `Usage: handover restore <handover-id> [--json]`,
    trash: `Usage: handover trash <handover-id> [--json]

Trash is reversible for 30 days. Revisions are blocked while trashed.`,
    purge: `Usage: handover purge <handover-id> --yes [--json]

Purge is permanent and rejected until the trash retention deadline.`,
    create: `Usage:
  handover create --title <title> [options]

Options:
  --summary <text>      Short description
  --note <text>         Revision note
  --file <path>         Attach a file; repeatable
  --stdin <name>        Read an artifact from standard input
  --objective <text>    Desired outcome
  --state <text>        Current state
  --decision <text>     Record a decision; repeatable
  --question <text>     Record an open question; repeatable
  --next <text>         Add a next step; repeatable

Example:
  handover create --title "Retention analysis" --file analysis.md \\
    --objective "Explain the retention change" --next "Validate billing"`,
    continue: `Usage:
  handover continue <handover-id> [options]

The current revision is fetched first. Its ID is used for conflict protection,
its artifacts are inherited, and its brief is preserved unless updated.

Options:
  --note <text>             What changed
  --file <path>             Add or replace a file; repeatable
  --stdin <name>            Read an artifact from standard input
  --expected <revision-id>  Override the expected current revision
  --objective <text>        Replace the objective
  --state <text>            Replace the current state
  --decision <text>         Append a decision; repeatable
  --question <text>         Append an open question; repeatable
  --next <text>             Append a next step; repeatable
  --done <step-id>          Complete a next step; repeatable
  --clear-decisions         Replace decisions with supplied --decision values
  --clear-questions         Replace questions with supplied --question values`,
    activity: `Usage: handover activity [--limit 50] [--json]`,
    destinations: `Usage: handover destinations [--json]`,
    exports: `Usage: handover exports <handover-id> [--json]`,
    export: `Usage:
  handover export <handover-id> --destination <destination-id> [options]

Options:
  --revision <revision-id>  Export a historical immutable revision`,
    download: `Usage: handover download <artifact-id> [--out <path|->] [--json]`,
    pull: `Usage: handover pull <slug-or-/r/url> --out <directory> [--json]`,
    publish: `Usage:
  handover publish <directory> --title <title> [options]

Options:
  --slug <slug>       Requested stable report slug
  --entry <path>      Entry file served at the report URL
  --public            Publish publicly; otherwise organization-visible`,
    republish: `Usage:
  handover republish <directory> [--entry <path>] [--public|--organization] [--json]

The directory must contain .handover.json from a previous pull. Every file in
the directory is uploaded with replacement semantics and a new immutable revision.`,
    folders: `Usage:
  handover folders list [--json]
  handover folders create --name <name> [--slug <slug>] [--description <text>] [--json]
  handover folders add <folder-slug> <handover-id>... [--json]
  handover folders remove <folder-slug> <handover-id> [--json]`,
    "okf-export": `Usage:
  handover okf-export <handover-id> --out <bundle.tar> [--revision <revision-id>] [--json]

Creates a portable Open Knowledge Format archive containing concepts, files,
an index, update log, and Handover provenance manifest.`,
    "okf-import": `Usage:
  handover okf-import <handover-id> <bundle.tar> [--expected <revision-id>] [--mode merge|replace] [--json]

Imports the archive as an immutable revision. Replaying the same archive is
idempotent and returns the revision created by the first import.`,
  };
  return help[command];
}

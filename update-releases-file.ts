import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import { basename } from "https://deno.land/std@0.164.0/path/mod.ts";

const octokit = new Octokit({

  auth: Deno.readTextFileSync("secrets/github-pat.txt").trim(),

  userAgent: 'cscheid/quarto-regress',

  baseUrl: 'https://api.github.com',

  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error
  },

  request: {
    agent: undefined,
    fetch: undefined,
    timeout: 0
  }
});

console.log("Fetching releases...");
const releases = await octokit.paginate("GET /repos/{owner}/{repo}/releases", {
  owner: "quarto-dev",
  repo: "quarto-cli",
});

const output = JSON.stringify(releases, null, 2);

const date = new Date();
const filename = `data/quarto-releases-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.json`;

Deno.writeTextFileSync(filename, output);

try {
  Deno.removeSync("data/quarto-releases.json");
} catch {
  // pass
}

Deno.symlinkSync(basename(filename), "data/quarto-releases.json");
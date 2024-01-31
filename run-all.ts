import { expandGlobSync } from "https://deno.land/std@0.213.0/fs/mod.ts";
import { join, resolve } from "https://deno.land/std@0.213.0/path/mod.ts";

function versionLess(v1: number[], v2: number[]) {
    for (let i = 0; i < 3; i++) {
        if (v1[i] < v2[i]) {
            return true;
        }
        if (v1[i] > v2[i]) {
            return false;
        }
    }
    return false;
}

function versionEquals(v1: number[], v2: number[]) {
    for (let i = 0; i < 3; i++) {
        if (v1[i] !== v2[i]) {
            return false;
        }
    }
    return true;
}

function versionInRange(version: number[], rangeMin: number[], rangeMax: number[]) {
    if (versionEquals(version, rangeMin) || 
        versionEquals(version, rangeMax)) {
        return true;
    }
    return versionLess(version, rangeMax) && versionLess(rangeMin, version);
}

async function renderAllVersions(path: string, output: string, rangeMin?: string[], rangeMax?: string[])
{
    const releases = join("/", ...import.meta.url.split("/").slice(1,-1), `releases/v*`);
    const releaseGlob = expandGlobSync(releases);
    Deno.mkdirSync(output, { recursive: true });
    const relPath = path;
    path = resolve(path);
    output = resolve(output);

    for (const release of releaseGlob) {
        if (release.path.endsWith(".tar.gz")) {
            continue;
        }
        const releasePath = release.path;
        const version = releasePath.split('/').pop()!;
        const versionList = version.slice(1).split('.');
        if (rangeMin && rangeMax) {
            if (!versionInRange(versionList.map(Number), rangeMin.map(Number), rangeMax.map(Number))) {
                console.log("Skipping", release.path);
                continue;
            }
        }
        console.log("Processing", release.path);
        const versionPath = resolve(`${output}/${version}`);
        Deno.mkdirSync(versionPath, { recursive: true });

        await Deno.run({ cmd : ["cp", "-r", path, versionPath] }).status();
        Deno.chdir(versionPath);

        console.log([resolve(`${releasePath}/bin/quarto`), "render", relPath].join(" "));

        await Deno.run({ cmd : [resolve(`${releasePath}/bin/quarto`), "render", relPath] }).status();
    }
}

const us = new URL('', import.meta.url).pathname;

if (Deno.args.length === 0) {
    console.log(`Usage:

${us} <path> [rangeMin] [rangeMax] [output]
`);
    Deno.exit(1);
}

let rangeMin: string[] | undefined;
let rangeMax: string[] | undefined;

if (Deno.args.length > 1) {
    rangeMin = Deno.args[1].split('.');
    rangeMax = Deno.args[2].split('.');
}

await renderAllVersions(Deno.args[0], Deno.args[3] ?? "output", rangeMin, rangeMax);

import { expandGlobSync } from "https://deno.land/std@0.164.0/fs/mod.ts";

const osFilter = Deno.args[0] || "macos";

const releases = JSON.parse(await Deno.readTextFile("data/quarto-releases.json"));

for (const obj of releases) {
    const { tag_name, assets } = obj;
    const macPkg = assets.filter((asset: any) => asset.name.endsWith(`${osFilter}.tar.gz`));
    if (macPkg.length === 0) {
        continue;
    }
    // console.log(`${tag_name} ${macPkg[0].browser_download_url}`);
    try {
        Deno.statSync(`releases/${tag_name}`);
        console.log(`Release already extracted: ${macPkg[0].browser_download_url}`);
        continue;
    } catch (_e) {
        // pass
    }
    if (tag_name.startsWith("v0")) {
        // do not download v0 releases
        continue;
    }
    console.log(`Downloading ${macPkg[0].browser_download_url}`);
    const p = Deno.run({ cmd : ["curl", "-L", macPkg[0].browser_download_url, "-o", `releases/${tag_name}.tar.gz`] });
    const r = await p.status();
    if (r.code !== 0) {
        console.log(`Failed to download ${tag_name}`);
    } else {
        console.log(`Downloaded ${tag_name}`);
    }
    Deno.mkdirSync("releases/" + tag_name, { recursive: true });
    const p2 = Deno.run({ cmd : ["tar", "xzf", `releases/${tag_name}.tar.gz`, "-C", `releases/${tag_name}`] });
    await p2.status();
    console.log(`Extracted ${tag_name}`);
    Deno.removeSync(`releases/${tag_name}.tar.gz`);
}

if (!(await Deno.run({ cmd: ["which", "fdupes"] }).status()).success) {
    console.log("fdupes not found, skipping");
} else {
    console.log("Starting duplicate removal");
    await Deno.run({ cmd: ["fdupes", "--recurse", "releases", "-H", "-m"] }).status();
    console.log(`Removed duplicates`);
}

try {
    Deno.removeSync("releases/latest");    
} catch {};

Deno.symlinkSync(releases[0].tag_name, "releases/latest");

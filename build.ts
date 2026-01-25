import { rm, mkdir, cp, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");
const SRC_EXTENSION = join(ROOT, "src", "extension");

// Entry points to bundle
const ENTRYPOINTS = {
    background: join(SRC_EXTENSION, "background.ts"),
    content: join(SRC_EXTENSION, "content.ts"),
    options: join(SRC_EXTENSION, "options.ts"),
};

// Static files to copy (not bundled)
const STATIC_FILES = [
    "eld-bundle.js",
    "purify.min.js",
    "styles.css",
    "options.html",
    "options.css",
    "tailwindcss.min.js",
];

const IMAGE_FILES = ["images/icon16.png", "images/icon48.png", "images/icon128.png"];

async function clean() {
    if (existsSync(DIST)) {
        await rm(DIST, { recursive: true });
    }
}

/**
 * Bundle a single entry point using Bun.build
 */
async function bundleEntrypoint(
    entrypoint: string,
    outfile: string,
): Promise<void> {
    const result = await Bun.build({
        entrypoints: [entrypoint],
        outdir: join(DIST, "temp"),
        target: "browser",
        format: "iife",
        minify: false,
        sourcemap: "none",
        splitting: false,
    });

    if (!result.success) {
        console.error(`Build failed for ${entrypoint}:`);
        for (const log of result.logs) {
            console.error(log);
        }
        throw new Error(`Failed to bundle ${entrypoint}`);
    }

    // Read the bundled output and write to target location
    const bundledPath = result.outputs[0].path;
    const bundledContent = await Bun.file(bundledPath).text();
    await writeFile(outfile, bundledContent);
}

async function buildChrome() {
    const chromeDir = join(DIST, "chrome");
    await mkdir(join(chromeDir, "images"), { recursive: true });

    // Copy manifest
    await cp(join(ROOT, "manifest.json"), join(chromeDir, "manifest.json"));

    // Bundle JavaScript entry points
    await bundleEntrypoint(ENTRYPOINTS.background, join(chromeDir, "background.js"));
    await bundleEntrypoint(ENTRYPOINTS.content, join(chromeDir, "content.js"));
    await bundleEntrypoint(ENTRYPOINTS.options, join(chromeDir, "options.js"));

    // Copy static files
    for (const file of STATIC_FILES) {
        await cp(join(ROOT, file), join(chromeDir, file));
    }

    // Copy images
    for (const file of IMAGE_FILES) {
        await cp(join(ROOT, file), join(chromeDir, file));
    }

    console.log("Built Chrome extension -> dist/chrome/");
}

async function buildFirefox() {
    const firefoxDir = join(DIST, "firefox");
    await mkdir(join(firefoxDir, "images"), { recursive: true });

    // Copy Firefox manifest (renamed to manifest.json)
    await cp(join(ROOT, "manifest.firefox.json"), join(firefoxDir, "manifest.json"));

    // Bundle JavaScript entry points
    await bundleEntrypoint(ENTRYPOINTS.background, join(firefoxDir, "background.js"));
    await bundleEntrypoint(ENTRYPOINTS.content, join(firefoxDir, "content.js"));
    await bundleEntrypoint(ENTRYPOINTS.options, join(firefoxDir, "options.js"));

    // Copy static files
    for (const file of STATIC_FILES) {
        await cp(join(ROOT, file), join(firefoxDir, file));
    }

    // Copy images
    for (const file of IMAGE_FILES) {
        await cp(join(ROOT, file), join(firefoxDir, file));
    }

    console.log("Built Firefox extension -> dist/firefox/");
}

async function cleanupTemp() {
    const tempDir = join(DIST, "temp");
    if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true });
    }
}

async function createZips() {
    const version = (await Bun.file(join(ROOT, "manifest.json")).json()).version;

    // Create Chrome zip
    const chromeProc = Bun.spawn(
        ["zip", "-r", `../translator-${version}-chrome.zip`, "."],
        { cwd: join(DIST, "chrome") },
    );
    await chromeProc.exited;

    // Create Firefox zip
    const firefoxProc = Bun.spawn(
        ["zip", "-r", `../translator-${version}-firefox.zip`, "."],
        { cwd: join(DIST, "firefox") },
    );
    await firefoxProc.exited;

    console.log(`Created dist/translator-${version}-chrome.zip`);
    console.log(`Created dist/translator-${version}-firefox.zip`);
}

async function main() {
    const shouldZip = process.argv.includes("--zip");

    console.log("Cleaning dist/...");
    await clean();

    console.log("Building extensions...");
    await buildChrome();
    await buildFirefox();

    // Clean up temp directory used by bundler
    await cleanupTemp();

    if (shouldZip) {
        console.log("Creating zip files...");
        await createZips();
    }

    console.log("Done!");
}

main().catch(console.error);

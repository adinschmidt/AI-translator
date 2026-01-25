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
    "assets/eld-bundle.js",
    "assets/purify.min.js",
    "assets/styles.css",
    "assets/options.html",
    "assets/options.css",
    "assets/tailwindcss.min.js",
];

const IMAGE_FILES = [
    "assets/images/icon16.png",
    "assets/images/icon48.png",
    "assets/images/icon128.png",
];

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

async function buildExtension(
    target: "chrome" | "firefox",
    manifestSource: string,
) {
    const targetDir = join(DIST, target);
    await mkdir(join(targetDir, "images"), { recursive: true });

    await cp(join(ROOT, manifestSource), join(targetDir, "manifest.json"));

    await bundleEntrypoint(ENTRYPOINTS.background, join(targetDir, "background.js"));
    await bundleEntrypoint(ENTRYPOINTS.content, join(targetDir, "content.js"));
    await bundleEntrypoint(ENTRYPOINTS.options, join(targetDir, "options.js"));

    for (const file of STATIC_FILES) {
        const destPath = file.replace("assets/", "");
        await cp(join(ROOT, file), join(targetDir, destPath));
    }

    for (const file of IMAGE_FILES) {
        const destPath = file.replace("assets/", "");
        await cp(join(ROOT, file), join(targetDir, destPath));
    }

    console.log(`Built ${target} extension -> dist/${target}/`);
}

async function buildChrome() {
    await buildExtension("chrome", "manifest.json");
}

async function buildFirefox() {
    await buildExtension("firefox", "manifest.firefox.json");
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

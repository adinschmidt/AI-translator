import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface MessageEntry {
    message?: string;
}

type MessagesMap = Record<string, MessageEntry>;

const ROOT = import.meta.dir.endsWith("/scripts")
    ? import.meta.dir.slice(0, -"/scripts".length)
    : import.meta.dir;
const LOCALES_DIR = join(ROOT, "_locales");
const BASE_LOCALE = "en";

function extractPlaceholders(message: string): string[] {
    return Array.from(new Set(message.match(/\$\d+/g) || [])).sort();
}

function extractHtmlTags(message: string): string[] {
    return Array.from(
        new Set(
            (message.match(/<\/?[a-zA-Z0-9-]+/g) || []).map((tag) =>
                tag.replace(/^<\//, "<").toLowerCase(),
            ),
        ),
    ).sort();
}

function asKeySet(values: string[]): string {
    return values.join(",");
}

async function readMessages(locale: string): Promise<MessagesMap> {
    const path = join(LOCALES_DIR, locale, "messages.json");
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as MessagesMap;
}

async function main() {
    const localeDirs = (await readdir(LOCALES_DIR, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    if (!localeDirs.includes(BASE_LOCALE)) {
        throw new Error(`Missing base locale: ${BASE_LOCALE}`);
    }

    const baseMessages = await readMessages(BASE_LOCALE);
    const baseKeys = Object.keys(baseMessages).sort();

    let hasErrors = false;

    for (const locale of localeDirs) {
        if (locale === BASE_LOCALE) {
            continue;
        }

        const messages = await readMessages(locale);
        const keys = Object.keys(messages).sort();
        const missing = baseKeys.filter((key) => !(key in messages));
        const extra = keys.filter((key) => !(key in baseMessages));

        if (missing.length > 0 || extra.length > 0) {
            hasErrors = true;
            console.error(
                `[${locale}] key mismatch: ${keys.length}/${baseKeys.length} keys`,
            );
            if (missing.length > 0) {
                console.error(`  missing (${missing.length}): ${missing.join(", ")}`);
            }
            if (extra.length > 0) {
                console.error(`  extra (${extra.length}): ${extra.join(", ")}`);
            }
        }

        for (const key of baseKeys) {
            const baseMessage = baseMessages[key]?.message || "";
            const localeMessage = messages[key]?.message || "";

            const basePlaceholders = asKeySet(extractPlaceholders(baseMessage));
            const localePlaceholders = asKeySet(extractPlaceholders(localeMessage));
            if (basePlaceholders !== localePlaceholders) {
                hasErrors = true;
                console.error(
                    `[${locale}] placeholder mismatch for "${key}": expected "${basePlaceholders}", got "${localePlaceholders}"`,
                );
            }

            if (key.toLowerCase().endsWith("html")) {
                const baseTags = asKeySet(extractHtmlTags(baseMessage));
                const localeTags = asKeySet(extractHtmlTags(localeMessage));
                if (baseTags !== localeTags) {
                    hasErrors = true;
                    console.error(
                        `[${locale}] HTML tag mismatch for "${key}": expected "${baseTags}", got "${localeTags}"`,
                    );
                }
            }
        }
    }

    if (hasErrors) {
        process.exitCode = 1;
        return;
    }

    console.log(
        `i18n check passed: ${baseKeys.length} keys across ${localeDirs.length} locales`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

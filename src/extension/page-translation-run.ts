export interface RegionTranslationUnit {
    parentElement: Element;
    runId: string;
    regionId: string;
    html: string;
    chunkIndex?: number;
    totalChunks?: number;
}

export interface HtmlTranslationOnUpdateMeta {
    batchIndex: number;
    batchCount: number;
    batchSize?: number;
    subBatchIndex?: number;
    subBatchCount?: number;
    subBatchSize?: number;
}

export interface HtmlTranslationResultItem {
    id: string | number;
    translatedHtml: string;
    error?: string;
}

export interface PageTranslationProgress {
    translatedChunks: number;
    totalChunks: number;
    errorCount: number;
    batchInfo: HtmlTranslationOnUpdateMeta | null;
}

export interface PageTranslationSummary extends PageTranslationProgress {
    successCount: number;
}

type ApplyRegionTranslation = (
    parentElement: Element,
    regionId: string,
    translatedHtml: string,
) => boolean;

interface RegionEntry {
    parentElement: Element;
    chunks: Map<number, { translatedHtml: string; error?: string }>;
    totalChunks: number;
    translatedChunkIndices: Set<number>;
    applied: boolean;
    hasError: boolean;
}

export class FullPageTranslationRun {
    readonly parentElements = new Set<Element>();
    cancelled = false;
    htmlTranslationRequestId: string | null = null;
    htmlTranslationPort: chrome.runtime.Port | null = null;

    private units: RegionTranslationUnit[] = [];
    private regionChunks = new Map<string, RegionEntry>();
    private successCount = 0;
    private errorCount = 0;
    private translatedChunks = 0;
    private latestBatchInfo: HtmlTranslationOnUpdateMeta | null = null;

    constructor(readonly runId: string) {}

    get totalChunks(): number {
        return this.units.length;
    }

    setUnits(units: RegionTranslationUnit[]): void {
        this.units = units;
        this.regionChunks.clear();
        this.parentElements.clear();
        this.successCount = 0;
        this.errorCount = 0;
        this.translatedChunks = 0;
        this.latestBatchInfo = null;

        for (const unit of units) {
            const total = unit.totalChunks || 1;
            this.parentElements.add(unit.parentElement);

            let entry = this.regionChunks.get(unit.regionId);
            if (!entry) {
                entry = {
                    parentElement: unit.parentElement,
                    chunks: new Map(),
                    totalChunks: total,
                    translatedChunkIndices: new Set(),
                    applied: false,
                    hasError: false,
                };
                this.regionChunks.set(unit.regionId, entry);
            } else {
                entry.totalChunks = Math.max(entry.totalChunks, total);
            }
        }
    }

    cancel(): void {
        this.cancelled = true;
    }

    getProgress(): PageTranslationProgress {
        return {
            translatedChunks: this.translatedChunks,
            totalChunks: this.totalChunks,
            errorCount: this.errorCount,
            batchInfo: this.latestBatchInfo,
        };
    }

    handleResults(
        results: HtmlTranslationResultItem[],
        batchInfo: HtmlTranslationOnUpdateMeta | null,
        applyRegionTranslation: ApplyRegionTranslation,
    ): PageTranslationProgress {
        if (this.cancelled || results.length === 0) {
            return this.getProgress();
        }

        if (batchInfo) {
            this.latestBatchInfo = batchInfo;
        }

        for (const result of results) {
            const unit = this.units[Number(result.id)];
            if (!unit) {
                console.warn(`translatePageV3: no unit found for id ${result.id}`);
                continue;
            }

            const entry = this.regionChunks.get(unit.regionId);
            if (!entry) {
                continue;
            }

            const chunkIndex = unit.chunkIndex ?? 0;
            const translatedHtml = result.translatedHtml;
            const hasTranslation = translatedHtml.trim().length > 0;

            if (hasTranslation && !entry.translatedChunkIndices.has(chunkIndex)) {
                entry.translatedChunkIndices.add(chunkIndex);
                this.translatedChunks++;
            }

            entry.chunks.set(chunkIndex, {
                translatedHtml,
                error: result.error,
            });

            if (result.error) {
                this.markRegionError(
                    unit.regionId,
                    entry,
                    result.error || "Chunk translation error",
                    `translatePageV3: region ${unit.regionId} has chunk error: ${result.error}`,
                );
            }

            if (!entry.hasError) {
                this.applyRegionIfReady(
                    unit.regionId,
                    entry,
                    applyRegionTranslation,
                );
            }
        }

        return this.getProgress();
    }

    finalize(applyRegionTranslation: ApplyRegionTranslation): PageTranslationSummary {
        if (!this.cancelled) {
            for (const [regionId, entry] of this.regionChunks) {
                if (entry.applied || entry.hasError) {
                    continue;
                }
                if (entry.chunks.size < entry.totalChunks) {
                    this.markRegionError(
                        regionId,
                        entry,
                        "Missing chunk translation",
                        `translatePageV3: region ${regionId} missing chunk results`,
                    );
                    continue;
                }
                this.applyRegionIfReady(regionId, entry, applyRegionTranslation);
            }
        }

        return {
            ...this.getProgress(),
            successCount: this.successCount,
        };
    }

    private markRegionError(
        regionId: string,
        entry: RegionEntry,
        message: string,
        logMessage?: string,
    ): void {
        if (entry.hasError) {
            return;
        }
        entry.hasError = true;
        this.errorCount++;
        if (logMessage) {
            console.warn(logMessage);
        }
        console.warn(`Region ${regionId} failed: ${message}`);
    }

    private applyRegionIfReady(
        regionId: string,
        entry: RegionEntry,
        applyRegionTranslation: ApplyRegionTranslation,
    ): void {
        if (this.cancelled || entry.applied || entry.hasError) {
            return;
        }
        if (entry.chunks.size < entry.totalChunks) {
            return;
        }

        const orderedChunks = Array.from(entry.chunks.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, chunk]) => chunk);

        const errorChunk = orderedChunks.find((chunk) => chunk.error);
        if (errorChunk) {
            this.markRegionError(
                regionId,
                entry,
                errorChunk.error || "Chunk translation error",
                `translatePageV3: region ${regionId} has chunk error: ${errorChunk.error}`,
            );
            return;
        }

        const missingChunk = orderedChunks.find(
            (chunk) => !chunk.translatedHtml || !chunk.translatedHtml.trim(),
        );
        if (missingChunk) {
            this.markRegionError(
                regionId,
                entry,
                "Missing chunk translation",
                `translatePageV3: region ${regionId} has missing chunk translation`,
            );
            return;
        }

        const combinedHtml = orderedChunks
            .map((chunk) => chunk.translatedHtml)
            .join(" ");

        if (!combinedHtml.trim()) {
            this.markRegionError(
                regionId,
                entry,
                "Empty combined translation",
                `translatePageV3: region ${regionId} has empty combined translation`,
            );
            return;
        }

        if (applyRegionTranslation(entry.parentElement, regionId, combinedHtml)) {
            this.successCount++;
            entry.applied = true;
            return;
        }

        this.markRegionError(
            regionId,
            entry,
            "Region apply failed, preserving original content",
        );
    }
}

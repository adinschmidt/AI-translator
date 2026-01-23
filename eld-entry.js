// Entry point for bundling ELD for browser extension use
// Using the static extrasmall build for smallest size
import { eld } from 'eld/extrasmall';

// Export to globalThis for browser extension access
globalThis.ELD = eld;

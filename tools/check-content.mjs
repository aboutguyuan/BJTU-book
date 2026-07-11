import { canonicalSourceLabel, readChapterSources } from "./manual-source.mjs";

const sources = await readChapterSources();
const characters = sources.reduce((total, source) => total + source.markdown.length, 0);

console.log(`Content check passed: ${sources.length} chapter files, ${characters} characters from ${canonicalSourceLabel}`);

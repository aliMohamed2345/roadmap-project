import AdmZip from "adm-zip";

// Folders we never want to feed to the AI (noise, not source code)
const IGNORED_DIR_PATTERNS = [
    "node_modules/",
    ".git/",
    "dist/",
    "build/",
    ".next/",
    ".dart_tool/",
    ".idea/",
    ".vscode/",
    "coverage/",
    "__pycache__/",
    ".venv/",
    "venv/",
    "vendor/",
    ".gradle/",
    "Pods/",
    ".firebase/",
];

// Extensions we treat as binary / not worth reading as text
const BINARY_EXTENSIONS = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg",
    ".mp4", ".mov", ".avi", ".mkv", ".mp3", ".wav", ".ogg",
    ".pdf", ".zip", ".rar", ".7z", ".tar", ".gz",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".class", ".jar",
    ".lock", // package-lock.json kept, but yarn.lock/pubspec.lock are huge & low value
    ".ds_store",
]);

// Hard limits to keep the payload sane for the Gemini call
const MAX_FILE_CHARS = 20_000;       // skip reading single files bigger than this
const MAX_TOTAL_CHARS = 180_000;     // stop appending once combined text hits this
const MAX_FILES_LISTED = 2_000;      // safety cap on the file tree listing

function isIgnoredPath(entryName) {
    const lower = entryName.toLowerCase();
    return IGNORED_DIR_PATTERNS.some((pattern) => lower.includes(pattern));
}

function getExtension(entryName) {
    const idx = entryName.lastIndexOf(".");
    if (idx === -1) return "";
    return entryName.slice(idx).toLowerCase();
}

/**
 * Heuristic check for binary content: if the buffer contains a NUL byte
 * within the first chunk, treat it as non-text.
 */
function looksBinary(buffer) {
    const sampleSize = Math.min(buffer.length, 1000);
    for (let i = 0; i < sampleSize; i++) {
        if (buffer[i] === 0) return true;
    }
    return false;
}

/**
 * Extracts readable source/text content from a zip buffer so it can be
 * handed to an LLM for review.
 *
 * @param {Buffer} zipBuffer - raw bytes of the uploaded .zip file
 * @returns {{
 *   fileTree: string[],
 *   combinedText: string,
 *   totalEntries: number,
 *   readableFiles: number,
 *   skippedFiles: number,
 *   truncated: boolean
 * }}
 */
export function extractTextFromZip(zipBuffer) {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    const fileTree = [];
    const textChunks = [];

    let totalEntries = 0;
    let readableFiles = 0;
    let skippedFiles = 0;
    let totalChars = 0;
    let truncated = false;

    for (const entry of entries) {
        if (entry.isDirectory) continue;

        const name = entry.entryName;
        if (isIgnoredPath(name)) continue;

        totalEntries++;

        if (fileTree.length < MAX_FILES_LISTED) {
            fileTree.push(name);
        }

        if (truncated) {
            skippedFiles++;
            continue;
        }

        const ext = getExtension(name);
        if (BINARY_EXTENSIONS.has(ext)) {
            skippedFiles++;
            continue;
        }

        let buffer;
        try {
            buffer = entry.getData();
        } catch {
            skippedFiles++;
            continue;
        }

        if (!buffer || buffer.length === 0) {
            skippedFiles++;
            continue;
        }

        if (looksBinary(buffer)) {
            skippedFiles++;
            continue;
        }

        let content = buffer.toString("utf8");
        if (content.length > MAX_FILE_CHARS) {
            content = `${content.slice(0, MAX_FILE_CHARS)}\n...[truncated, file too large]...`;
        }

        const chunk = `\n\n===== FILE: ${name} =====\n${content}`;

        if (totalChars + chunk.length > MAX_TOTAL_CHARS) {
            truncated = true;
            skippedFiles++;
            continue;
        }

        textChunks.push(chunk);
        totalChars += chunk.length;
        readableFiles++;
    }

    return {
        fileTree,
        combinedText: textChunks.join(""),
        totalEntries,
        readableFiles,
        skippedFiles,
        truncated,
    };
}

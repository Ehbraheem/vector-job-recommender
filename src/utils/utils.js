import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

/**
 * Local require (like CommonJS `require`).
 * Good for loading local CJS files.
 */
export function localRequire(importMetaUrl) {
  // Create a `require` that resolves relative to the caller file
  const __dirname = dirname(fileURLToPath(importMetaUrl));

  return createRequire(pathToFileURL(__dirname + "/"));
}

/**
 * Native require (like CommonJS `require`).
 * Good for loading node_modules or global packages.
 */
export function nativeRequire(importMetaUrl) {
  return createRequire(importMetaUrl);
}

export function flattenJob({
  jobTitle,
  jobDescription,
  jobType,
  location,
  jobResponsibilities,
}) {
  return `${jobTitle}. ${jobType}. ${location}. jobDescription. Responsibilities: ${jobResponsibilities.join(
    ", "
  )}`;
}

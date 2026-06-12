import { readFile } from "node:fs/promises";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const packageJson = await readJson("package.json");
const manifest = await readJson("src/public/manifest.json");
const tag = process.argv[2];

if (packageJson.version !== manifest.version) {
  throw new Error(
    `Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`
  );
}

if (tag) {
  const tagVersion = tag.startsWith("v") ? tag.slice(1) : tag;
  if (tagVersion !== manifest.version) {
    throw new Error(
      `Tag mismatch: tag=${tag}, extension version=${manifest.version}`
    );
  }
}

console.log(`Extension version ${manifest.version} is valid.`);

import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const artifactDirectory = path.resolve("web-ext-artifacts");
const filename = `${packageJson.name.replaceAll("-", "_")}-${packageJson.version}.zip`;
const archivePath = path.join(artifactDirectory, filename);

await mkdir(artifactDirectory, { recursive: true });
await rm(archivePath, { force: true });

await new Promise((resolve, reject) => {
  const zip = spawn(
    "zip",
    ["-q", "-r", archivePath, ".", "-x", ".DS_Store", "*/.DS_Store"],
    {
      cwd: path.resolve("dist"),
      stdio: "inherit"
    }
  );

  zip.on("error", reject);
  zip.on("exit", (code) => {
    if (code === 0) {
      resolve();
      return;
    }

    reject(new Error(`zip exited with code ${code}`));
  });
});

console.log(`Firefox package created: ${path.relative(process.cwd(), archivePath)}`);

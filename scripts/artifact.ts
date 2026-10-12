import fs from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';

const archiveDirectory = path.resolve('dist');
const outputPath = path.resolve('seoyedoum.zip');

async function artifact() {
  const fileNames = await fs.promises.readdir(archiveDirectory, { recursive: true });
  const files = await Promise.all(
    fileNames.map(async (fileName) => {
      const absolutePath = path.join(archiveDirectory, fileName);
      const stat = await fs.promises.stat(absolutePath);
      return { absolutePath, directory: stat.isDirectory(), relativePath: fileName };
    }),
  );
  const artifactFiles = files
    .filter((file) => !file.directory && !file.relativePath.includes('.DS_Store') && !file.relativePath.endsWith('.zip'))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const output = fs.createWriteStream(outputPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.pipe(output);
  artifactFiles.forEach((file) => archive.file(file.absolutePath, { name: file.relativePath }));

  await new Promise<void>((resolve, reject) => {
    archive.on('error', reject);
    output.on('error', reject);
    output.on('close', resolve);
    void archive.finalize();
  });

  console.log(`Artifact created: ${outputPath} (${artifactFiles.length} files, ${archive.pointer()} bytes)`);
}

artifact().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

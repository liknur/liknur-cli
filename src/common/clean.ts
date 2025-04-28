import { readdir, stat, rm, rename } from 'fs/promises';
import { PathLike } from 'fs';
import path from 'path';

export async function clearDirectoryExcept(directoryPath : PathLike, exceptions : ReadonlyArray<string> = []) : Promise<void> {
  const entries = await readdir(directoryPath);

  for (const entry of entries) {
    const fullPath = path.join(directoryPath.toString(), entry);

    if (exceptions.includes(entry)) {
      continue;
    }

    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      await rm(fullPath, { recursive: true, force: true });
    } else {
      await rm(fullPath);
    }
  }
}



import { readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import writeFileAtomic from 'write-file-atomic';

export async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultValue;
    }
    throw err;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFileAtomic(filePath, JSON.stringify(data, null, 2) + '\n');
}

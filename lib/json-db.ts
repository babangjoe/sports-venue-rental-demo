import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'dbjson');

export async function readJSON(fileName: string): Promise<any[]> {
  const filePath = path.join(DB_DIR, `${fileName}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileName}.json:`, error);
    return [];
  }
}

export async function writeJSON(fileName: string, data: any[]): Promise<void> {
  const filePath = path.join(DB_DIR, `${fileName}.json`);
  try {
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      await fs.promises.mkdir(DB_DIR, { recursive: true });
    }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${fileName}.json:`, error);
    throw error;
  }
}

export async function getNextId(fileName: string): Promise<number> {
    const data = await readJSON(fileName);
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map((item: any) => item.id || 0));
    return maxId + 1;
}

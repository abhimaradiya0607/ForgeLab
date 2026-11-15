import fs from 'node:fs/promises';
import path from 'node:path';

export async function add(filePath) {
    const cwd = process.cwd();
    const source = path.resolve(cwd, filePath);
    const relative = path.relative(cwd, source).split(path.sep).join('/');

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('The file must be inside the project folder.');
    }
    if (relative.startsWith('.ForgeLab')) {
        throw new Error('Files inside .ForgeLab cannot be added.');
    }

    const target = path.join(cwd, '.ForgeLab', 'staging', relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
    console.log(`Added ${relative} to the staging area`);
}

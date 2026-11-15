import fs from 'node:fs/promises';
import path from 'node:path';

export async function addRepo(filePath) {
    const stagingPath = path.resolve(process.cwd(), '.ForgeLab', 'staging');
    const source = path.resolve(filePath);
    const relative = path.relative(process.cwd(), source);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        console.error('The file must be inside the project folder.');
        return;
    }

    if (relative.startsWith('.ForgeLab')) {
        console.error('Files inside .ForgeLab cannot be added.');
        return;
    }

    try {
        const target = path.join(stagingPath, relative);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.copyFile(source, target);

        console.log(`Added ${relative} to the staging area`);
    } catch (err) {
        console.error('Error adding file:', err.message);
    }
}
import fs from 'node:fs/promises';
import path from 'node:path';

export async function addRepo(filePath) {
    const repopath=path.resolve(process.cwd(),".ForgeLab");
    const stagingPath=path.resolve(repopath,"staging");
    try {
        await fs.mkdir(stagingPath,{recursive:true});
        const fileName=path.basename(filePath);
        await fs.copyFile(filePath,path.join(stagingPath,fileName));
        console.log(`File ${fileName} added to the staging area!`);
    } catch (err) {
        console.error("Error adding file ",err);
    }
}
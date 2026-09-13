import fs from 'node:fs/promises';
import path from 'node:path';

export async function revertRepo(commitID) {
    if (!commitID) {
        console.error("Unable to revert: commit ID is required");
        return;
    }

    const repopath=path.resolve(process.cwd(),".ForgeLab");
    const commitsPath=path.join(repopath,"commits");

    try {
        const commitDir=path.join(commitsPath,commitID);
        const files=await fs.readdir(commitDir);
        const parentDir=path.resolve(repopath,'..');

        for(const file of files){
            if (file === "commit.json") continue;
            await fs.copyFile(path.join(commitDir,file),path.join(parentDir,file));
        }
        console.log(`Commit ${commitID} revertedd successfullyy!!`);
        
    } catch (error) {
        console.error("Unable to revert: ",error);
        
    }
}
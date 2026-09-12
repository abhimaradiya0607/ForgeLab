import fs from 'node:fs/promises';
import path from 'node:path';

export async function initRepo() {
    const repoPath=path.resolve(process.cwd(),'.ForgeLab');
    const commitPath=path.resolve(repoPath,'commits');
    try {
        await fs.mkdir(repoPath,{recursive:true});
        await fs.mkdir(commitPath,{recursive:true});
        await fs.writeFile(
            path.join(repoPath,"config.json"),
            JSON.stringify({bucket:process.env.S3_BUCKET})
        );
        console.log('Repository Initialized Successfullyy');
    } catch (err) {
        console.error('Error in initializing repoo',err);
    }
}
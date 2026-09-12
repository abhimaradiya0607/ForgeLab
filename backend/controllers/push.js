import fs from 'node:fs/promises';
import path from 'node:path';
import {s3,s3_BUCKET} from '../config/aws-config.js';

export async function pushRepo(params) {
    const repopath=path.resolve(process.cwd(),".ForgeLab");
    const commitspath=path.resolve(repopath,"commits");

    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error("Missing AWS credentials. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to backend/.env");
            return;
        }

        const commitDirs=await fs.readdir(commitspath);

        for(const commitDir of commitDirs){
            const commitPath=path.join(commitspath,commitDir);
            const files=await fs.readdir(commitPath);

            for(const file of files){
                const filePath=path.join(commitPath,file);
                const fileContent=await fs.readFile(filePath);
                const uploadParams={
                    Bucket:s3_BUCKET,
                    Key:`commits/${commitDir}/${file}`,
                    Body:fileContent
                };
                await s3.upload(uploadParams).promise();
            }
        }
        console.log('All commmits pushed to s3');
    } catch (err) {
        console.error("Error pushing to s3 ",err);
    }
}
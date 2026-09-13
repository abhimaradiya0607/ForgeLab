import fs from 'node:fs/promises';
import path from 'node:path';
import {s3,s3_BUCKET} from '../config/aws-config.js';

export async function pullRepo() {
    const repopath=path.resolve(process.cwd(),".ForgeLab");
    const commitPath=path.join(repopath,'commits');

    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error("Missing AWS credentials. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to backend/.env");
            return;
        }

        const data=await s3.listObjectsV2({
            Bucket:s3_BUCKET,
            Prefix:"commits/"
        }).promise();

        const objects=data.Contents || [];
        if (objects.length===0) {
            console.log("No commits found in s3");
            return;
        }

        for(const object of objects){
            const key=object.Key;
            if (!key || key.endsWith("/")) continue;

            const commitDir=path.join(
                commitPath,
                path.dirname(key).split("/").pop()
            );

            await fs.mkdir(commitDir,{recursive:true});

            const fileContent=await s3.getObject({
                Bucket:s3_BUCKET,
                Key:key,
            }).promise();

            await fs.writeFile(path.join(repopath,key),fileContent.Body);
        }

        console.log("All commits pulled from s3");
    } catch (error) {
        console.error('Error in pulling repo :',error);
    }
}

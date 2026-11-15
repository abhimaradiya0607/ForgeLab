import fs from 'node:fs/promises';
import path from 'node:path';
import { s3, s3_BUCKET } from '../config/aws-config.js';
import { readRepoConfig } from './utils/files.js';

export async function pullRepo() {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error('Missing AWS credentials. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to backend/.env');
            return;
        }

        const { repoId } = await readRepoConfig();
        const prefix = `repos/${repoId}/commits/`;
        const commitsPath = path.resolve(process.cwd(), '.ForgeLab', 'commits');

        // Collect every object key, following pagination
        const keys = [];
        let token;
        do {
            const page = await s3.listObjectsV2({
                Bucket: s3_BUCKET,
                Prefix: prefix,
                ContinuationToken: token,
            }).promise();

            keys.push(...(page.Contents || []).map((obj) => obj.Key));
            token = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (token);

        if (keys.length === 0) {
            console.log('No commits found for this repo on S3');
            return;
        }

        for (const key of keys) {
            const rel = key.slice(prefix.length);
            if (!rel || rel.endsWith('/')) continue;

            const dest = path.join(commitsPath, rel);
            await fs.mkdir(path.dirname(dest), { recursive: true });

            const obj = await s3.getObject({ Bucket: s3_BUCKET, Key: key }).promise();
            await fs.writeFile(dest, obj.Body);
        }

        console.log(`Pulled ${keys.length} file(s) from S3`);
    } catch (err) {
        console.error('Error pulling from S3:', err.message);
    }
}
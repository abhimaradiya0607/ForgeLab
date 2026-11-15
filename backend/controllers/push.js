import fs from 'node:fs/promises';
import path from 'node:path';
import { s3, s3_BUCKET } from '../config/aws-config.js';
import { listFiles, readRepoConfig } from './utils/files.js';

// Lists every key under a prefix, following pagination
async function listKeys(prefix) {
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

    return keys;
}

export async function pushRepo() {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error('Missing AWS credentials. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to backend/.env');
            return;
        }

        const { repoId } = await readRepoConfig();
        const repoPrefix = `repos/${repoId}/`;
        const commitsPath = path.resolve(process.cwd(), '.ForgeLab', 'commits');

        let commitIds = [];
        try {
            commitIds = await fs.readdir(commitsPath);
        } catch {
            console.log('No commits to push. Run: forgelab commit "message"');
            return;
        }

        // One listing tells us what is already on S3, so we skip it
        const existing = new Set(await listKeys(`${repoPrefix}commits/`));

        const commits = [];
        let uploaded = 0;
        let skipped = 0;

        for (const commitId of commitIds) {
            const commitDir = path.join(commitsPath, commitId);
            const meta = JSON.parse(await fs.readFile(path.join(commitDir, 'commit.json'), 'utf8'));

            // Older commits don't store a file list, so read the folder instead
            const files = meta.files ?? (await listFiles(commitDir)).filter((f) => f !== 'commit.json');

            commits.push({ id: commitId, message: meta.message, date: meta.date, files });

            for (const rel of [...files, 'commit.json']) {
                const key = `${repoPrefix}commits/${commitId}/${rel}`;

                if (existing.has(key)) {
                    skipped += 1;
                    continue;
                }

                await s3.upload({
                    Bucket: s3_BUCKET,
                    Key: key,
                    Body: await fs.readFile(path.join(commitDir, rel)),
                }).promise();

                uploaded += 1;
            }
        }

        // Build the index: newest commit first, and the latest commit for each file
        commits.sort((a, b) => new Date(b.date) - new Date(a.date));

        const files = {};
        for (const commit of [...commits].reverse()) {
            for (const file of commit.files) {
                files[file] = commit.id;
            }
        }

        await s3.upload({
            Bucket: s3_BUCKET,
            Key: `${repoPrefix}index.json`,
            Body: JSON.stringify({ commits, files }),
            ContentType: 'application/json',
        }).promise();

        console.log(`Pushed ${uploaded} new file(s), skipped ${skipped} already on S3. Index updated.`);
    } catch (err) {
        console.error('Error pushing to S3:', err.message);
    }
}
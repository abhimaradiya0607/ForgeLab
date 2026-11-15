import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.S3_BUCKET;

// Credentials come from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the environment
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// Same key layout as before, so existing data keeps working
export const commitKey = (repoId, commitId, path) =>
    `repos/${repoId}/commits/${commitId}/${path}`;

// Short-lived link that allows one upload to one exact key
export const presignPut = (key) =>
    getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 });

// Short-lived link that allows one download of one exact key
export const presignGet = (key) =>
    getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 });

// True if the object exists. A missing object is a normal answer, not an error.
export async function exists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
        throw err;
    }
}

// Every key under a prefix, following pagination
export async function listKeys(prefix) {
    const keys = [];
    let token;

    do {
        const page = await s3.send(
            new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token })
        );
        keys.push(...(page.Contents || []).map((obj) => obj.Key));
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);

    return keys;
}

export async function readText(key) {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return res.Body.transformToString();
}

// Returns null when the object doesn't exist yet
export async function readJsonOrNull(key) {
    try {
        return JSON.parse(await readText(key));
    } catch (err) {
        if (err.name === 'NoSuchKey') return null;
        throw err;
    }
}

export async function writeJson(key, data) {
    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: JSON.stringify(data),
            ContentType: 'application/json',
        })
    );
}

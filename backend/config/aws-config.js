import AWS from "aws-sdk";
import { loadEnv } from "./load-env.js";

loadEnv();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "ap-south-1";

const awsConfig = { region };
if (accessKeyId && secretAccessKey) {
    awsConfig.accessKeyId = accessKeyId;
    awsConfig.secretAccessKey = secretAccessKey;
}

AWS.config.update(awsConfig);

export const s3 = new AWS.S3();
export const s3_BUCKET = process.env.S3_BUCKET || "forge-lab-bucket";

import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load .env explicitly so these values are not shadowed by
// the AWS SDK credential chain (e.g. ~/.aws/credentials or env exports
// from a previous shell session).
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error("[FATAL] AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY missing from .env");
  process.exit(1);
}

// Log which key the S3 client is using (first 8 chars only for security)
console.log(`[S3 Client] Using access key: ${accessKeyId.substring(0, 8)}...`);

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    // Explicitly supply credentials so the SDK never falls back to
    // ~/.aws/credentials, EC2 instance metadata, or any other source.
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export default s3Client;

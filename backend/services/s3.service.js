import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../utils/s3.js";

const DEFAULT_EXPIRY = 3600; // 1 hour

/**
 * Generate a presigned PUT URL to allow direct client upload to S3
 */
export const getPresignedUploadUrl = async (bucketName, key, contentType) => {
    try {
        console.log("=== S3 PRESIGNED UPLOAD GENERATION ===");
        console.log(`- Bucket Name: ${bucketName}`);
        console.log(`- Object Key: ${key}`);
        console.log(`- Content-Type: ${contentType}`);
        console.log(`- Expiry Time: ${DEFAULT_EXPIRY} seconds`);
        console.log(`- Request Method: PUT`);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
        });

        // Generate the presigned URL
        const url = await getSignedUrl(s3Client, command, { expiresIn: DEFAULT_EXPIRY });
        console.log(`- Generated Presigned URL successfully: ${url.substring(0, 150)}...`);
        return url;
    } catch (error) {
        console.error("=== S3 PRESIGNED UPLOAD ERROR ===");
        console.error("AWS SDK Error generating presigned upload URL:", error);
        throw error;
    }
};

/**
 * Generate a presigned GET URL for secure video playback (authorized students)
 */
export const getPresignedPlaybackUrl = async (bucketName, key) => {
    try {


        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: DEFAULT_EXPIRY });
        return url;
    } catch (error) {
        console.error("Error generating presigned playback URL:", error);
        throw error;
    }
};

/**
 * Delete a media file from S3
 */
export const deleteFileFromS3 = async (bucketName, key) => {
    try {


        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw error;
    }
};

/**
 * Upload a local file (from Multer temp storage) to AWS S3
 */
import fs from 'fs';
export const uploadLocalFileToS3 = async (filePath, bucketName, key, contentType) => {
    try {


        const fileContent = fs.readFileSync(filePath);
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
        });

        await s3Client.send(command);
        
        // Clean up local temp file
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.warn("Could not delete temp file:", err);
        }

        return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("Error uploading local file to S3:", error);
        throw error;
    }
};


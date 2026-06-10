import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner reference is required']
    },
    s3Key: {
        type: String,
        required: [true, 'S3 key is required'],
        unique: true,
        trim: true
    },
    bucketName: {
        type: String,
        required: [true, 'Bucket name is required']
    },
    fileType: {
        type: String,
        required: [true, 'File type is required']
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required']
    },
    duration: {
        type: Number,
        default: 0
    },
    processingStatus: {
        type: String,
        enum: ['pending', 'uploaded', 'ready', 'failed'],
        default: 'pending'
    },
    rawUrl: {
        type: String
    },
    hlsUrl: {
        type: String
    }
}, {
    timestamps: true
});

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

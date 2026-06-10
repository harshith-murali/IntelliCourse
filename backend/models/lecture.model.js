import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lecture title is required'],
        trim: true,
        maxLength: [100, 'Lecture title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Lecture description is required'],
        trim: true,
        maxLength: [500, 'Lecture description cannot exceed 500 characters']
    },
    sectionId: {
        type: String,
        trim: true
    },
    sectionTitle: {
        type: String,
        required: [true, 'Section or module title is required'],
        trim: true,
        maxLength: [120, 'Section title cannot exceed 120 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxLength: [10000, 'Lecture notes cannot exceed 10000 characters']
    },
    transcript: {
        type: String,
        trim: true,
        maxLength: [50000, 'Lecture transcript cannot exceed 50000 characters']
    },
    videoUrl: {
        type: String
    },
    duration: {
        type: Number,
        default: 0
    },
    thumbnailUrl: {
        type: String,
        trim: true
    },
    thumbnailKey: {
        type: String,
        trim: true
    },
    s3Key: {
        type: String
    },
    mediaAsset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset'
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    objectives: [{
        type: String,
        trim: true,
        maxLength: [240, 'Learning objective cannot exceed 240 characters']
    }],
    resources: [{
        title: {
            type: String,
            trim: true,
            maxLength: [100, 'Resource title cannot exceed 100 characters']
        },
        url: {
            type: String,
            trim: true
        }
    }],
    order: {
        type: Number,
        required: [true, 'Lecture order is required']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

lectureSchema.virtual('durationSeconds').get(function() {
    return this.duration || 0;
});

// Format duration before saving
lectureSchema.pre('save', function(next) {
    if (this.duration) {
        // Round duration to 2 decimal places
        this.duration = Math.round(this.duration * 100) / 100;
    }
    next();
});

export const Lecture = mongoose.model('Lecture', lectureSchema);

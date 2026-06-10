import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema({
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture',
        required: [true, 'Lecture reference is required']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    watchTime: {
        type: Number,
        default: 0
    },
    lastWatched: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

const courseProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course reference is required']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lectureProgress: [lectureProgressSchema],
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate completion percentage before saving
courseProgressSchema.pre('save', async function(next) {
    const totalLectures = this.lectureProgress.length;
    if (totalLectures > 0) {
        const completedLectures = this.lectureProgress.filter(lp => lp.isCompleted).length;
        this.completionPercentage = Math.round((completedLectures / totalLectures) * 100);
        this.isCompleted = this.completionPercentage === 100;
    } else {
        this.completionPercentage = 0;
        this.isCompleted = false;
    }
    next();
});

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

// Update last accessed
courseProgressSchema.methods.updateLastAccessed = function() {
    this.lastAccessed = Date.now();
    return this.save({ validateBeforeSave: false });
};

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);

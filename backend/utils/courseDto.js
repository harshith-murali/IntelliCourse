import { getPresignedPlaybackUrl } from "../services/s3.service.js";

const FALLBACK_COURSE_COVER =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&h=540&fit=crop";

// ─── S3 Key extraction ───────────────────────────────────────────────────────
/**
 * Extracts the S3 object key from a standard virtual-hosted-style S3 URL.
 * Returns null for non-S3 URLs (e.g. dicebear, unsplash).
 * Pattern: https://{bucket}.s3.{region}.amazonaws.com/{key}
 */
const extractS3Key = (url) => {
  if (!url || !url.includes("amazonaws.com")) return null;
  const withoutQuery = url.split("?")[0];
  const dotAmazon = withoutQuery.indexOf(".amazonaws.com/");
  if (dotAmazon === -1) return null;
  return withoutQuery.slice(dotAmazon + ".amazonaws.com/".length) || null;
};

/**
 * Returns true if the URL is a raw (unsigned) private S3 URL.
 * Signed URLs contain "X-Amz-Signature" query param.
 */
const isRawPrivateS3Url = (url) =>
  !!url &&
  url.includes("amazonaws.com") &&
  !url.includes("X-Amz-Signature") &&
  !url.includes("dicebear");

// ─── User serialization ──────────────────────────────────────────────────────
/**
 * Convert a Mongoose user doc to a safe plain object (no password).
 * Avatar URL is returned as-is; use serializeUserAsync for signed URLs.
 */
export const serializeUser = (user) => {
  if (!user) return user;
  const plain = user.toObject ? user.toObject({ virtuals: true }) : { ...user };
  const avatarUrl = plain.avatarUrl || plain.avatar || "";
  delete plain.password;
  plain.avatar = avatarUrl;
  plain.avatarUrl = avatarUrl;
  return plain;
};

/**
 * Same as serializeUser but also signs the avatar if it is a private S3 URL.
 * Use this in profile update / profile fetch endpoints.
 */
export const serializeUserAsync = async (user) => {
  const plain = serializeUser(user);
  if (!plain) return plain;

  const rawAvatarUrl = plain.avatar;
  if (!isRawPrivateS3Url(rawAvatarUrl)) return plain;

  // Prefer stored avatarKey over URL extraction
  const key = plain.avatarKey || extractS3Key(rawAvatarUrl);
  if (!key) return plain;

  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const signedUrl = await getPresignedPlaybackUrl(bucketName, key);
    plain.avatar = signedUrl;
    plain.avatarUrl = signedUrl;
  } catch (err) {
    console.warn(`Could not sign avatar for user ${plain._id}:`, err.message);
  }

  return plain;
};

// ─── Course thumbnail signing ────────────────────────────────────────────────
/**
 * Convert a Mongoose course doc to a plain object and inject a presigned
 * GET URL for the thumbnail so React Native can display private S3 images.
 *
 * For courses without a stored thumbnailKey (created before the S3 flow),
 * we detect the raw S3 URL and substitute the public fallback image so that
 * the card never shows a blank/broken 403 image.
 */
export const signCourseThumbnail = async (course) => {
  if (!course) return course;

  const plain = course.toObject ? course.toObject({ virtuals: true }) : { ...course };
  const storedUrl = plain.thumbnailUrl || plain.thumbnail || FALLBACK_COURSE_COVER;

  const setCoverFields = (url) => {
    plain.coverImageUrl = url;
    plain.thumbnailUrl = url;
    plain.thumbnail = url;
  };

  // Also serialize the nested instructor so its avatar is safe
  if (plain.instructor) {
    plain.instructor = serializeUser(plain.instructor);
  }

  if (!plain.thumbnailKey) {
    // No key stored — cannot sign. Use fallback for private S3 URLs to avoid 403s.
    setCoverFields(isRawPrivateS3Url(storedUrl) ? FALLBACK_COURSE_COVER : storedUrl);
    return plain;
  }

  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "lms-video-lessons-bucket";
    const signedUrl = await getPresignedPlaybackUrl(bucketName, plain.thumbnailKey);
    setCoverFields(signedUrl);
  } catch (err) {
    console.warn(`Could not sign thumbnail for course ${plain._id}:`, err.message);
    setCoverFields(isRawPrivateS3Url(storedUrl) ? FALLBACK_COURSE_COVER : storedUrl);
  }

  return plain;
};

/** Sign thumbnails for an array of course documents */
export const signCourseThumbnails = (courses = []) =>
  Promise.all(courses.filter(Boolean).map(signCourseThumbnail));

import { Course, User } from '../types';

export const FALLBACK_COURSE_COVER =
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&h=540&fit=crop';

export const avatarForName = (name?: string) =>
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name || 'learner')}`;

export const appendCacheBust = (uri?: string | null, version?: number | string) => {
  if (!uri) return '';
  // Do not cache-bust S3 presigned URLs since it alters the signature and causes 403 Forbidden
  if (uri.includes('amazonaws.com')) return uri;
  if (!version || uri.startsWith('file:') || uri.startsWith('data:')) return uri;
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}v=${version}`;
};

export const getUserAvatarUri = (user?: Pick<User, 'name' | 'avatar'> | null, version?: number | string) => {
  const avatar = user?.avatar && user.avatar !== 'default-avatar.png' ? user.avatar : avatarForName(user?.name);
  return appendCacheBust(avatar, version);
};

export const getCourseCoverUri = (course?: Partial<Course> | null, version?: number | string) => {
  const cover = course?.coverImageUrl || course?.thumbnailUrl || course?.thumbnail || FALLBACK_COURSE_COVER;
  return appendCacheBust(cover, version);
};

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, useCourse, useTheme } from '../hooks';
import { LessonItem, LoadingSpinner, Button, ProgressBar } from '../components';
import { apiService, apiClient } from '../services/api';
import { FALLBACK_COURSE_COVER, getCourseCoverUri, getUserAvatarUri } from '../utils/images';

/** Navigate back safely — falls back to home if there is no history entry */
const goBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/home');
  }
};

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const { currentCourse, isLoading, getCourseById, getMyCourses, getCourses, myCourses, deleteLesson, updateCourse } = useCourse();
  const { colors, spacing, radii, shadow } = useTheme();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  // Cache-bust key appended to thumbnail URL so RN re-fetches after an upload
  const [thumbnailCacheBust, setThumbnailCacheBust] = useState('');
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  // Instructor upload state
  const isCreatorRole = user?.role === 'instructor' || user?.role === 'admin';
  const isCourseOwner = isCreatorRole && currentCourse?.instructor?.id === user?.id;
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDescription, setNewLectureDescription] = useState('');
  const [newLectureSectionTitle, setNewLectureSectionTitle] = useState('');
  const [newLectureOrder, setNewLectureOrder] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('');
  const [newLectureTags, setNewLectureTags] = useState('');
  const [newLectureDifficulty, setNewLectureDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [newLectureTranscript, setNewLectureTranscript] = useState('');
  const [newLectureNotes, setNewLectureNotes] = useState('');
  const [newLectureObjectives, setNewLectureObjectives] = useState('');
  const [newLectureResources, setNewLectureResources] = useState('');
  const [newLectureIsPreview, setNewLectureIsPreview] = useState(false);
  const [addingLecture, setAddingLecture] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadPanelVisible, setUploadPanelVisible] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const checkStatus = async () => {
    if (!courseId) return;
    setCheckingEnrollment(true);
    try {
      // 1. Get detailed course status from backend
      const response = await apiClient.get(`/purchase/course/${courseId}/detail-with-status`);
      const { enrolled } = response.data.data;
      setIsEnrolled(enrolled);

      // 2. Load progress if enrolled
      if (enrolled) {
        const progressData = await apiService.getCourseProgress(courseId);
        setProgressDetails(progressData);
        setCourseProgress(progressData?.completionPercentage || 0);
      }
    } catch (err) {
      console.warn("Could not retrieve purchase status:", err);
      // Fallback
      setIsEnrolled(myCourses.some((c) => c.id === courseId));
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleToggleComplete = async (lessonId: string, currentCompletedStatus: boolean) => {
    if (!courseId) return;
    try {
      const lp = progressDetails?.lectureProgress?.find(
        (p: any) => p.lecture === lessonId || p.lecture?._id === lessonId
      );
      const watchTime = lp?.watchTime || 0;

      const updatedProgress = await apiService.updateBackendProgress(
        courseId,
        lessonId,
        watchTime,
        !currentCompletedStatus
      );

      setProgressDetails(updatedProgress);
      setCourseProgress(updatedProgress?.completionPercentage || 0);
    } catch (err) {
      console.error("Failed to toggle completion status:", err);
      Alert.alert('Error', 'Could not update completion status.');
    }
  };


  useEffect(() => {
    if (courseId) {
      getCourseById(courseId);
      checkStatus();
    }
  }, [courseId, user?.id]);

  if (isLoading || !currentCourse) {
    return <LoadingSpinner />;
  }

  const handleEnrollOrPurchase = async () => {
    if (!user?.id) {
      router.push('/auth/login');
      return;
    }

    try {
      setProcessingPayment(true);
      // Create Razorpay Order
      const orderData = await apiService.createRazorpayOrder(currentCourse.id);

      if (orderData.isFree) {
        // Free enrollment completed immediately
        Alert.alert('Success', 'You have been enrolled in this course!');
        setIsEnrolled(true);
        checkStatus();
        if (user.id) getMyCourses(user.id);
        setProcessingPayment(false);
        return;
      }

      // If paid, store order details and trigger payment simulation modal
      setPaymentDetails(orderData);
      setPaymentModalVisible(true);
      setProcessingPayment(false);
    } catch (error) {
      setProcessingPayment(false);
      Alert.alert('Enrollment Failed', (error as Error).message);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!paymentDetails) return;
    
    setProcessingPayment(true);
    try {
      // Send payment confirmation cryptographically verified on backend
      const verified = await apiService.verifyRazorpayPayment(
        currentCourse.id,
        paymentDetails.orderId,
        `pay_simulated_${Date.now()}`,
        'dev_mock_sig' // dev verification fallback key
      );

      if (verified) {
        setPaymentModalVisible(false);
        Alert.alert('Success 🎉', 'Payment verified! Welcome to the course.');
        setIsEnrolled(true);
        checkStatus();
        if (user?.id) getMyCourses(user.id);
      } else {
        Alert.alert('Payment Failed', 'Transaction signature verification failed.');
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // ─── Instructor: Add a lecture then pick & upload video ─────────────────────
  const handleAddLectureAndUpload = async () => {
    const title = newLectureTitle.trim();
    const description = newLectureDescription.trim();
    const sectionTitle = newLectureSectionTitle.trim();
    const fallbackOrder = (currentCourse?.lessons?.length || 0) + 1;
    const order = Number(newLectureOrder || fallbackOrder);
    const manualDuration = Number(newLectureDuration || 0);
    const tags = newLectureTags.split(',').map((tag) => tag.trim()).filter(Boolean);
    const objectives = newLectureObjectives.split('\n').map((objective) => objective.trim()).filter(Boolean);
    const resources = newLectureResources
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));

    if (!title || !description || !sectionTitle) {
      Alert.alert('Missing Metadata', 'Please enter the lecture title, description, and section/module title.');
      return;
    }
    if (tags.length === 0) {
      Alert.alert('Missing Tags', 'Please add at least one tag or keyword for this lecture.');
      return;
    }
    if (!Number.isFinite(order) || order <= 0) {
      Alert.alert('Invalid Order', 'Please enter a valid lesson order.');
      return;
    }
    if (!Number.isFinite(manualDuration) || manualDuration < 0) {
      Alert.alert('Invalid Duration', 'Duration must be zero or greater.');
      return;
    }
    if (!courseId) return;

    try {
      // 1. Pick a video file before creating the lecture so no orphan lecture is saved.
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) {
        Alert.alert('No video selected', 'Please choose a video to create this lecture.');
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `lecture_${Date.now()}.mp4`;
      const fileType = asset.mimeType || 'video/mp4';
      const fileSize = asset.fileSize || 0;
      const detectedDuration = Math.round((asset.duration || 0) / 1000);
      const duration = detectedDuration || manualDuration;

      setAddingLecture(true);

      // 2. Create the lecture with metadata before linking the uploaded media.
      const lecture = await apiService.addLesson(courseId, {
        title,
        description,
        sectionTitle,
        videoUrl: '',
        duration,
        order,
        tags,
        difficulty: newLectureDifficulty,
        transcript: newLectureTranscript.trim(),
        notes: newLectureNotes.trim(),
        isPreview: newLectureIsPreview,
        objectives,
        resources,
      });

      const lectureId = lecture?._id || lecture?.id;
      if (!lectureId) throw new Error('Lecture creation failed - no ID returned.');
      setAddingLecture(false);

      // 3. Get presigned S3 upload URL from backend
      setUploading(true);
      setUploadProgress(0);

      const { mediaAssetId, uploadUrl } = await apiService.getPresignedUploadUrl(
        courseId, fileName, fileType, fileSize
      );

      // 4. Upload directly to S3
      await apiService.uploadFileToS3(uploadUrl, asset.uri, fileType, (pct) => {
        setUploadProgress(pct);
      });

      // 5. Confirm upload with backend & link to lecture
      await apiService.confirmS3Upload(mediaAssetId, lectureId, duration);

      setUploading(false);
      setUploadProgress(0);
      setNewLectureTitle('');
      setNewLectureDescription('');
      setNewLectureSectionTitle('');
      setNewLectureOrder('');
      setNewLectureDuration('');
      setNewLectureTags('');
      setNewLectureDifficulty('beginner');
      setNewLectureTranscript('');
      setNewLectureNotes('');
      setNewLectureObjectives('');
      setNewLectureResources('');
      setNewLectureIsPreview(false);
      setUploadPanelVisible(false);

      Alert.alert('Success', 'Lecture metadata and video uploaded successfully!');
      getCourseById(courseId);
    } catch (err) {
      setAddingLecture(false);
      setUploading(false);
      Alert.alert('Upload Failed', (err as Error).message);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    // Non-enrolled users who aren't the course owner cannot watch videos
    if (!isEnrolled && !isCourseOwner) {
      Alert.alert(
        '🔒 Enrollment Required',
        'You need to enroll in this course to access its content. Purchase the course to get full access.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: currentCourse.price === 0 ? 'Enroll Free' : 'Buy Course',
            onPress: handleEnrollOrPurchase,
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/video-player',
      params: { courseId: currentCourse.id, lessonId },
    });
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    Alert.alert(
      'Delete Lecture',
      `Are you sure you want to delete "${lessonTitle}"? This will permanently delete the lecture and its video.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLesson(currentCourse.id, lessonId);
              Alert.alert('Success', 'Lecture and video deleted successfully.');
              getCourseById(courseId);
            } catch (err) {
              Alert.alert('Delete Failed', (err as Error).message);
            }
          }
        }
      ]
    );
  };

  const handlePickThumbnail = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library to upload thumbnails.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fileType = asset.mimeType || 'image/jpeg';
      const fileName = asset.fileName || `thumbnail_${Date.now()}.${fileType.split('/')[1] || 'jpg'}`;
      const fileSize = asset.fileSize || 0;

      if (fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a thumbnail image smaller than 5MB.');
        return;
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(fileType)) {
        Alert.alert('Invalid File Type', 'Please select a JPEG, PNG, or WEBP image.');
        return;
      }


      console.log("=== THUMBNAIL PICKED ===");
      console.log(`- File URI: ${fileUri}`);
      console.log(`- File Name: ${fileName}`);
      console.log(`- File Type: ${fileType}`);

      setThumbnailUploading(true);

      // Request presigned URL
      const response = await apiService.getPresignedThumbnailUrl(courseId, fileName, fileType);
      const { uploadUrl, s3Key, rawUrl } = response;

      // Upload to S3
      await apiService.uploadFileToS3(uploadUrl, fileUri, fileType);

      // Persist to course using store action to keep state in sync
      await updateCourse(courseId, {
        thumbnailUrl: rawUrl,
        thumbnailKey: s3Key,
      });

      // Refresh the global list (home/explore screens) to sync lists
      getCourses();
      setThumbnailFailed(false);
      setThumbnailCacheBust(`${Date.now()}`);
      Alert.alert('Success', 'Course thumbnail updated successfully!');
    } catch (err) {
      console.error("Thumbnail upload failed:", err);
      Alert.alert('Upload Failed', (err as Error).message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={goBack} style={{ paddingLeft: 16, paddingRight: 20, paddingVertical: 5 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Course Image Header */}
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: thumbnailFailed ? FALLBACK_COURSE_COVER : getCourseCoverUri(currentCourse, thumbnailCacheBust) }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setThumbnailFailed(true)}
        />
        <View style={styles.thumbnailOverlay} />
        {isCourseOwner && (
          <TouchableOpacity 
            style={[styles.editThumbnailButton, { backgroundColor: 'rgba(0,0,0,0.65)' }]} 
            onPress={handlePickThumbnail}
            activeOpacity={0.8}
          >
            {thumbnailUploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="camera" size={16} color="#ffffff" />
                <Text style={styles.editThumbnailText}>Edit Cover</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Course details Card */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.lg, borderWidth: 1, borderRadius: radii.xl, margin: spacing.lg, marginTop: -34, ...shadow }]}>
        <View style={styles.priceSection}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              {currentCourse.price === 0 ? 'Free' : `₹${currentCourse.price}`}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {currentCourse.level ? currentCourse.level.charAt(0).toUpperCase() + currentCourse.level.slice(1) : 'Beginner'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {currentCourse.category || 'General'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text, marginTop: spacing.sm }]}>{currentCourse.title}</Text>
        {currentCourse.subtitle ? (
          <Text style={[styles.subtitleText, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {currentCourse.subtitle}
          </Text>
        ) : null}

        <View style={[styles.metaContainer, { borderColor: colors.border }]}>
          <View style={styles.metaItem}>
            <View style={[styles.metaIconContainer, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="person" size={13} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Instructor</Text>
              <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
                {currentCourse.instructor?.name || 'Instructor'}
              </Text>
            </View>
          </View>
          
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaItem}>
            <View style={[styles.metaIconContainer, { backgroundColor: '#fbbf2415' }]}>
              <Ionicons name="star" size={13} color="#fbbf24" />
            </View>
            <View>
              <Text style={styles.metaLabel}>Rating</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {currentCourse.rating ? currentCourse.rating.toFixed(1) : '5.0'}
              </Text>
            </View>
          </View>

          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaItem}>
            <View style={[styles.metaIconContainer, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="people" size={13} color="#10b981" />
            </View>
            <View>
              <Text style={styles.metaLabel}>Enrolled</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {currentCourse.students || 0}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary, lineHeight: 20, marginTop: spacing.xs }]}>
          {currentCourse.description}
        </Text>

        {checkingEnrollment ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        ) : isCreatorRole ? (
          // Creators cannot purchase courses from the management view.
          <View style={[styles.instructorBadge, { backgroundColor: colors.primaryLight, borderRadius: radii.full, marginTop: spacing.md }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
            <Text style={[styles.instructorBadgeText, { color: colors.primary }]}>
              {isCourseOwner ? 'Creator View — enrollment not available' : 'Creator account — enrollment not available'}
            </Text>
          </View>
        ) : !isEnrolled ? (
          <Button
            label={processingPayment ? "Preparing..." : (currentCourse.price === 0 ? "Enroll for Free" : "Buy Course Now")}
            onPress={handleEnrollOrPurchase}
            disabled={processingPayment}
            size="large"
            style={{ marginTop: spacing.md }}
          />
        ) : (
          <View style={[styles.progressWrapper, { marginTop: spacing.sm }]}>
            <ProgressBar progress={courseProgress} showLabel={true} />
            {progressDetails && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '500' }}>
                {progressDetails.completedLectures} of {progressDetails.totalLectures} lectures completed ({courseProgress}%)
              </Text>
            )}
            <Button
              label="Access Course"
              onPress={() => {
                if (currentCourse.lessons && currentCourse.lessons.length > 0) {
                  // Find first incomplete lesson, fallback to first lesson
                  const incomplete = currentCourse.lessons.find(l => {
                    const isCompleted = progressDetails?.lectureProgress?.find(
                      (lp: any) => lp.lecture === l.id || lp.lecture?._id === l.id
                    )?.isCompleted || false;
                    return !isCompleted;
                  });
                  const startLesson = incomplete || currentCourse.lessons[0];
                  handleStartLesson(startLesson.id);
                } else {
                  Alert.alert('No Lectures Available', 'This course does not have any lectures yet.');
                }
              }}
              size="large"
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </View>

      {/* Lectures Content Accordion */}
      <View style={[styles.lessonsSection, { padding: spacing.lg, paddingTop: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
          Course Syllabus ({currentCourse.lessons.length} Lectures)
        </Text>

        {currentCourse.lessons.length > 0 ? (
          currentCourse.lessons.map((lesson, idx) => {
            const isCompleted = progressDetails?.lectureProgress?.find(
              (lp: any) => lp.lecture === lesson.id || lp.lecture?._id === lesson.id
            )?.isCompleted || false;

            const lessonWithProgress = {
              ...lesson,
              completed: isCompleted
            };

            return (
              <LessonItem
                key={lesson.id || idx}
                lesson={lessonWithProgress}
                onPress={() => handleStartLesson(lesson.id)}
                onDelete={isCourseOwner ? () => handleDeleteLesson(lesson.id, lesson.title) : undefined}
                onToggleComplete={isEnrolled ? () => handleToggleComplete(lesson.id, isCompleted) : undefined}
              />
            );
          })
        ) : (
          <View style={[styles.emptyLecturesCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.xl }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="journal" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Lectures Available</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              This course does not have any uploaded lectures yet. {isCourseOwner ? 'Create your first lecture below to get started!' : 'Please check back later.'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Instructor: Upload Lecture Section ───────────────────────────── */}
      {isCourseOwner && (
        <View style={[styles.uploadCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadow }]}>
          <TouchableOpacity
            style={styles.uploadHeader}
            onPress={() => setUploadPanelVisible(!uploadPanelVisible)}
            activeOpacity={0.7}
          >
            <View style={styles.uploadHeaderLeft}>
              <View style={[styles.uploadHeaderIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="cloud-upload" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.uploadTitle, { color: colors.text }]}>Add Lecture & Video</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Publish new content directly</Text>
              </View>
            </View>
            <Ionicons
              name={uploadPanelVisible ? 'chevron-up-circle' : 'chevron-down-circle'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          {uploadPanelVisible && (
            <View style={[styles.uploadContent, { borderTopColor: colors.border }]}>
	              <Text style={[styles.inputLabel, { color: colors.text }]}>Lecture Title *</Text>
	              <TextInput
                style={[
                  styles.modernInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. 1.1 Welcome to the Course"
                placeholderTextColor={colors.textSecondary}
                value={newLectureTitle}
                onChangeText={setNewLectureTitle}
	                editable={!addingLecture && !uploading}
	              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.sm }]}>Short Description *</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  styles.metadataTextArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="What will learners understand after this lecture?"
                placeholderTextColor={colors.textSecondary}
                value={newLectureDescription}
                onChangeText={setNewLectureDescription}
                editable={!addingLecture && !uploading}
                multiline
              />

              <View style={styles.metadataRow}>
                <View style={styles.metadataCol}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Section / Module *</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Module 1"
                    placeholderTextColor={colors.textSecondary}
                    value={newLectureSectionTitle}
                    onChangeText={setNewLectureSectionTitle}
                    editable={!addingLecture && !uploading}
                  />
                </View>
                <View style={styles.metadataSmallCol}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Order *</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder={`${(currentCourse?.lessons?.length || 0) + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    value={newLectureOrder}
                    onChangeText={setNewLectureOrder}
                    keyboardType="number-pad"
                    editable={!addingLecture && !uploading}
                  />
                </View>
              </View>

              <View style={styles.metadataRow}>
                <View style={styles.metadataCol}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Tags / Keywords *</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="react, hooks, state"
                    placeholderTextColor={colors.textSecondary}
                    value={newLectureTags}
                    onChangeText={setNewLectureTags}
                    editable={!addingLecture && !uploading}
                  />
                </View>
                <View style={styles.metadataSmallCol}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Duration</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={newLectureDuration}
                    onChangeText={setNewLectureDuration}
                    keyboardType="number-pad"
                    editable={!addingLecture && !uploading}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.sm }]}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                  const active = newLectureDifficulty === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setNewLectureDifficulty(level)}
                      disabled={addingLecture || uploading}
                      style={[
                        styles.difficultyChip,
                        {
                          backgroundColor: active ? colors.primary : colors.background,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.difficultyText, { color: active ? '#fff' : colors.textSecondary }]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setNewLectureIsPreview((value) => !value)}
                disabled={addingLecture || uploading}
                style={[styles.previewToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Ionicons
                  name={newLectureIsPreview ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={newLectureIsPreview ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.previewToggleText, { color: colors.text }]}>Free preview lecture</Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.sm }]}>Learning Objectives</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  styles.metadataTextArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="One objective per line"
                placeholderTextColor={colors.textSecondary}
                value={newLectureObjectives}
                onChangeText={setNewLectureObjectives}
                editable={!addingLecture && !uploading}
                multiline
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.sm }]}>Notes / Transcript</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  styles.metadataTextArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Paste lecture notes or transcript text for AI features"
                placeholderTextColor={colors.textSecondary}
                value={newLectureNotes || newLectureTranscript}
                onChangeText={(value) => {
                  setNewLectureNotes(value);
                  setNewLectureTranscript(value);
                }}
                editable={!addingLecture && !uploading}
                multiline
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.sm }]}>Resource Links</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  styles.metadataTextArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="One URL per line"
                placeholderTextColor={colors.textSecondary}
                value={newLectureResources}
                onChangeText={setNewLectureResources}
                editable={!addingLecture && !uploading}
                multiline
              />

              {uploading && (
                <View style={styles.uploadProgressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>Uploading Video File</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{uploadProgress}%</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressIndicator, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                    Uploading video file, please wait...
                  </Text>
                </View>
              )}

              <Button
                label={
                  addingLecture
                    ? 'Creating lecture entry…'
                    : uploading
                    ? `Uploading (${uploadProgress}%)`
                    : 'Choose Video & Upload'
                }
                onPress={handleAddLectureAndUpload}
                loading={addingLecture || uploading}
                disabled={addingLecture || uploading}
                size="large"
                style={{ marginTop: spacing.xs }}
              />
            </View>
          )}
        </View>
      )}


      {/* Instructor info Section */}
      <View style={[styles.instructorSection, { padding: spacing.lg, paddingBottom: spacing.xxl }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Your Instructor</Text>
        <View style={[styles.modernInstructorCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadow }]}>
          <View style={styles.instructorHeaderRow}>
            <Image
              source={{ uri: getUserAvatarUri(currentCourse.instructor) }}
              style={[styles.modernInstructorAvatar, { borderRadius: 24 }]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.modernInstructorName, { color: colors.text }]} numberOfLines={1}>
                {currentCourse.instructor?.name || 'Instructor'}
              </Text>
              <View style={[styles.instructorRoleBadge, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.instructorRoleText, { color: colors.primary }]}>Verified Instructor</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.modernInstructorBio, { color: colors.textSecondary }]}>
            {currentCourse.instructor?.bio || 'Experienced professional educator dedicated to raising standard knowledge and simplifying complex concepts.'}
          </Text>
        </View>
      </View>

      {/* Simulated Payment Gateway Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Secure Sandbox Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.paymentSummaryCard, { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, marginVertical: spacing.md }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Payee: IntelliCourse</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: spacing.xs }}>{currentCourse.title}</Text>
              <View style={[styles.line, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Amount Due:</Text>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>₹{currentCourse.price}</Text>
              </View>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginBottom: spacing.md }}>
              This simulates the Razorpay Checkout gateway inside active developer debug environments.
            </Text>

            <Button
              label={processingPayment ? "Verifying Transaction..." : "Simulate Payment Success"}
              onPress={handleSimulatePaymentSuccess}
              loading={processingPayment}
              size="large"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  editThumbnailButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editThumbnailText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metaIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  description: {
    fontSize: 14,
  },
  progressWrapper: {
    width: '100%',
  },
  instructorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  instructorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lessonsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyLecturesCard: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  instructorSection: {
    width: '100%',
  },
  modernInstructorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  instructorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernInstructorAvatar: {
    width: 48,
    height: 48,
  },
  modernInstructorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  instructorRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  instructorRoleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modernInstructorBio: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSummaryCard: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  line: {
    height: 1,
  },
  // Instructor upload card
  uploadCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  uploadHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadHeaderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  uploadContent: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modernInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  metadataTextArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metadataCol: {
    flex: 1,
  },
  metadataSmallCol: {
    width: 96,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  difficultyChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewToggle: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadProgressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
  },
});

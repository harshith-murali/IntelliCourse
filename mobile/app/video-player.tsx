import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useCourse, useTheme } from '../hooks';
import { LoadingSpinner, Button } from '../components';
import { apiService, apiClient } from '../services/api';
import { LessonAskResponse, LessonQuiz, LessonSummary } from '../types';

/** Navigate back safely — falls back to course-detail if there is no history entry */
const goBack = (courseId?: string) => {
  if (router.canGoBack()) {
    router.back();
  } else if (courseId) {
    router.replace({ pathname: '/course-detail', params: { courseId } });
  } else {
    router.replace('/(tabs)/home');
  }
};

export default function VideoPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
  }>();
  
  const { currentCourse, getCourseById, getLectureUrl, isLoading } = useCourse();
  const { colors, spacing, radii } = useTheme();

  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingPlayback, setLoadingPlayback] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [watchTime, setWatchTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  // Enrollment guard state
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [summary, setSummary] = useState<LessonSummary | null>(null);
  const [askResponse, setAskResponse] = useState<LessonAskResponse | null>(null);
  const [quiz, setQuiz] = useState<LessonQuiz | null>(null);
  const [aiModal, setAiModal] = useState<'summary' | 'ask' | 'quiz' | null>(null);
  const [aiLoading, setAiLoading] = useState<'summary' | 'ask' | 'quiz' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const videoRef = useRef<Video>(null);

  // ── Enrollment guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!courseId) return;
      try {
        const response = await apiClient.get(`/purchase/course/${courseId}/detail-with-status`);
        const { enrolled, isOwner } = response.data.data;
        const authorized = enrolled || isOwner;
        setIsEnrolled(authorized);
        if (!authorized) {
          Alert.alert(
            '🔒 Enrollment Required',
            'You must enroll in this course to watch its content.',
            [
              {
                text: 'View Course',
                onPress: () =>
                  router.replace({ pathname: '/course-detail', params: { courseId } }),
              },
            ]
          );
        }
      } catch {
        // On error, allow access and let the playback URL request handle authorization
        setIsEnrolled(true);
      } finally {
        setEnrollmentChecked(true);
      }
    };
    checkEnrollment();
  }, [courseId]);

  const loadPlaybackUrl = async () => {
    if (!courseId || !lessonId) return;
    setLoadingPlayback(true);
    setPlaybackError(null);
    try {
      // Fetch secure presigned playback URL from backend
      const url = await getLectureUrl(courseId, lessonId);
      setPlaybackUrl(url);

      // Check current progress for this lesson to initialize values
      const progressData = await apiService.getCourseProgress(courseId);
      const lp = progressData?.lectureProgress?.find(
        (p: any) => p.lecture === lessonId || p.lecture?._id === lessonId
      );
      if (lp) {
        setIsCompleted(lp.isCompleted);
        setWatchTime(lp.watchTime || 0);
      }
    } catch (err) {
      console.error(err);
      setPlaybackError((err as Error).message || 'Could not retrieve playback URL');
    } finally {
      setLoadingPlayback(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId && lessonId && enrollmentChecked && isEnrolled) {
      loadPlaybackUrl();
    }
  }, [courseId, lessonId, enrollmentChecked, isEnrolled]);

  const handleToggleCompleteInPlayer = async () => {
    if (!courseId || !lessonId) return;
    try {
      const nextState = !isCompleted;
      await apiService.updateBackendProgress(courseId, lessonId, watchTime, nextState);
      setIsCompleted(nextState);
      Alert.alert('Success', `Lecture marked as ${nextState ? 'complete' : 'incomplete'}! 🎉`);
    } catch (err) {
      Alert.alert('Error', 'Could not sync completion status.');
    }
  };

  const loadSummary = async () => {
    if (!courseId || !lessonId) return;
    setAiModal('summary');
    setAiLoading('summary');
    setAiError(null);
    try {
      setSummary(await apiService.getLessonSummary(courseId, lessonId));
    } catch (error) {
      setAiError((error as Error).message);
    } finally {
      setAiLoading(null);
    }
  };

  const askAI = async (nextQuestion = question) => {
    if (!courseId || !lessonId || !nextQuestion.trim()) {
      setAiError('Type a question first.');
      return;
    }
    setAiModal('ask');
    setAiLoading('ask');
    setAiError(null);
    try {
      setQuestion(nextQuestion);
      setAskResponse(await apiService.askLessonAI(courseId, lessonId, nextQuestion.trim()));
    } catch (error) {
      setAiError((error as Error).message);
    } finally {
      setAiLoading(null);
    }
  };

  const loadQuiz = async () => {
    if (!courseId || !lessonId) return;
    setAiModal('quiz');
    setAiLoading('quiz');
    setAiError(null);
    setSelectedAnswers({});
    try {
      setQuiz(await apiService.generateLessonQuiz(courseId, lessonId, 5));
    } catch (error) {
      setAiError((error as Error).message);
    } finally {
      setAiLoading(null);
    }
  };

  const handlePlaybackUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // Track current position in seconds
    const currentPos = Math.round(status.positionMillis / 1000);
    setWatchTime(currentPos);

    // Auto mark complete when video reaches 90% completion
    if (status.didJustFinish || (status.durationMillis && status.positionMillis > status.durationMillis * 0.90)) {
      if (!isCompleted) {
        setIsCompleted(true);
        try {
          await apiService.updateBackendProgress(courseId!, lessonId!, currentPos, true);
        } catch (e) {
          console.warn('Could not save auto completion:', e);
        }
      }
    }
  };

  // Keep progress synced to backend on unmount
  useEffect(() => {
    return () => {
      if (courseId && lessonId && watchTime > 0) {
        apiService.updateBackendProgress(courseId, lessonId, watchTime, isCompleted).catch(console.warn);
      }
    };
  }, [watchTime, isCompleted]);

  // Show spinner while checking enrollment or loading course
  if (!enrollmentChecked || isLoading || !currentCourse) {
    return <LoadingSpinner />;
  }

  // If not enrolled, show a redirect message (the alert will handle navigation)
  if (!isEnrolled) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
          Enrollment Required
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
          Purchase or enroll in this course to access its content.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary, borderRadius: radii.md, marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}
          onPress={() => router.replace({ pathname: '/course-detail', params: { courseId } })}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>View Course Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lesson = currentCourse.lessons.find((l) => l.id === lessonId);

  if (!lesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Lecture not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => goBack(courseId)} style={{ paddingLeft: 16, paddingRight: 20, paddingVertical: 5 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Video Container */}
      <View style={styles.videoContainer}>
        {loadingPlayback ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : playbackError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={36} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text, marginTop: spacing.sm }]}>{playbackError}</Text>
            <TouchableOpacity onPress={loadPlaybackUrl} style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radii.sm, marginTop: spacing.sm }]}>
              <Text style={styles.retryText}>Retry Playback</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: playbackUrl || '' }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackUpdate}
            // Auto-resume from last watch point if watchTime was stored and not completed/near end
            onLoad={(status) => {
              if (status && 'durationMillis' in status && status.durationMillis) {
                const totalDurationSec = status.durationMillis / 1000;
                if (watchTime > 0 && !isCompleted && watchTime < totalDurationSec * 0.90 && videoRef.current) {
                  videoRef.current.setPositionAsync(watchTime * 1000);
                }
              }
            }}
          />
        )}
      </View>

      {/* Lesson Details Section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface, padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xs }]}>{lesson.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md }]}>
          {lesson.description || 'No description provided for this lesson.'}
        </Text>

        <View style={[styles.durationContainer, { borderTopColor: colors.border, borderBottomColor: colors.border, paddingVertical: spacing.sm }]}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.durationText, { color: colors.textSecondary }]}>
            Current Position: {Math.floor(watchTime / 60)}m {watchTime % 60}s
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label={isCompleted ? 'Completed ✓ (Mark Incomplete)' : 'Mark as Completed'}
            onPress={handleToggleCompleteInPlayer}
            variant={isCompleted ? 'secondary' : 'primary'}
            style={{ marginBottom: spacing.md }}
          />

          <View style={styles.aiActions}>
            <TouchableOpacity
              style={[styles.aiButton, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: radii.md }]}
              onPress={loadSummary}
            >
              <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              <Text style={[styles.aiButtonText, { color: colors.text }]}>Summarize</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aiButton, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: radii.md }]}
              onPress={() => setAiModal('ask')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
              <Text style={[styles.aiButtonText, { color: colors.text }]}>Ask AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aiButton, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: radii.md }]}
              onPress={loadQuiz}
            >
              <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.aiButtonText, { color: colors.text }]}>Quiz</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing.md }]}
            onPress={() => goBack(courseId)}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back to Course Syllabus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    <Modal visible={aiModal !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAiModal(null)}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {aiModal === 'summary' ? 'Lesson Summary' : aiModal === 'ask' ? 'Ask AI' : 'Lesson Quiz'}
          </Text>
          <TouchableOpacity onPress={() => setAiModal(null)} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.modalContent, { padding: spacing.lg }]}>
          {aiLoading ? (
            <View style={styles.aiState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.aiStateText, { color: colors.textSecondary }]}>Thinking...</Text>
            </View>
          ) : aiError ? (
            <View style={styles.aiState}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
              <Text style={[styles.aiStateText, { color: colors.error }]}>{aiError}</Text>
              <Button
                label="Try Again"
                onPress={aiModal === 'summary' ? loadSummary : aiModal === 'quiz' ? loadQuiz : () => askAI()}
                size="small"
              />
            </View>
          ) : aiModal === 'summary' ? (
            summary ? (
              <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
                <Text style={[styles.aiBodyText, { color: colors.text }]}>{summary.summary}</Text>
                <Text style={[styles.aiMetaText, { color: colors.textSecondary }]}>Read time: {summary.estimatedReadTime}</Text>
                {summary.keyPoints.map((point, index) => (
                  <View key={`${point}-${index}`} style={styles.pointRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                    <Text style={[styles.pointText, { color: colors.text }]}>{point}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Button label="Generate Summary" onPress={loadSummary} />
            )
          ) : aiModal === 'ask' ? (
            <View>
              <TextInput
                style={[styles.askInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, borderRadius: radii.md }]}
                placeholder="Ask about this lesson..."
                placeholderTextColor={colors.textSecondary}
                value={question}
                onChangeText={setQuestion}
                multiline
              />
              <Button label="Ask AI" onPress={() => askAI()} style={{ marginTop: spacing.md }} />
              {askResponse && (
                <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.lg }]}>
                  <Text style={[styles.aiBodyText, { color: colors.text }]}>{askResponse.answer}</Text>
                  {askResponse.followUpQuestions.map((followUp) => (
                    <TouchableOpacity
                      key={followUp}
                      style={[styles.followUp, { borderColor: colors.border, borderRadius: radii.sm }]}
                      onPress={() => askAI(followUp)}
                    >
                      <Text style={[styles.followUpText, { color: colors.primary }]}>{followUp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : quiz?.questions.length ? (
            quiz.questions.map((item, index) => {
              const selected = selectedAnswers[index];
              return (
                <View key={`${item.question}-${index}`} style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
                  <Text style={[styles.quizQuestion, { color: colors.text }]}>{index + 1}. {item.question}</Text>
                  {item.options.map((option) => {
                    const isSelected = selected === option;
                    const isCorrect = selected && option === item.correctAnswer;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          {
                            borderColor: isCorrect ? colors.success : isSelected ? colors.primary : colors.border,
                            backgroundColor: isCorrect ? `${colors.success}22` : isSelected ? colors.primaryLight : colors.background,
                            borderRadius: radii.sm,
                          },
                        ]}
                        onPress={() => setSelectedAnswers((prev) => ({ ...prev, [index]: option }))}
                      >
                        <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {selected && (
                    <Text style={[styles.explanation, { color: colors.textSecondary }]}>
                      Correct answer: {item.correctAnswer}. {item.explanation}
                    </Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.aiState}>
              <Text style={[styles.aiStateText, { color: colors.textSecondary }]}>No quiz could be generated from this lesson content.</Text>
              <Button label="Generate Quiz" onPress={loadQuiz} size="small" />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loader: {
    alignSelf: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    marginTop: 20,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  aiButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  aiButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 58,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingBottom: 40,
  },
  aiState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  aiStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  aiCard: {
    borderWidth: 1,
    padding: 14,
  },
  aiBodyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  aiMetaText: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: '600',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  askInput: {
    minHeight: 96,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  followUp: {
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  followUpText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quizCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  quizQuestion: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionButton: {
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  optionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  explanation: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

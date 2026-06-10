import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Play, CheckCircle, Menu, Info, Circle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import './Learn.css';

const Learn = () => {
  const { courseId } = useParams();
  const videoRef = useRef(null);
  const autoCompletedRef = useRef(new Set());
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingLectureId, setSavingLectureId] = useState('');

  const progressMap = useMemo(() => {
    const entries = progress?.lectureProgress || [];
    return new Map(entries.map(lp => [lp.lecture?.toString?.() || lp.lecture, lp]));
  }, [progress]);

  const completedCount = progress?.completedLectures ?? (progress?.lectureProgress || []).filter(lp => lp.isCompleted).length;
  const totalLectures = progress?.totalLectures ?? course?.lectures?.length ?? 0;
  const percentage = totalLectures ? Math.round((completedCount / totalLectures) * 100) : 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/purchase/course/${courseId}/detail-with-status`),
          api.get(`/progress/${courseId}`)
        ]);
        if (!courseRes.data.data.enrolled) {
          setError('You need to purchase this course before learning.');
          return;
        }
        const loadedCourse = courseRes.data.data.course;
        setCourse(loadedCourse);
        setProgress(progressRes.data.data);
        setActiveLesson(loadedCourse.lectures?.[0] || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load course player.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  useEffect(() => {
    const loadPlayback = async () => {
      if (!activeLesson?._id) return;
      setPlaybackUrl('');
      try {
        const { data } = await api.get(`/media/play/c/${courseId}/l/${activeLesson._id}`);
        setPlaybackUrl(data.data.playbackUrl);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load lecture video.');
      }
    };
    loadPlayback();
  }, [activeLesson, courseId]);

  const updateLecture = async (lectureId, payload) => {
    setSavingLectureId(lectureId);
    try {
      const { data } = await api.patch(`/progress/${courseId}/lectures/${lectureId}`, payload);
      setProgress(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update progress.');
    } finally {
      setSavingLectureId('');
    }
  };

  const handleManualToggle = (lecture) => {
    const current = progressMap.get(lecture._id);
    updateLecture(lecture._id, { isCompleted: !current?.isCompleted });
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !activeLesson?._id || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const watchedEnough = video.currentTime / video.duration >= 0.92;
    if (watchedEnough && !progressMap.get(activeLesson._id)?.isCompleted && !autoCompletedRef.current.has(activeLesson._id)) {
      autoCompletedRef.current.add(activeLesson._id);
      updateLecture(activeLesson._id, { watchTime: Math.round(video.currentTime) });
    }
  };

  if (loading) return <div className="learn-page"><div className="container" style={{ paddingTop: 120 }}>Loading player...</div></div>;
  if (error && !course) return <div className="learn-page"><div className="container" style={{ paddingTop: 120 }}>{error}</div></div>;

  return (
    <div className="learn-page">
      <header className="learn-header glass">
        <div className="container-fluid learn-nav">
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <div className="course-title-wrapper">
            <span className="course-label">Now Learning</span>
            <h2 className="course-title-mini">{course?.title}</h2>
          </div>
          <div className="learn-actions">
            <Button variant="ghost" size="small"><Info size={18} /> Resources</Button>
            <div className="progress-mini">
              <div className="progress-text">{percentage}% Complete · {completedCount}/{totalLectures}</div>
              <div className="progress-bar-mini">
                <div className="progress-fill-mini" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="learn-main">
        <div className="video-viewport">
          <div className="video-container">
            {playbackUrl ? (
              <video
                ref={videoRef}
                className="lecture-video"
                controls
                src={playbackUrl}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="video-placeholder">
                <Play size={64} className="play-btn-large" />
                <p>Loading video...</p>
              </div>
            )}
          </div>
          <div className="lesson-info container">
            <div className="lesson-header">
              <h1>{activeLesson?.title}</h1>
              {activeLesson && (
                <Button variant="secondary" onClick={() => handleManualToggle(activeLesson)} disabled={savingLectureId === activeLesson._id}>
                  {progressMap.get(activeLesson._id)?.isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                </Button>
              )}
            </div>
            {error && <p className="lesson-error">{error}</p>}
            <div className="lesson-description">
              <p>{activeLesson?.description || 'Replay this lecture anytime. Completion status never blocks access.'}</p>
              <div className="lesson-meta">
                <span><strong>Duration:</strong> {activeLesson?.duration ? `${Math.round(activeLesson.duration / 60)} min` : 'Video'}</span>
                <span><strong>Progress:</strong> {percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="lesson-sidebar">
          <div className="sidebar-header">
            <h3>Course Content</h3>
            <span className="lesson-pill">{totalLectures} Lessons</span>
          </div>
          <div className="lesson-list">
            {(course?.lectures || []).map((lesson, index) => {
              const lectureProgress = progressMap.get(lesson._id);
              const isCompleted = Boolean(lectureProgress?.isCompleted);
              return (
                <div
                  key={lesson._id}
                  role="button"
                  tabIndex={0}
                  className={`lesson-item ${activeLesson?._id === lesson._id ? 'active' : ''}`}
                  onClick={() => setActiveLesson(lesson)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveLesson(lesson);
                  }}
                >
                  <div className="lesson-status">
                    {isCompleted ? <CheckCircle size={20} className="completed-icon" /> : <Circle size={18} />}
                  </div>
                  <div className="lesson-info-mini">
                    <span className="lesson-title-mini">{index + 1}. {lesson.title}</span>
                    <span className="lesson-duration-mini">{lesson.duration ? `${Math.round(lesson.duration / 60)} min` : 'Video'}</span>
                  </div>
                  <button
                    type="button"
                    className="complete-toggle"
                    disabled={savingLectureId === lesson._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualToggle(lesson);
                    }}
                  >
                    {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  {activeLesson?._id === lesson._id && <Play size={16} className="active-play" />}
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Learn;

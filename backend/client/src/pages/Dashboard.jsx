import React, { useEffect, useState } from 'react';
import { Book, Clock, Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/ui/CourseCard';
import Button from '../components/ui/Button';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [purchasedRes, publishedRes] = await Promise.all([
          api.get('/purchase'),
          api.get('/course/published')
        ]);
        const ownedCourses = purchasedRes.data.data || [];
        setCourses(ownedCourses);
        const ownedIds = new Set(ownedCourses.map(course => course._id));
        setRecommended((publishedRes.data.data || []).filter(course => !ownedIds.has(course._id)).slice(0, 3));

        const progressEntries = await Promise.all(
          ownedCourses.map(async course => {
            try {
              const { data } = await api.get(`/progress/${course._id}`);
              return [course._id, data.data];
            } catch {
              return [course._id, null];
            }
          })
        );
        setProgressByCourse(Object.fromEntries(progressEntries));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + (progressByCourse[course._id]?.completionPercentage || 0), 0) / courses.length)
    : 0;

  return (
    <div className="dashboard-page container">
      <header className="dashboard-header">
        <div className="welcome-text">
          <h1>Welcome back, {user?.name || 'Student'}!</h1>
          <p>{courses.length ? `You've completed ${averageProgress}% across your active courses.` : 'Your enrolled courses will appear here after purchase.'}</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Book size={20} /></div>
            <div className="stat-info">
              <strong>{courses.length}</strong>
              <span>Enrolled</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Clock size={20} /></div>
            <div className="stat-info">
              <strong>{averageProgress}%</strong>
              <span>Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><Trophy size={20} /></div>
            <div className="stat-info">
              <strong>{Object.values(progressByCourse).filter(p => p?.isCompleted).length}</strong>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Continue Learning</h2>
          <Button variant="ghost" onClick={() => navigate('/courses')}>Browse Courses</Button>
        </div>
        <div className="enrolled-grid">
          {!loading && courses.map(course => {
            const progress = progressByCourse[course._id];
            const percentage = progress?.completionPercentage || 0;
            return (
              <div key={course._id} className="progress-card">
                <div className="progress-thumb">
                  <img src={course.coverImageUrl || course.thumbnailUrl || course.thumbnail} alt={course.title} />
                </div>
                <div className="progress-content">
                  <span className="cat-tag">{course.category}</span>
                  <h3>{course.title}</h3>
                  <div className="progress-bar-wrapper">
                    <div className="progress-info">
                      <span>{progress?.completedLectures || 0}/{progress?.totalLectures || course.totalLectures || 0} lectures</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                  <Button variant="primary" className="resume-btn" size="small" onClick={() => navigate(`/learn/${course._id}`)}>
                    Resume Lesson <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recommended for You</h2>
        </div>
        <div className="course-grid">
          {recommended.map(course => <CourseCard key={course._id} course={course} />)}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { Plus, Users, BarChart3, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    try {
      const { data } = await api.get('/course');
      setCourses(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your courses.');
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (courseId) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.delete(`/course/c/${courseId}`);
      setCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete course.');
    }
  };

  const totalStudents = courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0);

  return (
    <div className="instructor-dashboard container">
      <header className="dashboard-header">
        <div className="welcome-text">
          <h1>Instructor Dashboard</h1>
          <p>Manage the courses you created.</p>
        </div>
        <Link to="/instructor/courses/new">
          <Button variant="accent"><Plus size={20} /> Create New Course</Button>
        </Link>
      </header>

      <section className="stats-strip">
        <div className="inst-stat-card">
          <Users size={24} className="icon-blue" />
          <div className="stat-val">
            <strong>{totalStudents}</strong>
            <span>Total Students</span>
          </div>
        </div>
        <div className="inst-stat-card">
          <BarChart3 size={24} className="icon-green" />
          <div className="stat-val">
            <strong>{courses.length}</strong>
            <span>Created Courses</span>
          </div>
        </div>
      </section>

      <section className="courses-table-section">
        <div className="section-header">
          <h2>My Courses</h2>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="courses-table-wrapper">
          <table className="courses-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Students</th>
                <th>Lectures</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course._id}>
                  <td><strong>{course.title}</strong></td>
                  <td>{course.enrolledStudents?.length || 0}</td>
                  <td>{course.totalLectures || course.lectures?.length || 0}</td>
                  <td>
                    <span className={`status-pill ${course.isPublished ? 'published' : 'draft'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/instructor/courses/${course._id}/edit`}>
                      <button className="icon-btn edit" title="Edit course"><Edit size={18} /></button>
                    </Link>
                    <button className="icon-btn delete" title="Delete course" onClick={() => handleDelete(course._id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default InstructorDashboard;

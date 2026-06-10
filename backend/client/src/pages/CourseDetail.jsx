import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Star, Clock, Globe, User, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const loadCourse = async () => {
    setLoading(true);
    setError('');
    try {
      if (user) {
        const { data } = await api.get(`/purchase/course/${id}/detail-with-status`);
        setCourse(data.data.course);
        setEnrolled(Boolean(data.data.enrolled));
      } else {
        const { data } = await api.get(`/course/c/${id}`);
        setCourse(data.data);
        setEnrolled(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id, user]);

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasing(true);
    setError('');
    try {
      const { data } = await api.post('/razorpay/create-order', { courseId: id });
      if (data.isFree) {
        setEnrolled(true);
        return;
      }

      if (window.Razorpay && data.keyId && !data.keyId.includes('mock')) {
        const checkout = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'IntelliCourse',
          description: course.title,
          order_id: data.orderId,
          handler: async (response) => {
            await api.post('/razorpay/verify-payment', { ...response, courseId: id });
            setEnrolled(true);
          }
        });
        checkout.open();
      } else {
        await api.post('/razorpay/verify-payment', {
          razorpay_order_id: data.orderId,
          razorpay_payment_id: `dev_payment_${Date.now()}`,
          razorpay_signature: 'dev_mock_sig',
          courseId: id
        });
        setEnrolled(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete purchase.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="course-detail-page container" style={{ paddingTop: 120 }}>Loading course...</div>;
  if (!course) return <div className="course-detail-page container" style={{ paddingTop: 120 }}>{error || 'Course not found.'}</div>;

  const instructorName = course.instructor?.name || 'Instructor';
  const thumbnail = course.thumbnailUrl || course.thumbnail;
  const lectures = course.lectures || [];

  return (
    <div className="course-detail-page">
      <div className="course-hero">
        <div className="container hero-grid">
          <div className="hero-text-content">
            <Link to="/courses" className="back-link">
              <ArrowLeft size={18} /> Back to Courses
            </Link>
            <div className="cat-badge">{course.category}</div>
            <h1 className="course-detail-title">{course.title}</h1>
            <p className="course-tagline">{course.subtitle || course.description}</p>

            <div className="course-meta-large">
              <div className="meta-item">
                <Star size={20} className="star-fill" />
                <span><strong>4.8</strong> student rating</span>
              </div>
              <div className="meta-item">
                <User size={20} />
                <span>Created by <strong>{instructorName}</strong></span>
              </div>
              <div className="meta-item">
                <Clock size={20} />
                <span>{lectures.length} lectures</span>
              </div>
              <div className="meta-item">
                <Globe size={20} />
                <span>{course.level}</span>
              </div>
            </div>
          </div>

          <div className="course-purchase-card">
            <div className="preview-video">
              <img src={thumbnail} alt={course.title} />
              <div className="play-overlay">
                <div className="play-btn-circle"><Play size={24} /></div>
                <span>{enrolled ? 'Ready to learn' : 'Preview this course'}</span>
              </div>
            </div>
            <div className="purchase-content">
              <div className="price-row">
                <span className="current-price">{course.price > 0 ? `$${course.price}` : 'Free'}</span>
              </div>
              {error && <p className="urgency"><AlertCircle size={16} /> {error}</p>}
              <div className="cta-buttons">
                {enrolled ? (
                  <Button variant="primary" size="large" className="full-width" onClick={() => navigate(`/learn/${course._id}`)}>
                    Access Course
                  </Button>
                ) : (
                  <Button variant="primary" size="large" className="full-width" onClick={handlePurchase} disabled={purchasing}>
                    {purchasing ? 'Processing...' : 'Buy Course Now'}
                  </Button>
                )}
              </div>
              <ul className="course-features">
                <li><CheckCircle size={16} /> full lifetime access</li>
                <li><CheckCircle size={16} /> replay completed lectures anytime</li>
                <li><CheckCircle size={16} /> synced progress across devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-content-grid">
        <div className="main-content">
          <section className="detail-section">
            <h2>Description</h2>
            <div className="description-text">
              <p>{course.description || course.subtitle || 'No description available yet.'}</p>
            </div>
          </section>

          <section className="detail-section">
            <h2>Course Content</h2>
            <div className="curriculum-list">
              {lectures.map((lecture, index) => (
                <div key={lecture._id} className="curriculum-item">
                  <div className="item-left">
                    <Play size={16} />
                    <span>{index + 1}. {lecture.title}</span>
                  </div>
                  <span className="item-time">{lecture.duration ? `${Math.round(lecture.duration / 60)} min` : 'Video'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

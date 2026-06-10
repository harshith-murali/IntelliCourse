import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Code, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import CourseCard from '../components/ui/CourseCard';
import './Landing.css';

const Landing = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await api.get('/course/published');
        setFeaturedCourses((data.data || []).slice(0, 3));
      } catch {
        setFeaturedCourses([]);
      }
    };
    loadCourses();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="badge-wrapper">
              <span className="hero-badge">
                <Sparkles size={16} /> New courses every week
              </span>
            </div>
            <h1 className="hero-title">
              Curate your own <br />
              <span className="text-accent">creative career</span>
            </h1>
            <p className="hero-subtitle">
              Learn the latest design, development, and business skills from industry experts. 
              Build a portfolio that gets you hired.
            </p>
            <div className="hero-actions">
              <Link to="/courses">
                <Button variant="primary" size="large">
                  Get Started Now <ArrowRight size={20} style={{marginLeft: '12px'}} />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="ghost" size="large">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="shape box-1"></div>
            <div className="shape circle-1"></div>
            <div className="shape triangle-1"></div>
            <div className="hero-stats-card card-1">
              <div className="card-icon"><Code size={24} /></div>
              <div className="card-info">
                <strong>1,200+</strong>
                <span>Lessons</span>
              </div>
            </div>
            <div className="hero-stats-card card-2">
              <div className="card-icon"><Rocket size={24} /></div>
              <div className="card-info">
                <strong>Career Ready</strong>
                <span>Projects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Start at work</h2>
              <p className="section-subtitle">Real-world skills for the modern professional.</p>
            </div>
            <Link to="/courses"><Button variant="ghost">View All Courses</Button></Link>
          </div>

          <div className="course-grid">
            {featuredCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories / Feature Section */}
      <section className="category-section">
        <div className="container">
          <div className="category-banner">
            <div className="banner-content">
              <h3>Don't know where to start?</h3>
              <p>We've designed specialized tracks to help you transition into your dream role.</p>
              <div className="track-badges">
                <span className="track-badge dev">Development</span>
                <span className="track-badge design">Design</span>
                <span className="track-badge biz">Business</span>
              </div>
            </div>
            <Button variant="accent" size="large">Take a Quiz</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

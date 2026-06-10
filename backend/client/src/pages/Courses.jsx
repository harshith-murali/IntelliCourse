import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import CourseCard from '../components/ui/CourseCard';
import Button from '../components/ui/Button';
import './Courses.css';

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) setSearchQuery(query);
  }, [searchParams]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/course/published');
        setCourses(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const values = courses.map(course => course.category).filter(Boolean);
    return ['All', ...Array.from(new Set(values))];
  }, [courses]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setSearchParams(prev => {
      if (val) prev.set('search', val);
      else prev.delete('search');
      return prev;
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    const haystack = `${course.title || ''} ${course.subtitle || ''} ${course.description || ''}`.toLowerCase();
    return matchesCategory && haystack.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="courses-page container">
      <header className="courses-header">
        <h1 className="page-title">Explore Courses</h1>
        <p className="page-subtitle">Pick a path and start building your future today.</p>
      </header>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search for courses..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="sort-wrapper">
          <Button variant="ghost" size="small" className="sort-btn">
            Newest First <ChevronDown size={16} />
          </Button>
        </div>
      </div>

      <div className="results-info">
        <span>{loading ? 'Loading courses...' : `Showing ${filteredCourses.length} courses`}</span>
      </div>

      {error && <div className="no-results"><h3>{error}</h3></div>}

      <div className="course-grid">
        {!loading && filteredCourses.map(course => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>

      {!loading && filteredCourses.length === 0 && !error && (
        <div className="no-results">
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters.</p>
          <Button variant="primary" onClick={() => { handleSearchChange(''); setActiveCategory('All'); }}>Clear All Filters</Button>
        </div>
      )}
    </div>
  );
};

export default Courses;

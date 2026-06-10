import { Link } from 'react-router-dom';
import { Play, Star, Clock } from 'lucide-react';
import Button from './Button';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const courseId = course._id || course.id;
  const instructorName = course.instructor?.name || course.instructor || 'Instructor';
  const lectureCount = course.totalLectures || course.lectures?.length || 0;
  const { title, price, thumbnail, thumbnailUrl, coverImageUrl, category, rating, duration } = course;
  const cover = coverImageUrl || thumbnailUrl || thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';

  return (
    <div className="course-card">
      <Link to={`/course/${courseId}`} className="card-image">
        <img src={cover} alt={title} />
        <div className="category-badge">{category}</div>
      </Link>
      <div className="card-content">
        <Link to={`/course/${courseId}`}>
          <h4 className="course-title">{title}</h4>
        </Link>
        <p className="instructor">by {instructorName}</p>
        
        <div className="course-metrics">
          <div className="metric">
            <Star size={16} className="star-icon" />
            <span>{rating || '4.8'}</span>
          </div>
          <div className="metric">
            <Clock size={16} />
            <span>{duration || `${lectureCount} lectures`}</span>
          </div>
        </div>

        <div className="card-footer">
          <div className="price-tag">${price}</div>
          <Link to={`/course/${courseId}`}>
            <Button variant="primary" size="small">
              <Play size={16} className="play-icon" />
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

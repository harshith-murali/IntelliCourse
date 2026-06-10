import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, Send, Video, Camera } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer section">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="f-logo">
            <BookOpen size={28} className="logo-icon" />
            <span>EduSpark</span>
          </Link>
          <p className="f-tagline">Curating the future of creative education. Join 10k+ students worldwide.</p>
          <div className="social-links">
            <a href="#" className="social-link"><Code size={20} /></a>
            <a href="#" className="social-link"><Send size={20} /></a>
            <a href="#" className="social-link"><Camera size={20} /></a>
            <a href="#" className="social-link"><Video size={20} /></a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Learn</h4>
          <ul>
            <li><Link to="/courses">Development</Link></li>
            <li><Link to="/courses">Design</Link></li>
            <li><Link to="/courses">Business</Link></li>
            <li><Link to="/courses">Marketing</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/instructor">Become an Instructor</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div className="footer-newsletter">
          <h4>Stay Inspired</h4>
          <p>Weekly tips on design, tech and career.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="email@example.com" required />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; 2026 EduSpark. Built with ❤️ for the creative community.</p>
        <div className="bottom-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

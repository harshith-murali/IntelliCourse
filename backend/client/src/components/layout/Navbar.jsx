import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, Menu, Search, ChevronDown, Layout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  const avatarUrl = user?.avatarUrl || user?.avatar;

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <BookOpen size={32} className="logo-icon" />
            <span className="logo-text">EduSpark</span>
          </Link>

          <form className="nav-search" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="nav-links">
          <NavLink to="/courses" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Courses
          </NavLink>
          
          {user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                My Learning
              </NavLink>
              {(user.role === 'instructor' || user.role === 'admin') && (
                <NavLink to="/instructor" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Manage
                </NavLink>
              )}
              
              <div className="user-section">
                <ThemeToggle />
                
                <div className="profile-dropdown-container" ref={dropdownRef}>
                  <button 
                    className={`profile-trigger ${isDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="avatar">
                      {avatarUrl ? <img src={avatarUrl} alt={user.name} /> : <User size={20} />}
                    </div>
                    <span className="user-name">{user.name}</span>
                    <ChevronDown size={16} className={`arrow ${isDropdownOpen ? 'rotate' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <div className="header-info">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                        <span className="role-badge">{user.role}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <User size={18} /> Profile Details
                      </Link>
                      <Link to="/dashboard" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <Layout size={18} /> My Dashboard
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout-item" onClick={() => { logout(); setIsDropdownOpen(false); }}>
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="nav-actions">
              <ThemeToggle />
              <div className="auth-group">
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/register">
                  <Button variant="accent" size="small">Join Now</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <button className="mobile-menu-btn">
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

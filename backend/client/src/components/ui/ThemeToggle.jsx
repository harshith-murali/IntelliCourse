import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      <div className={`icon-container ${theme}`}>
        {theme === 'light' ? (
          <Moon size={20} className="moon" />
        ) : (
          <Sun size={20} className="sun" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;

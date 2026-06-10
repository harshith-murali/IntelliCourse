import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import InstructorDashboard from './pages/InstructorDashboard';
import CourseEditor from './pages/CourseEditor';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

// Scroll to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Login />;
    const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return <div className="container" style={{paddingTop: '100px'}}><h1>Access Denied</h1><p>You do not have permission to view this page.</p></div>;
    }
    return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-shell">
        <Routes>
          {/* Routes without standard Navbar (like the Player) */}
          <Route path="/learn/:courseId" element={
            <ProtectedRoute>
              <Learn />
            </ProtectedRoute>
          } />

          {/* Routes with standard Navbar */}
          <Route path="*" element={
            <>
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/course/:id" element={<CourseDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/instructor" element={
                    <ProtectedRoute role={['instructor', 'admin']}>
                      <InstructorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/instructor/courses/new" element={
                    <ProtectedRoute role={['instructor', 'admin']}>
                      <CourseEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/instructor/courses/:courseId/edit" element={
                    <ProtectedRoute role={['instructor', 'admin']}>
                      <CourseEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

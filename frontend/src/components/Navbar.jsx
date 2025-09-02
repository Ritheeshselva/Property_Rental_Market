import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    isLoggedIn: false,
    role: null,
    name: null,
    email: null
  });

  useEffect(() => {
    // Check authentication status on component mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    
    setUserData({
      isLoggedIn: !!token,
      role,
      name,
      email
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUserData({
      isLoggedIn: false,
      role: null,
      name: null,
      email: null
    });
    navigate('/');
  };

  const handleListProperty = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to list a property.');
      navigate('/login');
      return;
    }
    navigate('/register-property');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">
          <i className="fas fa-home"></i>
          <span>PropertyRental</span>
        </Link>
      </div>

      <div className="navbar-menu">
        <Link to="/" className="nav-link">
          <i className="fas fa-search"></i>
          Browse Properties
        </Link>
        
        {userData.isLoggedIn && (
          <button onClick={handleListProperty} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <i className="fas fa-plus"></i>
            List Property
          </button>
        )}

        {userData.role === 'admin' && (
          <Link to="/admin/dashboard" className="nav-link admin-link">
            <i className="fas fa-shield-alt"></i>
            Admin Dashboard
          </Link>
        )}
      </div>

      <div className="navbar-auth">
        {userData.isLoggedIn ? (
          <div className="user-profile">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="user-name">{userData.name}</span>
                <span className="user-role">
                  {userData.role === 'admin' ? (
                    <span className="admin-badge">
                      <i className="fas fa-crown"></i> Admin
                    </span>
                  ) : (
                    <span className="user-badge">
                      <i className="fas fa-user"></i> User
                    </span>
                  )}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-btn user-login-btn">
              <i className="fas fa-user"></i>
              User Login
            </Link>
            <Link to="/admin/login" className="login-btn admin-login-btn">
              <i className="fas fa-shield-alt"></i>
              Admin Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

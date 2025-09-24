import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../utils/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn: userIsLoggedIn, role, name } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleListProperty = () => {
    if (!userIsLoggedIn) {
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
        <Link to="/search" className="nav-link">
          <i className="fas fa-search"></i>
          Search Properties
        </Link>
        
        {userIsLoggedIn && (
          <button onClick={handleListProperty} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <i className="fas fa-plus"></i>
            List Property
          </button>
        )}

        {role === 'owner' && (
          <Link to="/owner-dashboard" className="nav-link admin-link">
            <i className="fas fa-home"></i>
            Owner Dashboard
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin/dashboard" className="nav-link admin-link">
            <i className="fas fa-shield-alt"></i>
            Admin Dashboard
          </Link>
        )}

        {role === 'staff' && (
          <Link to="/staff-dashboard" className="nav-link admin-link">
            <i className="fas fa-tools"></i>
            Staff Dashboard
          </Link>
        )}
      </div>

      <div className="navbar-auth">
        {userIsLoggedIn ? (
          <div className="user-profile">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="user-name">{name}</span>
                <span className="user-role">
                  {role === 'admin' ? (
                    <span className="admin-badge">
                      <i className="fas fa-crown"></i> Admin
                    </span>
                  ) : role === 'owner' ? (
                    <span className="admin-badge">
                      <i className="fas fa-home"></i> Owner
                    </span>
                  ) : role === 'staff' ? (
                    <span className="admin-badge">
                      <i className="fas fa-tools"></i> Staff
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
            <Link to="/login" className="login-btn">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

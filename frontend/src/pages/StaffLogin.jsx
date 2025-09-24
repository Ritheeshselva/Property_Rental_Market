import { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const data = await AuthAPI.login(email, password);
      if (data.role !== 'staff') {
        setMsg('Access denied. Staff privileges required.');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setMsg('Staff login successful! Redirecting...');
      setTimeout(() => {
        navigate('/staff-dashboard');
      }, 1000);
    } catch (e) {
      setMsg(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <i className="fas fa-tools admin-icon"></i>
          <h2>Staff Login</h2>
          <p>Access your staff dashboard</p>
        </div>
        <form className="form admin-form" onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Staff Email
            </label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter staff email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="Enter password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="admin-login-btn">
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Authenticating...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Staff Login
              </>
            )}
          </button>
        </form>
        <div className="admin-login-footer">
          <p>Need regular user access?</p>
          <button 
            onClick={() => navigate('/login')}
            className="switch-to-user-btn"
          >
            <i className="fas fa-user"></i>
            Switch to User Login
          </button>
        </div>
        {msg && (
          <div className={msg.includes('successful') ? 'success' : 'error'}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffLogin;

import { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
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
      if (isSignup) {
        await AuthAPI.signup(name, email, password);
        setMsg('Account created successfully! Now login.');
        setIsSignup(false);
        setName('');
        setPassword('');
        setLoading(false);
      } else {
        const data = await AuthAPI.login(email, password);
        
        // Check if user is trying to login as admin
        if (data.role === 'admin') {
          setMsg('This is an admin account. Please use the admin login page.');
          setLoading(false);
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);
        
        setMsg('Login successful! Redirecting...');
        
        // Redirect to home page after successful login
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (e) {
      setMsg(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="user-login-container">
        <div className="user-login-header">
          <i className="fas fa-user user-icon"></i>
          <h2>{isSignup ? 'Create User Account' : 'User Login'}</h2>
          <p>{isSignup ? 'Join our property rental community' : 'Access your account to browse and list properties'}</p>
        </div>
        
        <form className="form user-form" onSubmit={onSubmit}>
          {isSignup && (
            <div className="input-group">
              <label htmlFor="name">
                <i className="fas fa-user"></i> Full Name
              </label>
              <input 
                id="name"
                name="name" 
                type="text" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input 
              id="email"
              name="email" 
              type="email" 
              placeholder="Enter your email" 
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
              name="password" 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" disabled={loading} className="user-login-btn">
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {isSignup ? 'Creating Account...' : 'Logging In...'}
              </>
            ) : (
              <>
                <i className={isSignup ? 'fas fa-user-plus' : 'fas fa-sign-in-alt'}></i>
                {isSignup ? 'Create Account' : 'Login'}
              </>
            )}
          </button>
        </form>
        
        <div className="user-login-footer">
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"} 
            <button 
              onClick={() => {
                setIsSignup(!isSignup);
                setMsg('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="switch-mode-btn"
            >
              {isSignup ? 'Login here' : 'Sign up here'}
            </button>
          </p>
          
          <div className="admin-link-section">
            <p>Are you an administrator?</p>
            <button 
              onClick={() => navigate('/admin/login')}
              className="admin-link-btn"
            >
              <i className="fas fa-shield-alt"></i>
              Admin Login
            </button>
          </div>
        </div>
        
        {msg && (
          <div className={msg.includes('successful') || msg.includes('created') ? 'success' : 'error'}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

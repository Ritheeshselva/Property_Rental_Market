import { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    
    try {
      if (isSignup) {
        await AuthAPI.signup(name, email, password, role, phone, address);
        setMsg('Account created successfully! Now login.');
        setIsSignup(false);
        setName('');
        setPassword('');
        setPhone('');
        setAddress('');
        setRole('user');
        
        setLoading(false);
      } else {
        const data = await AuthAPI.login(email, password);
        
        console.log('Login successful, user data:', data); // Debug log
        
        // Use the login utility function
        login(data.token, {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          address: data.address,
          subscriptionStatus: data.subscriptionStatus,
          staffId: data.staffId,
          specialization: data.specialization
        });
        
        console.log('Auth change event triggered'); // Debug log
        
        setMsg('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
          if (data.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (data.role === 'owner') {
            navigate('/owner-dashboard');
          } else if (data.role === 'staff') {
            navigate('/staff-dashboard');
          } else {
            navigate('/');
          }
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
          <h2>{isSignup ? 'Create Account' : 'Login'}</h2>
          <p>{isSignup ? 'Join our property rental community' : 'Access your account - all user types welcome'}</p>
        </div>
        
        <form className="form user-form" onSubmit={onSubmit}>
          {isSignup && (
            <>
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

              <div className="input-group">
                <label htmlFor="role">
                  <i className="fas fa-user-tag"></i> Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="user">Regular User</option>
                  <option value="owner">Property Owner</option>
                  <option value="staff">Staff Member</option>
                </select>
              </div>

              {/* staff option allows users to register as staff like other roles */}

              <div className="input-group">
                <label htmlFor="phone">
                  <i className="fas fa-phone"></i> Phone Number
                </label>
                <input 
                  id="phone"
                  name="phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label htmlFor="address">
                  <i className="fas fa-map-marker-alt"></i> Address
                </label>
                <input 
                  id="address"
                  name="address" 
                  type="text" 
                  placeholder="Enter your address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>
            </>
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
                setPhone('');
                setAddress('');
                setRole('user');
              }}
              className="switch-mode-btn"
            >
              {isSignup ? 'Login here' : 'Sign up here'}
            </button>
          </p>
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

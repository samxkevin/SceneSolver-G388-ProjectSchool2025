import React, { useState, useRef } from "react";
import "./Login.css";
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(true);
    const passwordRef = useRef(null);
    const newPasswordRef = useRef(null);
    const [usernameError, setUsernameError] = useState('');
    const [newUsernameError, setNewUsernameError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Form data states
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });
    
    const [signupData, setSignupData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const toggleForm = () => {
        setShowLogin(prev => !prev);
        setUsernameError('');
        setNewUsernameError('');
        setMessage('');
    };

    const togglePassword = (ref) => {
        if (ref.current) {
            ref.current.type = ref.current.type === 'password' ? 'text' : 'password';
        }
    };

    const validateUsername = (username) => {
        const regex = /^[a-zA-Z0-9_]+$/;
        if (!regex.test(username)) {
            return "Username can only contain letters, numbers, and underscores.";
        }
        return "";
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData({
            ...loginData,
            [name]: value
        });
        
        if (name === 'username') {
            const error = validateUsername(value);
            setUsernameError(error);
        }
    };

    const handleSignupChange = (e) => {
        const { name, value } = e.target;
        setSignupData({
            ...signupData,
            [name]: value
        });
        
        if (name === 'username') {
            const error = validateUsername(value);
            setNewUsernameError(error);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        
        if (usernameError) return;
        
        setIsLoading(true);
        setMessage('');
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Login successful!');
                // Store the token in localStorage
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                // Redirect to dashboard or home page after successful login
                setTimeout(() => {
                    navigate('/dashboard'); // or any other route you want to redirect to
                }, 1000);
            } else {
                setMessage(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        
        if (newUsernameError) return;
        
        setIsLoading(true);
        setMessage('');
        
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Registration request submitted! An administrator will review your request.');
                // Clear form after successful signup
                setSignupData({
                    username: '',
                    email: '',
                    password: ''
                });
            } else {
                setMessage(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setMessage('An error occurred during registration. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <nav className="login-nav">
                <Link to="/" className="logo">CrimeSceneSolver</Link>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/upload">Upload</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
            </nav>

            <div className="relative w-full max-w-md form-container">
                {message && (
                    <div className={`message-container ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
                
                {showLogin ? (
                    <div id="loginForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Login</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Authorized personnel only</p>
                        
                        <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={loginData.username}
                                    onChange={handleLoginChange}
                                    required
                                    className={`w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border ${usernameError ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none`}
                                />
                                {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
                            </div>
                            
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    required
                                    ref={passwordRef}
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none"
                                />
                                <label className="text-sm mt-2 inline-flex items-center text-gray-300">
                                    <input type="checkbox" onClick={() => togglePassword(passwordRef)} className="mr-2" /> Show password
                                </label>
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-[#ff4757] text-white font-semibold py-2 px-4 rounded hover:bg-[#ff6b81] transition"
                                disabled={!!usernameError || isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                        
                        <p className="text-sm text-center text-gray-400 mt-4">
                            Don't have access?{" "}
                            <button onClick={toggleForm} className="text-[#ff4757] font-medium hover:bg-transparent">
                                Sign up
                            </button>
                        </p>
                    </div>
                ) : (
                    <div id="signupForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]">Sign Up</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Request access to the system</p>
                        
                        <form className="mt-6 space-y-4" onSubmit={handleSignupSubmit}>
                            <div>
                                <label htmlFor="new-username" className="block text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    id="new-username"
                                    name="username"
                                    value={signupData.username}
                                    onChange={handleSignupChange}
                                    required
                                    className={`w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border ${newUsernameError ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none`}
                                />
                                {newUsernameError && <p className="text-red-500 text-xs mt-1">{newUsernameError}</p>}
                            </div>
                            
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email"
                                    value={signupData.email}
                                    onChange={handleSignupChange}
                                    required
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none" 
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium">Create Password</label>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="password"
                                    value={signupData.password}
                                    onChange={handleSignupChange}
                                    required
                                    ref={newPasswordRef}
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none"
                                />
                                <label className="text-sm mt-2 inline-flex items-center text-gray-300">
                                    <input type="checkbox" onClick={() => togglePassword(newPasswordRef)} className="mr-2" /> Show password
                                </label>
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-[#ff4757] text-white font-semibold py-2 px-4 rounded hover:bg-[#ff6b81] transition"
                                disabled={!!newUsernameError || isLoading}
                            >
                                {isLoading ? 'Submitting Request...' : 'Request Access'}
                            </button>
                        </form>
                        
                        <p className="text-sm text-center text-gray-400 mt-4">
                            Already authorized?{" "}
                            <button onClick={toggleForm} className="text-[#ff4757] font-medium hover:bg-transparent">
                                Back to login
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
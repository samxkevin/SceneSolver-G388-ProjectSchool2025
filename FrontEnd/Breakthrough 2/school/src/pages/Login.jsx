import React, { useState, useRef } from "react";
import "./Login.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [showLogin, setShowLogin] = useState(true);
    const passwordRef = useRef(null);
    const newPasswordRef = useRef(null);
    const [username, setUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [email, setEmail] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [newUsernameError, setNewUsernameError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [signupError, setSignupError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const toggleForm = () => {
        setShowLogin(prev => !prev);
        setUsernameError('');
        setNewUsernameError('');
        setLoginError('');
        setSignupError('');
        setUsername('');
        setNewUsername('');
        setPassword('');
        setNewPassword('');
        setEmail('');
        setShowForgotPassword(false); // Hide forgot password form when toggling
        setForgotPasswordEmail('');
        setForgotPasswordMessage('');
        setForgotPasswordError('');
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

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        setUsernameError(validateUsername(value));
    };

    const handleNewUsernameChange = (e) => {
        const value = e.target.value;
        setNewUsername(value);
        setNewUsernameError(validateUsername(value));
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleNewPasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleForgotPasswordClick = () => {
        setShowForgotPassword(true);
        setShowLogin(false);
        setLoginError('');
        setForgotPasswordMessage('');
        setForgotPasswordError('');
    };

    const handleForgotPasswordEmailChange = (e) => {
        setForgotPasswordEmail(e.target.value);
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setForgotPasswordMessage('');
        setForgotPasswordError('');

        if (!forgotPasswordEmail) {
            setForgotPasswordError('Please enter your email address.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', { // Backend endpoint for forgot password
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });

            const data = await response.json();

            if (response.ok && data.message) {
                setForgotPasswordMessage(data.message);
            } else {
                setForgotPasswordError(data.message || 'Failed to send password reset email. Please try again.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setForgotPasswordError('Failed to connect to the server.');
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        if (!username || !password) {
            setLoginError('Please enter both username and password');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                login(data.token);
                navigate('/upload', { replace: true });
            } else {
                setLoginError(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('Failed to connect to the server.');
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSignupError('');

        if (!newUsername || !newPassword || !email) {
            setSignupError('Please fill in all the fields.');
            return;
        }

        const usernameValidation = validateUsername(newUsername);
        if (usernameValidation) {
            setNewUsernameError(usernameValidation);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: newUsername, password: newPassword, email }),
            });

            const data = await response.json();

            if (response.ok && data.message) {
                alert(data.message); // Or display a more user-friendly message
                toggleForm(); // Go back to the login form
            } else {
                setSignupError(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setSignupError('Failed to connect to the server.');
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
                {showForgotPassword ? (
                    <div id="forgotPasswordForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Forgot Password</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Enter your email to reset your password.</p>

                        {forgotPasswordMessage && (
                            <div className="mt-4 p-2 bg-green-800 bg-opacity-30 border border-green-500 rounded text-green-400 text-sm">
                                {forgotPasswordMessage}
                            </div>
                        )}

                        {forgotPasswordError && (
                            <div className="mt-4 p-2 bg-red-800 bg-opacity-30 border border-red-500 rounded text-red-400 text-sm">
                                {forgotPasswordError}
                            </div>
                        )}

                        <form className="mt-6 space-y-4" onSubmit={handleForgotPasswordSubmit}>
                            <div>
                                <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    id="forgotPasswordEmail"
                                    name="forgotPasswordEmail"
                                    value={forgotPasswordEmail}
                                    onChange={handleForgotPasswordEmailChange}
                                    required
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#ff4757] text-white font-semibold py-2 px-4 rounded hover:bg-[#ff6b81] transition"
                            >
                                Reset Password
                            </button>
                        </form>
                        <p className="text-sm text-center text-gray-400 mt-4">
                            Remember your password?{" "}
                            <button onClick={() => { setShowForgotPassword(false); setShowLogin(true); setForgotPasswordMessage(''); setForgotPasswordError(''); }} className="text-[#ff4757] font-medium hover:bg-transparent">
                                Back to login
                            </button>
                        </p>
                    </div>
                ) : showLogin ? (
                    <div id="loginForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Login</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Authorized personnel only</p>

                        {loginError && (
                            <div className="mt-4 p-2 bg-red-800 bg-opacity-30 border border-red-500 rounded text-red-400 text-sm">
                                {loginError}
                            </div>
                        )}

                        {location.state?.from && (
                            <div className="mt-4 p-2 bg-yellow-800 bg-opacity-30 border border-yellow-500 rounded text-yellow-300 text-sm">
                                Authentication required to access this page. Please log in.
                            </div>
                        )}

                        <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={username}
                                    onChange={handleUsernameChange}
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
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    ref={passwordRef}
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none"
                                />
                                <label className="text-sm mt-2 inline-flex items-center text-gray-300">
                                    <input type="checkbox" onClick={() => togglePassword(passwordRef)} className="mr-2" /> Show password
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="w-full bg-[#ff4757] text-white font-semibold py-2 px-4 rounded hover:bg-[#ff6b81] transition"
                                    disabled={!!usernameError}
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                        <div className="mt-4 text-center">
                            <button onClick={handleForgotPasswordClick} className="text-sm text-gray-400 hover:text-[#ff4757] focus:outline-none">
                                Forgot your password?
                            </button>
                            <p className="text-sm text-center text-gray-400 mt-2">
                                Don't have access?{" "}
                                <button onClick={toggleForm} className="text-[#ff4757] font-medium hover:bg-transparent">
                                    Sign up
                                </button>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div id="signupForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]">Sign Up</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Request access to the system</p>
                        {signupError && (
                            <div className="mt-4 p-2 bg-red-800 bg-opacity-30 border border-red-500 rounded text-red-400 text-sm">
                                {signupError}
                            </div>
                        )}
                        <form className="mt-6 space-y-4" onSubmit={handleSignupSubmit}>
                            <div>
                                <label htmlFor="new-username" className="block text-sm font-medium">Create Username</label>
                                <input
                                    type="text"
                                    id="new-username"
                                    name="new-username"
                                    value={newUsername}
                                    onChange={handleNewUsernameChange}
                                    required
                                    className={`w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border ${newUsernameError ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none`}
                                />
                                {newUsernameError && <p className="text-red-500 text-xs mt-1">{newUsernameError}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                                <input type="email" id="email" name="email" value={email} onChange={handleEmailChange} required
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none" />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium">Create Password</label>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="new-password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
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
                                disabled={!!newUsernameError}
                            >
                                Request Access
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
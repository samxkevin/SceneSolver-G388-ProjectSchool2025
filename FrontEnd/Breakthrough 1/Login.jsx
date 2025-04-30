import React, { useState, useRef } from "react";
import "./Login.css";
// import "./Login.css"; // Make sure to create this file with the CSS provided below
import { Link } from 'react-router-dom';

function Login() {
    const [showLogin, setShowLogin] = useState(true);
    const passwordRef = useRef(null);
    const newPasswordRef = useRef(null);
    const [usernameError, setUsernameError] = useState('');
    const [newUsernameError, setNewUsernameError] = useState('');

    const toggleForm = () => {
        setShowLogin(prev => !prev);
        setUsernameError('');
        setNewUsernameError('');
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
        const error = validateUsername(e.target.value);
        setUsernameError(error);
    };

    const handleNewUsernameChange = (e) => {
        const error = validateUsername(e.target.value);
        setNewUsernameError(error);
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
                {showLogin ? (
                    <div id="loginForm" className="form-slide form-visible">
                        <h2 className="text-3xl font-bold text-center text-[#ff4757]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Login</h2>
                        <p className="text-sm text-center text-gray-400 mt-1">Authorized personnel only</p>
                        <form className="mt-6 space-y-4" method="POST" action="#">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    required
                                    onChange={handleUsernameChange}
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
                                disabled={!!usernameError}
                            >
                                Sign in
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
                        <form className="mt-6 space-y-4" method="POST" action="#">
                            <div>
                                <label htmlFor="new-username" className="block text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    id="new-username"
                                    name="new-username"
                                    required
                                    onChange={handleNewUsernameChange}
                                    className={`w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border ${newUsernameError ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none`}
                                />
                                {newUsernameError && <p className="text-red-500 text-xs mt-1">{newUsernameError}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                                <input type="email" id="email" name="email" required
                                    className="w-full mt-1 px-3 py-2 rounded bg-[#0f0f0f] border border-gray-600 text-white focus:outline-none" />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium">Create Password</label>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="new-password"
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

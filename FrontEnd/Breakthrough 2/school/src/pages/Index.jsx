import React from "react";
import { Link } from 'react-router-dom'; // Import Link

function Index() {
    return (
        <div>
            {/*header*/}
            <header className="border-b border-[#ff4757]-800 py-4">
                <div className="container mx-auto flex justify-between items-center px-6">
                    <h1 className="logo"><Link to="/">CrimeSceneSolver</Link></h1>
                    <nav className="flex gap-6 items-center">
                        <Link to="/" className="hover:text-gray-400">Home</Link>
                        <Link to="/upload" className="hover:text-gray-400">Upload</Link>
                        <Link to="/contact" className="hover:text-gray-400">Contact</Link>
                        <Link to="/Login" className="btn">Sign Up / Log In</Link>
                    </nav>
                </div>
            </header>
            {/*//Header*/}
            <section className="hero">
                <h2 className="hero-title" style={{ fontFamily: 'Orbitron, sans-serif' }}>Uncover the Fact.</h2>
                <p className="hero-subtitle">
                    An intelligent, secure platform for modern crime scene investigation. Empowering investigators with
                    advanced tools for faster, more accurate case resolution.
                </p>
                <div className="mt-8">
                    <Link to="/Login" className="btn-lg">Get Started Now</Link>
                </div>
            </section>

            <section id="features" className="features-section">
                <h3 className="text-center text-2xl font-bold mb-6">Core Capabilities</h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <h4 className="text-xl font-semibold mb-3">Evidence Tracker</h4>
                        <img
                            src="images/crime.jpeg"
                            alt="Evidence markers and a measuring tape at a crime scene"
                            className="w-full rounded mb-3"
                        />
                        <p>Securely log and trace every piece of evidence from scene to court with detailed audit trails.</p>
                    </div>
                    <div className="feature-card">
                        <h4 className="text-xl font-semibold mb-3">AI Crime Pattern Detection</h4>
                        <img
                            src="images/crime1.webp"
                            alt="Network graph visualizing connections and patterns in data"
                            className="w-full rounded mb-3"
                        />
                        <p>
                            Uncover hidden connections and predict potential crime hotspots with intelligent crime mapping
                            and analysis tools.
                        </p>
                    </div>
                    <div className="feature-card">
                        <h4 className="text-xl font-semibold mb-3">Real-time Collaboration</h4>
                        <img
                            src="images/crime2.jpeg"
                            alt="Multiple devices showing shared data and communication"
                            className="w-full rounded mb-3"
                        />
                        <p>
                            Work seamlessly and securely with your team across different locations in real time, sharing
                            critical information instantly.
                        </p>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <Link to="/Login" className="btn">Explore All Features</Link>
                </div>
            </section>
            <section className="how-it-works">
                <h3 className="text-center text-2xl font-bold mb-6">How It Works</h3>
                <div className="how-grid">
                    <div className="text-center">
                        <div className="emoji">📁</div>
                        <h4 className="text-lg font-semibold mt-3 mb-2">1. Upload Case Data</h4>
                        <p>Digitize and securely upload all your reports, images, videos, and other crucial case files.</p>
                    </div>
                    <div className="text-center">
                        <div className="emoji">🧠</div>
                        <h4 className="text-lg font-semibold mt-3 mb-2">2. Analyze Evidence</h4>
                        <p>
                            Leverage our powerful AI and forensic tools to analyze evidence, identify suspects, and detect
                            patterns efficiently.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="emoji">✅</div>
                        <h4 className="text-lg font-semibold mt-3 mb-2">3. Solve Cases Faster</h4>
                        <p>
                            Make data-driven, informed decisions and collaborate effectively to close cases more quickly
                            and accurately.
                        </p>
                    </div>
                </div>
            </section>

            <section id="pricing" className="pricing-section">
                <h3 className="text-2xl font-bold">Pricing</h3>
                <div className="pricing-info">
                    <p>We offer flexible pricing plans to suit the needs of different investigation teams and agencies.</p>
                    <p><strong>Basic Plan:</strong> Ideal for small teams, offering core evidence tracking features.</p>
                    <p><strong>Pro Plan:</strong> Includes AI-powered pattern detection and enhanced collaboration tools.</p>
                    <p><strong>Enterprise Plan:</strong> Customizable solution with dedicated support and advanced analytics.</p>
                    <p className="mt-4">
                        <Link to="/pricing" className="btn">View Pricing Details</Link>
                    </p>
                </div>
            </section>

            <section className="testimonials">
                <h3 className="text-2xl font-bold mb-4">Trusted by Investigators</h3>
                <blockquote className="quote">
                    “We closed a complex 6-month investigation in under 2 weeks after implementing CrimeSceneSolver. The
                    AI-driven analysis and real-time collaboration features were a game changer for our team.”
                </blockquote>
                <p className="quote-author">— Detective Lara Monroe, Forensics Division</p>
            </section>

            <section id="contact" className="contact-section">
                <h3 className="text-2xl font-bold">Contact Us</h3>
                <div className="contact-info">
                    <p>Have questions or need more information? Reach out to our team.</p>
                    <p>
                        Email:
                        <a href="mailto:info@crimescenesolver.com" className="text-blue-400 hover:underline">
                            info@crimescenesolver.com
                        </a>
                    </p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p className="mt-4">
                        <Link to="/contact" className="btn">Contact Form</Link>
                    </p>
                </div>
            </section>
        </div>
    );
}

export default Index;

import React from 'react';
import { Link } from 'react-router-dom';
import './contact.css';

function ContactPage() {
  return (
    <div className="contact-page">
      <header className="contact-header">
        <div className="contact-logo">CrimeSceneSolver</div>
        <nav className="contact-nav">
          <Link to="/">Home</Link>
          <Link to="/Login">Login</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <form action="#" method="post">
          <input type="text" name="name" placeholder="Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
            required
          />
          <textarea name="message" rows="6" placeholder="Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </section>

      <footer className="contact-footer">
        &copy; 2025 CrimeSceneSolver. All rights reserved.
      </footer>
    </div>
  );
}

export default ContactPage;

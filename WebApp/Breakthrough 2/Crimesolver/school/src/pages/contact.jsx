import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './contact.css';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/contact', formData);
      alert('Message sent successfully!');
      console.log('✅ Server Response:', response.data);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('❌ Error submitting form:', error.response?.data || error.message);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="contact-page">
      <header className="contact-header">
        <div className="contact-logo">CrimeSceneSolver</div>
        <nav className="contact-nav">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            rows="6"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
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

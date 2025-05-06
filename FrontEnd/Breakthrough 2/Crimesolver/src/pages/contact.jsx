import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './contact.css';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('Sending...');
    
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitStatus('Message sent successfully!');
        // Clear form
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('Failed to send message: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('An error occurred while sending your message.');
    }
  };

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
        {submitStatus && <div className={submitStatus.includes('success') ? 'success-message' : 'error-message'}>{submitStatus}</div>}
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
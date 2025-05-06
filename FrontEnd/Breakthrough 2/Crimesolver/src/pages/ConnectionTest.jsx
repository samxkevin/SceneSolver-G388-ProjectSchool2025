import { useState, useEffect } from 'react';

function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [message, setMessage] = useState('');

  // Test connection when component loads
  useEffect(() => {
    testConnection();
  }, []);

  // Function to test backend connection
  const testConnection = () => {
    setConnectionStatus('Testing connection...');
    
    fetch('/api/test')
      .then(response => {
        if (!response.ok) {
          throw new Error('Server responded with an error');
        }
        return response.json();
      })
      .then(data => {
        setConnectionStatus('Connected! 🎉');
        setMessage(data.message);
      })
      .catch(error => {
        console.error('Connection error:', error);
        setConnectionStatus('Connection failed ❌');
      });
  };

  return (
    <div style={{ 
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <h2>Backend Connection Test</h2>
      <p>Status: <strong>{connectionStatus}</strong></p>
      
      {message && (
        <p>Message from server: <strong>{message}</strong></p>
      )}
      
      <button 
        onClick={testConnection}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Connection Again
      </button>
    </div>
  );
}

export default ConnectionTest;
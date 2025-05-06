const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

export const testConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/test`);
    return await response.json();
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
};

// Add more API functions as needed
export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:, error`);
    throw error;
  }
};

export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error(`Error posting to ${endpoint}:, error`);
    throw error;
  }
};
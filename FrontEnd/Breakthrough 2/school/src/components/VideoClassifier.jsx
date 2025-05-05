import React, { useState, useEffect } from 'react';
import { videoClassifierApi } from './VideoClassifierAPI';

/**
 * Video Classifier component for uploading and classifying videos
 */
function VideoClassifier() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState(null);

  // Fetch model info when component mounts
  useEffect(() => {
    async function fetchModelInfo() {
      try {
        const info = await videoClassifierApi.getModelInfo();
        setModelInfo(info);
      } catch (err) {
        console.error('Error fetching model info:', err);
        setError('Failed to connect to the classification API. Please check if the backend is running.');
      }
    }

    fetchModelInfo();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setResults(null);
      setError('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await videoClassifierApi.classifyVideo(videoFile);
      setResults(response.results);
    } catch (err) {
      console.error('Classification error:', err);
      setError(err.message || 'Failed to classify video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="video-classifier">
      <h2>Video Crime Classification</h2>
      
      {modelInfo && (
        <div className="model-info">
          <p>Model: <strong>{modelInfo.model_name}</strong></p>
          <p>Device: {modelInfo.device}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="file-upload">
          <label htmlFor="video-upload">Select Video:</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>

        {videoPreview && (
          <div className="video-preview">
            <video controls src={videoPreview} style={{ maxWidth: '100%', maxHeight: '300px' }} />
          </div>
        )}

        <button 
          type="submit" 
          disabled={!videoFile || isLoading}
          className="classify-button"
        >
          {isLoading ? 'Processing...' : 'Classify Video'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="results-container">
          <h3>Classification Results:</h3>
          
          <div className="prediction-main">
            <h4>Primary Prediction:</h4>
            <div className="prediction-card">
              <div className="prediction-label">
                {results.predicted_class.name}
              </div>
              <div className="prediction-confidence">
                {results.predicted_class.percent}% confidence
              </div>
              <div className="prediction-bar-container">
                <div 
                  className="prediction-bar" 
                  style={{ width: `${results.predicted_class.percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="top-predictions">
            <h4>Top Predictions:</h4>
            {results.top_predictions.map((prediction, index) => (
              <div key={index} className="prediction-item">
                <span className="prediction-name">{prediction.name}</span>
                <span className="prediction-percent">{prediction.percent}%</span>
                <div className="prediction-bar-container">
                  <div 
                    className="prediction-bar" 
                    style={{ width: `${prediction.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="timing-info">
            <p>Processing time: {results.processing_time}s</p>
            <p>Inference time: {results.inference_time}s</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoClassifier;
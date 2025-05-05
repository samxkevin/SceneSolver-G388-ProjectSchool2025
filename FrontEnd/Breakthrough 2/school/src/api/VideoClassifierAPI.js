/**
 * API service for interacting with the video classification backend
 */
class VideoClassifierAPI {
    constructor(baseUrl = '') {
      // Base URL defaults to current server in production
      // In development, it points to the local Express server
      this.baseUrl = baseUrl || '';
    }
  
    /**
     * Check if the API is healthy
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
      try {
        const response = await fetch(`${this.baseUrl}/api/health`);
        return await response.json();
      } catch (error) {
        console.error('Health check failed:', error);
        throw new Error('API health check failed');
      }
    }
  
    /**
     * Get information about the model
     * @returns {Promise<Object>} Model information
     */
    async getModelInfo() {
      try {
        const response = await fetch(`${this.baseUrl}/api/model/info`);
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch model info:', error);
        throw new Error('Failed to get model information');
      }
    }
  
    /**
     * Get the list of classes the model can detect
     * @returns {Promise<Object>} Class information
     */
    async getClasses() {
      try {
        const response = await fetch(`${this.baseUrl}/api/classes`);
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        throw new Error('Failed to get class information');
      }
    }
  
    /**
     * Upload and classify a video
     * @param {File} videoFile - The video file to classify
     * @param {Function} onProgress - Optional callback for progress updates
     * @returns {Promise<Object>} Classification results
     */
    async classifyVideo(videoFile, onProgress = null) {
      try {
        // Create form data and append the file
        const formData = new FormData();
        formData.append('video', videoFile);
  
        // Set up the request
        const response = await fetch(`${this.baseUrl}/api/classify`, {
          method: 'POST',
          body: formData,
        });
  
        const data = await response.json();
  
        // Check for errors in the response
        if (data.error) {
          throw new Error(data.message || 'Classification failed');
        }
  
        return data;
      } catch (error) {
        console.error('Video classification failed:', error);
        throw error;
      }
    }
  }
  
  // Export a singleton instance
  export const videoClassifierApi = new VideoClassifierAPI();
  
  // Also export the class for custom instantiation
  export default VideoClassifierAPI;
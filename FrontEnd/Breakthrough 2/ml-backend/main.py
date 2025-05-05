from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
import logging
from werkzeug.utils import secure_filename
import model_utils

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload settings
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "SceneSolver API is running",
        "timestamp": time.time()
    })

@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Return information about the model"""
    return jsonify({
        "model_name": "TimeSformer Crime Classification",
        "num_classes": model_utils.NUM_CLASSES,
        "class_names": model_utils.CLASS_NAMES,
        "device": model_utils.DEVICE
    })

@app.route('/api/classify', methods=['POST'])
def classify_video():
    """
    Endpoint to classify a video
    
    Expects a multipart/form-data with a 'video' field containing the video file
    
    Returns:
        JSON with classification results
    """
    try:
        # Check if video file was included in the request
        if 'video' not in request.files:
            return jsonify({
                "error": "No video file provided",
                "message": "Please upload a video file"
            }), 400
        
        file = request.files['video']
        
        # Check if filename is empty
        if file.filename == '':
            return jsonify({
                "error": "No selected file",
                "message": "Please select a video file"
            }), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                "error": "Invalid file type",
                "message": f"Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Process the video
        logger.info(f"Processing uploaded video: {file.filename}")
        start_time = time.time()
        
        # Process the uploaded video
        results = model_utils.process_uploaded_video(file)
        
        # Add processing time to results
        results["processing_time"] = round(time.time() - start_time, 4)
        
        return jsonify({
            "status": "success",
            "message": "Video classified successfully",
            "results": results
        })
        
    except Exception as e:
        logger.exception("Error processing video")
        return jsonify({
            "error": "Processing error",
            "message": str(e)
        }), 500

@app.route('/api/classes', methods=['GET'])
def get_classes():
    """Return the list of classes the model can detect"""
    return jsonify({
        "num_classes": model_utils.NUM_CLASSES,
        "classes": model_utils.CLASS_NAMES
    })

if __name__ == '__main__':
    # Log startup
    logger.info("Starting SceneSolver API...")
    
    # Get port from environment or use 5000 as default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)
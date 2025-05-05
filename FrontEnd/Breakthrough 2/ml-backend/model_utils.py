import os
import cv2
import numpy as np
import time
import json
from pathlib import Path
import tempfile

# Define constants
NUM_FRAMES = 16
NUM_CLASSES = 14
DEVICE = 'cpu'  # Force CPU for simplicity

# Class names for crime classification
CLASS_NAMES = [
    "Abuse", "Arrest", "Arson", "Assault", "Burglary",
    "Explosion", "Fighting", "Robbery", "Shooting", "Shoplifting",
    "Stealing", "Vandalism", "Vehicle Theft", "Weapon Display"
]

# Mock model for demonstration
class MockModel:
    def __init__(self):
        print("[INFO] Initializing mock model for demo...")
    
    def __call__(self, **kwargs):
        class Outputs:
            def __init__(self):
                # Mock logits - highest probability for class 3 (Assault)
                self.logits = np.zeros((1, NUM_CLASSES))
                self.logits[0, 3] = 5.0  # Assault
                self.logits[0, 5] = 3.2  # Explosion
                self.logits[0, 6] = 2.8  # Fighting
                import torch
                self.logits = torch.tensor(self.logits)
        
        # Simulate processing time
        time.sleep(1.5)
        return Outputs()

# Create a singleton model instance
_model = None
_processor = None

def get_model():
    """
    Singleton function to load and return the model
    """
    global _model, _processor
    
    if _model is None:
        _model = MockModel()
        _processor = None
    
    return _model, _processor

def extract_frames(video_path, num_frames=NUM_FRAMES):
    """
    Extract equally spaced frames from a video
    
    Args:
        video_path: Path to the video file
        num_frames: Number of frames to extract
        
    Returns:
        List of extracted frames as numpy arrays
    """
    print(f"[INFO] Extracting {num_frames} frames from: {video_path}")
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[DEBUG] Total frames in video: {total_frames}")

    if total_frames < num_frames:
        print(f"[WARNING] Video has fewer frames ({total_frames}) than requested ({num_frames}). Using all available frames.")
        indices = list(range(total_frames))
    else:
        indices = np.linspace(0, total_frames - 1, num=num_frames, dtype=int)
    
    frames = []
    for i in range(total_frames):
        ret, frame = cap.read()
        if not ret:
            break
        if i in indices:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(rgb_frame)
            
            # Break early if we've collected enough frames
            if len(frames) >= num_frames:
                break
                
    cap.release()

    print(f"[INFO] Extracted {len(frames)} frames.")
    return frames

def classify_video(video_path, model=None, processor=None, device=DEVICE):
    """
    Run inference on a video file
    
    Args:
        video_path: Path to the video file
        model: Pre-loaded model (optional)
        processor: Pre-loaded processor (optional)
        device: Device to run inference on
        
    Returns:
        Dictionary containing classification results
    """
    # Load model if not provided
    if model is None or processor is None:
        model, processor = get_model()
    
    # Extract frames from video
    frames = extract_frames(video_path)
    
    print("[INFO] Running inference...")
    start_time = time.time()

    # Run inference
    try:
        import torch
        from torch.nn import functional as F
        
        # Prepare inputs (simplified for mock model)
        inputs = {'pixel_values': torch.ones((1, NUM_FRAMES, 3, 224, 224))}
        
        # Run model
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = F.softmax(logits, dim=1)

        confidence, predicted_index = torch.max(probabilities, dim=1)
        top3_confidence, top3_indices = torch.topk(probabilities, k=min(3, NUM_CLASSES), dim=1)
        
        # Convert torch tensors to python values
        predicted_class_idx = predicted_index.item()
        confidence_score = confidence.item()
        
    except ImportError:
        # If torch is not available, use numpy for mock results
        probabilities = np.zeros((1, NUM_CLASSES))
        probabilities[0, 3] = 0.7  # Assault
        probabilities[0, 5] = 0.2  # Explosion
        probabilities[0, 6] = 0.1  # Fighting
        
        predicted_class_idx = 3  # Assault
        confidence_score = 0.7
        
        # Mock top3 indices and scores
        top3_indices = np.array([[3, 5, 6]])
        top3_confidence = np.array([[0.7, 0.2, 0.1]])

    inference_time = time.time() - start_time

    # Format the results
    results = {
        "inference_time": round(inference_time, 4),
        "predicted_class": {
            "id": predicted_class_idx,
            "name": CLASS_NAMES[predicted_class_idx],
            "confidence": round(confidence_score, 4),
            "percent": round(confidence_score * 100, 2)
        },
        "top_predictions": []
    }
    
    # Add top 3 predictions
    try:
        for i in range(min(3, NUM_CLASSES)):
            idx = top3_indices[0, i].item() if hasattr(top3_indices[0, i], 'item') else top3_indices[0, i]
            score = top3_confidence[0, i].item() if hasattr(top3_confidence[0, i], 'item') else top3_confidence[0, i]
            results["top_predictions"].append({
                "id": idx,
                "name": CLASS_NAMES[idx],
                "confidence": round(score, 4),
                "percent": round(score * 100, 2)
            })
    except:
        # Fallback if something goes wrong with the tensor operations
        results["top_predictions"] = [
            {"id": 3, "name": "Assault", "confidence": 0.7, "percent": 70.0},
            {"id": 5, "name": "Explosion", "confidence": 0.2, "percent": 20.0},
            {"id": 6, "name": "Fighting", "confidence": 0.1, "percent": 10.0}
        ]
    
    print(f"[INFO] Classification complete in {inference_time:.4f} seconds")
    return results

def process_uploaded_video(file_storage):
    """
    Process a video uploaded through Flask
    
    Args:
        file_storage: FileStorage object from Flask request
        
    Returns:
        Classification results
    """
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        file_storage.save(temp_file.name)
        video_path = temp_file.name
    
    try:
        # Classify the video
        results = classify_video(video_path)
        
        # Remove the temporary file
        os.unlink(video_path)
        
        return results
    except Exception as e:
        # Make sure to clean up even if there's an error
        if os.path.exists(video_path):
            os.unlink(video_path)
        raise e
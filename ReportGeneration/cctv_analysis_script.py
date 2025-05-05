import cv2
import os
import time
import torch
from PIL import Image
from datetime import datetime
from transformers import BlipProcessor, BlipForConditionalGeneration
from transformers import pipeline

class CCTVAnalyzer:
    def __init__(self, model_name="Salesforce/blip-image-captioning-base"):
        """Initialize the CCTV Analyzer with necessary models."""
        print("Initializing CCTV Analysis System...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")
        
        # Initialize image captioning model
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name)
        self.model.to(self.device)
        
        # Initialize text summarization model
        self.summarizer = pipeline("summarization", model="t5-small", device=0 if self.device == "cuda" else -1)
        print("Models loaded successfully")

    def extract_frames(self, video_path, output_folder, frame_interval=30):
        """Extract frames from video at specified intervals.
        
        Args:
            video_path: Path to the video file
            output_folder: Folder to save extracted frames
            frame_interval: Extract one frame every N frames
        
        Returns:
            Number of frames extracted
        """
        os.makedirs(output_folder, exist_ok=True)
        cap = cv2.VideoCapture(video_path)
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        
        print(f"Video Properties:")
        print(f"- Duration: {duration:.2f} seconds")
        print(f"- FPS: {fps}")
        print(f"- Total Frames: {frame_count}")
        print(f"- Extracting 1 frame every {frame_interval} frames")
        
        frame_id = 0
        saved_count = 0
        timestamps = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_id % frame_interval == 0:
                timestamp = frame_id / fps
                timestamps.append(timestamp)
                frame_path = os.path.join(output_folder, f"frame_{saved_count:04d}.jpg")
                cv2.imwrite(frame_path, frame)
                saved_count += 1
                
            frame_id += 1
            
        cap.release()
        print(f"Extracted {saved_count} frames")
        return saved_count, timestamps

    def generate_caption(self, image_path):
        """Generate caption for an image using BLIP model."""
        try:
            image = Image.open(image_path).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(**inputs, max_length=50)
            caption = self.processor.decode(outputs[0], skip_special_tokens=True)
            return caption
        except Exception as e:
            print(f"Error generating caption for {image_path}: {e}")
            return "No description available"

    def detect_anomalies(self, captions):
        """Detect potential anomalies based on captions.
        
        This looks for keywords that might indicate suspicious activity.
        """
        suspicious_keywords = [
            "weapon", "gun", "knife", "suspicious", "fight", "fighting",
            "running", "hiding", "mask", "masked", "fallen", "lying",
            "argument", "stealing", "stolen", "break in", "breaking",
            "blood", "injury", "injured", "alone", "dark", "night"
        ]
        
        anomalies = []
        for i, (caption, timestamp) in enumerate(captions):
            for keyword in suspicious_keywords:
                if keyword in caption.lower():
                    time_str = self.format_timestamp(timestamp)
                    anomalies.append({
                        "frame_id": i,
                        "timestamp": time_str,
                        "caption": caption,
                        "keyword": keyword
                    })
                    break
                    
        return anomalies

    def format_timestamp(self, seconds):
        """Format seconds into HH:MM:SS."""
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"

    def summarize_captions(self, captions, max_length=150):
        """Summarize the captions using the T5 summarization model."""
        # Extract just the captions from the (caption, timestamp) pairs
        caption_texts = [c[0] for c in captions]
        
        # Combine captions into chunks to avoid token limits
        text_chunks = []
        current_chunk = ""
        
        for caption in caption_texts:
            if len(current_chunk) + len(caption) > 512:
                text_chunks.append(current_chunk)
                current_chunk = caption
            else:
                current_chunk += " " + caption
                
        if current_chunk:
            text_chunks.append(current_chunk)
            
        # Summarize each chunk
        chunk_summaries = []
        for chunk in text_chunks:
            summary = self.summarizer(chunk, max_length=100, min_length=30, do_sample=False)[0]['summary_text']
            chunk_summaries.append(summary)
            
        # Combine chunk summaries
        combined_summary = " ".join(chunk_summaries)
        
        # If the combined summary is too long, summarize again
        if len(combined_summary.split()) > max_length:
            combined_summary = self.summarizer(combined_summary, max_length=max_length, min_length=30, do_sample=False)[0]['summary_text']
            
        return combined_summary

    def create_annotated_frames(self, frame_folder, captions, output_folder):
        """Create annotated frames with captions."""
        os.makedirs(output_folder, exist_ok=True)
        
        for i, (caption, timestamp) in enumerate(captions):
            frame_path = os.path.join(frame_folder, f"frame_{i:04d}.jpg")
            if not os.path.exists(frame_path):
                continue
                
            frame = cv2.imread(frame_path)
            time_str = self.format_timestamp(timestamp)
            
            # Add timestamp to top left
            cv2.putText(frame, f"Time: {time_str}", (10, 30), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Add caption (split into multiple lines if too long)
            words = caption.split()
            lines = []
            current_line = ""
            
            for word in words:
                if len(current_line + " " + word) > 40:  # Limit line length
                    lines.append(current_line)
                    current_line = word
                else:
                    current_line += " " + word if current_line else word
                    
            if current_line:
                lines.append(current_line)
                
            for j, line in enumerate(lines):
                y_pos = 60 + j * 30
                cv2.putText(frame, line, (10, y_pos), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
            output_path = os.path.join(output_folder, f"annotated_{i:04d}.jpg")
            cv2.imwrite(output_path, frame)
            
        print(f"Created {len(captions)} annotated frames")

    def generate_report(self, video_path, anomalies, summary, captions, output_file="cctv_report.html"):
        """Generate an HTML report of the CCTV analysis."""
        # Get video filename
        video_filename = os.path.basename(video_path)
        
        # Get current date and time
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Start building HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>CCTV Analysis Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .summary {{ background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .anomalies {{ background-color: #fff0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .anomaly-item {{ margin-bottom: 10px; padding: 10px; background-color: #ffe6e6; border-radius: 5px; }}
                .timeline {{ margin: 20px 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CCTV Footage Analysis Report</h1>
                <p><strong>Video File:</strong> {video_filename}</p>
                <p><strong>Analysis Date:</strong> {current_time}</p>
            </div>
            
            <div class="summary">
                <h2>Summary of Activity</h2>
                <p>{summary}</p>
            </div>
        """
        
        # Add anomalies section if any were detected
        if anomalies:
            html_content += """
            <div class="anomalies">
                <h2>Detected Anomalies</h2>
            """
            
            for anomaly in anomalies:
                html_content += f"""
                <div class="anomaly-item">
                    <p><strong>Timestamp:</strong> {anomaly['timestamp']}</p>
                    <p><strong>Description:</strong> {anomaly['caption']}</p>
                    <p><strong>Detected Concern:</strong> {anomaly['keyword']}</p>
                </div>
                """
                
            html_content += "</div>"
        else:
            html_content += """
            <div class="anomalies">
                <h2>Detected Anomalies</h2>
                <p>No suspicious activities detected.</p>
            </div>
            """
        
        # Add timeline section
        html_content += """
        <div class="timeline">
            <h2>Complete Timeline</h2>
            <table>
                <tr>
                    <th>Time</th>
                    <th>Description</th>
                </tr>
        """
        
        for caption, timestamp in captions:
            time_str = self.format_timestamp(timestamp)
            html_content += f"""
                <tr>
                    <td>{time_str}</td>
                    <td>{caption}</td>
                </tr>
            """
            
        html_content += """
            </table>
        </div>
        """
        
        # Add footer and close HTML
        html_content += """
            <div class="footer">
                <p>This report was automatically generated by CCTV Analysis System.</p>
                <p><em>Note: This system provides assistance in reviewing footage but should not replace human analysis for critical security decisions.</em></p>
            </div>
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(output_file, 'w') as f:
            f.write(html_content)
            
        print(f"Report generated successfully: {output_file}")
        return output_file

    def analyze_video(self, video_path, output_dir="cctv_analysis", frame_interval=30):
        """Complete CCTV video analysis pipeline."""
        start_time = time.time()
        print(f"Starting analysis of {video_path}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Define subdirectories
        frames_dir = os.path.join(output_dir, "frames")
        annotated_dir = os.path.join(output_dir, "annotated_frames")
        
        # Step 1: Extract frames
        num_frames, timestamps = self.extract_frames(video_path, frames_dir, frame_interval)
        
        # Step 2: Generate captions for each frame
        print("Generating captions...")
        captions = []
        for i in range(num_frames):
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.jpg")
            if os.path.exists(frame_path):
                caption = self.generate_caption(frame_path)
                captions.append((caption, timestamps[i]))
                print(f"Frame {i}: {caption}")
        
        # Step 3: Detect anomalies
        print("Detecting anomalies...")
        anomalies = self.detect_anomalies(captions)
        if anomalies:
            print(f"Detected {len(anomalies)} potential anomalies")
        else:
            print("No anomalies detected")
            
        # Step 4: Generate summary
        print("Generating summary...")
        summary = self.summarize_captions(captions)
        print(f"Summary: {summary}")
        
        # Step 5: Create annotated frames
        print("Creating annotated frames...")
        self.create_annotated_frames(frames_dir, captions, annotated_dir)
        
        # Step 6: Generate report
        report_path = os.path.join(output_dir, "cctv_report.html")
        self.generate_report(video_path, anomalies, summary, captions, report_path)
        
        elapsed_time = time.time() - start_time
        print(f"Analysis completed in {elapsed_time:.2f} seconds")
        print(f"Results saved to {output_dir}")
        
        return {
            "report": report_path,
            "frames": frames_dir,
            "annotated_frames": annotated_dir,
            "summary": summary,
            "anomalies": anomalies
        }


def main():
    """Main function to run the CCTV analysis."""
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='CCTV Footage Analysis')
    parser.add_argument('video_path', type=str, help='Path to the video file')
    parser.add_argument('--output', type=str, default='cctv_analysis', help='Output directory')
    parser.add_argument('--interval', type=int, default=30, help='Frame extraction interval')
    args = parser.parse_args()
    
    # Initialize analyzer and process video
    analyzer = CCTVAnalyzer()
    results = analyzer.analyze_video(args.video_path, args.output, args.interval)
    
    # Display results location
    print("\n======== ANALYSIS COMPLETE ========")
    print(f"Report file: {results['report']}")
    print(f"Extracted frames: {results['frames']}")
    print(f"Annotated frames: {results['annotated_frames']}")
    
    if results['anomalies']:
        print(f"\nATTENTION: {len(results['anomalies'])} potential incidents detected!")
        for anomaly in results['anomalies']:
            print(f"- {anomaly['timestamp']}: {anomaly['caption']} (Keyword: {anomaly['keyword']})")
    else:
        print("\nNo suspicious activities detected in the footage.")
        
    print("\nSummary of activity:")
    print(results['summary'])


if __name__ == "__main__":
    main()
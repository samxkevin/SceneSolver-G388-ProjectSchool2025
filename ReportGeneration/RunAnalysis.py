# Example usage with an anomaly detection dataset

# Import the main analyzer class
from cctv_analysis_script import CCTVAnalyzer

# Initialize the analyzer
analyzer = CCTVAnalyzer()

# For testing with an anomaly detection dataset:
# Replace this path with your dataset video path
video_path = "anomaly_dataset/video_001.mp4"

# Run the analysis with custom parameters
# - Extract frames every 15 frames for more detailed analysis
# - Save results to a custom directory
results = analyzer.analyze_video(
    video_path=video_path,
    output_dir="anomaly_analysis_results",
    frame_interval=15  # More frequent frame extraction for anomaly detection
)

# Print the results summary
print("\n===== ANOMALY DETECTION RESULTS =====")
print(f"Analyzed video: {video_path}")

if results['anomalies']:
    print(f"\nDetected {len(results['anomalies'])} potential anomalies:")
    for anomaly in results['anomalies']:
        print(f"• {anomaly['timestamp']} - {anomaly['caption']} (Keyword: {anomaly['keyword']})")
else:
    print("\nNo anomalies detected in the footage")

print(f"\nActivity summary: {results['summary']}")
print(f"\nDetailed report available at: {results['report']}")
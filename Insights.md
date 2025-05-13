# SceneSolver Project Documentation

## Project Overview

This document outlines the development phases and pipeline for SceneSolver, a project focused on anomaly detection in videos, particularly for identifying criminal activities.

## Project Pipeline Structure

### Corrected Full SceneSolver Project Flow

#### Phase 1: Dataset Integrity
- Clean videos, verify against train.txt
- Ensure no missing files, no broken paths

#### Phase 2: Frame Extraction
- Uniformly sample frames per video (16–32 frames)
- OR dynamically sample frames based on video length

#### Phase 3: CLIP-Based Keyframe Selection
- Use pre-trained CLIP (or lightweight Vision Transformer) to rank frames
- Select only action-representative frames based on visual-semantic relevance
- Purpose: Preserve temporal context without bloating computation
- Without this step, you are just feeding garbage sequences to TimeSformer

#### Phase 4: Binary Anomaly Detection
- Train/fine-tune TimeSformer to classify normal vs anomalous
- Prioritize temporal understanding, not just isolated frame analysis

#### Phase 5: Crime Type Classification (Only Anomalies)
- Fine-tune the classifier head for 13–14 crime categories
- Normal videos can be filtered out beforehand

#### Phase 6: Evidence Extraction
- Run YOLOv8 (or custom-trained detector) only on anomalous video keyframes
- Focus on weapons, dangerous objects, suspicious activity

#### Phase 7: Crime Report Generation
- Video-LLaVA or similar model ingests keyframes + detected objects
- Outputs structured, natural language crime scene reports

## Development Updates

### Phase 1: Dataset Integrity Check (April 28, 2025)

Verification of dataset identified 92 missing files, primarily in the RoadAccidents category:
- 2 files from Arson and Assault categories
- 90 files from RoadAccidents category

These missing files were successfully retrieved using a Python script that verified file existence against the train.txt manifest.

### Pipeline Restructuring (May 13, 2025)

The project pipeline has been restructured into a clearer three-phase approach:

#### New Pipeline Structure
1. **Phase 0: Raw Video Stage** – untouched .mp4 videos from UCF-Crime, saved in classwise folders
2. **Phase 1: Binary Anomaly Detection** – frame extraction, annotation logic, and training of TimeSformer/Swin models
3. **Phase 2: Multimodal Crime Analysis** – evidence extraction (YOLO/CLIP) and crime scene report generation (LLaVA)

#### Purpose of Redesign
- Eliminate confusion between raw data and preprocessed data
- Clearly define entry and exit points for each model stage
- Align pipeline's data flow with the spiritual-analytical metaphor of SceneSolver

#### Core Principles
- **Non-destructive Principle**: Raw videos must never be modified or renamed
- **Training Isolation**: Phase 1 models trained only on outputs of Phase 0
- **Annotation Ethics**: Rechecking temporal annotation logic, especially alignment with extracted frames

## Technical Implementation Details

### Phase 0: CLIP-Based Temporal Anomaly Inference

#### Context and Purpose
This module serves as the first inference phase of the SceneSolver pipeline, operating on raw video inputs to extract semantic anomaly cues using CLIP. It detects and annotates temporal anomaly segments using frame-level semantics without modifying the original data.

#### Design Goals
- Maintain non-destructive operations on raw videos
- Isolate anomaly inference from higher-level evidence extraction
- Support UCF-Crime's temporal annotation format
- Enable downstream training with clear, reproducible labels

#### Pipeline Overview

1. **Frame Extraction**
   - Split videos into sequential JPEG frames at fixed sampling rate
   - Maintain deterministic naming conventions for traceability

2. **CLIP Embedding Generation**
   - Use pre-trained CLIP model to embed each frame
   - Capture semantic context beyond pixel similarity

3. **Prompt-Based Semantic Scoring**
   - Score frames against predefined textual prompts:
     - "normal scene"
     - "anomaly happening"
     - "a person attacking"
     - "suspicious object"

4. **Anomaly Deviation Curve**
   - Calculate deviation score: `deviation = max(anomaly - normal, attack - normal, suspicious - normal)`
   - Produce 1D semantic anomaly curve across timeline

5. **Spike Detection**
   - Process signal to identify anomaly spikes
   - Interpret spikes as centers of abnormal activity

6. **Segment Windowing**
   - Extract fixed-size frame windows around each spike
   - Form temporal segments with center frame, boundaries, and anomaly score

7. **Output Formats**
   - Detailed JSON with segment metadata, frame-level scores, and deviation curves
   - UCF-compatible TXT for integration with temporal annotation systems

8. **Output Directory Layout**
   ```
   outputs/
   ├── [video_name].json
   ├── Temporal_Anomaly_Annotation_GEN.txt
   └── frames/[video_name]/  # Temporary, deletable
   ```

### Important Code Components

#### Temporal Attention Mechanism
```python
class TemporalAttention(nn.Module):
    def __init__(self, embed_dim):
        super().__init__()
        self.query = nn.Linear(embed_dim, embed_dim)
        self.key = nn.Linear(embed_dim, embed_dim)
        self.value = nn.Linear(embed_dim, embed_dim)
        self.scale = embed_dim ** -0.5

    def forward(self, x):
        # x shape: [batch_size, num_frames, embed_dim]
        q = self.query(x)  # [batch_size, num_frames, embed_dim]
        k = self.key(x)    # [batch_size, num_frames, embed_dim]
        v = self.value(x)  # [batch_size, num_frames, embed_dim]

        # Compute attention scores
        attn = (q @ k.transpose(-2, -1)) * self.scale  # [batch_size, num_frames, num_frames]
        attn = torch.softmax(attn, dim=-1)

        # Apply attention to values
        out = attn @ v  # [batch_size, num_frames, embed_dim]
        return out
```

#### Enhanced TimeSformer Model
```python
class EnhancedTimeSformer(nn.Module):
    def __init__(self, base_model, num_frames=8, embed_dim=768):
        super().__init__()
        self.feature_extractor = base_model  # Use our feature extractor
        self.temporal_attention = TemporalAttention(embed_dim)
        self.frame_classifier = nn.Linear(embed_dim, CONFIG['NUM_CLASSES'])
        self.final_classifier = nn.Linear(embed_dim, CONFIG['NUM_CLASSES'])

    def forward(self, x):
        # x shape: [batch_size, num_frames, channels, height, width]
        batch_size, num_frames, channels, height, width = x.shape

        # Get per-frame embeddings from feature extractor
        frame_features = []
        for i in range(num_frames):
            # Process one frame at a time
            frame = x[:, i, :, :, :]  # [batch_size, channels, height, width]
            frame_embedding = self.feature_extractor(frame)  # [batch_size, embed_dim]
            frame_features.append(frame_embedding)

        # Stack frame features
        frame_features = torch.stack(frame_features, dim=1)  # [batch_size, num_frames, embed_dim]

        # Apply temporal attention
        attended_features = self.temporal_attention(frame_features)

        # Combine features (residual connection)
        combined_features = frame_features + attended_features

        # Average pooling over frames
        pooled_features = torch.mean(combined_features, dim=1)  # [batch_size, embed_dim]

        # Final classification
        output = self.final_classifier(pooled_features)

        return output
```

## Philosophical Framework

The project aligns with a spiritual-analytical framework:

| Phase | Meaning | Symbolic Layer |
|-------|---------|----------------|
| 0 | Material Input | *Avidya* – Unrefined perception |
| 1 | Discrimination & Purification | *Viveka* – Stoic discernment |
| 2 | Realized Narrative & Reporting | *Leela* – Krishna's divine play |

# Instructions Used in Generating the `CLIP-BasedAnomalyInference.py`:

## Phase 0 – CLIP-Based Temporal Anomaly Inference

**Developer Instructions for Contract Delivery**
Target: UCF-Crime dataset (Temporal Anomaly Annotation format)

---

### **Objective**

Build a modular and CLI-executable pipeline that processes a video, extracts semantic anomaly cues using CLIP, and produces both:

1. A detailed `.json` file (soft-labels, anomaly segments)
2. A UCF-compatible `.txt` row like:

```plaintext
Abuse028_x264.mp4  Abuse  165  240  -1  -1
```

---

## Implementation Steps

---

### **Step 1 – Frame Extraction (30 FPS)**

**Input:** Raw video
**Output:** Folder of JPEG frames, named sequentially

**Command:**

```bash
ffmpeg -i Abuse028_x264.mp4 -r 30 frames/Abuse028_x264/frame_%06d.jpg
```

Ensure consistent naming:
`frames/Abuse028_x264/frame_000001.jpg` …

---

### **Step 2 – Frame Embedding with CLIP**

**Model:** `ViT-B/32` or `ViT-L/14` (OpenAI or Huggingface)
**Input:** Extracted frames
**Output:** Embedding tensor per frame

**Process:**

* Load CLIP model
* Normalize and preprocess each frame
* Pass through image encoder
* Store embeddings (e.g., in a `.pt` or memory-mapped structure)

---

### **Step 3 – Prompt Scoring**

Use 4 semantic prompts:

* `"normal scene"`
* `"anomaly happening"`
* `"a person attacking"`
* `"suspicious object"`

**Process:**

* Encode all prompts once with CLIP's text encoder
* For each frame embedding, compute cosine similarity against each prompt
* Store result:

```json
{
  "frame_id": 187,
  "scores": {
    "normal": 0.85,
    "anomaly": 0.45,
    "attack": 0.32,
    "suspicious": 0.41
  }
}
```

---

### **Step 4 – Anomaly Deviation Calculation**

**Logic:**

```python
deviation = max(anomaly - normal, attack - normal, suspicious - normal)
```

* Output is a 1D array of floats across video length
* This will form the anomaly signal curve

---

### **Step 5 – Semantic Spike Detection**

Use `scipy.signal.find_peaks()`:

```python
from scipy.signal import find_peaks
peaks, _ = find_peaks(deviation_array, height=0.2, distance=90)
```

Tune `height` and `distance` as hyperparameters
Each spike becomes a candidate anomaly center

---

### **Step 6 – Segment Window Extraction**

Each peak frame index `i` becomes the center:

```python
start = max(0, i - 120)
end = min(total_frames - 1, i + 120)
```

Window = 241 frames around spike
Add metadata for each segment:

```json
{
  "start_frame": 165,
  "end_frame": 240,
  "center": 202,
  "score": 0.91
}
```

---

### **Step 7 – Output Generation**

#### a. JSON Format

```json
{
  "video": "Abuse028_x264.mp4",
  "anomaly_segments": [
    {
      "start_frame": 165,
      "end_frame": 240,
      "center": 202,
      "score": 0.91
    }
  ],
  "frame_scores": {
    "187": {"normal": 0.85, "anomaly": 0.45, ...}
  },
  "deviation_curve": [...]
}
```

#### b. UCF-Compatible Text Line Format

For every video, write a single line like:

```plaintext
Abuse028_x264.mp4  Abuse  165  240  -1  -1
```

**Rules:**

* Use first and second spike for 3rd-6th columns
* If only one spike, fill `-1 -1` in 5th and 6th columns
* If no spike, optionally omit or use `-1` for all frames

---

### **Step 8 – Directory Structure**

```
outputs/
├── Abuse028_x264.json
├── Temporal_Anomaly_Annotation_GEN.txt
├── soft_labels.csv            # Optional
└── frames/Abuse028_x264/      # Temporary, deletable
```

---

### **Step 9 – Developer Deliverables**

* `phase0_infer.py` or `clip_anomaly_detect.ipynb`
* Executable CLI:

```bash
python phase0_infer.py \
    --video data/Abuse028_x264.mp4 \
    --output_dir outputs/ \
    --model ViT-B/32
```

* Outputs:

  1. `.json` for detailed analysis
  2. `.txt` for annotation integration
  3. Optional `.csv` for debugging visualizations

---

### Criteria

* Accurate frame-wise embedding and scoring
* Clear spike-based anomaly detection
* Strict adherence to output formatting
* Modular code, scalable to batch video input

---

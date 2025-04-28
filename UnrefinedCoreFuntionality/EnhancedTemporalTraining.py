import os
import json
import numpy as np
import cv2
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
from sklearn.model_selection import train_test_split

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.optim.lr_scheduler import CosineAnnealingLR
import torchvision.transforms as transforms

import decord
from einops import rearrange

# For accessing Google Drive
from google.colab import drive

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

# =============================================================================
# CONFIGURATION SECTION - SET ALL PARAMETERS HERE
# =============================================================================

# Determine if CUDA is available and set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Global constants and paths
CONFIG = {
    # Class information
    'NUM_CLASSES': 14,
    'class_names': {
        1: "Abuse",
        2: "Arrest",
        3: "Arson",
        4: "Assault",
        5: "Burglary",
        6: "Explosion",
        7: "Fighting",
        8: "normal",
        9: "RoadAccidents",
        10: "Robbery",
        11: "Shooting",
        12: "Shoplifting",
        13: "Stealing",
        14: "Vandalism"
    },
    
    # File paths
    'paths': {
        'best_model': "/content/drive/MyDrive/crime_classification_checkpoints/best_model.pth",
        'annotation_file': "/content/drive/MyDrive/Temporal_Anomaly_Annotation_for_Testing_Videos.txt",
        'data_root': "/content/drive/MyDrive/Anamoly",
        'output_dir': "enhanced_model",
        'drive_output_path': "/content/drive/MyDrive/crime_classification_enhanced"
    },
    
    # Model parameters - adjusted based on hardware
    'model': {
        'num_frames': 8,
        'embed_dim': 768,
        'target_size': (224, 224)
    },
    
    # Training parameters - these will be automatically adjusted
    'training': {
        'batch_size': 8 if torch.cuda.is_available() else 4,
        'num_workers': 2 if torch.cuda.is_available() else 1,
        'pin_memory': torch.cuda.is_available(),
        'learning_rate': 1e-5 if torch.cuda.is_available() else 5e-6,
        'num_epochs': 25,
        'weight_decay': 0.01,
        'train_ratio': 0.7,
        'val_ratio': 0.15
    },
    
    # Other settings
    'use_annotations': True,
    'normal_class_index': 7,  # The index for 'Normal' class after shifting to 0-indexed
    'normal_class_weight': 0.5  # Weight for the 'Normal' class to handle imbalance
}

# Print final configuration
print("\n" + "="*50)
print("CONFIGURATION SUMMARY")
print("="*50)
print(f"Device: {device}")
print(f"Batch size: {CONFIG['training']['batch_size']}")
print(f"Learning rate: {CONFIG['training']['learning_rate']}")
print(f"Number of workers: {CONFIG['training']['num_workers']}")
print(f"Pin memory: {CONFIG['training']['pin_memory']}")
print(f"Number of epochs: {CONFIG['training']['num_epochs']}")
print("="*50 + "\n")

# =============================================================================
# END OF CONFIGURATION SECTION
# =============================================================================

# Enhanced VideoDataset to use temporal annotations
class TemporalAnnotatedVideoDataset(Dataset):
    """
    Dataset for video classification with temporal annotations that focuses on the 
    frames containing anomalous events
    """
    def __init__(self, video_paths, labels, transform=None, num_frames=8, target_size=(224, 224),
                 annotation_file=None, use_annotations=True):
        self.video_paths = video_paths
        self.labels = labels
        self.transform = transform
        self.num_frames = num_frames
        self.target_size = target_size
        self.use_annotations = use_annotations
        self.annotations = {}
        
        # Load temporal annotations if provided
        if annotation_file and use_annotations:
            success = self._load_annotations(annotation_file)
            if success:
                print(f"Successfully loaded {len(self.annotations)} temporal annotations")
            else:
                print("Failed to load temporal annotations. Will proceed without them.")
                self.use_annotations = False
    
    def _load_annotations(self, annotation_file):
        """Load temporal annotations from file"""
        try:
            with open(annotation_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 4:  # Need at least video name, event, start and end
                        video_name = parts[0]
                        event_name = parts[1]
                        
                        # Parse start and end frames
                        try:
                            start_frame = int(parts[2])
                            end_frame = int(parts[3])
                            
                            # Handle second instance if available
                            second_start = -1
                            second_end = -1
                            if len(parts) >= 6:
                                # Try to parse as integers, but handle 'nofollow' or other special values
                                try:
                                    second_start = int(parts[4])
                                    second_end = int(parts[5])
                                except ValueError:
                                    # If values can't be converted to integers, use defaults
                                    second_start = -1
                                    second_end = -1
                            
                            self.annotations[video_name] = {
                                'event': event_name,
                                'start_frame': start_frame,
                                'end_frame': end_frame,
                                'second_start': second_start,
                                'second_end': second_end
                            }
                        except ValueError as e:
                            print(f"Warning: Could not parse frame numbers for video {video_name}: {e}")
                            continue
            return True
        except Exception as e:
            print(f"Error loading annotations: {e}")
            return False
    
    def __len__(self):
        return len(self.video_paths)

    def __getitem__(self, idx):
        video_path = self.video_paths[idx]
        label = self.labels[idx]
        
        try:
            # Get video filename for matching with annotations
            video_filename = os.path.basename(video_path)
            
            # Load video
            vr = decord.VideoReader(video_path)
            total_frames = len(vr)
            
            # Check if we have annotations and should use them
            has_annotation = video_filename in self.annotations and self.use_annotations
            
            # Normal class index from CONFIG
            normal_class_index = CONFIG['normal_class_index']
            
            if has_annotation and label != normal_class_index:  # If not "Normal" class
                # Get annotation data
                anno = self.annotations[video_filename]
                
                # Focus frames selection on anomalous event
                start_frame = anno['start_frame']
                end_frame = anno['end_frame']
                
                # If there's a second instance, include it too
                if anno['second_start'] > 0 and anno['second_end'] > 0:
                    # Randomly choose between first and second instance
                    if np.random.random() > 0.5:
                        start_frame = anno['second_start']
                        end_frame = anno['second_end']
                
                # Make sure frames are within video bounds
                start_frame = max(0, start_frame)
                end_frame = min(total_frames - 1, end_frame)
                
                # If valid range exists
                if start_frame < end_frame and end_frame - start_frame >= self.num_frames:
                    # Sample uniformly from the anomalous event
                    frame_indices = np.linspace(start_frame, end_frame, self.num_frames, dtype=int)
                else:
                    # Fallback to regular sampling
                    frame_indices = np.linspace(0, total_frames - 1, self.num_frames, dtype=int)
            else:
                # Standard frame sampling for normal videos or when annotations aren't available
                frame_indices = np.linspace(0, total_frames - 1, self.num_frames, dtype=int)
            
            # Get frames
            frames = vr.get_batch(frame_indices).asnumpy()
            
            # Process frames
            processed_frames = []
            for frame in frames:
                # Convert to RGB
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame = cv2.resize(frame, self.target_size)
                if self.transform:
                    frame = self.transform(frame)
                processed_frames.append(frame)
            
            # Stack frames
            frames_tensor = torch.stack(processed_frames)
            
            return frames_tensor, torch.tensor(label, dtype=torch.long)
        
        except Exception as e:
            print(f"Error loading video {video_path}: {e}")
            # Return a dummy tensor in case of error
            dummy_tensor = torch.zeros((self.num_frames, 3, self.target_size[0], self.target_size[1]))
            return dummy_tensor, torch.tensor(0, dtype=torch.long)

# A key-temporal attention module to help the model attend to important frames
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

# Enhanced TimeSformer model with temporal attention
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

def load_data_from_directory(data_dir):
    """
    Load video paths and labels from directory structure
    Each class should be in a separate folder
    """
    video_paths = []
    labels = []

    for class_id, class_name in CONFIG['class_names'].items():
        class_dir = os.path.join(data_dir, class_name)
        if not os.path.exists(class_dir):
            print(f"Warning: Class directory {class_dir} not found")
            continue

        for video_file in os.listdir(class_dir):
            if video_file.endswith(('.mp4', '.avi', '.mov')):
                video_path = os.path.join(class_dir, video_file)
                video_paths.append(video_path)
                labels.append(class_id - 1)  # Convert to 0-indexed

    return video_paths, labels

def split_data(video_paths, labels, train_ratio=0.7, val_ratio=0.15):
    """
    Split data into train, validation, and test sets
    """
    # First split into train and temp (val + test)
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        video_paths, labels, test_size=(1-train_ratio), stratify=labels, random_state=42
    )

    # Then split temp into val and test
    val_size = val_ratio / (1 - train_ratio)
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels, test_size=(1-val_size), stratify=temp_labels, random_state=42
    )

    return (train_paths, train_labels), (val_paths, val_labels), (test_paths, test_labels)

def load_checkpoint(model, optimizer, scheduler, checkpoint_path):
    """Load checkpoint for resuming training"""
    print(f"Loading checkpoint from {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    # Load model state
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # Load optimizer and scheduler states if provided
    if optimizer is not None and 'optimizer_state_dict' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    
    if scheduler is not None and 'scheduler_state_dict' in checkpoint:
        scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
    
    # Return the starting epoch and metrics
    start_epoch = checkpoint.get('epoch', 0)
    best_val_acc = checkpoint.get('val_acc', 0.0)
    
    return model, optimizer, scheduler, start_epoch, best_val_acc

def get_latest_checkpoint(output_dir):
    """Find the latest checkpoint in the output directory"""
    checkpoints = [f for f in os.listdir(output_dir) if f.startswith('checkpoint_epoch_') and f.endswith('.pth')]
    if not checkpoints:
        return None
    
    # Extract epoch numbers and find the latest
    latest_epoch = max([int(f.split('_')[2].split('.')[0]) for f in checkpoints])
    return os.path.join(output_dir, f"checkpoint_epoch_{latest_epoch}.pth")

# Function to continue training from best model checkpoint
def continue_training_with_temporal_annotations(base_model_path, train_loader, val_loader,
                                                num_epochs=20, learning_rate=5e-5, 
                                                output_dir="enhanced_model", resume_training=True):
    """
    Continue training from a checkpoint using temporal annotations
    """
    # Mount Google Drive for saving results
    drive.mount('/content/drive', force_remount=True)
    
    # Create output directories
    drive_output_path = CONFIG['paths']['drive_output_path']
    os.makedirs(drive_output_path, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    # Load the base model
    print(f"Loading base model from {base_model_path}")

    try:
        # Create a feature extractor model that will be used within our enhanced model
        class FeatureExtractor(nn.Module):
            def __init__(self, embed_dim=768):
                super().__init__()
                # Basic feature extraction layers
                self.features = nn.Sequential(
                    nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3),
                    nn.BatchNorm2d(64),
                    nn.ReLU(inplace=True),
                    nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
                    nn.Conv2d(64, 128, kernel_size=3, padding=1),
                    nn.BatchNorm2d(128),
                    nn.ReLU(inplace=True),
                    nn.Conv2d(128, 256, kernel_size=3, padding=1),
                    nn.BatchNorm2d(256),
                    nn.ReLU(inplace=True),
                    nn.AdaptiveAvgPool2d((1, 1)),
                    nn.Flatten(),
                    nn.Linear(256, embed_dim)
                )
            
            def forward(self, x):
                return self.features(x)
    
        # Create a base feature extractor
        base_model = FeatureExtractor(embed_dim=CONFIG['model']['embed_dim']).to(device)
        print("Base feature extractor created successfully")
    except  Exception as e:
        print(f"Error creating base model: {e}")
        print("Exiting training as base model is required")
        return None, None
    
    # Create enhanced model
    print("Creating enhanced model with temporal attention...")
    model = EnhancedTimeSformer(
        base_model, 
        num_frames=CONFIG['model']['num_frames'], 
        embed_dim=CONFIG['model']['embed_dim']
    ).to(device)
    
    # Only train the temporal attention and classifier parts
    for param in model.feature_extractor.parameters():
        param.requires_grad = False
    
    # Define optimizer and loss
    optimizer = optim.AdamW([
        {'params': model.temporal_attention.parameters(), 'lr': learning_rate},
        {'params': model.frame_classifier.parameters(), 'lr': learning_rate * 2},
        {'params': model.final_classifier.parameters(), 'lr': learning_rate * 2}
    ], weight_decay=CONFIG['training']['weight_decay'])
    
    # Use focal loss to handle class imbalance
    class_weights = torch.ones(CONFIG['NUM_CLASSES'], device=device)
    # Normal class usually has more samples, so lower its weight
    class_weights[CONFIG['normal_class_index']] = CONFIG['normal_class_weight']
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    
    # Learning rate scheduler
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs)
    
    # For tracking metrics
    start_epoch = 0
    best_val_acc = 0.0
    train_losses = []
    train_accuracies = []
    val_losses = []
    val_accuracies = []
    
    # Check if we should resume training
    if resume_training:
        # First check if there's a checkpoint in the output directory
        latest_checkpoint = get_latest_checkpoint(output_dir)
        
        if latest_checkpoint:
            print(f"Found checkpoint: {latest_checkpoint}")
            model, optimizer, scheduler, start_epoch, best_val_acc = load_checkpoint(
                model, optimizer, scheduler, latest_checkpoint
            )
            print(f"Resuming training from epoch {start_epoch+1}")
            
            # Load metrics if available
            metrics_file = os.path.join(output_dir, "metrics.json")
            if os.path.exists(metrics_file):
                with open(metrics_file, "r") as f:
                    metrics = json.load(f)
                    train_losses = metrics.get("train_losses", [])
                    train_accuracies = metrics.get("train_accuracies", [])
                    val_losses = metrics.get("val_losses", [])
                    val_accuracies = metrics.get("val_accuracies", [])
        else:
            print("No checkpoint found. Starting training from scratch.")
    
    # Training loop
    for epoch in range(start_epoch, num_epochs):
        print(f"Epoch {epoch+1}/{num_epochs}")
        
        # Training phase
        model.train()
        running_loss = 0.0
        train_predictions = []
        train_targets = []
        
        for inputs, labels in tqdm(train_loader, desc="Training"):
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            # Backward pass and optimize
            loss.backward()
            optimizer.step()
            
            # Statistics
            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            train_predictions.extend(preds.cpu().numpy())
            train_targets.extend(labels.cpu().numpy())
        
        # Calculate epoch statistics
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = accuracy_score(train_targets, train_predictions)
        
        train_losses.append(epoch_loss)
        train_accuracies.append(epoch_acc)
        
        print(f"Training Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")
        
        # Validation phase
        model.eval()
        val_running_loss = 0.0
        val_predictions = []
        val_targets = []
        
        with torch.no_grad():
            for inputs, labels in tqdm(val_loader, desc="Validation"):
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_running_loss += loss.item() * inputs.size(0)
                _, preds = torch.max(outputs, 1)
                val_predictions.extend(preds.cpu().numpy())
                val_targets.extend(labels.cpu().numpy())
        
        # Calculate validation statistics
        val_epoch_loss = val_running_loss / len(val_loader.dataset)
        val_epoch_acc = accuracy_score(val_targets, val_predictions)
        
        val_losses.append(val_epoch_loss)
        val_accuracies.append(val_epoch_acc)
        
        print(f"Validation Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
        
        # Update scheduler
        scheduler.step()
        
        # Save checkpoint
        checkpoint = {
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
            'train_loss': epoch_loss,
            'val_loss': val_epoch_loss,
            'train_acc': epoch_acc,
            'val_acc': val_epoch_acc
        }
        
        # Save checkpoint locally and to Drive
        torch.save(checkpoint, f"{output_dir}/checkpoint_epoch_{epoch+1}.pth")
        torch.save(checkpoint, f"{drive_output_path}/checkpoint_epoch_{epoch+1}.pth")
        
        # Save best model
        if val_epoch_acc > best_val_acc:
            best_val_acc = val_epoch_acc
            torch.save(model.state_dict(), f"{output_dir}/best_model.pth")
            torch.save(model.state_dict(), f"{drive_output_path}/best_model.pth")
            print(f"Saved best model with validation accuracy: {best_val_acc:.4f}")
        
        # Save metrics
        metrics = {
            "train_losses": train_losses,
            "train_accuracies": train_accuracies,
            "val_losses": val_losses,
            "val_accuracies": val_accuracies,
            "best_val_acc": best_val_acc
        }
        
        with open(f"{output_dir}/metrics.json", "w") as f:
            json.dump(metrics, f, indent=4)
        with open(f"{drive_output_path}/metrics.json", "w") as f:
            json.dump(metrics, f, indent=4)
        
        # Every 5 epochs or last epoch, save confusion matrix and classification report
        if epoch % 5 == 0 or epoch == num_epochs - 1:
            cm = confusion_matrix(val_targets, val_predictions)
            plt.figure(figsize=(12, 10))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                        xticklabels=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])],
                        yticklabels=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])])
            plt.xlabel('Predicted')
            plt.ylabel('True')
            plt.title(f'Confusion Matrix - Epoch {epoch+1}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/confusion_matrix_epoch_{epoch+1}.png")
            plt.savefig(f"{drive_output_path}/confusion_matrix_epoch_{epoch+1}.png")
            plt.close()
            
            # Generate classification report
            report = classification_report(
                val_targets, val_predictions,
                target_names=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])],
                output_dict=True
            )
            
            with open(f"{output_dir}/classification_report_epoch_{epoch+1}.json", "w") as f:
                json.dump(report, f, indent=4)
            with open(f"{drive_output_path}/classification_report_epoch_{epoch+1}.json", "w") as f:
                json.dump(report, f, indent=4)
    
    # Plot and save final training curves
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label='Training Loss')
    plt.plot(val_losses, label='Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(train_accuracies, label='Training Accuracy')
    plt.plot(val_accuracies, label='Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/training_history.png")
    plt.savefig(f"{drive_output_path}/training_history.png")
    plt.close()
    
    return model, metrics

# Evaluation function
def evaluate_enhanced_model(model, test_loader, criterion, output_dir="enhanced_model"):
    """
    Evaluate the enhanced model on the test set
    """
    drive_results_path = CONFIG['paths']['drive_output_path']
    
    model.eval()
    test_loss = 0.0
    test_predictions = []
    test_targets = []
    
    with torch.no_grad():
        for inputs, labels in tqdm(test_loader, desc="Testing"):
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            test_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            test_predictions.extend(preds.cpu().numpy())
            test_targets.extend(labels.cpu().numpy())
    
    # Calculate metrics
    test_loss /= len(test_loader.dataset)
    test_acc = accuracy_score(test_targets, test_predictions)
    test_precision = precision_score(test_targets, test_predictions, average='weighted')
    test_recall = recall_score(test_targets, test_predictions, average='weighted')
    test_f1 = f1_score(test_targets, test_predictions, average='weighted')
    
    # Generate confusion matrix
    cm = confusion_matrix(test_targets, test_predictions)
    
    # Generate and save classification report
    report = classification_report(
        test_targets, test_predictions,
        target_names=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])],
        output_dict=True
    )
    
    # Save detailed results
    results = {
        "test_loss": test_loss,
        "test_accuracy": test_acc,
        "test_precision": test_precision,
        "test_recall": test_recall,
        "test_f1": test_f1,
        "classification_report": report
    }
    
    with open(f"{output_dir}/test_results.json", "w") as f:
        json.dump(results, f, indent=4)
    with open(f"{drive_results_path}/test_results.json", "w") as f:
        json.dump(results, f, indent=4)
    
    # Plot confusion matrix
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])],
                yticklabels=[CONFIG['class_names'][i+1] for i in range(CONFIG['NUM_CLASSES'])])
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix - Test Set')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/test_confusion_matrix.png")
    plt.savefig(f"{drive_results_path}/test_confusion_matrix.png")
    plt.close()
    
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_acc:.4f}")
    print(f"Test Precision: {test_precision:.4f}")
    print(f"Test Recall: {test_recall:.4f}")
    print(f"Test F1 Score: {test_f1:.4f}")
    
    return results

# Main function to run the enhanced training
def main():
    # Mount Google Drive
    drive.mount('/content/drive')
    
    # Set paths from config
    best_model_path = CONFIG['paths']['best_model']
    annotation_file = CONFIG['paths']['annotation_file']
    data_root = CONFIG['paths']['data_root']
    output_dir = CONFIG['paths']['output_dir']
    
    # Set parameters from config
    num_frames = CONFIG['model']['num_frames']
    batch_size = CONFIG['training']['batch_size']
    num_epochs = CONFIG['training']['num_epochs']
    learning_rate = CONFIG['training']['learning_rate']
    num_workers = CONFIG['training']['num_workers']
    pin_memory = CONFIG['training']['pin_memory']
    train_ratio = CONFIG['training']['train_ratio']
    val_ratio = CONFIG['training']['val_ratio']
    
    # Create output dirs if they don't exist
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(CONFIG['paths']['drive_output_path'], exist_ok=True)
    
    # Define transforms
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2)
    ])
    
    val_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load video paths and labels
    print("Loading video data...")
    video_paths, labels = load_data_from_directory(data_root)
    print(f"Found {len(video_paths)} videos across {len(set(labels))} classes")
    
    # Split data
    (train_paths, train_labels), (val_paths, val_labels), (test_paths, test_labels) = split_data(
        video_paths, labels, train_ratio=train_ratio, val_ratio=val_ratio
    )
    
    print(f"Training set: {len(train_paths)} videos")
    print(f"Validation set: {len(val_paths)} videos")
    print(f"Test set: {len(test_paths)} videos")
    
    # Create enhanced datasets with temporal annotations
    train_dataset = TemporalAnnotatedVideoDataset(
        train_paths, train_labels, transform=train_transform,
        num_frames=num_frames, target_size=CONFIG['model']['target_size'],
        annotation_file=annotation_file, use_annotations=CONFIG['use_annotations']
    )
    
    val_dataset = TemporalAnnotatedVideoDataset(
        val_paths, val_labels, transform=val_transform,
        num_frames=num_frames, target_size=CONFIG['model']['target_size'],
        annotation_file=annotation_file, use_annotations=CONFIG['use_annotations']
    )
    
    test_dataset = TemporalAnnotatedVideoDataset(
        test_paths, test_labels, transform=val_transform,
        num_frames=num_frames, target_size=CONFIG['model']['target_size'],
        annotation_file=annotation_file, use_annotations=CONFIG['use_annotations']
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=pin_memory
    )
    
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=pin_memory
    )
    
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=pin_memory
    )
    
    # Continue training with temporal annotations
    print("Starting enhanced training with temporal annotations...")
    enhanced_model, training_metrics = continue_training_with_temporal_annotations(
        base_model_path=best_model_path,
        train_loader=train_loader,
        val_loader=val_loader,
        num_epochs=num_epochs,
        learning_rate=learning_rate,
        output_dir=output_dir,
        resume_training=True
    )
    
    # Load best enhanced model for evaluation
    if enhanced_model is None:
        print("Training failed. Skipping evaluation.")
        return
    enhanced_model.load_state_dict(torch.load(f"{output_dir}/best_model.pth"))
    
    # Create class weights for evaluation
    class_weights = torch.ones(CONFIG['NUM_CLASSES'], device=device)
    class_weights[CONFIG['normal_class_index']] = CONFIG['normal_class_weight']
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    
    # Evaluate model
    print("Evaluating enhanced model...")
    test_results = evaluate_enhanced_model(enhanced_model, test_loader, criterion, output_dir=output_dir)
    
    print("Training and evaluation complete!")
    print(f"Best validation accuracy: {training_metrics['best_val_acc']:.4f}")
    print(f"Test accuracy: {test_results['test_accuracy']:.4f}")

if __name__ == "__main__":
    main()
import React, { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./upload.css";

function Upload() {
    const [fileName, setFileName] = useState('No file chosen');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [analysisResults, setAnalysisResults] = useState('');
    const [query, setQuery] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (fileInputRef.current) {
            fileInputRef.current.addEventListener('change', handleFileChange);
        }
        
        // Cleanup function
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.removeEventListener('change', handleFileChange);
            }
        };
    }, []);

    const handleFileChange = () => {
        if (fileInputRef.current.files && fileInputRef.current.files.length > 0) {
            const selectedFile = fileInputRef.current.files[0];
            setFileName(selectedFile.name);
            setFile(selectedFile);
        } else {
            setFileName('No file chosen');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('Please select a file first');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setUploadStatus('File uploaded successfully!');
                setAnalysisResults('Analysis in progress... Results will appear shortly.');
                
                // Simulating analysis results (replace with actual API call)
                setTimeout(() => {
                    setAnalysisResults('Analysis complete. Key findings: [Example findings would appear here]');
                }, 3000);
            } else {
                setUploadStatus('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleQuerySubmit = async () => {
        if (!query.trim()) {
            return;
        }

        try {
            // This is where you would connect to an API endpoint to process the query
            // For now, we'll just simulate a response
            setAnalysisResults(`Processing query: "${query}"...\n\nSimulated response: [The requested information would appear here]`);
        } catch (error) {
            console.error('Error processing query:', error);
        }
    };

    return (
        <div className="upload-container">
            <nav className="upload-nav">
                <Link to="/" className="upload-logo">CrimeSceneSolver</Link>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/Login">Login</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
            </nav>
            <div className="container">
                <h1 className="upload-h1">Case File Analysis</h1>
                <div className="upload-section">
                    <h2>Upload Case File</h2>
                    {uploadStatus && <div className={uploadStatus.includes('success') ? 'success-message' : 'error-message'}>{uploadStatus}</div>}
                    <label htmlFor="file-upload">Select a file to analyze:</label>
                    <div className="upload-file-upload-wrapper">
                        <label htmlFor="file-upload" className="upload-choose-file-button">Choose File</label>
                        <input
                            type="file"
                            id="file-upload"
                            ref={fileInputRef}
                            accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                        />
                        <span className="upload-file-name">{fileName}</span>
                    </div>
                    <button 
                        className="upload-btn" 
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
                <div className="upload-section">
                    <h2>Analysis Results</h2>
                    <div className="upload-results">
                        {analysisResults ? (
                            <pre>{analysisResults}</pre>
                        ) : (
                            <>
                                <p>Once a file is uploaded and analyzed, the results will be displayed here.</p>
                                <p>
                                    This might include key findings, potential suspects, timelines, and other relevant information
                                    extracted from the case file.
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <div className="upload-section">
                    <h2>Submit Query</h2>
                    <label htmlFor="query-input">Enter a specific question about the case:</label>
                    <input 
                        type="text" 
                        id="query-input" 
                        placeholder="e.g., What is the victim's alibi?" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                        className="upload-btn"
                        onClick={handleQuerySubmit}
                    >
                        Submit Query
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Upload;
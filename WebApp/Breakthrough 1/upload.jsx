import React, { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./upload.css";

function Upload() {
    const [fileName, setFileName] = useState('No file chosen');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (fileInputRef.current) {
            fileInputRef.current.addEventListener('change', () => {
                if (fileInputRef.current.files && fileInputRef.current.files.length > 0) {
                    setFileName(fileInputRef.current.files[0].name);
                } else {
                    setFileName('No file chosen');
                }
            });
        }

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.removeEventListener('change', () => { });
            }
        };
    }, []);

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
                    <button className="upload-btn">Upload File</button>
                </div>

                <div className="upload-section">
                    <h2>Analysis Results</h2>
                    <div className="upload-results">
                        <p>Once a file is uploaded and analyzed, the results will be displayed here.</p>
                        <p>
                            This might include key findings, potential suspects, timelines, and other relevant information
                            extracted from the case file.
                        </p>
                    </div>
                </div>

                <div className="upload-section">
                    <h2>Submit Query</h2>
                    <label htmlFor="query-input">Enter a specific question about the case:</label>
                    <input type="text" id="query-input" placeholder="e.g., What is the victim's alibi?" />
                    <button className="upload-btn">Submit Query</button>
                </div>
            </div>
        </div>
    );
}

export default Upload;

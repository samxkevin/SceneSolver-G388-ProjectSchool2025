import React, { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./upload.css";

function Upload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('No file chosen');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState('');
    const fileInputRef = useRef(null);
    const [caseId, setCaseId] = useState(null); // Store the case ID

    // Handle file selection and update state
    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setFileName(event.target.files[0].name);
        } else {
            setSelectedFile(null);
            setFileName('No file chosen');
        }
    };

    // Handle file upload form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setResults('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile); // 'file' is the field name your backend expects

        setResults('Uploading...'); // Provide user feedback
        try {
            const response = await fetch('/api/cases/upload', { //  Replace with your actual endpoint
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log(result);
                setResults(`File "${fileName}" uploaded successfully! Case ID: ${result.caseId}`); //  Use fileName
                setCaseId(result.caseId); // Store the case ID from the response
                setSelectedFile(null);
                setFileName('No file chosen');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'File upload failed.');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setResults(`Error uploading file: ${error.message}`);
        }
    };

    // Handle query input change
    const handleQueryChange = (event) => {
        setQuery(event.target.value);
    };

    // Handle query submission
    const handleQuerySubmit = async (event) => {
        event.preventDefault();
        if (!query) {
            setResults("Please enter a query.");
            return;
        }
        if (!caseId) {
            setResults("Please upload a file first to get a Case ID.");
            return;
        }
        try {
            //  Replace '123' with the actual case ID.  You'll need a way to get this dynamically.
            const actualCaseId = caseId; // Use the stored case ID
            setResults('Submitting query...');
            const response = await fetch(`/api/cases/${actualCaseId}/results?query=${query}`, { //  Adjust the endpoint as needed
                method: 'GET', //  Or POST, depending on your API
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Query Results:", data);
            setResults(JSON.stringify(data, null, 2)); // Display results, adjust formatting as needed

        } catch (error) {
            console.error("Error submitting query", error);
            setResults(`Error submitting query: ${error.message}`);
        }
    };


    return (
        <div className="upload-container">
            <nav className="upload-nav">
                <Link to="/" className="logo">CrimeSceneSolver</Link>
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
                    <form onSubmit={handleSubmit} className="upload-file-upload-wrapper">
                        <label htmlFor="file-upload" className="upload-choose-file-button">Choose File</label>
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileChange}
                            accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                        />
                        <span className="upload-file-name">{fileName}</span>
                        <button type="submit" className="upload-btn">Upload File</button>
                    </form>
                </div>

                <div className="upload-section">
                    <h2>Analysis Results</h2>
                    <div className="upload-results">
                        <p>{results || "Once a file is uploaded and analyzed, the results will be displayed here."}</p>
                    </div>
                </div>

                <div className="upload-section">
                    <h2>Submit Query</h2>
                    <label htmlFor="query-input">Enter a specific question about the case:</label>
                    <form onSubmit={handleQuerySubmit} className="upload-query-form">
                        <input
                            type="text"
                            id="query-input"
                            placeholder="e.g., What is the victim's alibi?"
                            value={query}
                            onChange={handleQueryChange}
                        />
                        <button type="submit" className="upload-btn">Submit Query</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Upload;

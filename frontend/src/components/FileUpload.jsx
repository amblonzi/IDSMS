import { useState } from 'react';
import { uploadDocument } from '../services/documents';

/**
 * FileUpload Component
 * Reusable component for uploading documents with validation and progress tracking
 */
export default function FileUpload({
    label,
    documentType,
    required = false,
    accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    maxSize = 5 * 1024 * 1024, // 5MB
    onUploadSuccess,
    onUploadError
}) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadedDocument, setUploadedDocument] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setFile(null);
            return;
        }

        // Validate file size
        if (selectedFile.size > maxSize) {
            const maxMB = maxSize / (1024 * 1024);
            setErrorMessage(`File size exceeds ${maxMB}MB limit`);
            setUploadStatus('error');
            setFile(null);
            return;
        }

        // Validate file type
        const fileExt = selectedFile.name.split('.').pop().toLowerCase();
        const allowedExts = accept.split(',').map(ext => ext.replace('.', '').trim());

        if (!allowedExts.includes(fileExt)) {
            setErrorMessage(`Invalid file type. Allowed: ${accept}`);
            setUploadStatus('error');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setUploadStatus(null);
        setErrorMessage('');
    };

    const handleUpload = async () => {
        if (!file) {
            setErrorMessage('Please select a file');
            setUploadStatus('error');
            return;
        }

        setUploading(true);
        setUploadStatus(null);
        setErrorMessage('');

        try {
            const response = await uploadDocument(file, documentType);
            setUploadStatus('success');
            setUploadedDocument(response);

            if (onUploadSuccess) {
                onUploadSuccess(response);
            }
        } catch (error) {
            const message = error.response?.data?.detail || 'Upload failed. Please try again.';
            setErrorMessage(message);
            setUploadStatus('error');

            if (onUploadError) {
                onUploadError(error);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setUploadStatus(null);
        setErrorMessage('');
        setUploadedDocument(null);
    };

    return (
        <div className="file-upload-container">
            <label className="file-upload-label">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="file-upload-content">
                {/* File Input */}
                {!uploadedDocument && (
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="file-input"
                            id={`file-${documentType}`}
                        />
                        <label
                            htmlFor={`file-${documentType}`}
                            className="file-input-label"
                        >
                            <svg className="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>{file ? file.name : 'Choose file or drag here'}</span>
                        </label>
                    </div>
                )}

                {/* File Info & Actions */}
                {file && !uploadedDocument && (
                    <div className="file-info">
                        <div className="file-details">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">
                                {(file.size / 1024).toFixed(2)} KB
                            </span>
                        </div>
                        <div className="file-actions">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="btn-upload"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="spinner" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={uploading}
                                className="btn-remove"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Success */}
                {uploadStatus === 'success' && uploadedDocument && (
                    <div className="upload-success">
                        <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="success-content">
                            <span className="success-title">Upload successful!</span>
                            <span className="success-subtitle">
                                {uploadedDocument.file_name} - Pending verification
                            </span>
                        </div>
                        <button onClick={handleRemove} className="btn-change">
                            Change
                        </button>
                    </div>
                )}

                {/* Upload Error */}
                {uploadStatus === 'error' && errorMessage && (
                    <div className="upload-error">
                        <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="error-message">{errorMessage}</span>
                    </div>
                )}
            </div>

            <style jsx>{`
        .file-upload-container {
          margin-bottom: 1.5rem;
        }

        .file-upload-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .file-upload-content {
          width: 100%;
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }

        .file-input-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-input-label:hover {
          border-color: #2563eb;
          background-color: #eff6ff;
        }

        .file-icon {
          width: 3rem;
          height: 3rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .file-input-label span {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .file-info {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #ffffff;
        }

        .file-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .file-name {
          font-weight: 500;
          color: #111827;
        }

        .file-size {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-upload, .btn-remove, .btn-change {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-upload {
          background-color: #2563eb;
          color: white;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-upload:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .btn-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-remove {
          background-color: #ef4444;
          color: white;
        }

        .btn-remove:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .btn-change {
          background-color: #6b7280;
          color: white;
        }

        .btn-change:hover {
          background-color: #4b5563;
        }

        .spinner {
          width: 1.25rem;
          height: 1.25rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .upload-success, .upload-error {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 0.5rem;
          gap: 0.75rem;
        }

        .upload-success {
          background-color: #f0fdf4;
          border: 1px solid #86efac;
        }

        .upload-error {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
        }

        .success-icon, .error-icon {
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
        }

        .success-icon {
          color: #16a34a;
        }

        .error-icon {
          color: #dc2626;
        }

        .success-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .success-title {
          font-weight: 600;
          color: #166534;
        }

        .success-subtitle {
          font-size: 0.875rem;
          color: #15803d;
        }

        .error-message {
          color: #991b1b;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}

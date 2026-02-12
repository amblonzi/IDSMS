import api from './api';

/**
 * Document service for handling document uploads and management
 */

/**
 * Upload a document
 * @param {File} file - The file to upload
 * @param {string} documentType - Type of document (national_id, passport, etc.)
 * @returns {Promise} Response with document data
 */
export const uploadDocument = async (file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    const response = await api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Get all documents for the current user
 * @returns {Promise} Array of documents
 */
export const getUserDocuments = async () => {
    const response = await api.get('/documents/me');
    return response.data;
};

/**
 * Get documents for a specific user (admin/manager only)
 * @param {string} userId - User ID
 * @returns {Promise} Array of documents
 */
export const getUserDocumentsById = async (userId) => {
    const response = await api.get(`/documents/user/${userId}`);
    return response.data;
};

/**
 * Download a document
 * @param {string} documentId - Document ID
 * @returns {Promise} Blob data
 */
export const downloadDocument = async (documentId) => {
    const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Verify or reject a document (admin/manager only)
 * @param {string} documentId - Document ID
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} rejectionReason - Reason for rejection (optional)
 * @returns {Promise} Updated document data
 */
export const verifyDocument = async (documentId, status, rejectionReason = null) => {
    const response = await api.put(`/documents/${documentId}/verify`, {
        status,
        rejection_reason: rejectionReason,
    });
    return response.data;
};

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @returns {Promise}
 */
export const deleteDocument = async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
};

/**
 * Get pending documents for verification (admin/manager only)
 * @returns {Promise} Array of pending documents
 */
export const getPendingDocuments = async () => {
    const response = await api.get('/documents/pending');
    return response.data;
};

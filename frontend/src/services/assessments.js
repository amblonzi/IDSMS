import api from './api';

/**
 * Assessment service for managing student assessments
 */

/**
 * Create a new assessment
 * @param {Object} assessmentData - Assessment data
 * @returns {Promise} Created assessment
 */
export const createAssessment = async (assessmentData) => {
    const response = await api.post('/assessments/', assessmentData);
    return response.data;
};

/**
 * Get assessments for a specific enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @param {string} assessmentType - Optional filter by assessment type
 * @returns {Promise} Array of assessments
 */
export const getEnrollmentAssessments = async (enrollmentId, assessmentType = null) => {
    const params = assessmentType ? { assessment_type: assessmentType } : {};
    const response = await api.get(`/assessments/enrollment/${enrollmentId}`, { params });
    return response.data;
};

/**
 * Get all assessments for the current student
 * @returns {Promise} Array of assessments
 */
export const getMyAssessments = async () => {
    const response = await api.get('/assessments/student/me');
    return response.data;
};

/**
 * Get a specific assessment by ID
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise} Assessment data
 */
export const getAssessment = async (assessmentId) => {
    const response = await api.get(`/assessments/${assessmentId}`);
    return response.data;
};

/**
 * Update an assessment
 * @param {string} assessmentId - Assessment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} Updated assessment
 */
export const updateAssessment = async (assessmentId, updateData) => {
    const response = await api.put(`/assessments/${assessmentId}`, updateData);
    return response.data;
};

/**
 * Delete an assessment (admin only)
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise}
 */
export const deleteAssessment = async (assessmentId) => {
    const response = await api.delete(`/assessments/${assessmentId}`);
    return response.data;
};

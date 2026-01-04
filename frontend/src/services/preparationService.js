import api from './api';

export const preparationService = {
  async extractMaterial(materialId) {
    const response = await api.get(`/materials/${materialId}/extract/`);
    return response.data;
  },

  async listSummaries(courseId) {
    const response = await api.get('/preparation/summaries/', {
      params: courseId ? { course_id: courseId } : {},
    });
    return Array.isArray(response.data) ? response.data : response.data.results || response.data;
  },

  async createSummary({ course, materials = [], content, title = 'Summary' }) {
    const response = await api.post('/preparation/summaries/', {
      course,
      materials,
      content,
      title,
    });
    return response.data;
  },

  async updateSummary(summaryId, { content, title }) {
    const response = await api.patch(`/preparation/summaries/${summaryId}/`, {
      content,
      title,
    });
    return response.data;
  },

  async deleteSummary(summaryId) {
    await api.delete(`/preparation/summaries/${summaryId}/`);
  },

  async generateSummary({ course, materials = [] }) {
    const response = await api.post('/preparation/summaries/generate/', {
      course,
      materials,
    });
    return response.data;
  },

  async downloadSummaryPdf({ text, title = 'Study Summary', courseCode = '' }) {
    const response = await api.post(
      '/preparation/summaries/export-pdf/',
      {
        text,
        title,
        course_code: courseCode,
      },
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${courseCode || 'summary'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async generateQuiz({ course, materials = [], numQuestions = 5, difficulty = 'medium' }) {
    const response = await api.post('/preparation/quizzes/generate/', {
      course,
      materials,
      num_questions: numQuestions,
      difficulty,
    });
    return response.data;
  },

  async submitQuiz(quizId, answers) {
    const response = await api.post(`/preparation/quizzes/${quizId}/submit/`, {
      answers,
    });
    return response.data;
  },

  async listQuizzes(courseId) {
    const response = await api.get('/preparation/quizzes/', {
      params: courseId ? { course_id: courseId } : {},
    });
    return Array.isArray(response.data) ? response.data : response.data.results || response.data;
  },
};

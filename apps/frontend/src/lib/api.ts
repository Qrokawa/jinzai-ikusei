import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/refresh`,
            { refreshToken },
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export const usersApi = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

export const goalsApi = {
  getMyGoals: async (cycleId?: string) => {
    const params = cycleId ? { cycleId } : {};
    const response = await api.get('/goals/my', { params });
    return response.data;
  },

  getGoal: async (id: string) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  createGoal: async (data: any) => {
    const response = await api.post('/goals', data);
    return response.data;
  },

  updateGoal: async (id: string, data: any) => {
    const response = await api.patch(`/goals/${id}`, data);
    return response.data;
  },

  submitGoal: async (id: string) => {
    const response = await api.post(`/goals/${id}/submit`);
    return response.data;
  },

  updateProgress: async (id: string, data: any) => {
    const response = await api.post(`/goals/${id}/progress`, data);
    return response.data;
  },

  getPendingApprovals: async () => {
    const response = await api.get('/goals/pending-approvals');
    return response.data;
  },

  approveGoal: async (id: string, comment?: string) => {
    const response = await api.post(`/goals/${id}/approve`, { comment });
    return response.data;
  },

  rejectGoal: async (id: string, comment: string) => {
    const response = await api.post(`/goals/${id}/reject`, { comment });
    return response.data;
  },
};

export const coursesApi = {
  getCourses: async (params?: any) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourse: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await api.get('/courses/enrollments');
    return response.data;
  },

  enrollCourse: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  updateLessonProgress: async (enrollmentId: string, lessonId: string, data: any) => {
    const response = await api.patch(
      `/courses/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      data,
    );
    return response.data;
  },
};

export const evaluationsApi = {
  getCycles: async () => {
    const response = await api.get('/evaluations/cycles');
    return response.data;
  },

  getEvaluations: async (params?: any) => {
    const response = await api.get('/evaluations', { params });
    return response.data;
  },

  createEvaluation: async (data: any) => {
    const response = await api.post('/evaluations', data);
    return response.data;
  },

  submitEvaluation: async (id: string, data: any) => {
    const response = await api.post(`/evaluations/${id}/submit`, data);
    return response.data;
  },
};

export default api;

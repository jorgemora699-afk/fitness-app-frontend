export const API_URL = 'https://fitness-app-backend-production-4b4f.up.railway.app';

export const ENDPOINTS = {
  // Auth
  LOGIN_TRAINER: '/api/auth/login/trainer',
  LOGIN_USER: '/api/auth/login/user',
  REGISTER_USER: '/api/auth/register',
  CREATE_TRAINER: '/api/auth/create/trainer',
  TRAINER_FORGOT_PASSWORD: '/api/auth/trainer/forgot-password',
  TRAINER_RESET_PASSWORD: '/api/auth/trainer/reset-password',
  CHANGE_TRAINER_PASSWORD: '/api/auth/trainers/me/password',
  

  // Users
  GET_MY_USERS: '/api/users/',
  GET_USER: (id) => `/api/users/${id}`,
  UPDATE_USER: (id) => `/api/users/${id}`,
  ASSIGN_TRAINER: (id) => `/api/users/${id}/assign`,
  MY_PROFILE: '/api/users/me',
  CHANGE_PASSWORD: '/api/users/me/password',
  RESET_PASSWORD: '/api/auth/reset-password',
  UPLOAD_MY_PHOTO: '/api/users/me/photo',
  UPLOAD_TRAINER_PHOTO: '/api/auth/trainers/me/photo',
  DELETE_MY_PHOTO: '/api/users/me/photo',
  DELETE_TRAINER_PHOTO: '/api/auth/trainers/me/photo',
  APPROVE_USER: (id) => `/api/users/${id}/approve`,
  REJECT_USER: (id) => `/api/users/${id}/reject`,

  // Memberships
  CREATE_MEMBERSHIP: '/api/memberships/',
  CONFIRM_PAYMENT: (id) => `/api/memberships/${id}/confirm`,
  MEMBERSHIP_HISTORY: (id) => `/api/memberships/user/${id}/history`,
  ACTIVE_MEMBERSHIP: '/api/memberships/me/active',
  EXPIRING_MEMBERSHIPS: '/api/memberships/expiring',
  FINANCES: '/api/memberships/finances',

  // Routines
  CREATE_ROUTINE: '/api/routines/',
  GET_USER_ROUTINES: (id) => `/api/routines/user/${id}`,
  MY_ROUTINE_BY_DATE: '/api/routines/me/day',
  UPDATE_EXERCISE: (id) => `/api/routines/exercise/${id}`,
  DELETE_ROUTINE: (id) => `/api/routines/${id}`,
  COPY_ROUTINE: (id) => `/api/routines/${id}/copy`,
  GET_WORKOUT_HISTORY: (id) => `/api/routines/user/${id}/history`,

  UPDATE_ROUTINE: (id) => `/api/routines/${id}`,
  ADD_EXERCISE: (id) => `/api/routines/${id}/exercises`,
  DELETE_EXERCISE: (id) => `/api/routines/exercise/${id}`,
  MY_EXERCISE_NAMES: '/api/routines/me/exercise-names',
  ARCHIVE_ROUTINE: (id) => `/api/routines/${id}/archive`,
  UNARCHIVE_ROUTINE: (id) => `/api/routines/${id}/restore`,
  UPLOAD_EXERCISE_VIDEO: (id) => `/api/routines/exercise/${id}/video`,
  DELETE_EXERCISE_VIDEO: (id) => `/api/routines/exercise/${id}/video`,

  // Templates
  CREATE_TEMPLATE: '/api/templates/',
  GET_TEMPLATES: '/api/templates/',
  GET_TEMPLATE: (id) => `/api/templates/${id}`,
  UPDATE_TEMPLATE: (id) => `/api/templates/${id}`,
  DELETE_TEMPLATE: (id) => `/api/templates/${id}`,
  ASSIGN_TEMPLATE: (id) => `/api/templates/${id}/assign`,
  UPLOAD_TEMPLATE_EXERCISE_VIDEO: (id) => `/api/templates/exercise/${id}/video`,
  DELETE_TEMPLATE_EXERCISE_VIDEO: (id) => `/api/templates/exercise/${id}/video`,

  // Schedules
  CREATE_SCHEDULE: '/api/schedules/',
  GET_SCHEDULE: '/api/schedules/',
  MY_SCHEDULE: '/api/schedules/me',
  CONFIRM_SCHEDULE: (id) => `/api/schedules/${id}/confirm`,
  DELETE_SCHEDULE: (id) => `/api/schedules/${id}`,
  WHATSAPP_CONFIRMATION: (id) => `/api/schedules/${id}/whatsapp`,
  CANCEL_AS_USER: (id) => `/api/schedules/${id}/cancel/user`,
  CANCEL_AS_TRAINER: (id) => `/api/schedules/${id}/cancel/trainer`,
  UPDATE_SCHEDULE: (id) => `/api/schedules/${id}`,
  GET_MY_SESSION_BY_SCHEDULE: (scheduleId) => `/api/sessions/me/by-schedule/${scheduleId}`,

  // Agregar en ENDPOINTS
  SAVE_PUSH_TOKEN: '/api/users/me/push-token',
  NOTIFY_SCHEDULE: (id) => `/api/schedules/${id}/notify`,
  RESPOND_SCHEDULE: (id) => `/api/schedules/${id}/respond`,
  MARK_ATTENDANCE: (id) => `/api/schedules/${id}/attendance`,
  PENDING_SCHEDULES: '/api/schedules/me/pending',
  UPDATE_SCHEDULE: (id) => `/api/schedules/${id}`,

  // Photos
  UPLOAD_PHOTO: '/api/photos/upload',
  MY_PHOTOS: '/api/photos/me',
  PHOTOS_BY_DATE: '/api/photos/me/date',
  PHOTOS_BY_MONTH: '/api/photos/me/months',
  AVAILABLE_MONTHS: '/api/photos/me/available-months',
  COMPARE_PHOTOS: '/api/photos/me/compare',
  DELETE_PHOTO: (id) => `/api/photos/${id}`,

  // Progress
  ADD_BODY_RECORD: '/api/progress/body',
  MY_BODY_PROGRESS: '/api/progress/body/me',
  MY_EXERCISE_PROGRESS: '/api/progress/exercise/me',
  MY_IMC: '/api/progress/imc/me',
  USER_PROGRESS: (id) => `/api/progress/user/${id}`,
  USER_IMC: (id) => `/api/progress/imc/user/${id}`,
  DELETE_BODY_RECORD: (id) => `/api/progress/body/${id}`,

  // Assigned Workouts
  USER_ASSIGNED_WORKOUTS: (id) => `/api/assigned-workouts/user/${id}`,
  MY_ASSIGNED_WORKOUTS: '/api/assigned-workouts/me',

  // Attendance
  REGISTER_ATTENDANCE: '/api/attendance/',
  USER_ATTENDANCE: (id) => `/api/attendance/user/${id}`,
  ATTENDANCE_SUMMARY: '/api/attendance/summary',
  INACTIVE_USERS: '/api/attendance/inactive',
  MY_ATTENDANCE: '/api/attendance/me',

  // Notes
  CREATE_NOTE: '/api/notes/',
  GET_ALL_NOTES: '/api/notes/',
  GET_USER_NOTES: (id) => `/api/notes/user/${id}`,
  UPDATE_NOTE: (id) => `/api/notes/${id}`,
  DELETE_NOTE: (id) => `/api/notes/${id}`,

  // Workout Sessions
  START_SESSION: '/api/sessions/start',
  LOG_EXERCISE_IN_SESSION: (sessionId) => `/api/sessions/${sessionId}/log`,
  FINISH_SESSION: (sessionId) => `/api/sessions/${sessionId}/finish`,
  GET_SESSION_BY_SCHEDULE: (scheduleId) => `/api/sessions/by-schedule/${scheduleId}`,
  SESSION_HISTORY: (userId) => `/api/sessions/user/${userId}/history`,
  START_MY_SESSION: '/api/sessions/me/start',
  FINISH_MY_SESSION: (sessionId) => `/api/sessions/me/${sessionId}/finish`,

  // Notifications
  EXPIRING_NOTIFICATIONS: '/api/notifications/expiring',
};


export const COLORS = {
  // Negros
  primary: '#1A1A1A',      // Negro profundo
  dark: '#0D0D0D',         // Negro carbón
  darkGray: '#2C2C2C',     // Gris antracita
  steelDark: '#3A3A3A',    // Gris acero oscuro

  // Grises
  metalGray: '#4F4F4F',    // Gris metálico
  gray: '#6E6E6E',         // Gris medio
  lightGray: '#B0B0B0',    // Gris claro
  softWhite: '#F5F5F5',    // Blanco suave

  // Claros
  white: '#FFFFFF',        // Blanco puro
  silver: '#C0C0C0',       // Plata brillante

  // Acento (para botones y destacados)
  accent: '#E8E8E8',       // Gris muy claro
  accentDark: '#888888',   // Gris oscuro medio

  // Estados
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#E53935',

  // Fondos
  background: '#0D0D0D',
  card: '#1E1E1E',
  input: '#2C2C2C',
  border: '#3A3A3A',

  // Textos
  text: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textDark: '#1A1A1A',
};
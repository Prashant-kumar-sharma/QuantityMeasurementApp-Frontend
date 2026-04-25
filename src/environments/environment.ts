export const environment = {
  production: false,
  gatewayBaseUrl: 'http://13.60.215.51:8080',
  apiUrl: 'http://13.60.215.51:8080/api',
  authEndpoints: {
    login: '/auth/login',
    register: '/auth/signup',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password'
  },
  oauth: {
    googleAuthorizeUrl: 'http://13.60.215.51:8080/oauth2/authorize/google'
  },
  storage: {
    authSessionKey: 'qm_auth_session'
  }
};

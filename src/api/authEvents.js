let _clearAuth = null;

export const setAuthClearer = (fn) => {
  _clearAuth = fn;
};

export const triggerClearAuth = () => {
  if (_clearAuth) _clearAuth();
};
import { createSlice } from '@reduxjs/toolkit';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: user || null, token: token || null, isAuthenticated: !!(user && token), loading: false },
  reducers: {
    loginStart: (state) => { state.loading = true; },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state) => { state.loading = false; },
    logout: (state) => {
      state.user = null; state.token = null; state.isAuthenticated = false;
      localStorage.removeItem('user'); localStorage.removeItem('token');
    },
    updateUser: (state, action) => { state.user = { ...state.user, ...action.payload }; },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

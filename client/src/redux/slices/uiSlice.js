import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, loading: false, notification: null },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setNotification: (state, action) => { state.notification = action.payload; },
    clearNotification: (state) => { state.notification = null; },
  },
});

export const { toggleSidebar, setSidebarOpen, setLoading, setNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;

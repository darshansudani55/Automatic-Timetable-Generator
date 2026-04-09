import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './components/common/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Departments = lazy(() => import('./pages/masters/Departments'));
const Faculty = lazy(() => import('./pages/masters/Faculty'));
const Subjects = lazy(() => import('./pages/masters/Subjects'));
const Classrooms = lazy(() => import('./pages/masters/Classrooms'));
const Labs = lazy(() => import('./pages/masters/Labs'));
const Classes = lazy(() => import('./pages/masters/Classes'));
const TimetableGenerator = lazy(() => import('./pages/TimetableGenerator'));
const ViewTimetables = lazy(() => import('./pages/ViewTimetables'));
const TimetableDetail = lazy(() => import('./pages/TimetableDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

const Loader = () => (
  <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" sx={{ background: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)' }}>
    <CircularProgress size={48} sx={{ color: '#fff' }} />
  </Box>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="masters/departments" element={<Departments />} />
            <Route path="masters/faculty" element={<Faculty />} />
            <Route path="masters/subjects" element={<Subjects />} />
            <Route path="masters/classrooms" element={<Classrooms />} />
            <Route path="masters/labs" element={<Labs />} />
            <Route path="masters/classes" element={<Classes />} />
            <Route path="timetable/generate" element={<TimetableGenerator />} />
            <Route path="timetable/view" element={<ViewTimetables />} />
            <Route path="timetable/view/:id" element={<TimetableDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

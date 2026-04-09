import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, IconButton, Divider, Alert, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import api from '../utils/api';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    setLoading(true);
    dispatch(loginStart());
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(loginSuccess(data.data));
      toast.success(`Welcome back, ${data.data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      dispatch(loginFailure());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 30%, #8B5CF6 70%, #7C3AED 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative blobs */}
      {[...Array(4)].map((_, i) => (
        <Box key={i} sx={{ position: 'absolute', width: [300,200,150,250][i], height: [300,200,150,250][i], borderRadius: '50%', background: `rgba(255,255,255,${[0.05,0.04,0.06,0.03][i]})`, top: ['10%','60%','30%','80%'][i], left: ['5%','70%','80%','15%'][i], animation: `float ${[6,8,7,9][i]}s ease-in-out infinite alternate` }} />
      ))}

      <Card sx={{ width: '100%', maxWidth: 440, mx: 2, borderRadius: 4, boxShadow: '0 32px 64px rgba(0,0,0,0.25)', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.97)' }}>
        <CardContent sx={{ p: 5 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '20px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <SchoolIcon sx={{ color: '#fff', fontSize: 36 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TimetableAI
            </Typography>
            <Typography color="text.secondary" variant="body2">Intelligent Academic Scheduling System</Typography>
          </Box>

          <Divider sx={{ mb: 3 }}><Typography variant="caption" color="text.secondary">Admin Login</Typography></Divider>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email Address" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              sx={{ mb: 2.5 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'primary.main', fontSize: 20 }} /></InputAdornment> }}
              placeholder="admin@timetable.com"
            />
            <TextField
              fullWidth label="Password" type={showPass ? 'text' : 'password'} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'primary.main', fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">{showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
              }}
              placeholder="••••••••"
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 3, mb: 2, boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#F5F7FF', borderRadius: 2, border: '1px dashed #C7D2FE' }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" fontWeight={600}>Demo Credentials</Typography>
            <Typography variant="caption" color="primary.main" display="block" textAlign="center">admin@timetable.com / Admin@1234</Typography>
          </Box>
        </CardContent>
      </Card>

      <style>{`@keyframes float { from { transform: translateY(0px) scale(1); } to { transform: translateY(-20px) scale(1.05); } }`}</style>
    </Box>
  );
}

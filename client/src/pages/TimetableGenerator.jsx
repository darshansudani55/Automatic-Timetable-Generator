import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Stepper, Step, StepLabel, Button, Typography, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormControlLabel, Switch, Checkbox, Chip, LinearProgress, Alert, CircularProgress, Divider, Paper } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const STEPS = ['Basic Config', 'Select Classes', 'Constraints', 'Generate'];

export default function TimetableGenerator() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const [config, setConfig] = useState({
    academicYear: '2024-2025',
    semester: 'Odd',
    timetableName: '',
    algorithm: 'genetic',
    workingHours: { startTime: '07:30', endTime: '13:30', breakTime: { start: '10:30', end: '11:00' } },
  });
  const [constraints, setConstraints] = useState({
    noFreeSlots: true,
    maxFacultyHoursPerDay: 6,
    labContinuousSlots: true,
  });

  useEffect(() => {
    setLoading(true);
    api.get('/master/classes', { params: { limit: 100 } })
      .then(({ data: r }) => setClasses(r.data))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  const toggleClass = (id) => setSelectedClasses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress((p) => { if (p >= 88) { clearInterval(progressInterval); return 88; } return p + Math.random() * 12; });
    }, 400);

    try {
      const { data: res } = await api.post('/timetable/generate', {
        ...config,
        timetableName: config.timetableName || `${config.academicYear} ${config.semester}`,
        classes: selectedClasses,
        constraints,
      });
      clearInterval(progressInterval);
      setProgress(100);
      setResult(res.data);
      toast.success('Timetable generated successfully!');
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) {
      if (!config.academicYear || !config.semester) return false;
      if (!config.workingHours.startTime || !config.workingHours.endTime || !config.workingHours.breakTime.start || !config.workingHours.breakTime.end) return false;
      
      const tStart = new Date(`1970-01-01T${config.workingHours.startTime}`);
      const tEnd = new Date(`1970-01-01T${config.workingHours.endTime}`);
      const bStart = new Date(`1970-01-01T${config.workingHours.breakTime.start}`);
      const bEnd = new Date(`1970-01-01T${config.workingHours.breakTime.end}`);
      
      if (tStart >= tEnd || bStart >= bEnd) return false;
      if (bStart <= tStart || bEnd >= tEnd) return false;
      
      return true;
    }
    if (activeStep === 1) return selectedClasses.length > 0;
    return true;
  }

  return (
    <Box>
      <PageHeader title="Generate Timetable" subtitle="Create a conflict-free academic timetable automatically" breadcrumbs={[{ label: 'Timetables', path: '/timetable/view' }, { label: 'Generate' }]} />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel><Typography variant="caption" fontWeight={600}>{label}</Typography></StepLabel></Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step 0: Basic Config */}
      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Basic Configuration</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Timetable Name" value={config.timetableName} onChange={(e) => setConfig({ ...config, timetableName: e.target.value })} placeholder="e.g. CSE Semester 3 Timetable 2024" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Academic Year" value={config.academicYear} onChange={(e) => setConfig({ ...config, academicYear: e.target.value })} placeholder="2024-2025" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Semester *</InputLabel>
                  <Select value={config.semester} onChange={(e) => setConfig({ ...config, semester: e.target.value })} label="Semester *">
                    <MenuItem value="Odd">Odd Semester</MenuItem>
                    <MenuItem value="Even">Even Semester</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Start Time" type="time" value={config.workingHours.startTime} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, startTime: e.target.value } })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="End Time" type="time" value={config.workingHours.endTime} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, endTime: e.target.value } })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Break Start" type="time" value={config.workingHours.breakTime.start} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, breakTime: { ...config.workingHours.breakTime, start: e.target.value } } })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Break End" type="time" value={config.workingHours.breakTime.end} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, breakTime: { ...config.workingHours.breakTime, end: e.target.value } } })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Algorithm</InputLabel>
                  <Select value={config.algorithm} onChange={(e) => setConfig({ ...config, algorithm: e.target.value })} label="Algorithm">
                    <MenuItem value="genetic">Genetic Algorithm (Recommended)</MenuItem>
                    <MenuItem value="backtracking">Backtracking (Exact, best for ≤5 classes)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {!canProceed() && activeStep === 0 && (
                <Grid item xs={12}>
                   <Alert severity="error">Invalid times! Break must be between Start and End time, and Start must be before End.</Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Classes */}
      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Select Classes</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>{selectedClasses.length} of {classes.length} classes selected</Typography>
            {loading ? <CircularProgress /> : (
              <Grid container spacing={2}>
                {classes.map((cls) => {
                  const selected = selectedClasses.includes(cls._id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={cls._id}>
                      <Paper onClick={() => toggleClass(cls._id)} elevation={0} sx={{ p: 2.5, border: `2px solid ${selected ? '#6366F1' : '#E5E7EB'}`, borderRadius: 3, cursor: 'pointer', bgcolor: selected ? '#EEF2FF' : '#fff', transition: 'all 0.2s', '&:hover': { borderColor: '#6366F1', transform: 'translateY(-2px)' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Chip label={cls.className} sx={{ fontWeight: 800, bgcolor: selected ? '#6366F1' : '#F3F4F6', color: selected ? '#fff' : 'text.primary' }} />
                          {selected && <CheckCircleIcon sx={{ color: '#6366F1' }} />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">{cls.department?.departmentName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">Sem {cls.semester} | {cls.studentCount} students</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{cls.subjects?.length || 0} subjects assigned</Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Constraints */}
      {activeStep === 2 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Constraint Configuration</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={constraints.noFreeSlots} onChange={(e) => setConstraints({ ...constraints, noFreeSlots: e.target.checked })} color="primary" />} label={<Box><Typography fontWeight={600}>No Free Slots</Typography><Typography variant="caption" color="text.secondary">Ensure no gaps between lectures for any class</Typography></Box>} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={constraints.labContinuousSlots} onChange={(e) => setConstraints({ ...constraints, labContinuousSlots: e.target.checked })} color="primary" />} label={<Box><Typography fontWeight={600}>Continuous Lab Sessions</Typography><Typography variant="caption" color="text.secondary">Labs must be scheduled in continuous 1.5-hour blocks</Typography></Box>} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Max Faculty Hours Per Day" type="number" value={constraints.maxFacultyHoursPerDay} onChange={(e) => setConstraints({ ...constraints, maxFacultyHoursPerDay: Number(e.target.value) })} inputProps={{ min: 1, max: 8 }} helperText="Maximum hours a faculty can teach in a single day" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generate */}
      {activeStep === 3 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Review & Generate</Typography>
            <Grid container spacing={3} mb={3}>
              {[
                { label: 'Academic Year', value: config.academicYear },
                { label: 'Semester', value: config.semester },
                { label: 'Algorithm', value: config.algorithm === 'genetic' ? 'Genetic Algorithm' : 'Backtracking' },
                { label: 'Classes', value: `${selectedClasses.length} selected` },
                { label: 'Working Hours', value: `${config.workingHours.startTime} – ${config.workingHours.endTime}` },
                { label: 'Break', value: `${config.workingHours.breakTime.start} – ${config.workingHours.breakTime.end}` },
              ].map((item) => (
                <Grid item xs={6} md={4} key={item.label}>
                  <Box sx={{ p: 2, bgcolor: '#F5F7FF', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                    <Typography fontWeight={700}>{item.value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {generating && (
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" mb={1} fontWeight={600}>Generating... {Math.round(progress)}%</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="caption" color="text.secondary" mt={1} display="block">Running {config.algorithm === 'genetic' ? 'Genetic Algorithm' : 'Backtracking'} — optimizing for zero conflicts...</Typography>
              </Box>
            )}

            {result && (
              <Alert severity={result.conflicts?.length > 0 ? 'warning' : 'success'} icon={result.conflicts?.length > 0 ? <WarningIcon /> : <CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                <Typography fontWeight={700}>Timetable Generated! Fitness Score: {result.fitnessScore}/1000</Typography>
                {result.conflicts?.length > 0 ? (
                  <Typography variant="body2">{result.conflicts.length} conflict(s) detected. You can resolve them manually.</Typography>
                ) : (
                  <Typography variant="body2">Zero conflicts detected — perfect timetable!</Typography>
                )}
                <Button size="small" variant="outlined" sx={{ mt: 1, borderRadius: 2 }} onClick={() => navigate(`/timetable/view/${result.timetableId}`)}>View Timetable →</Button>
              </Alert>
            )}

            {!generating && !result && (
              <Button variant="contained" size="large" startIcon={<AutoFixHighIcon />} onClick={handleGenerate} sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1rem' }}>
                Generate Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0 || generating} onClick={() => setActiveStep((s) => s - 1)} sx={{ borderRadius: 2 }}>Back</Button>
        {activeStep < STEPS.length - 1 && (
          <Button variant="contained" disabled={!canProceed()} onClick={() => setActiveStep((s) => s + 1)} sx={{ borderRadius: 2 }}>Next</Button>
        )}
      </Box>
    </Box>
  );
}

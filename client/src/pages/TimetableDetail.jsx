import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Chip, Button, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublishIcon from '@mui/icons-material/Publish';

import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TYPE_COLORS = { Theory: { bg: '#DBEAFE', color: '#1D4ED8' }, Lab: { bg: '#D1FAE5', color: '#065F46' }, Tutorial: { bg: '#FEF3C7', color: '#92400E' }, Break: { bg: '#F3F4F6', color: '#6B7280' } };

function TimetableGrid({ schedule, selectedClassId }) {
  const classSchedule = schedule?.find((s) => s.class?._id === selectedClassId || s.class === selectedClassId);
  if (!classSchedule) return <Typography color="text.secondary" textAlign="center" py={4}>Select a class to view its timetable</Typography>;

  // Collect all unique time slots across all days
  const allSlots = new Map();
  for (const ds of classSchedule.dayWiseSchedule) {
    for (const slot of ds.slots) {
      allSlots.set(slot.startTime, { startTime: slot.startTime, endTime: slot.endTime, isBreak: slot.isBreak });
    }
  }
  const sortedSlots = [...allSlots.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSlot = (day, startTime) => {
    const ds = classSchedule.dayWiseSchedule.find((d) => d.day === day);
    return ds?.slots.find((s) => s.startTime === startTime) || null;
  };

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F7FF', width: 100 }}>Time</TableCell>
            {DAYS.map((d) => <TableCell key={d} align="center" sx={{ fontWeight: 700, bgcolor: '#F5F7FF' }}>{d}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSlots.map((slotTime) => (
            <TableRow key={slotTime.startTime}>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: '#FAFBFF', whiteSpace: 'nowrap' }}>
                {slotTime.startTime}<br />{slotTime.endTime}
              </TableCell>
              {slotTime.isBreak ? (
                <TableCell colSpan={5} align="center" sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: '0.8rem' }}>☕ Break Time</TableCell>
              ) : (
                DAYS.map((day) => {
                  const slot = getSlot(day, slotTime.startTime);
                  if (!slot || slot.isBreak) return <TableCell key={day} sx={{ border: '1px solid #F0F0FF', p: 0.75 }} />;
                  const colors = TYPE_COLORS[slot.sessionType] || TYPE_COLORS.Theory;
                  return (
                    <TableCell key={day} sx={{ border: '1px solid #F0F0FF', p: 0.75, verticalAlign: 'top' }}>
                      {slot.subject && (
                        <Box sx={{ bgcolor: colors.bg, borderRadius: 1.5, p: 1, borderLeft: `3px solid ${colors.color}` }}>
                          <Typography variant="caption" fontWeight={700} display="block" color={colors.color}>{slot.subject?.subjectCode}</Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>{slot.subject?.subjectName}</Typography>
                          {slot.faculty && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{slot.faculty?.fullName}</Typography>}
                          {slot.classroom && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{slot.classroom?.roomNumber}</Typography>}
                          {slot.lab && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{slot.lab?.labCode}{slot.labPart ? ` (${slot.labPart})` : ''}</Typography>}
                          <Chip label={slot.sessionType} size="small" sx={{ mt: 0.5, height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: colors.color, color: '#fff' }} />
                        </Box>
                      )}
                    </TableCell>
                  );
                })
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function TimetableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    api.get(`/timetable/${id}`)
      .then(({ data: r }) => { setTimetable(r.data); if (r.data.schedule?.length) setSelectedClass(r.data.schedule[0].class?._id || r.data.schedule[0].class); })
      .catch(() => { toast.error('Failed to load timetable'); navigate('/timetable/view'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    try { await api.put(`/timetable/${id}/publish`); toast.success('Published!'); window.location.reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Publish failed'); }
  };

  if (loading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!timetable) return null;

  const classes = timetable.schedule?.map((s) => s.class).filter(Boolean) || [];

  return (
    <Box>
      <PageHeader
        title={timetable.timetableName}
        subtitle={`${timetable.academicYear} · ${timetable.semester} Semester`}
        breadcrumbs={[{ label: 'Timetables', path: '/timetable/view' }, { label: timetable.timetableName }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/timetable/view')} sx={{ borderRadius: 2 }}>Back</Button>
            {timetable.status === 'draft' && <Button variant="contained" startIcon={<PublishIcon />} onClick={handlePublish} sx={{ borderRadius: 2 }}>Publish</Button>}
          </Box>
        }
      />

      {/* Meta */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Status', value: timetable.status, type: 'chip', color: { draft: 'warning', published: 'success', archived: 'default' }[timetable.status] },
          { label: 'Fitness Score', value: `${timetable.fitnessScore || 0}/1000` },
          { label: 'Algorithm', value: timetable.algorithm || 'genetic' },
          { label: 'Classes', value: timetable.schedule?.length || 0 },
          { label: 'Working Hours', value: `${timetable.workingHours?.startTime} – ${timetable.workingHours?.endTime}` },
          { label: 'Break', value: `${timetable.workingHours?.breakTime?.start} – ${timetable.workingHours?.breakTime?.end}` },
        ].map((item) => (
          <Grid item xs={6} sm={4} md={2} key={item.label}>
            <Card><CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
              {item.type === 'chip' ? <Box mt={0.5}><Chip label={item.value} size="small" color={item.color} /></Box> : <Typography fontWeight={700} variant="body2">{item.value}</Typography>}
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* Conflicts */}
      {timetable.conflicts?.filter((c) => !c.resolved).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography fontWeight={700}>{timetable.conflicts.filter((c) => !c.resolved).length} unresolved conflict(s)</Typography>
          {timetable.conflicts.filter((c) => !c.resolved).slice(0, 3).map((c, i) => <Typography key={i} variant="caption" display="block">• {c.description}</Typography>)}
        </Alert>
      )}

      {/* Class selector + Grid */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
            <Typography variant="h6" fontWeight={700}>Timetable Grid</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Class</InputLabel>
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} label="Select Class">
                {classes.map((cls) => <MenuItem key={cls._id || cls} value={cls._id || cls}>{cls?.className || cls}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(TYPE_COLORS).map(([type, c]) => <Chip key={type} label={type} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: '0.7rem' }} />)}
            </Box>
          </Box>
          <TimetableGrid schedule={timetable.schedule} selectedClassId={selectedClass} />
        </CardContent>
      </Card>
    </Box>
  );
}

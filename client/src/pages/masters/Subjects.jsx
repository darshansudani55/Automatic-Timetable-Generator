import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const CREDIT_MAP = { 1: { theory: 1, lab: 0 }, 2: { theory: 2, lab: 0 }, 3: { theory: 2, lab: 1 }, 4: { theory: 3, lab: 1 }, 5: { theory: 4, lab: 1 }, 6: { theory: 4, lab: 2 } };
const defaultValues = { subjectCode: '', subjectName: '', department: '', credits: '', semester: '' };

export default function Subjects() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues });
  const credits = useWatch({ control, name: 'credits' });
  const sessionPreview = CREDIT_MAP[credits];

  useEffect(() => { api.get('/master/departments', { params: { limit: 100 } }).then(({ data: r }) => setDepartments(r.data)).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/master/subjects', { params: { page: page + 1, limit: rowsPerPage, search } });
      setData(res.data); setTotal(res.pagination.total);
    } catch { toast.error('Failed to load subjects'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditItem(null); reset(defaultValues); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); reset({ ...item, department: item.department?._id || item.department }); setDialogOpen(true); };

  const onSubmit = async (values) => {
    try {
      if (editItem) { await api.put(`/master/subjects/${editItem._id}`, values); toast.success('Subject updated'); }
      else { await api.post('/master/subjects', values); toast.success('Subject created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/master/subjects/${deleteId}`); toast.success('Subject deleted'); setDeleteId(null); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Box>
      <PageHeader title="Subjects" subtitle="Manage academic subjects and credits" breadcrumbs={[{ label: 'Masters', path: '/masters/subjects' }, { label: 'Subjects' }]}
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Subject</Button>} />

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField placeholder="Search subjects..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 300 }} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Code', 'Name', 'Department', 'Credits', 'Theory/Week', 'Lab/Week', 'Lab Required', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                : data.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No subjects found</Typography></TableCell></TableRow>
                : data.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell><Chip label={row.subjectCode} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: 'primary.dark' }} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.subjectName}</TableCell>
                    <TableCell>{row.department?.departmentCode || '—'}</TableCell>
                    <TableCell><Chip label={`${row.credits} cr`} size="small" color="secondary" /></TableCell>
                    <TableCell><Chip label={row.sessionsPerWeek?.theory || 0} size="small" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }} /></TableCell>
                    <TableCell><Chip label={row.sessionsPerWeek?.lab || 0} size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 700 }} /></TableCell>
                    <TableCell>{row.requiresLab ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" />}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField fullWidth label="Subject Code" {...register('subjectCode', { required: 'Required' })} error={!!errors.subjectCode} helperText={errors.subjectCode?.message} inputProps={{ style: { textTransform: 'uppercase' } }} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Subject Name" {...register('subjectName', { required: 'Required' })} error={!!errors.subjectName} helperText={errors.subjectName?.message} /></Grid>
              <Grid item xs={6}>
                <Controller name="department" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.department}>
                    <InputLabel>Department *</InputLabel>
                    <Select {...field} label="Department *">
                      {departments.map((d) => <MenuItem key={d._id} value={d._id}>{d.departmentName}</MenuItem>)}
                    </Select>
                    {errors.department && <FormHelperText>{errors.department.message}</FormHelperText>}
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="credits" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.credits}>
                    <InputLabel>Credits *</InputLabel>
                    <Select {...field} label="Credits *">
                      {[1, 2, 3, 4, 5, 6].map((c) => <MenuItem key={c} value={c}>{c} Credits</MenuItem>)}
                    </Select>
                    {errors.credits && <FormHelperText>{errors.credits.message}</FormHelperText>}
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Semester" type="number" {...register('semester', { min: 1, max: 8 })} inputProps={{ min: 1, max: 8 }} />
              </Grid>
              {sessionPreview && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
                    <strong>{credits} Credits</strong> → <strong>{sessionPreview.theory}</strong> theory sessions/week + <strong>{sessionPreview.lab}</strong> lab session{sessionPreview.lab !== 1 ? 's' : ''}/week
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>{editItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this subject?</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

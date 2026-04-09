import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, FormHelperText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Visiting Faculty'];
const defaultValues = { facultyId: '', fullName: '', email: '', phone: '', department: '', designation: '', maxWeeklyHours: 25 };

export default function Faculty() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues });

  useEffect(() => { api.get('/master/departments', { params: { limit: 100 } }).then(({ data: r }) => setDepartments(r.data)).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/master/faculty', { params: { page: page + 1, limit: rowsPerPage, search, department: deptFilter || undefined } });
      setData(res.data); setTotal(res.pagination.total);
    } catch { toast.error('Failed to load faculty'); }
    setLoading(false);
  }, [page, rowsPerPage, search, deptFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditItem(null); reset(defaultValues); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    reset({ ...item, department: item.department?._id || item.department, designation: item.designation || '' });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editItem) { await api.put(`/master/faculty/${editItem._id}`, values); toast.success('Faculty updated'); }
      else { await api.post('/master/faculty', values); toast.success('Faculty created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/master/faculty/${deleteId}`); toast.success('Faculty deleted'); setDeleteId(null); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Box>
      <PageHeader title="Faculty" subtitle="Manage teaching staff" breadcrumbs={[{ label: 'Masters', path: '/masters/faculty' }, { label: 'Faculty' }]}
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Faculty</Button>} />

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 260 }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Department</InputLabel>
            <Select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }} label="Filter by Department">
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => <MenuItem key={d._id} value={d._id}>{d.departmentName}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['ID', 'Name', 'Email', 'Department', 'Designation', 'Max Hours/Week', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                : data.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No faculty found</Typography></TableCell></TableRow>
                : data.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell><Chip label={row.facultyId} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: 'primary.dark' }} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.fullName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.department?.departmentCode || '—'}</TableCell>
                    <TableCell>{row.designation || '—'}</TableCell>
                    <TableCell><Chip label={`${row.maxWeeklyHours} hrs`} size="small" color="info" /></TableCell>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Faculty' : 'Add Faculty'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField fullWidth label="Faculty ID" {...register('facultyId', { required: 'Required' })} error={!!errors.facultyId} helperText={errors.facultyId?.message} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Full Name" {...register('fullName', { required: 'Required' })} error={!!errors.fullName} helperText={errors.fullName?.message} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Email" type="email" {...register('email', { required: 'Required' })} error={!!errors.email} helperText={errors.email?.message} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Phone" {...register('phone')} /></Grid>
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
                <Controller name="designation" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Designation</InputLabel>
                    <Select {...field} label="Designation">
                      {DESIGNATIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Max Weekly Hours" type="number" {...register('maxWeeklyHours', { min: 1, max: 40 })} /></Grid>
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
        <DialogContent><Typography>Delete this faculty member? This cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

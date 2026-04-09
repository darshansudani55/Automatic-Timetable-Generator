import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const defaultValues = { className: '', department: '', semester: '', section: 'A', academicYear: '2024-2025', studentCount: '', subjects: [] };

export default function Classes() {
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]); const [allSubjects, setAllSubjects] = useState([]); const [allFaculty, setAllFaculty] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' });

  useEffect(() => {
    api.get('/master/departments', { params: { limit: 100 } }).then(({ data: r }) => setDepartments(r.data)).catch(() => {});
    api.get('/master/subjects', { params: { limit: 200 } }).then(({ data: r }) => setAllSubjects(r.data)).catch(() => {});
    api.get('/master/faculty', { params: { limit: 200 } }).then(({ data: r }) => setAllFaculty(r.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/master/classes', { params: { page: page + 1, limit: rowsPerPage, search } }); setData(res.data); setTotal(res.pagination.total); } catch { toast.error('Failed to load classes'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditItem(null);
    reset({ ...defaultValues, subjects: [] });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    reset({
      ...item,
      department: item.department?._id || item.department || '',
      subjects: (item.subjects || []).map((s) => ({
        subject: s.subject?._id || s.subject || '',
        faculty: s.faculty?._id || s.faculty || '',
        labFaculty: s.labFaculty?._id || s.labFaculty || '',
      })),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, subjects: values.subjects.map((s) => ({ subject: s.subject, faculty: s.faculty || undefined, labFaculty: s.labFaculty || undefined })) };
      if (editItem) { await api.put(`/master/classes/${editItem._id}`, payload); toast.success('Class updated'); }
      else { await api.post('/master/classes', payload); toast.success('Class created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };
  const handleDelete = async () => { try { await api.delete(`/master/classes/${deleteId}`); toast.success('Deleted'); setDeleteId(null); fetchData(); } catch { toast.error('Delete failed'); } };

  return (
    <Box>
      <PageHeader title="Classes" subtitle="Manage class sections and subject assignments" breadcrumbs={[{ label: 'Masters', path: '/masters/classes' }, { label: 'Classes' }]} action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Class</Button>} />
      <Card>
        <Box sx={{ p: 2 }}><TextField placeholder="Search classes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 260 }} /></Box>
        <TableContainer><Table>
          <TableHead><TableRow>{['Class', 'Department', 'Semester', 'Section', 'Academic Year', 'Students', 'Subjects', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              : data.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No classes found</Typography></TableCell></TableRow>
              : data.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell><Chip label={row.className} sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: 'primary.dark' }} /></TableCell>
                  <TableCell>{row.department?.departmentCode || '—'}</TableCell>
                  <TableCell><Chip label={`Sem ${row.semester}`} size="small" color="secondary" /></TableCell>
                  <TableCell>{row.section}</TableCell>
                  <TableCell>{row.academicYear}</TableCell>
                  <TableCell><Chip label={row.studentCount} size="small" color="info" /></TableCell>
                  <TableCell><Chip label={`${row.subjects?.length || 0} subjects`} size="small" /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table></TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Class' : 'Add Class'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6} md={4}><TextField fullWidth label="Class Name" {...register('className', { required: 'Required' })} error={!!errors.className} helperText={errors.className?.message} placeholder="e.g. CSE-3A" /></Grid>
              <Grid item xs={6} md={4}>
                <Controller name="department" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                  <FormControl fullWidth size="small"><InputLabel>Department *</InputLabel><Select {...field} label="Department *">{departments.map((d) => <MenuItem key={d._id} value={d._id}>{d.departmentName}</MenuItem>)}</Select></FormControl>
                )} />
              </Grid>
              <Grid item xs={4} md={2}><TextField fullWidth label="Semester" type="number" {...register('semester', { required: 'Required', min: 1, max: 8 })} error={!!errors.semester} helperText={errors.semester?.message} /></Grid>
              <Grid item xs={4} md={2}><TextField fullWidth label="Section" {...register('section')} /></Grid>
              <Grid item xs={4} md={3}><TextField fullWidth label="Academic Year" {...register('academicYear', { required: 'Required' })} placeholder="2024-2025" /></Grid>
              <Grid item xs={4} md={3}><TextField fullWidth label="Student Count" type="number" {...register('studentCount', { required: 'Required', min: 1 })} error={!!errors.studentCount} helperText={errors.studentCount?.message} /></Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Subject Assignments</Typography>
              <Button size="small" startIcon={<AddCircleIcon />} onClick={() => append({ subject: '', faculty: '', labFaculty: '' })} sx={{ borderRadius: 2 }}>Add Subject</Button>
            </Box>

            {fields.length === 0 && <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#F9FAFB', borderRadius: 2 }}><Typography color="text.secondary" variant="body2">No subjects added. Click "Add Subject" to assign subjects.</Typography></Box>}

            {fields.map((field, index) => (
              <Box key={field.id} sx={{ p: 2, mb: 2, border: '1px solid #E5E7EB', borderRadius: 2, position: 'relative', bgcolor: '#FAFBFF' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}><IconButton size="small" onClick={() => remove(index)} color="error"><RemoveCircleIcon fontSize="small" /></IconButton></Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Controller name={`subjects.${index}.subject`} control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                      <FormControl fullWidth size="small"><InputLabel>Subject *</InputLabel><Select {...f} label="Subject *">{allSubjects.map((s) => <MenuItem key={s._id} value={s._id}>{s.subjectCode} - {s.subjectName}</MenuItem>)}</Select></FormControl>
                    )} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller name={`subjects.${index}.faculty`} control={control} render={({ field: f }) => (
                      <FormControl fullWidth size="small"><InputLabel>Theory Faculty</InputLabel><Select {...f} label="Theory Faculty"><MenuItem value="">None</MenuItem>{allFaculty.map((fac) => <MenuItem key={fac._id} value={fac._id}>{fac.fullName}</MenuItem>)}</Select></FormControl>
                    )} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller name={`subjects.${index}.labFaculty`} control={control} render={({ field: f }) => (
                      <FormControl fullWidth size="small"><InputLabel>Lab Faculty</InputLabel><Select {...f} label="Lab Faculty"><MenuItem value="">Same as Theory</MenuItem>{allFaculty.map((fac) => <MenuItem key={fac._id} value={fac._id}>{fac.fullName}</MenuItem>)}</Select></FormControl>
                    )} />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>{editItem ? 'Update' : 'Create'}</Button></DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this class?</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

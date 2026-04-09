import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Chip, Button, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Select, MenuItem, FormControl, InputLabel, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublishIcon from '@mui/icons-material/Publish';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';

import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TYPE_COLORS = { Theory: { bg: '#DBEAFE', color: '#1D4ED8' }, Lab: { bg: '#D1FAE5', color: '#065F46' }, Tutorial: { bg: '#FEF3C7', color: '#92400E' }, Break: { bg: '#F3F4F6', color: '#6B7280' } };

function TimetableGrid({ schedule = [], viewMode, selectedId, onSwap }) {
  if (!selectedId) return <Typography color="text.secondary" textAlign="center" py={4}>Select an entity to view its timetable</Typography>;

  const allSlots = new Map();
  for (const classSched of schedule) {
    for (const ds of classSched.dayWiseSchedule) {
      for (const slot of ds.slots) {
        allSlots.set(slot.startTime, { startTime: slot.startTime, endTime: slot.endTime, isBreak: slot.isBreak });
      }
    }
  }
  const sortedSlots = [...allSlots.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSlot = (day, startTime) => {
    const timeSlotDef = sortedSlots.find(s => s.startTime === startTime);
    if (timeSlotDef?.isBreak) return { isBreak: true };

    for (const classSched of schedule) {
      if (viewMode === 'Class' && (classSched.class?._id || classSched.class) !== selectedId) continue;

      const ds = classSched.dayWiseSchedule.find((d) => d.day === day);
      if (!ds) continue;
      
      const slotIndex = ds.slots.findIndex((s) => s.startTime === startTime);
      if (slotIndex === -1) continue;
      const slot = ds.slots[slotIndex];

      if (viewMode === 'Class') return { ...slot, parentClass: classSched.class, slotIndex };
      if (viewMode === 'Faculty' && (slot.faculty?._id === selectedId || slot.faculty === selectedId)) return { ...slot, parentClass: classSched.class, slotIndex };
      if (viewMode === 'Classroom' && (slot.classroom?._id === selectedId || slot.classroom === selectedId)) return { ...slot, parentClass: classSched.class, slotIndex };
      if (viewMode === 'Lab' && (slot.lab?._id === selectedId || slot.lab === selectedId)) return { ...slot, parentClass: classSched.class, slotIndex };
    }
    return null;
  };

  const handleDragStart = (e, day, slot) => {
    if (viewMode !== 'Class') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('sourceDay', day);
    e.dataTransfer.setData('sourceIndex', slot.slotIndex);
    e.dataTransfer.setData('sourceTime', slot.startTime);
  };

  const handleDrop = (e, targetDay, targetStartTime) => {
    e.preventDefault();
    if (viewMode !== 'Class') return;
    const sourceDay = e.dataTransfer.getData('sourceDay');
    const sourceIndex = e.dataTransfer.getData('sourceIndex');
    const sourceTime = e.dataTransfer.getData('sourceTime');
    
    if (sourceDay && sourceIndex !== "" && targetDay && targetStartTime) {
      if (sourceDay === targetDay && sourceTime === targetStartTime) return; 
      onSwap(selectedId, sourceDay, parseInt(sourceIndex, 10), targetDay, targetStartTime);
    }
  };

  // Compute precise grid layout mapping to support accurate HTML rowSpans for Labs!
  const timeRows = [...allSlots.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const gridData = timeRows.map(tr => ({
    startTime: tr.startTime,
    endTime: tr.endTime,
    isBreak: tr.isBreak,
    cells: {}
  }));

  DAYS.forEach(day => {
    timeRows.forEach((tr, rowIndex) => {
       if (gridData[rowIndex].cells[day]?.skip) return;

       const slot = getSlot(day, tr.startTime);
       if (slot && !slot.isBreak) {
         let span = 1;
         let nextIndex = rowIndex + 1;
         while (nextIndex < timeRows.length && timeRows[nextIndex].startTime < slot.endTime) {
            span++;
            nextIndex++;
         }
         
         gridData[rowIndex].cells[day] = { slot, rowSpan: span, skip: false };
         
         for (let k = 1; k < span; k++) {
            gridData[rowIndex + k].cells[day] = { skip: true };
         }
       } else {
         gridData[rowIndex].cells[day] = { slot: null, rowSpan: 1, skip: false };
       }
    });
  });

  return (
    <Box id="timetable-grid-export" sx={{ bgcolor: '#fff', p: 1 }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" id="timetable-table" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F7FF', width: 100 }}>Time</TableCell>
              {DAYS.map((d) => <TableCell key={d} align="center" sx={{ fontWeight: 700, bgcolor: '#F5F7FF', width: '18%' }}>{d}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {gridData.map((row, rowIndex) => (
              <TableRow key={row.startTime}>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', bgcolor: '#FAFBFF', whiteSpace: 'nowrap' }}>
                  {row.startTime}<br />{row.endTime}
                </TableCell>
                {row.isBreak ? (
                  <TableCell colSpan={5} align="center" sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: '0.8rem' }}>☕ Break Time</TableCell>
                ) : (
                  DAYS.map((day) => {
                    const cell = row.cells[day];
                    if (cell.skip) return null; // Skip rendering cell if spanned by previous row!

                    if (!cell.slot) {
                      return (
                         <TableCell 
                            key={day} 
                            sx={{ border: '1px dashed #E5E7EB', p: 0.75, transition: '0.2s', '&:hover': { bgcolor: '#F9FAFB' } }}
                            onDragOver={(e) => viewMode === 'Class' && e.preventDefault()}
                            onDrop={(e) => handleDrop(e, day, row.startTime)}
                          />
                      );
                    }

                    const slot = cell.slot;
                    const colors = TYPE_COLORS[slot.sessionType] || TYPE_COLORS.Theory;
                    return (
                      <TableCell 
                        key={day} 
                        rowSpan={cell.rowSpan}
                        sx={{ border: '1px solid #F0F0FF', p: 0.75, verticalAlign: 'top', transition: '0.2s', '&:hover': { opacity: 0.8 } }}
                        onDragOver={(e) => viewMode === 'Class' && e.preventDefault()}
                        onDrop={(e) => handleDrop(e, day, row.startTime)}
                      >
                        {slot.subject && (
                          <Box 
                            draggable={viewMode === 'Class'} 
                            onDragStart={(e) => handleDragStart(e, day, slot)}
                            sx={{ bgcolor: colors.bg, borderRadius: 1.5, p: 1, borderLeft: `3px solid ${colors.color}`, cursor: viewMode === 'Class' ? 'grab' : 'default', height: '100%' }}
                          >
                            <Typography variant="caption" fontWeight={800} display="block" color={colors.color}>
                              {slot.subject?.subjectCode || slot.subject}
                              {viewMode !== 'Class' && ` (${slot.parentClass?.className || 'Class'})`}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>{slot.subject?.subjectName}</Typography>
                            
                            {viewMode !== 'Faculty' && slot.faculty && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.5 }}>👨‍🏫 {slot.faculty?.fullName || slot.faculty}</Typography>}
                            {viewMode !== 'Classroom' && slot.classroom && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>🏫 R: {slot.classroom?.roomNumber || slot.classroom}</Typography>}
                            {viewMode !== 'Lab' && slot.lab && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>🔬 L: {slot.lab?.labCode || slot.lab}{slot.labPart ? ` (${slot.labPart})` : ''}</Typography>}
                            
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
    </Box>
  );
}

export default function TimetableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('Class');
  const [selectedId, setSelectedId] = useState('');

  const [entities, setEntities] = useState({ classes: [], faculties: [], classrooms: [], labs: [] });

  const loadTimetable = () => {
    api.get(`/timetable/${id}`)
      .then(({ data: r }) => {
        setTimetable(r.data);
        
        // Extract unique entities for dropdowns
        const uniqueClasses = new Map();
        const uniqueFaculties = new Map();
        const uniqueRooms = new Map();
        const uniqueLabs = new Map();

        r.data.schedule?.forEach(s => {
          if (s.class) uniqueClasses.set(s.class._id || s.class, s.class);
          s.dayWiseSchedule?.forEach(ds => {
            ds.slots?.forEach(slot => {
              if (slot.faculty) uniqueFaculties.set(slot.faculty._id || slot.faculty, slot.faculty);
              if (slot.classroom) uniqueRooms.set(slot.classroom._id || slot.classroom, slot.classroom);
              if (slot.lab) uniqueLabs.set(slot.lab._id || slot.lab, slot.lab);
            });
          });
        });

        const cls = [...uniqueClasses.values()];
        setEntities({
          classes: cls,
          faculties: [...uniqueFaculties.values()],
          classrooms: [...uniqueRooms.values()],
          labs: [...uniqueLabs.values()]
        });

        if (viewMode === 'Class' && cls.length) setSelectedId(cls[0]._id || cls[0]);
      })
      .catch(() => { toast.error('Failed to load timetable'); navigate('/timetable/view'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTimetable(); }, [id]);

  useEffect(() => {
    if (!timetable) return;
    if (viewMode === 'Class' && entities.classes.length) setSelectedId(entities.classes[0]._id || entities.classes[0]);
    if (viewMode === 'Faculty' && entities.faculties.length) setSelectedId(entities.faculties[0]._id || entities.faculties[0]);
    if (viewMode === 'Classroom' && entities.classrooms.length) setSelectedId(entities.classrooms[0]._id || entities.classrooms[0]);
    if (viewMode === 'Lab' && entities.labs.length) setSelectedId(entities.labs[0]._id || entities.labs[0]);
  }, [viewMode]);

  const handlePublish = async () => {
    try { await api.put(`/timetable/${id}/publish`); toast.success('Published!'); window.location.reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Publish failed'); }
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('timetable-grid-export');
    if (!el) return;
    toast.info('Generating PDF...');
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.text(`${timetable.timetableName} - ${viewMode} View`, 10, 10);
    pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
    pdf.save(`Timetable_${viewMode}_${selectedId}.pdf`);
    toast.success('PDF Exported');
  };

  const handleExportExcel = () => {
    const table = document.getElementById('timetable-table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: "Timetable" });
    XLSX.writeFile(wb, `Timetable_${viewMode}_${selectedId}.xlsx`);
    toast.success('Excel Exported');
  };

  const handleSwapSlot = async (classId, sourceDay, sourceIndex, targetDay, targetStartTime) => {
    if (timetable.status !== 'draft') {
      toast.warning('Only Draft timetables can be manually edited');
      return;
    }
    
    // Find target slot index
    const classSched = timetable.schedule.find(s => (s.class._id || s.class) === classId);
    if (!classSched) return;
    
    const targetDayObj = classSched.dayWiseSchedule.find(d => d.day === targetDay);
    if (!targetDayObj) return;
    
    const targetSlotIndex = targetDayObj.slots.findIndex(s => s.startTime === targetStartTime);
    const sourceDayObj = classSched.dayWiseSchedule.find(d => d.day === sourceDay);
    const sourceSlotData = sourceDayObj.slots[sourceIndex];

    try {
      if (targetSlotIndex === -1) {
        toast.error("Drop location must be an existing valid slot block.");
        return;
      }

      const targetSlotData = targetDayObj.slots[targetSlotIndex];
      
      const p1 = api.put(`/timetable/${id}/slot`, {
        classId, day: sourceDay, slotIndex: sourceIndex,
        updates: { subject: targetSlotData.subject?._id || null, faculty: targetSlotData.faculty?._id || null, classroom: targetSlotData.classroom?._id || null, lab: targetSlotData.lab?._id || null, sessionType: targetSlotData.sessionType || 'Theory' }
      });

      const p2 = api.put(`/timetable/${id}/slot`, {
        classId, day: targetDay, slotIndex: targetSlotIndex,
        updates: { subject: sourceSlotData.subject?._id || null, faculty: sourceSlotData.faculty?._id || null, classroom: sourceSlotData.classroom?._id || null, lab: sourceSlotData.lab?._id || null, sessionType: sourceSlotData.sessionType || 'Theory' }
      });

      await Promise.all([p1, p2]);
      toast.success('Slots swapped successfully!');
      loadTimetable(); // reload grid
    } catch (err) {
      toast.error('Failed to swap slots');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!timetable) return null;

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

      {timetable.conflicts?.filter((c) => !c.resolved).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography fontWeight={700}>{timetable.conflicts.filter((c) => !c.resolved).length} unresolved conflict(s)</Typography>
          {timetable.conflicts.filter((c) => !c.resolved).slice(0, 3).map((c, i) => <Typography key={i} variant="caption" display="block">• {c.description}</Typography>)}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight={700}>Interactive Grid</Typography>
              
              <ToggleButtonGroup color="primary" value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)} size="small" sx={{ bgcolor: '#fff' }}>
                <ToggleButton value="Class" sx={{ fontWeight: 600 }}>Class</ToggleButton>
                <ToggleButton value="Faculty" sx={{ fontWeight: 600 }}>Faculty</ToggleButton>
                <ToggleButton value="Classroom" sx={{ fontWeight: 600 }}>Room</ToggleButton>
                <ToggleButton value="Lab" sx={{ fontWeight: 600 }}>Lab</ToggleButton>
              </ToggleButtonGroup>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select {viewMode}</InputLabel>
                <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} label={`Select ${viewMode}`}>
                  {viewMode === 'Class' && entities.classes.map((x) => <MenuItem key={x._id || x} value={x._id || x}>{x?.className || x}</MenuItem>)}
                  {viewMode === 'Faculty' && entities.faculties.map((x) => <MenuItem key={x._id || x} value={x._id || x}>{x?.fullName || x}</MenuItem>)}
                  {viewMode === 'Classroom' && entities.classrooms.map((x) => <MenuItem key={x._id || x} value={x._id || x}>{x?.roomNumber || x}</MenuItem>)}
                  {viewMode === 'Lab' && entities.labs.map((x) => <MenuItem key={x._id || x} value={x._id || x}>{x?.labCode || x}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF} sx={{ bgcolor: '#FFF0F0', color: '#D32F2F', '&:hover': { bgcolor: '#FFD7D7' } }}>PDF</Button>
              <Button size="small" startIcon={<GridOnIcon />} onClick={handleExportExcel} sx={{ bgcolor: '#F0FFF4', color: '#1B5E20', '&:hover': { bgcolor: '#D9F5E3' } }}>Excel</Button>
            </Box>
          </Box>
          
          <Box mb={2} display="flex" gap={1} flexWrap="wrap">
            {Object.entries(TYPE_COLORS).map(([type, c]) => <Chip key={type} label={type} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: '0.7rem' }} />)}
            {viewMode === 'Class' && timetable.status === 'draft' && <Chip label="Drag & Drop Enabled" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: '0.7rem' }} />}
          </Box>

          <TimetableGrid schedule={timetable.schedule} viewMode={viewMode} selectedId={selectedId} onSwap={handleSwapSlot} />
        </CardContent>
      </Card>
    </Box>
  );
}

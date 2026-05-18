import React, { useState, useEffect, useMemo } from 'react';
import { Save, Calendar, CheckCircle, XCircle, Search, Layers, User, Plus, Edit, Trash2, FileSpreadsheet, Printer, Upload, FileText, ExternalLink, ShieldAlert, Eye, EyeOff, Flag } from 'lucide-react';

import Skeleton, { TableSkeleton } from '../UI/Skeleton';
import SaveStatusButton from '../UI/SaveStatusButton';
import Modal from '../UI/Modal';
import '../../css/panels/AttendancePanel.css';

const AttendancePanel = ({ user, data, apiService, showToast, isMobile, onTeacherDetailToggle }) => {
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({}); // { teacherId_YYYY-MM-DD: { estado, detalle } }
  const [pending, setPending] = useState({}); // Cambios sin guardar
  const [yearlyAttendance, setYearlyAttendance] = useState([]); // Asistencias de todo el año para límites
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('attendance_selectedMonth');
    return saved || new Date().toISOString().slice(0, 7);
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showWeekends, setShowWeekends] = useState(() => {
    const saved = localStorage.getItem('attendance_showWeekends');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('attendance_selectedMonth', selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem('attendance_showWeekends', JSON.stringify(showWeekends));
  }, [showWeekends]);
  
  const [suspendedDays, setSuspendedDays] = useState([]); // array of YYYY-MM-DD
  const [fechaGrabadoLocal, setFechaGrabadoLocal] = useState('');

  useEffect(() => {
    setFechaGrabadoLocal(data.config?.[`fecha_grabado_${selectedMonth}`] || '');
  }, [selectedMonth, data.config]);
  
  const [selectedTeacher, setSelectedTeacher] = useState(null); // Para Ficha del Docente
  
  useEffect(() => {
    if (onTeacherDetailToggle) {
      onTeacherDetailToggle(!!selectedTeacher);
    }
  }, [selectedTeacher, onTeacherDetailToggle]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ 
    id: null, dni: '', apellidos_nombres: '', cargo: '', 
    estado_actual: 'Activo en el cargo', codigo_cargo: '', c_hs: '', turno: '', alta_fecha: '',
    baja_fecha: '', reintegro_fecha: '', excluir_asistencia: 0, num_disposicion: '', adjunto_url: '',
    institucion_destino: '', tp_transitorias: 0, tp_horario_reducido: 0, tp_definitivas: 0, tp_concentracion: 0
  });
  const [teacherHistory, setTeacherHistory] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedHistoryYear, setSelectedHistoryYear] = useState('Todos');
  const [showJustificacionModal, setShowJustificacionModal] = useState(false);
  const [justifModalData, setJustifModalData] = useState({ codigo: '', anio: '', motivo: '' });
  const [justificaciones, setJustificaciones] = useState([]);

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    teacherHistory.forEach(h => {
      if (h.fecha) {
        const yr = h.fecha.substring(0, 4);
        if (yr) yearsSet.add(yr);
      }
    });
    yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [teacherHistory]);
  const [showLicenseInitModal, setShowLicenseInitModal] = useState(false);
  const [licenseInitForm, setLicenseInitForm] = useState({
    teacherId: '',
    codigo: '',
    startDate: '',
    endDate: '',
    contemplar: 'corridos'
  });
  const [editForm, setEditForm] = useState({});

  // Feriados y estados adicionales
  const [deactivatedHolidays, setDeactivatedHolidays] = useState([]);
  const [activeHolidayDetail, setActiveHolidayDetail] = useState(null);

  useEffect(() => {
    if (data && data.config && data.config.feriados_desactivados) {
      try {
        const loaded = JSON.parse(data.config.feriados_desactivados);
        setDeactivatedHolidays(loaded);
      } catch (e) {}
    }
  }, [data]);

  const toggleDeactivatedHoliday = async (dateStr) => {
    const newDeactivated = deactivatedHolidays.includes(dateStr)
      ? deactivatedHolidays.filter(d => d !== dateStr)
      : [...deactivatedHolidays, dateStr];
    setDeactivatedHolidays(newDeactivated);
    try {
      await apiService.fetchData('/api/data?type=config', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_setting', clave: 'feriados_desactivados', valor: JSON.stringify(newDeactivated) })
      });
      showToast('Bloqueo de feriado actualizado', 'success');
    } catch(e) {
      showToast('Error al guardar configuración de feriado', 'error');
    }
  };

  const holidaysMap = useMemo(() => {
    const map = {};
    if (data.feriados) {
      data.feriados.forEach(f => {
        map[f.fecha] = f.descripcion;
      });
    }
    return map;
  }, [data.feriados]);

  // Generate months for selector
  const monthOptions = useMemo(() => {
    const options = [];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    for (let i = 1; i <= 12; i++) {
      options.push({ id: String(i).padStart(2, '0'), name: months[i - 1] });
    }
    return options;
  }, []);

  const years = useMemo(() => {
    if (data.years && data.years.length > 0) {
      return data.years.map(y => y.anio).sort((a, b) => b.localeCompare(a));
    }
    return ['2025', '2026', '2027'];
  }, [data.years]);

  const currentYear = selectedMonth.split('-')[0];
  const currentMonthId = selectedMonth.split('-')[1];

  const getDaysInMonth = (year, month) => {
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      const dayNames = ['DOM', 'LU', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
      const dayName = dayNames[date.getDay()];
      return { day: i + 1, date: date.toISOString().slice(0, 10), isWeekend: date.getDay() === 0 || date.getDay() === 6, dayName };
    });
  };

  const days = useMemo(() => getDaysInMonth(currentYear, parseInt(currentMonthId)), [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar docentes
      const tRes = await apiService.fetchData('/api/teachers?type=list');
      setTeachers(tRes || []);

      // 2. Cargar asistencias del mes
      const attRes = await apiService.fetchData(`/api/teachers?type=attendance_month&month=${selectedMonth}`);
      const attMap = {};
      (attRes || []).forEach(row => {
        attMap[`${row.docente_id}_${row.fecha}`] = { estado: row.estado, detalle: row.detalle };
      });
      setAttendance(attMap);
      setPending({});

      // 3. Cargar asistencias del año
      const yearAttRes = await apiService.fetchData(`/api/teachers?type=attendance_year&year=${currentYear}`);
      setYearlyAttendance(yearAttRes || []);

      // 4. Cargar justificaciones globales
      const justifRes = await apiService.fetchData('/api/teachers?type=justificaciones');
      setJustificaciones(justifRes || []);
    } catch (err) {
      showToast('Error cargando datos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  useEffect(() => {
    if (data && data.config && data.config.dias_suspendidos) {
      try {
        const loaded = JSON.parse(data.config.dias_suspendidos);
        // Asegurar que los fines de semana del mes actual estén marcados si no se han cargado antes
        setSuspendedDays(loaded);
      } catch (e) {}
    }
  }, [data]);

  // Efecto para auto-marcar fines de semana cuando cambia el mes si es necesario
  useEffect(() => {
    if (!loading && days.length > 0) {
      const weekends = days.filter(d => d.isWeekend).map(d => d.date);
      const missingWeekends = weekends.filter(w => !suspendedDays.includes(w));
      
      // Solo si el usuario no los desmarcó explícitamente? 
      // Complicado saber si fueron desmarcados o nunca marcados.
      // Pero el usuario dice "automáticamente ya con la casilla activada".
      // Vamos a asumir que si entramos a un mes nuevo, los fines de semana se agregan.
      if (missingWeekends.length > 0) {
        const newSuspended = [...suspendedDays, ...missingWeekends];
        setSuspendedDays(newSuspended);
        // No guardamos automáticamente para no saturar, se guardará al interactuar o podemos guardarlo
      }
    }
  }, [selectedMonth, loading]);
  
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherHistory(selectedTeacher.id);
      setIsEditingProfile(false);
      setEditForm({ ...selectedTeacher });
      setSelectedHistoryYear('Todos');
    } else {
      setTeacherHistory([]);
      setJustificaciones([]);
      setExpandedCategories({});
      setIsEditingProfile(false);
      setSelectedHistoryYear('Todos');
    }
  }, [selectedTeacher]);

  const handleBackToList = () => {
    setSelectedTeacher(null);
    setIsEditingProfile(false);
  };

  const loadTeacherHistory = async (docenteId) => {
    try {
      setLoadingHistory(true);
      const [resHistory, resJustif] = await Promise.all([
        apiService.fetchData(`/api/teachers?type=attendance&docenteId=${docenteId}`),
        apiService.fetchData('/api/teachers?type=justificaciones')
      ]);
      setTeacherHistory(resHistory || []);
      setJustificaciones(resJustif || []);
    } catch (e) {
      showToast('Error al cargar historial', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openJustificacionModal = (codigo, anio, motivo) => {
    setJustifModalData({ codigo, anio, motivo });
    setShowJustificacionModal(true);
  };

  const handleSaveJustificacion = async () => {
    if (!justifModalData.motivo.trim()) {
      showToast('Por favor ingrese el motivo de la justificación', 'warning');
      return;
    }
    try {
      await apiService.fetchData('/api/teachers?action=save_justificacion', {
        method: 'POST',
        body: JSON.stringify({
          docente_id: selectedTeacher.id,
          codigo_licencia: justifModalData.codigo,
          anio: justifModalData.anio,
          motivo: justifModalData.motivo
        })
      });
      showToast('Licencia justificada correctamente. Situación regularizada.', 'success');
      setShowJustificacionModal(false);
      loadTeacherHistory(selectedTeacher.id);
      loadData();
    } catch (e) {
      showToast('Error al guardar la justificación', 'error');
    }
  };

  const getAttendanceSummary = () => {
    const summary = {};
    // Agrupar por código y filtrar por año
    const filtered = teacherHistory.filter(h => {
      const matchesYear = selectedHistoryYear === 'Todos' || (h.fecha && h.fecha.startsWith(selectedHistoryYear + '-'));
      return h.estado && h.estado !== 'A' && matchesYear;
    });
    // Ordenar por fecha ASC para detectar rangos
    const sorted = [...filtered].sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    const ranges = [];
    let currentRange = null;

    sorted.forEach(record => {
      if (currentRange && currentRange.estado === record.estado) {
        const lastDate = new Date(currentRange.endDate);
        const nextDate = new Date(record.fecha);
        const diff = (nextDate - lastDate) / (1000 * 60 * 60 * 24);
        
        if (diff <= 1) { // Día consecutivo (o el mismo día si hay error)
          currentRange.endDate = record.fecha;
          currentRange.count++;
          return;
        }
      }
      
      currentRange = {
        estado: record.estado,
        startDate: record.fecha,
        endDate: record.fecha,
        count: 1
      };
      ranges.push(currentRange);
    });

    // Agrupar rangos por categoría
    ranges.forEach(r => {
      if (!summary[r.estado]) summary[r.estado] = [];
      summary[r.estado].push(r);
    });

    return summary;
  };

  const getStatusDescription = (teacher) => {
    if (teacher.estado_actual === 'Relevado de Funciones') {
      return `RELEVADO DE FUNCIONES - ${teacher.institucion_destino || 'SIN DESTINO'}`;
    }
    if (teacher.estado_actual === 'Tareas Pasivas') {
      let parts = [];
      if (teacher.tp_transitorias) parts.push('TRANSITORIAS');
      if (teacher.tp_horario_reducido) parts.push('REDUCCION HORARIA');
      
      let base = `TAREAS PASIVAS ${teacher.tp_definitivas ? 'DEFINITIVAS' : ''}`.trim();
      
      let others = '';
      if (parts.length > 0) {
        others = parts.join(' Y ');
      }
      
      if (teacher.tp_concentracion) {
        const ch = `C.H. (${teacher.institucion_destino || 'SIN DESTINO'})`;
        others = others ? `${others} Y ${ch}` : ch;
      }
      
      return others ? `${base} - ${others}` : base;
    }
    return '';
  };

  const getBadgeStatusStyle = (teacher) => {
    if (!teacher) return {};
    const estado = teacher.estado_actual || '';
    
    if (estado.includes('Tareas Pasivas')) {
      return { background: '#ffedd5', color: '#9a3412', border: '1px solid rgba(154, 52, 18, 0.2)' };
    }
    if (estado === 'Baja y Reintegro') {
      return { background: '#fef9c3', color: '#854d0e', border: '1px solid rgba(133, 77, 14, 0.2)' };
    }
    if (estado === 'Baja') {
      return { background: 'rgba(75, 133, 211, 0.15)', color: '#4b85d3', border: '1px solid rgba(75, 133, 211, 0.3)' };
    }
    if (estado === 'Relevado de Funciones') {
      return { background: '#fee2e2', color: '#991b1b', border: '1px solid rgba(153, 27, 27, 0.2)' };
    }
    // Activo en el cargo
    return { background: '#dcfce7', color: '#166534', border: '1px solid rgba(22, 101, 52, 0.2)' };
  };

  const getBadgeStatusText = (teacher) => {
    if (!teacher) return '';
    if (teacher.estado_actual === 'Tareas Pasivas') {
      let parts = [];
      if (teacher.tp_definitivas === 1 || teacher.tp_definitivas === true) parts.push('Definitivas');
      if (teacher.tp_transitorias === 1 || teacher.tp_transitorias === true) parts.push('Transitorias');
      if (teacher.tp_horario_reducido === 1 || teacher.tp_horario_reducido === true) parts.push('Reducción Horaria');
      if (teacher.tp_concentracion === 1 || teacher.tp_concentracion === true) {
        parts.push(`Concentración Horaria${teacher.institucion_destino ? `: ${teacher.institucion_destino}` : ''}`);
      }
      return parts.length > 0 ? `Tareas Pasivas (${parts.join(' - ')})` : 'Tareas Pasivas';
    }
    if (teacher.estado_actual === 'Relevado de Funciones') {
      return `Relevado de Funciones${teacher.institucion_destino ? ` - ${teacher.institucion_destino}` : ''}`;
    }
    return teacher.estado_actual;
  };

  const getExceededLicenses = (teacherId) => {
    if (!data.licencias || !yearlyAttendance.length) return [];
    
    // Contar días por licencia para este docente en el año actual
    const counts = {};
    yearlyAttendance.filter(a => a.docente_id === teacherId).forEach(a => {
      counts[a.estado] = (counts[a.estado] || 0) + 1;
    });

    // Comparar con límites
    const exceeded = [];
    data.licencias.forEach(lic => {
      const hasJustif = justificaciones.some(j => j.docente_id === teacherId && j.codigo_licencia === lic.codigo && j.anio === currentYear);
      
      if (lic.limite_dias && counts[lic.codigo] > lic.limite_dias && !hasJustif) {
        exceeded.push({ 
          codigo: lic.codigo, 
          nombre: lic.descripcion, 
          limite: lic.limite_dias, 
          actual: counts[lic.codigo] 
        });
      }
    });
    return exceeded;
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleBulkLicense = () => {
    const { teacherId, codigo, startDate, endDate, contemplar } = licenseInitForm;
    if (!teacherId || !codigo || !startDate || !endDate) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const newPending = { ...pending };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isSuspended = suspendedDays.includes(dateStr);

      if (contemplar === 'habiles') {
        if (isWeekend || isSuspended) continue;
      }
      
      newPending[`${teacherId}_${dateStr}`] = { estado: codigo, detalle: '' };
    }

    setPending(newPending);
    setShowLicenseInitModal(false);
    showToast('Licencia proyectada en la grilla. Recuerda Guardar Cambios.', 'success');
  };

  const handlePrintWindow = () => {
    const monthName = monthOptions.find(m => m.id === currentMonthId)?.name.toUpperCase();
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    const instNombre = data.config?.inst_nombre || 'EPP N° 33 "Comisario Insp. Victoriano E. Taret"';
    const instCodigo = data.config?.inst_codigo || '233';
    const instLocalidad = data.config?.inst_localidad || 'Rio Gallegos';
    const instDirector = data.config?.inst_director || 'Terron. Maria Alicia';
    const fechaGrabado = data.config?.[`fecha_grabado_${selectedMonth}`] || '';

    const teacherCount = filteredTeachers.length;
    
    // Scaling system based on number of teachers
    let fontSizeTable = '6.5pt';
    let cellPadding = '1px 1px';
    let cellHeight = '15px';
    let headerHeight = '80px';
    let footerMargin = '2rem';
    let referencesSize = '5.5pt';
    let importantSize = '6pt';
    let signatureHeight = '42px';
    let marginTopReferences = '0.8rem';
    let titleMargin = '0.5rem';
    let fontSizeLabels = '7.5pt';
    let fontSizeDate = '8.5pt';

    if (teacherCount <= 12) {
      fontSizeTable = '8.5pt';
      cellPadding = '4px 3px';
      cellHeight = '24px';
      headerHeight = '90px';
      footerMargin = '4rem';
      referencesSize = '7pt';
      importantSize = '7.5pt';
      signatureHeight = '55px';
      marginTopReferences = '2rem';
      titleMargin = '1.2rem';
      fontSizeLabels = '9.5pt';
      fontSizeDate = '10.5pt';
    } else if (teacherCount <= 20) {
      fontSizeTable = '7.5pt';
      cellPadding = '2px 2px';
      cellHeight = '18px';
      headerHeight = '85px';
      footerMargin = '3rem';
      referencesSize = '6.5pt';
      importantSize = '7pt';
      signatureHeight = '48px';
      marginTopReferences = '1.5rem';
      titleMargin = '1rem';
      fontSizeLabels = '8.5pt';
      fontSizeDate = '9.5pt';
    } else if (teacherCount <= 35) {
      fontSizeTable = '6.5pt';
      cellPadding = '1.5px 1px';
      cellHeight = '14px';
      headerHeight = '70px';
      footerMargin = '2rem';
      referencesSize = '5.5pt';
      importantSize = '6pt';
      signatureHeight = '40px';
      marginTopReferences = '1rem';
      titleMargin = '0.6rem';
      fontSizeLabels = '7.5pt';
      fontSizeDate = '8.5pt';
    } else if (teacherCount <= 50) {
      fontSizeTable = '5pt';
      cellPadding = '0.5px 0.5px';
      cellHeight = '10.5px';
      headerHeight = '55px';
      footerMargin = '1.2rem';
      referencesSize = '4.8pt';
      importantSize = '5.2pt';
      signatureHeight = '32px';
      marginTopReferences = '0.6rem';
      titleMargin = '0.4rem';
      fontSizeLabels = '6pt';
      fontSizeDate = '7pt';
    } else {
      // 50+ teachers, extremely dense to fit on a single A4 page
      fontSizeTable = '4pt';
      cellPadding = '0px';
      cellHeight = '8.5px';
      headerHeight = '42px';
      footerMargin = '0.5rem';
      referencesSize = '4pt';
      importantSize = '4.2pt';
      signatureHeight = '24px';
      marginTopReferences = '0.4rem';
      titleMargin = '0.2rem';
      fontSizeLabels = '5pt';
      fontSizeDate = '6pt';
    }

    const htmlContent = `
      <html>
        <head>
          <title>Asistencia Docente - ${monthName}</title>
          <style>
            @page { size: landscape; margin: 0.2cm; }
            body { 
              font-family: 'Arial Narrow', sans-serif; 
              margin: 0; 
              padding: 0.2cm; 
              background: #f0f0f0; 
              display: flex; 
              flex-direction: column; 
              align-items: center;
              color: black;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .paper {
              background: white;
              width: 293mm;
              padding: 10px;
              box-sizing: border-box;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              min-height: 205mm;
            }
            .header-top { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: ${titleMargin};
              width: 100%;
            }
            .header-top h1 { font-size: 1.3rem; margin: 0; text-align: left; }
            .header-top img { height: 50px; width: auto; object-fit: contain; }
            
            .info-box { 
              display: flex; 
              padding: 0; 
              margin-top: 0.5rem; 
              font-size: 0.85rem; 
              text-align: left;
            }
            .info-col { padding: 5px 10px; flex: 1; }
            
            table { width: 100%; border-collapse: collapse; font-size: ${fontSizeTable}; border: 1.5px solid black; margin-top: 0.3rem; table-layout: fixed; }
            th, td { 
              border: 1px solid black !important; 
              padding: ${cellPadding} !important; 
              text-align: center; 
              word-break: break-all;
              height: ${cellHeight};
              color: black;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th { background: #f0f0f0 !important; font-weight: bold; vertical-align: bottom; }
            
            .col-n { width: 22px; }
            .col-dni { width: 60px; }
            .col-name { width: 140px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 3px; }
            .col-cargo { width: 45px; }
            .col-chs { width: 45px; }
            .col-espacio { width: 75px; }
            .col-turno { width: 32px; }
            .col-day { width: 19px; }
            .col-day.suspended { background-color: rgb(106, 189, 255) !important; }
            .col-total { width: 38px; }
            .wrap-text {
              white-space: normal !important;
              word-break: normal !important;
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              line-height: 1 !important;
              padding: 1px 2px !important;
            }
            
            .vertical-text { 
              writing-mode: vertical-rl; 
              transform: rotate(180deg); 
              text-align: center; 
              white-space: nowrap;
              font-size: ${fontSizeTable};
              line-height: 1;
              max-height: 100%;
            }
            .ui-vertical-header { height: ${headerHeight}; }
            @media print { 
              body { background: white; padding: 0; }
              .paper { box-shadow: none; width: 100%; padding: 0; margin: 0; }
              .no-print { display: none; } 
            }
            .btn-print { 
              position: fixed; bottom: 20px; right: 20px;
              background: #0078d7; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .footer-info { margin-top: 2rem; display: flex; justify-content: flex-end; font-size: 0.8rem; }
          </style>
        </head>
        <body>
          <div class="paper">
            <div class="header-top">
              <h1>PLANILLA MENSUAL DE ASISTENCIAS/INASISTENCIAS</h1>
              <img src="/logo santa cruz.jpg" alt="Logo Santa Cruz" />
            </div>
            
            <div class="info-box">
              <div class="info-col" style="flex: 2;">
                <div><strong>ESTABLECIMIENTO:</strong> ${instNombre}</div>
                <div style="margin-top: 4px;"><strong>DIRECTOR/A:</strong> ${instDirector}</div>
              </div>
              <div class="info-col">
                <div><strong>MES:</strong> ${monthName}</div>
                <div style="margin-top: 4px;"><strong>AÑO:</strong> ${currentYear}</div>
              </div>
              <div class="info-col">
                <div><strong>LOCALIDAD:</strong> ${instLocalidad}</div>
                <div style="margin-top: 4px; font-weight: bold; font-size: 0.9rem; text-align: left;">${instCodigo}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="col-n" rowspan="2">N°</th>
                  <th class="col-dni" rowspan="2">Documento</th>
                  <th class="col-name" rowspan="2">Apellido y Nombres</th>
                  <th class="col-cargo wrap-text" rowspan="2">Codigo del Cargo/Horas</th>
                  <th class="col-chs" rowspan="2">C/HS</th>
                  <th class="col-espacio wrap-text" rowspan="2" style="padding: 0 !important; vertical-align: bottom !important; font-weight: bold; background: #f0f0f0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    <div style="background-color: #f0f0f0 !important; padding: 3px 0; font-size: 6.5pt; font-weight: bold; line-height: 1.1; border-bottom: 1px solid black; color: black !important; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Cargo/ Espacios Curriculares</div>
                    <div style="background-color: #fef9c3 !important; color: #854d0e !important; padding: 2px 0; font-size: 5pt; font-weight: bold; border-bottom: 1px solid black; text-transform: uppercase; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Baja y Reintegro</div>
                    <div style="background-color: rgb(75, 133, 211) !important; color: white !important; padding: 2px 0; font-size: 5pt; font-weight: bold; text-transform: uppercase; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Baja</div>
                  </th>
                  <th class="col-turno" rowspan="2">Turno</th>
                  <th colspan="${days.length}">${monthName}</th>
                  <th colspan="4">Totales</th>
                </tr>
                <tr>
                  ${days.map(d => {
                    const isSuspended = suspendedDays.includes(d.date);
                    const holidayName = holidaysMap[d.date];
                    const isHoliday = !!holidayName;
                    const isHolidayActive = isHoliday && !deactivatedHolidays.includes(d.date);
                    
                    let cellStyle = '';
                    if (isSuspended) {
                      cellStyle = 'background-color: rgb(106, 189, 255) !important;';
                    } else if (isHolidayActive) {
                      cellStyle = 'background-color: #fecaca !important; color: #dc2626 !important;';
                    }
                    
                    return `<th class="col-day" style="${cellStyle}">${d.day}</th>`;
                  }).join('')}
                  <th class="col-total vertical-text ui-vertical-header">Total Oblig.</th>
                  <th class="col-total vertical-text ui-vertical-header">Total Días Asis.</th>
                  <th class="col-total vertical-text ui-vertical-header">Oblig. a Deducir</th>
                  <th class="col-total vertical-text ui-vertical-header">Días a Deducir</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTeachers.map((t, i) => {
                  const statusEspecial = getStatusDescription(t);
                  
                  let cargoCellStyle = 'text-align: left; padding-left: 3px;';
                  let statusTextColor = '#dc2626'; // Default red
                  
                  const isReintegroMonth = t.estado_actual === 'Baja y Reintegro' && (!t.reintegro_fecha || t.reintegro_fecha.slice(0, 7) === selectedMonth);
                  const isBajaMonth = t.estado_actual === 'Baja' && (!t.baja_fecha || t.baja_fecha.slice(0, 7) === selectedMonth);
                  
                  if (isReintegroMonth) {
                    cargoCellStyle += ' background-color: #fef9c3 !important; color: #854d0e !important;';
                    statusTextColor = '#854d0e';
                  } else if (isBajaMonth) {
                    cargoCellStyle += ' background-color: rgb(75, 133, 211) !important; color: white !important;';
                    statusTextColor = 'white';
                  }
                  
                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${t.dni}</td>
                    <td class="col-name">${t.apellidos_nombres}</td>
                    <td class="wrap-text">${t.codigo_cargo || ''}</td>
                    <td>${t.c_hs || ''}</td>
                    <td class="wrap-text" style="${cargoCellStyle}">
                      ${t.cargo || ''}
                      ${statusEspecial ? `<div style="font-size: 5pt; color: ${statusTextColor}; font-weight: bold; line-height: 1; margin-top: 2px; text-transform: uppercase;">${statusEspecial}</div>` : ''}
                    </td>
                    <td>${t.turno || ''}</td>
                    ${days.map(d => {
                      const isSuspended = suspendedDays.includes(d.date);
                      const holidayName = holidaysMap[d.date];
                      const isHoliday = !!holidayName;
                      const isHolidayActive = isHoliday && !deactivatedHolidays.includes(d.date);
                      
                      const val = isHolidayActive ? 'FE' : getEffectiveAttendance(t, d.date);
                      
                      let cellContent = val || '';
                      let cellStyle = '';
                      
                      if (val && val !== '') {
                        const valTrimmed = val.trim();
                        const len = valTrimmed.length;
                        
                        if (t.estado_actual === 'Tareas Pasivas' && t.tp_concentracion) {
                          cellContent = `<div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10pt; font-weight: bold; line-height: 1.1; margin: 0 auto; display: flex; align-items: center; justify-content: center; white-space: nowrap; padding: 2px 0;">${valTrimmed}</div>`;
                          cellStyle = 'padding: 0 !important;';
                        } else if (len === 2 && valTrimmed === 'FE') {
                          cellContent = `<div style="font-size: 7.5pt; font-weight: bold; color: #dc2626;">FE</div>`;
                        } else if (len === 3) {
                          // 3 characters -> fit horizontally in a single line
                          cellContent = `<div style="font-size: 7pt; letter-spacing: -0.4px; white-space: nowrap; word-break: keep-all; display: inline-block; font-weight: bold; line-height: 1;">${valTrimmed}</div>`;
                        } else if (len > 3) {
                          // More than 3 characters -> vertical text format
                          cellContent = `<div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10pt; font-weight: bold; line-height: 1.1; margin: 0 auto; display: flex; align-items: center; justify-content: center; letter-spacing: -0.2px; white-space: nowrap; padding: 2px 0;">${valTrimmed}</div>`;
                          cellStyle = 'padding: 0 !important;';
                        }
                      }
                      
                      let bgStyle = '';
                      if (isSuspended) {
                        bgStyle = 'background-color: rgb(106, 189, 255) !important;';
                      } else if (isHolidayActive) {
                        bgStyle = 'background-color: #fee2e2 !important;';
                      }
                      
                      return `
                        <td style="${bgStyle} ${cellStyle}">
                          ${cellContent}
                        </td>`;
                    }).join('')}
                    <td style="background-color: rgb(106, 189, 255) !important;"></td>
                    <td style="background-color: rgb(106, 189, 255) !important;"></td>
                    <td style="background-color: rgb(106, 189, 255) !important;"></td>
                    <td style="background-color: rgb(106, 189, 255) !important;"></td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
            <div class="footer-info" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: ${footerMargin}; width: 100%;">
              <!-- Secretario (Extremo izquierdo) -->
              <div style="display: flex; flex-direction: column; align-items: center; width: 220px; text-align: center;">
                <div style="height: ${signatureHeight};"></div>
                <div style="border-top: 1.5px solid black; width: 100%; font-size: ${fontSizeLabels}; font-weight: bold; padding-top: 2px;">
                  Secretario
                </div>
              </div>
              
              <!-- Firma digital (Centro) -->
              <div style="display: flex; flex-direction: column; align-items: center; width: 220px; text-align: center;">
                <img src="/Firma.png" alt="Firma" style="height: ${signatureHeight}; width: auto; object-fit: contain; z-index: 10; mix-blend-mode: multiply;" />
                <div style="width: 100%; font-size: ${fontSizeLabels}; font-weight: bold; padding-top: 2px; visibility: hidden; user-select: none;">
                  Secretario
                </div>
              </div>
              
              <!-- Fecha de Grabado (Extremo derecho) -->
              <div style="display: flex; flex-direction: column; align-items: center; width: 220px; text-align: center;">
                <div style="font-size: ${fontSizeDate}; font-weight: bold; margin-bottom: 5px; height: 16px;">
                  ${fechaGrabado || ''}
                </div>
                <div style="border-top: 1.5px solid black; width: 100%; font-size: ${fontSizeLabels}; font-weight: bold; padding-top: 2px;">
                  Fecha de Grabado
                </div>
              </div>
            </div>

            <!-- Referencias de Abreviaturas y Notas Importantes -->
            <div style="margin-top: ${marginTopReferences}; border-top: 1px solid #ccc; padding-top: 6px; font-size: ${referencesSize}; text-align: left; line-height: 1.25; color: black !important; font-family: 'Arial Narrow', Arial, sans-serif; width: 100%;">
              <div style="margin-bottom: 3px;">
                <strong>Referencias de Abreviaturas:</strong> <strong>A:</strong> Asistió - <strong>L (8) L (10) L (11) L (12) L (18) L (20) L(22) L (23) L (24) L (25) L (27) L (28) L (30) L(1117)</strong> (Según sea Art. Nº 8, 10, 11, etc). <strong>EC</strong> (Enfermedades Crónicas) - <strong>PP:</strong> Paro Provincial - <strong>PN:</strong> Paro Nacional - <strong>RS:</strong> Retención de Servicios.
              </div>
              <div style="margin-bottom: 5px;">
                <strong>CS:</strong> Comisión de Servicios - <strong>LCMJ:</strong> Licencia Cargo Mayor Jerarquía - Rellenar con color y/o negro los campos donde se haya suspendido la Actividad Escolar al igual que los Domingos y/o Feriados Nacionales y/o Provinciales.
              </div>
              
              <div style="margin-top: 4px; padding: 4px 0; font-size: ${importantSize};">
                <div style="margin-bottom: 2px;">
                  <strong>IMPORTANTE:</strong> <span style="background-color: #ffff00; font-weight: bold; padding: 0 4px;">TODOS LOS CAMPOS DEBEN VENIR COMPLETOS. <span style="color: #ff0000;">NO MODIFICAR LA PLANILLA.</span></span> LA MISMA DEBERÁ SER ENVIADA DEL 1 AL 5 DE CADA MES CON LA FIRMA DEL DIRECTIVO A CARGO Y SECRETARIO.
                </div>
                <div style="background-color: #ffff00; font-weight: bold; display: inline-block; padding: 0 4px;">
                  EL DÍA 5 DE CADA MES SE CONSIDERA FECHA LÍMITE
                </div>
              </div>
            </div>
          </div>
          <button class="btn-print no-print" onclick="window.print()">Imprimir Planilla</button>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const toggleSuspendedDay = async (dateStr) => {
    const newDays = suspendedDays.includes(dateStr)
      ? suspendedDays.filter(d => d !== dateStr)
      : [...suspendedDays, dateStr];
    setSuspendedDays(newDays);
    try {
      await apiService.fetchData('/api/data?type=config', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_suspended_days', days: JSON.stringify(newDays) })
      });
      showToast('Calendario actualizado', 'success');
    } catch(e) {
      showToast('Error al guardar', 'error');
    }
  };

  const saveFechaGrabado = async (value) => {
    try {
      if (data.config) {
        data.config[`fecha_grabado_${selectedMonth}`] = value;
      }
      await apiService.fetchData('/api/data?type=config', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_setting', clave: `fecha_grabado_${selectedMonth}`, valor: value })
      });
      showToast('Fecha de grabado guardada', 'success');
    } catch(err) {
      showToast('Error al guardar fecha de grabado', 'error');
    }
  };

  const handleDniChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.substring(0, 8);
    let formatted = v;
    if (v.length > 5) {
      formatted = `${v.substring(0,2)}.${v.substring(2,5)}.${v.substring(5)}`;
    } else if (v.length > 2) {
      formatted = `${v.substring(0,2)}.${v.substring(2)}`;
    }
    setTeacherForm(prev => ({ ...prev, dni: formatted }));
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    if (!teacherForm.dni || !teacherForm.apellidos_nombres) {
      return showToast('DNI y Nombre son obligatorios', 'error');
    }
    if (!teacherForm.alta_fecha) {
      return showToast('La Fecha de Alta es obligatoria', 'error');
    }
    if (teacherForm.estado_actual === 'Baja' && !teacherForm.baja_fecha) {
      return showToast('La Fecha de Baja es obligatoria para el estado "Baja"', 'error');
    }
    if (teacherForm.estado_actual === 'Baja y Reintegro' && !teacherForm.reintegro_fecha) {
      return showToast('La Fecha de Reintegro es obligatoria para el estado "Baja y Reintegro"', 'error');
    }
    try {
      const action = teacherForm.id ? 'update_teacher' : 'create_teacher';
      await apiService.fetchData(`/api/teachers?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(teacherForm)
      });
      showToast('Docente guardado correctamente', 'success');
      setShowTeacherForm(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('¿Eliminar este docente y todo su historial de asistencia?')) return;
    try {
      await apiService.fetchData(`/api/teachers?action=delete_teacher`, {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      showToast('Docente eliminado', 'success');
      loadData();
    } catch(err) {
      showToast(err.message, 'error');
    }
  };

  const licencias = data.licencias || [];
  const allowedCodes = useMemo(() => licencias.map(l => l.codigo), [licencias]);

  const handleAttendanceChange = (teacherId, date, value) => {
    const upperVal = value.trim().toUpperCase();
    const key = `${teacherId}_${date}`;
    
    if (upperVal === '') {
      setPending(prev => ({
        ...prev,
        [key]: { estado: '', detalle: '' }
      }));
      return;
    }

    setPending(prev => ({
      ...prev,
      [key]: { estado: upperVal, detalle: '' }
    }));
  };

  const getEffectiveAttendance = (teacher, date) => {
    const key = `${teacher.id}_${date}`;
    if (teacher.estado_actual === 'Relevado de Funciones') return 'R/F';
    if (teacher.estado_actual === 'Tareas Pasivas' && teacher.tp_concentracion) return teacher.institucion_destino || 'C.H.';
    return pending[key]?.estado ?? attendance[key]?.estado ?? '';
  };

  const handleBlur = (teacherId, date, value) => {
    const trimmed = value.trim().toUpperCase();
    if (trimmed === '' || allowedCodes.includes(trimmed)) return;
    
    showToast(`Código "${trimmed}" no reconocido.`, 'warning');
    setPending(prev => {
      const next = { ...prev };
      delete next[`${teacherId}_${date}`];
      return next;
    });
  };

  const saveAttendance = async () => {
    if (Object.keys(pending).length === 0) return;
    try {
      const promises = Object.entries(pending).map(([key, data]) => {
        const [teacherId, date] = key.split('_');
        return apiService.fetchData('/api/teachers?action=record_attendance', {
          method: 'POST',
          body: JSON.stringify({
            docente_id: parseInt(teacherId),
            fecha: date,
            estado: data.estado,
            detalle: data.detalle
          })
        });
      });
      await Promise.all(promises);
      showToast('Asistencias guardadas', 'success');
      
      // Actualizar estados locales incluyendo yearlyAttendance para advertencias inmediatas
      const newAttendance = { ...attendance };
      const newYearly = [...yearlyAttendance];
      
      Object.entries(pending).forEach(([key, val]) => {
        const [tid, date] = key.split('_');
        const teacherId = parseInt(tid);
        
        // Actualizar yearlyAttendance
        const existingIdx = newYearly.findIndex(a => a.docente_id === teacherId && a.fecha === date);
        if (existingIdx > -1) {
          if (val.estado === '') newYearly.splice(existingIdx, 1);
          else newYearly[existingIdx].estado = val.estado;
        } else if (val.estado !== '') {
          newYearly.push({ docente_id: teacherId, fecha: date, estado: val.estado });
        }

        // Actualizar attendance del mes
        if (val.estado === '') delete newAttendance[key];
        else newAttendance[key] = val;
      });
      
      setAttendance(newAttendance);
      setYearlyAttendance(newYearly);
      setPending({});
    } catch (error) {
      showToast('Error al guardar asistencia', 'error');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.apellidos_nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.dni.includes(searchTerm);
    
    if (!matchesSearch) return false;

    // A) FECHA DE ALTA (alta_fecha)
    // El docente solo debe aparecer en el listado a partir del año y mes de su alta.
    if (t.alta_fecha) {
      const altaYM = t.alta_fecha.substring(0, 7); // Formato YYYY-MM
      if (selectedMonth < altaYM) return false;
    }

    // B) FECHA DE BAJA (baja_fecha)
    // El docente se mantiene en el listado por el mes de su baja, pero al mes siguiente desaparece.
    if (t.baja_fecha && t.estado_actual === 'Baja') {
      const bajaYM = t.baja_fecha.substring(0, 7); // Formato YYYY-MM
      if (selectedMonth > bajaYM) return false;
    }

    return true;
  });

  return (
    <section className="page-section">
      {showTeacherForm && (
        <Modal title={teacherForm.id ? "Editar Docente" : "Nuevo Docente"} onClose={() => setShowTeacherForm(false)}>
          <form className="stack-form" onSubmit={handleTeacherSubmit}>
            <label>Apellidos y Nombres *
              <input type="text" className="input-field" value={teacherForm.apellidos_nombres} onChange={e => setTeacherForm({...teacherForm, apellidos_nombres: e.target.value})} required />
            </label>
            <label>DNI *
              <input type="text" className="input-field" value={teacherForm.dni} onChange={handleDniChange} placeholder="XX.XXX.XXX" required />
            </label>
            <label>Estado Actual
              <select className="input-field" value={teacherForm.estado_actual} onChange={e => {
                const nextState = e.target.value;
                const updates = { estado_actual: nextState };
                if (nextState !== 'Baja') {
                  updates.baja_fecha = '';
                  updates.excluir_asistencia = 0;
                }
                if (nextState !== 'Baja y Reintegro') {
                  updates.reintegro_fecha = '';
                }
                if (nextState !== 'Tareas Pasivas') {
                  updates.tp_transitorias = 0;
                  updates.tp_horario_reducido = 0;
                  updates.tp_definitivas = 0;
                  updates.tp_concentracion = 0;
                  updates.c_hs_reducidas = '';
                }
                if (nextState !== 'Relevado de Funciones' && nextState !== 'Tareas Pasivas') {
                  updates.institucion_destino = '';
                }
                setTeacherForm({ ...teacherForm, ...updates });
              }}>
                <option value="Activo en el cargo">Activo en el cargo</option>
                <option value="Baja y Reintegro">Baja y Reintegro</option>
                <option value="Baja">Baja</option>
                <option value="Relevado de Funciones">Relevado de Funciones</option>
                <option value="Tareas Pasivas">Tareas Pasivas</option>
              </select>
            </label>
            <label>Código del Cargo/Horas
              <input type="text" className="input-field" value={teacherForm.codigo_cargo} onChange={e => setTeacherForm({...teacherForm, codigo_cargo: e.target.value})} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: teacherForm.tp_horario_reducido === 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
              <label>C/ HS
                <input type="text" className="input-field" value={teacherForm.c_hs} onChange={e => setTeacherForm({...teacherForm, c_hs: e.target.value})} />
              </label>
              {teacherForm.tp_horario_reducido === 1 && (
                <label>C/ HS (Reducidas)
                  <input type="text" className="input-field" value={teacherForm.c_hs_reducidas || ''} onChange={e => setTeacherForm({...teacherForm, c_hs_reducidas: e.target.value})} />
                </label>
              )}
            </div>
            <label>Cargo / Espacio Curricular
              <input type="text" className="input-field" value={teacherForm.cargo} onChange={e => setTeacherForm({...teacherForm, cargo: e.target.value})} />
            </label>
            <label>Turno
              <select className="input-field" value={teacherForm.turno} onChange={e => setTeacherForm({...teacherForm, turno: e.target.value})}>
                <option value="">Seleccionar...</option>
                <option value="M">M (Mañana)</option>
                <option value="T">T (Tarde)</option>
                <option value="M/T">M/T (Doble Turno)</option>
              </select>
            </label>
            <label>N° de Disposición
              <input type="text" className="input-field" value={teacherForm.num_disposicion} onChange={e => setTeacherForm({...teacherForm, num_disposicion: e.target.value})} />
            </label>
            <label>Fecha de Alta *
              <input type="date" lang="es" className="input-field" value={teacherForm.alta_fecha} onChange={e => setTeacherForm({...teacherForm, alta_fecha: e.target.value})} required />
            </label>
            {teacherForm.estado_actual === 'Baja y Reintegro' && (
              <label>Fecha de Reintegro *
                <input type="date" lang="es" className="input-field" value={teacherForm.reintegro_fecha} onChange={e => setTeacherForm({...teacherForm, reintegro_fecha: e.target.value})} required />
              </label>
            )}
            {teacherForm.estado_actual === 'Baja' && (
              <label>Fecha de Baja *
                <input type="date" className="input-field" value={teacherForm.baja_fecha} onChange={e => setTeacherForm({...teacherForm, baja_fecha: e.target.value})} required />
              </label>
            )}
            {(teacherForm.estado_actual === 'Relevado de Funciones' || (teacherForm.estado_actual === 'Tareas Pasivas' && teacherForm.tp_concentracion)) && (
              <label>Institución/Jurisdicción destinada:
                <input type="text" className="input-field" value={teacherForm.institucion_destino} onChange={e => setTeacherForm({...teacherForm, institucion_destino: e.target.value})} />
              </label>
            )}
            {teacherForm.estado_actual === 'Tareas Pasivas' && (
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Opciones de Tareas Pasivas:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={teacherForm.tp_transitorias === 1} 
                      disabled={teacherForm.tp_definitivas === 1}
                      onChange={e => setTeacherForm({...teacherForm, tp_transitorias: e.target.checked ? 1 : 0})} 
                    />
                    Transitorias
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={teacherForm.tp_horario_reducido === 1} 
                      onChange={e => {
                        const checked = e.target.checked ? 1 : 0;
                        setTeacherForm({
                          ...teacherForm,
                          tp_horario_reducido: checked,
                          c_hs_reducidas: checked ? teacherForm.c_hs_reducidas : ''
                        });
                      }} 
                    />
                    Horario Reducido
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={teacherForm.tp_definitivas === 1} 
                      onChange={e => {
                        const checked = e.target.checked ? 1 : 0;
                        setTeacherForm({
                          ...teacherForm,
                          tp_definitivas: checked,
                          tp_transitorias: checked ? 0 : teacherForm.tp_transitorias
                        });
                      }} 
                    />
                    Definitivas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={teacherForm.tp_concentracion === 1} 
                      onChange={e => {
                        const checked = e.target.checked ? 1 : 0;
                        setTeacherForm({
                          ...teacherForm,
                          tp_concentracion: checked,
                          institucion_destino: checked ? teacherForm.institucion_destino : ''
                        });
                      }} 
                    />
                    Concentración Horaria
                  </label>
                </div>
              </div>
            )}
            <button className="btn btn-primary" type="submit">Guardar Docente</button>
          </form>
        </Modal>
      )}

      {selectedTeacher ? (
        <div className="teacher-profile-page">
          <header className="profile-header">
            <button className="btn-back" onClick={handleBackToList}>
              <Search size={18} /> Volver al Listado
            </button>
            <div className="profile-actions">
              {isEditingProfile ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={async () => {
                    if (!editForm.apellidos_nombres) {
                      return showToast('El Apellido y Nombre es obligatorio', 'error');
                    }
                    if (!editForm.dni) {
                      return showToast('El DNI es obligatorio', 'error');
                    }
                    if (!editForm.alta_fecha) {
                      return showToast('La Fecha de Alta es obligatoria', 'error');
                    }
                    if (editForm.estado_actual === 'Baja' && !editForm.baja_fecha) {
                      return showToast('La Fecha de Baja es obligatoria para el estado "Baja"', 'error');
                    }
                    if (editForm.estado_actual === 'Baja y Reintegro' && !editForm.reintegro_fecha) {
                      return showToast('La Fecha de Reintegro es obligatoria para el estado "Baja y Reintegro"', 'error');
                    }
                    try {
                      await apiService.fetchData('/api/teachers?action=update_teacher', {
                        method: 'POST',
                        body: JSON.stringify(editForm)
                      });
                      showToast('Información actualizada', 'success');
                      setSelectedTeacher({ ...editForm });
                      setIsEditingProfile(false);
                      loadData(); 
                    } catch (err) {
                      showToast(err.message, 'error');
                    }
                  }}>
                    <Save size={16} /> Guardar
                  </button>
                  <button className="btn" onClick={() => { setIsEditingProfile(false); setEditForm({...selectedTeacher}); }} style={{ background: '#f1f5f9', color: '#475569' }}>
                    <XCircle size={16} /> Cancelar
                  </button>
                </div>
              ) : (
                user.rol === 'admin' && (
                  <button className="btn btn-primary" onClick={() => { 
                    setEditForm({
                      id: selectedTeacher.id, dni: selectedTeacher.dni, apellidos_nombres: selectedTeacher.apellidos_nombres,
                      cargo: selectedTeacher.cargo, estado_actual: selectedTeacher.estado_actual,
                      codigo_cargo: selectedTeacher.codigo_cargo, c_hs: selectedTeacher.c_hs,
                      c_hs_reducidas: selectedTeacher.c_hs_reducidas || '',
                      turno: selectedTeacher.turno, alta_fecha: selectedTeacher.alta_fecha,
                      baja_fecha: selectedTeacher.baja_fecha || '', 
                      reintegro_fecha: selectedTeacher.reintegro_fecha || '',
                      excluir_asistencia: selectedTeacher.excluir_asistencia || 0,
                      num_disposicion: selectedTeacher.num_disposicion || '',
                      adjunto_url: selectedTeacher.adjunto_url || '',
                      institucion_destino: selectedTeacher.institucion_destino || '',
                      tp_transitorias: selectedTeacher.tp_transitorias || 0,
                      tp_horario_reducido: selectedTeacher.tp_horario_reducido || 0,
                      tp_definitivas: selectedTeacher.tp_definitivas || 0,
                      tp_concentracion: selectedTeacher.tp_concentracion || 0
                    }); 
                    setIsEditingProfile(true); 
                  }}>
                    <Edit size={16} /> Editar Información
                  </button>
                )
              )}
            </div>
          </header>

          <div className="profile-content">
            <div className="profile-card main-info">
              {loadingHistory ? (
                <div style={{ width: '100%' }}>
                  <Skeleton type="text" style={{ width: '80%', height: '2rem', margin: '0 auto 1rem' }} />
                  <div className="info-grid">
                    {[1,2,3,4,5,6].map(i => <div key={i}><Skeleton type="text" style={{ width: '40%', marginBottom: '0.5rem' }} /><Skeleton type="text" style={{ width: '90%' }} /></div>)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-title">
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}
                        value={editForm.apellidos_nombres} 
                        onChange={e => setEditForm({...editForm, apellidos_nombres: e.target.value})} 
                        placeholder="Apellido y Nombres *"
                        required
                      />
                    ) : (
                      <h2>{selectedTeacher.apellidos_nombres}</h2>
                    )}
                    <span 
                      className="badge-status" 
                      style={getBadgeStatusStyle(isEditingProfile ? editForm : selectedTeacher)}
                    >
                      {getBadgeStatusText(isEditingProfile ? editForm : selectedTeacher)}
                    </span>
                    {getExceededLicenses(selectedTeacher.id).map(exc => (
                      <div key={exc.codigo} style={{ 
                        marginTop: '0.8rem', marginBottom: '1.5rem', padding: '0.8rem', borderRadius: '8px', 
                        background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)',
                        color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        <ShieldAlert size={16} />
                        Este docente ha superado el límite de {exc.limite} días para la licencia {exc.nombre}. Regularizar su situación.
                      </div>
                    ))}
                  </div>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <label>DNI *</label>
                      {isEditingProfile ? (
                        <input type="text" className="input-field compact" value={editForm.dni} onChange={handleDniChange} required />
                      ) : (
                        <div className="value">{selectedTeacher.dni}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Estado Actual</label>
                      {isEditingProfile ? (
                        <select className="input-field compact" value={editForm.estado_actual} onChange={e => {
                          const nextState = e.target.value;
                          const updates = { estado_actual: nextState };
                          if (nextState !== 'Baja') {
                            updates.baja_fecha = '';
                            updates.excluir_asistencia = 0;
                          }
                          if (nextState !== 'Baja y Reintegro') {
                            updates.reintegro_fecha = '';
                          }
                          if (nextState !== 'Tareas Pasivas') {
                            updates.tp_transitorias = 0;
                            updates.tp_horario_reducido = 0;
                            updates.tp_definitivas = 0;
                            updates.tp_concentracion = 0;
                            updates.c_hs_reducidas = '';
                          }
                          if (nextState !== 'Relevado de Funciones' && nextState !== 'Tareas Pasivas') {
                            updates.institucion_destino = '';
                          }
                          setEditForm({ ...editForm, ...updates });
                        }}>
                          <option value="Activo en el cargo">Activo en el cargo</option>
                          <option value="Baja y Reintegro">Baja y Reintegro</option>
                          <option value="Baja">Baja</option>
                          <option value="Relevado de Funciones">Relevado de Funciones</option>
                          <option value="Tareas Pasivas">Tareas Pasivas</option>
                        </select>
                      ) : (
                        <div className="value">{selectedTeacher.estado_actual}</div>
                      )}
                    </div>

                    {(editForm.estado_actual === 'Baja y Reintegro' || selectedTeacher.estado_actual === 'Baja y Reintegro') && (
                      <div className="info-item">
                        <label>Fecha de Reintegro *</label>
                        {isEditingProfile ? (
                          <input type="date" className="input-field compact" value={editForm.reintegro_fecha} onChange={e => setEditForm({...editForm, reintegro_fecha: e.target.value})} required />
                        ) : (
                          <div className="value">{formatDate(selectedTeacher.reintegro_fecha) || '-'}</div>
                        )}
                      </div>
                    )}

                    {(editForm.estado_actual === 'Baja' || selectedTeacher.estado_actual === 'Baja') && (
                      <div className="info-item">
                        <label>Fecha de Baja *</label>
                        {isEditingProfile ? (
                          <input type="date" className="input-field compact" value={editForm.baja_fecha} onChange={e => setEditForm({...editForm, baja_fecha: e.target.value})} required />
                        ) : (
                          <div className="value">{formatDate(selectedTeacher.baja_fecha) || '-'}</div>
                        )}
                      </div>
                    )}

                    {(isEditingProfile ? editForm.estado_actual : selectedTeacher.estado_actual) === 'Relevado de Funciones' && (
                      <div className="info-item" style={{ gridColumn: 'span 2' }}>
                        <label>Institución/Jurisdicción destinada:</label>
                        {isEditingProfile ? (
                          <input type="text" className="input-field compact" value={editForm.institucion_destino} onChange={e => setEditForm({...editForm, institucion_destino: e.target.value})} />
                        ) : (
                          <div className="value" style={{ color: '#dc2626', fontWeight: 'bold' }}>{selectedTeacher.institucion_destino || 'Sin definir'}</div>
                        )}
                      </div>
                    )}

                    {isEditingProfile && editForm.estado_actual === 'Tareas Pasivas' && (
                      <div className="info-item" style={{ gridColumn: 'span 2', background: 'rgba(220, 38, 38, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                        <label style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '8px' }}>Opciones de Tareas Pasivas:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={editForm.tp_transitorias === 1} 
                              disabled={editForm.tp_definitivas === 1}
                              onChange={e => setEditForm({...editForm, tp_transitorias: e.target.checked ? 1 : 0})} 
                            />
                            Transitorias
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={editForm.tp_horario_reducido === 1} 
                              onChange={e => {
                                const checked = e.target.checked ? 1 : 0;
                                setEditForm({
                                  ...editForm,
                                  tp_horario_reducido: checked,
                                  c_hs_reducidas: checked ? editForm.c_hs_reducidas : ''
                                });
                              }} 
                            />
                            Horario Reducido
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={editForm.tp_definitivas === 1} 
                              onChange={e => {
                                const checked = e.target.checked ? 1 : 0;
                                setEditForm({
                                  ...editForm,
                                  tp_definitivas: checked,
                                  tp_transitorias: checked ? 0 : editForm.tp_transitorias
                                });
                              }} 
                            />
                            Definitivas
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={editForm.tp_concentracion === 1} 
                              onChange={e => {
                                const checked = e.target.checked ? 1 : 0;
                                setEditForm({
                                  ...editForm,
                                  tp_concentracion: checked,
                                  institucion_destino: checked ? editForm.institucion_destino : ''
                                });
                              }} 
                            />
                            Concentración Horaria
                          </label>
                          {editForm.tp_concentracion === 1 && (
                            <div style={{ gridColumn: 'span 2', marginTop: '5px' }}>
                              <label style={{ fontSize: '0.75rem' }}>Institución Destino (C.H.):</label>
                              <input type="text" className="input-field compact" value={editForm.institucion_destino} onChange={e => setEditForm({...editForm, institucion_destino: e.target.value})} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="info-item">
                      <label>N° de Disposición</label>
                      {isEditingProfile ? (
                        <input type="text" className="input-field compact" value={editForm.num_disposicion} onChange={e => setEditForm({...editForm, num_disposicion: e.target.value})} />
                      ) : (
                        <div className="value">{selectedTeacher.num_disposicion || '-'}</div>
                      )}
                    </div>

                    <div className="info-item" style={{ gridColumn: 'span 2' }}>
                      <label>Cargo / Espacios Curriculares</label>
                      {isEditingProfile ? (
                        <input type="text" className="input-field compact" value={editForm.cargo} onChange={e => setEditForm({...editForm, cargo: e.target.value})} />
                      ) : (
                        <div className="value">{selectedTeacher.cargo || 'No asignado'}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Código del Cargo</label>
                      {isEditingProfile ? (
                        <input type="text" className="input-field compact" value={editForm.codigo_cargo} onChange={e => setEditForm({...editForm, codigo_cargo: e.target.value})} />
                      ) : (
                        <div className="value">{selectedTeacher.codigo_cargo || '-'}</div>
                      )}
                    </div>
                    <div className="info-item" style={{ gridColumn: (isEditingProfile ? editForm.tp_horario_reducido : selectedTeacher.tp_horario_reducido) === 1 ? 'span 2' : 'span 1' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
                        <div style={{ flex: 1 }}>
                          <label>C/ HS</label>
                          {isEditingProfile ? (
                            <input type="text" className="input-field compact" value={editForm.c_hs} onChange={e => setEditForm({...editForm, c_hs: e.target.value})} />
                          ) : (
                            <div className="value">{selectedTeacher.c_hs || '-'}</div>
                          )}
                        </div>
                        {(isEditingProfile ? editForm.tp_horario_reducido : selectedTeacher.tp_horario_reducido) === 1 && (
                          <div style={{ flex: 1 }}>
                            <label>C/ HS (Reducidas)</label>
                            {isEditingProfile ? (
                              <input type="text" className="input-field compact" value={editForm.c_hs_reducidas || ''} onChange={e => setEditForm({...editForm, c_hs_reducidas: e.target.value})} />
                            ) : (
                              <div className="value">{selectedTeacher.c_hs_reducidas || '-'}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="info-item">
                      <label>Turno</label>
                      {isEditingProfile ? (
                        <select className="input-field compact" value={editForm.turno} onChange={e => setEditForm({...editForm, turno: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          <option value="M">M (Mañana)</option>
                          <option value="T">T (Tarde)</option>
                          <option value="M/T">M/T (Doble Turno)</option>
                        </select>
                      ) : (
                        <div className="value">{selectedTeacher.turno || '-'}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Fecha de Alta *</label>
                      {isEditingProfile ? (
                        <input type="date" lang="es" className="input-field compact" value={editForm.alta_fecha} onChange={e => setEditForm({...editForm, alta_fecha: e.target.value})} required />
                      ) : (
                        <div className="value">{formatDate(selectedTeacher.alta_fecha)}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="profile-card history-section">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.2rem', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Historial de Inasistencias / Licencias</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="history-year-select" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', opacity: 0.8, textTransform: 'none', margin: 0 }}>Año:</label>
                  <select 
                    id="history-year-select"
                    className="input-field compact"
                    style={{ width: 'auto', padding: '4px 24px 4px 10px', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                    value={selectedHistoryYear}
                    onChange={e => setSelectedHistoryYear(e.target.value)}
                  >
                    <option value="Todos">Todos los años</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="history-list">
                {Object.keys(getAttendanceSummary()).length === 0 ? (
                  <div className="empty-state">
                    {loadingHistory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Skeleton type="text" style={{ height: '3rem' }} />
                        <Skeleton type="text" style={{ height: '3rem' }} />
                        <Skeleton type="text" style={{ height: '3rem' }} />
                      </div>
                    ) : (
                      <>
                        <CheckCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No se registran inasistencias o licencias para este docente.</p>
                      </>
                    )}
                  </div>
                ) : (
                  Object.entries(getAttendanceSummary()).map(([code, items]) => {
                    const totalCount = items.reduce((acc, curr) => acc + curr.count, 0);
                    const exceededList = getExceededLicenses(selectedTeacher.id);
                    const isExceeded = exceededList.some(exc => exc.codigo === code);
                    const isExpanded = expandedCategories[code];
                    
                    const licConfig = licencias.find(l => l.codigo === code);
                    const isExtensible = licConfig?.extensible === 1;
                    const currentFilterYear = selectedHistoryYear === 'Todos' ? currentYear : selectedHistoryYear;
                    const justifRecord = justificaciones.find(j => j.docente_id === selectedTeacher.id && j.codigo_licencia === code && j.anio === currentFilterYear);
                    
                    return (
                      <div 
                        key={code} 
                        className={`history-category ${isExpanded ? 'expanded' : ''}`}
                        style={isExceeded ? { 
                          background: 'rgba(220, 38, 38, 0.1)', 
                          border: '1.5px solid rgba(220, 38, 38, 0.3)',
                          borderRadius: '12px'
                        } : {}}
                      >
                        <div 
                          className="category-header"
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [code]: !prev[code] }))}
                          style={{
                            ...isExceeded ? { color: '#dc2626', fontWeight: 'bold' } : {},
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div className="category-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span className="category-icon">{isExpanded ? '−' : '+'}</span>
                            <span className="category-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {code} 
                              <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 'normal' }}>
                                ({licConfig?.descripcion || 'Sin descripción'})
                              </span>
                              {isExtensible && (
                                <span style={{ fontSize: '0.65rem', background: '#e8f0fe', color: '#1a73e8', border: '1px solid rgba(26, 115, 232, 0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
                                  Extensible
                                </span>
                              )}
                              {justifRecord && (
                                <span style={{ fontSize: '0.65rem', background: '#e6f4ea', color: '#137333', border: '1px solid rgba(19, 115, 51, 0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
                                  Regularizado
                                </span>
                              )}
                            </span>
                            <span className="category-count">({totalCount} días)</span>
                          </div>
                          
                          {isExtensible && (
                            <button 
                              className="btn compact"
                              style={{ 
                                padding: '2px 8px', 
                                fontSize: '0.7rem', 
                                background: justifRecord ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary)', 
                                color: justifRecord ? '#10b981' : 'white',
                                border: justifRecord ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginLeft: '10px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // prevent accordion toggle
                                openJustificacionModal(code, currentFilterYear, justifRecord?.motivo || '');
                              }}
                            >
                              <FileText size={11} /> {justifRecord ? 'Editar Justificación' : 'Justificar'}
                            </button>
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className="category-details">
                            {justifRecord && (
                              <div style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <CheckCircle size={14} /> Licencia Justificada ({justifRecord.anio})
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                  <strong>Motivo regularizado:</strong> "{justifRecord.motivo}"
                                </div>
                              </div>
                            )}
                            {items.map((item, idx) => (
                              <div key={idx} className="history-item">
                                <div className="item-dot"></div>
                                <div className="item-text">
                                  <strong>{item.count} días</strong> - 
                                  {item.count === 1 ? formatDate(item.startDate) : ` del ${formatDate(item.startDate)} al ${formatDate(item.endDate)}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="profile-card attachment-section" style={{ marginTop: '1.5rem' }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
              <Upload size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Documentación Adjunta (JPG/PNG)</h3>
            </div>

            {(isEditingProfile ? editForm.adjunto_url : selectedTeacher.adjunto_url) ? (
              <div style={{ background: 'rgba(0,120,215,0.05)', border: '1px solid rgba(0,120,215,0.1)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '45px', height: '45px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Archivo adjunto disponible</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Subido vía ImgBB</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href={isEditingProfile ? editForm.adjunto_url : selectedTeacher.adjunto_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={16} /> Ver Archivo
                  </a>
                  {isEditingProfile && user.rol === 'admin' && (
                    <button className="btn" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }} onClick={() => setEditForm({...editForm, adjunto_url: ''})}>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              user.rol === 'admin' ? (
                <div style={{ border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                    <input 
                      type="file" 
                      id="fileUpload" 
                      style={{ display: 'none' }} 
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        // Límite de 32MB
                        const MAX_SIZE = 32 * 1024 * 1024;
                        if (file.size > MAX_SIZE) {
                          return showToast('El archivo supera el límite de 32MB.', 'error');
                        }

                        const formData = new FormData();
                        formData.append('image', file);
                        
                        const apiKey = data.config?.imgbb_api_key || '0622543d3b764c53835706593f619565'; 
                        if (!data.config?.imgbb_api_key) {
                          showToast('Usando API Key por defecto. Configura la tuya en Ajustes.', 'warning');
                        }
                        
                        try {
                          showToast('Subiendo archivo...', 'info');
                          const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                            method: 'POST',
                            body: formData
                          });
                          const json = await res.json();
                          if (json.success) {
                            const url = json.data.url;
                            if (isEditingProfile) {
                              setEditForm({...editForm, adjunto_url: url});
                            } else {
                              await apiService.fetchData('/api/teachers?action=update_teacher', {
                                method: 'POST',
                                body: JSON.stringify({ ...selectedTeacher, adjunto_url: url })
                              });
                              setSelectedTeacher({ ...selectedTeacher, adjunto_url: url });
                              loadData();
                            }
                            showToast('Archivo subido con éxito', 'success');
                          } else {
                            // ImgBB suele fallar con PDFs
                            if (file.type === 'application/pdf') {
                              throw new Error('ImgBB no admite archivos PDF directamente. Intenta con una imagen o contacta a soporte.');
                            }
                            throw new Error(json.error.message);
                          }
                        } catch (err) {
                          showToast('Error al subir: ' + err.message, 'error');
                        }
                      }}
                    />
                    <label htmlFor="fileUpload" style={{ cursor: 'pointer' }}>
                      <div style={{ width: '60px', height: '60px', background: 'rgba(0,120,215,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
                        <Upload size={30} />
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '5px' }}>Haz clic para subir documentación</div>
                      <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Formatos soportados: JPG, PNG, PDF (Máx. 32MB)</p>
                    </label>
                </div>
              ) : (
                <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', opacity: 0.6 }}>
                  <FileText size={24} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--primary)' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Sin documentación adjunta</div>
                </div>
              )
            )}
          </div>

          {isEditingProfile && (
            <div className="profile-card danger-zone" style={{ marginTop: '2rem', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.02)' }}>
              <div className="section-header" style={{ color: '#dc2626', marginBottom: '1rem' }}>
                <Trash2 size={20} />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Zona de Peligro</h3>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem' }}>
                Al eliminar al docente se borrarán permanentemente todos sus datos personales y su historial de inasistencias. Esta acción no se puede deshacer.
              </p>
              <button 
                className="btn" 
                style={{ background: '#dc2626', color: 'white', width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={async () => {
                  if (window.confirm(`¿Estas seguro de eliminar definitivamente del sistema a ${selectedTeacher.apellidos_nombres}?`)) {
                    try {
                      await apiService.fetchData(`/api/teachers?action=delete_teacher`, {
                        method: 'POST',
                        body: JSON.stringify({ id: selectedTeacher.id })
                      });
                      showToast('Docente eliminado', 'success');
                      handleBackToList();
                      loadData();
                    } catch(err) {
                      showToast(err.message, 'error');
                    }
                  }
                }}
              >
                <Trash2 size={18} /> Eliminar Definitivamente al Docente
              </button>
            </div>
          )}
        </div>
      ) : (
        <>

      <div className="controls-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <select className="input-field" style={{ width: 'auto', minWidth: '120px' }} value={currentYear} onChange={(e) => setSelectedMonth(`${e.target.value}-${currentMonthId}`)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input-field" style={{ width: 'auto', minWidth: '150px' }} value={currentMonthId} onChange={(e) => setSelectedMonth(`${currentYear}-${e.target.value}`)}>
          {monthOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar docente..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '35px', width: '100%' }}
          />
        </div>
        
        {user.rol === 'admin' && (
          <button className="btn btn-primary" onClick={() => { 
            setTeacherForm({ 
              id: null, dni: '', apellidos_nombres: '', cargo: '', 
              estado_actual: 'Activo en el cargo', codigo_cargo: '', c_hs: '', c_hs_reducidas: '', turno: '', alta_fecha: '',
              baja_fecha: '', reintegro_fecha: '', excluir_asistencia: 0, num_disposicion: '', adjunto_url: '',
              institucion_destino: '', tp_transitorias: 0, tp_horario_reducido: 0, tp_definitivas: 0, tp_concentracion: 0
            }); 
            setShowTeacherForm(true); 
          }}>
            <Plus size={16} /> Nuevo Docente
          </button>
        )}

        <button className="btn" onClick={() => setShowLicenseInitModal(true)} style={{ background: '#10b981', color: 'white' }}>
          <Calendar size={16} /> Inicio de Licencia
        </button>

        <button className="btn" onClick={handlePrintWindow} style={{ background: '#6366f1', color: 'white', padding: '8px 12px' }} title="Ver Planilla para Imprimir">
          <Printer size={18} />
        </button>

        <button 
          className="btn" 
          onClick={() => setShowWeekends(!showWeekends)} 
          style={{ 
            background: showWeekends ? 'rgba(0, 120, 215, 0.15)' : 'rgba(255,255,255,0.1)', 
            color: showWeekends ? '#0078d7' : 'inherit', 
            border: `1px solid ${showWeekends ? 'rgba(0, 120, 215, 0.3)' : 'var(--glass-border)'}`,
            padding: '8px 12px'
          }} 
          title={showWeekends ? "Ocultar Fines de Semana" : "Mostrar Fines de Semana"}
        >
          {showWeekends ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <SaveStatusButton 
            hasChanges={Object.keys(pending).length > 0} 
            onClick={saveAttendance} 
          />
        </div>
      </div>

      <div className="print-only-header" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
          PLANILLA MENSUAL DE ASISTENCIAS/INASISTENCIAS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', border: '1px solid black', padding: '10px' }}>
          <div><strong>ESTABLECIMIENTO:</strong> EPP N° 33 "Comisario Insp. Victoriano E. Taret"</div>
          <div><strong>MES:</strong> {monthOptions.find(m => m.id === currentMonthId)?.name.toUpperCase()}</div>
          <div><strong>AÑO:</strong> {currentYear}</div>
        </div>
      </div>

      <datalist id="attendance-codes">
        {licencias.map(l => (
          <option key={l.id} value={l.codigo}>{l.codigo} ({l.descripcion})</option>
        ))}
      </datalist>

      <div className="table-container" style={{ maxHeight: '65vh' }}>
        <table className="attendance-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 20, minWidth: '45px', maxWidth: '45px', background: '#0078d7', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)', verticalAlign: 'middle' }}>N°</th>
              
              {/* Fecha de Grabado header */}
              <th style={{ 
                position: 'sticky', left: '45px', zIndex: 20, 
                background: '#0078d7', 
                borderRight: '1px solid rgba(255,255,255,0.2)', 
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
                padding: '6px 8px 4px 8px',
                textAlign: 'center',
                minWidth: '220px',
                verticalAlign: 'middle'
              }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.05em', color: 'white', marginBottom: '4px' }}>FECHA DE GRABADO</div>
                <input 
                  type="text" 
                  placeholder="Ej: 30 de Mayo 2026"
                  value={fechaGrabadoLocal}
                  onChange={(e) => setFechaGrabadoLocal(e.target.value)}
                  onBlur={(e) => saveFechaGrabado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '3px 6px',
                    fontSize: '0.75rem',
                    border: 'none',
                    borderRadius: '4px',
                    background: 'white',
                    color: '#333',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
              </th>

              {days.filter(d => showWeekends || !d.isWeekend).map(d => {
                const isSuspended = suspendedDays.includes(d.date);
                const holidayName = holidaysMap[d.date];
                const isHoliday = !!holidayName;
                const isHolidayActive = isHoliday && !deactivatedHolidays.includes(d.date);
                
                return (
                <th 
                  key={d.day} 
                  rowSpan={2}
                  className={`day-header ${d.isWeekend ? 'weekend' : ''}`} 
                  style={{ 
                    minWidth: '45px', maxWidth: '45px', textAlign: 'center', 
                    background: isSuspended ? 'rgb(106, 189, 255)' : (isHolidayActive ? '#fecaca' : ''),
                    borderLeft: d.dayName === 'LU' ? '2.5px solid white' : '0.5px solid rgba(255,255,255,0.1)',
                    borderRight: d.dayName === 'VIE' ? '2.5px solid white' : '0.5px solid rgba(255,255,255,0.1)',
                    verticalAlign: 'middle',
                    padding: '4px 2px'
                  }}
                >
                  <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{d.dayName}</div>
                  
                  {isHoliday && (
                    <div 
                      onClick={() => setActiveHolidayDetail({ fecha: d.date, descripcion: holidayName })}
                      style={{ 
                        fontSize: '0.55rem', 
                        fontWeight: 'bold', 
                        color: '#dc2626', 
                        cursor: 'pointer',
                        background: '#fee2e2',
                        padding: '1px 3px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        margin: '1px 0',
                        border: '1px solid rgba(220, 38, 38, 0.2)'
                      }}
                      title={`Feriado: ${holidayName}. Clic para detalle`}
                    >
                      FE.
                    </div>
                  )}

                  <div style={{ fontWeight: 'bold' }}>{d.day}</div>
                  
                  {isHoliday ? (
                    <input 
                      type="checkbox" 
                      checked={isHolidayActive} 
                      onChange={() => toggleDeactivatedHoliday(d.date)} 
                      title={isHolidayActive ? "Desactivar feriado (desbloquear celdas)" : "Activar feriado (bloquear celdas)"} 
                      style={{ transform: 'scale(0.8)', margin: '2px 0 0 0', accentColor: '#dc2626' }} 
                    />
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={suspendedDays.includes(d.date)} 
                      onChange={() => toggleSuspendedDay(d.date)} 
                      title="Suspender Día" 
                      style={{ transform: 'scale(0.8)', margin: '2px 0 0 0' }} 
                    />
                  )}
                </th>
              ); })}
              <th rowSpan={2} className="ui-vertical-header" style={{ verticalAlign: 'middle' }}>Total Oblig.</th>
              <th rowSpan={2} className="ui-vertical-header" style={{ verticalAlign: 'middle' }}>Total Días Asis.</th>
              <th rowSpan={2} className="ui-vertical-header" style={{ verticalAlign: 'middle' }}>Oblig. a Deducir</th>
              <th rowSpan={2} className="ui-vertical-header" style={{ verticalAlign: 'middle' }}>Días a Deducir</th>
              {user.rol === 'admin' && <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Acciones</th>}
            </tr>
            <tr>
              <th style={{ 
                position: 'sticky', left: '45px', zIndex: 20, 
                background: '#0078d7', 
                borderRight: '1px solid rgba(255,255,255,0.2)', 
                borderBottom: '1px solid rgba(255,255,255,0.2)', 
                boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
                padding: '6px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                DOCENTE
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={days.length + 7}><TableSkeleton columns={days.length + 7} rows={5} /></td></tr>
            ) : filteredTeachers.length === 0 ? (
              <tr><td colSpan={days.length + 7} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No se encontraron docentes.</td></tr>
            ) : (
              filteredTeachers.map((teacher, index) => {
                const rowBg = 'white';
                return (
                <tr key={teacher.id} style={{ background: rowBg }}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 15, background: rowBg, textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', minWidth: '45px', maxWidth: '45px' }}>{index + 1}</td>
                  <td style={{ position: 'sticky', left: '45px', zIndex: 15, background: rowBg, borderRight: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }} className="teacher-name-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedTeacher(teacher)}>
                      <User size={16} style={{ opacity: 0.7, color: getExceededLicenses(teacher.id).length > 0 ? '#dc2626' : 'inherit' }} />
                      <div>
                        <div style={{ fontWeight: '600', color: getExceededLicenses(teacher.id).length > 0 ? '#dc2626' : 'black', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {teacher.apellidos_nombres}
                          {getExceededLicenses(teacher.id).length > 0 && <ShieldAlert size={14} title="Límite de licencia excedido" />}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555' }}>{teacher.dni} · {teacher.cargo || 'Sin Cargo'}</div>
                        {['Relevado de Funciones', 'Tareas Pasivas'].includes(teacher.estado_actual) && (
                          <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 'bold', marginTop: '1px' }}>
                            {getStatusDescription(teacher)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {days.filter(d => showWeekends || !d.isWeekend).map(d => {
                    const key = `${teacher.id}_${d.date}`;
                    const effVal = getEffectiveAttendance(teacher, d.date);
                    
                    const isBeforeAlta = teacher.alta_fecha ? (d.date < teacher.alta_fecha) : false;
                    const isAfterBaja = (teacher.estado_actual === 'Baja' && teacher.baja_fecha) ? (d.date > teacher.baja_fecha) : false;
                    
                    const isHolidayActive = !!holidaysMap[d.date] && !deactivatedHolidays.includes(d.date);
                    
                    const isReadOnly = teacher.estado_actual === 'Relevado de Funciones' || 
                                       (teacher.estado_actual === 'Tareas Pasivas' && teacher.tp_concentracion) ||
                                       isBeforeAlta ||
                                       isAfterBaja ||
                                       isHolidayActive;
                                       
                    const isSuspended = suspendedDays.includes(d.date);
                    return (
                      <td 
                        key={d.day} 
                        style={{ 
                          textAlign: 'center', padding: '2px', 
                          background: isSuspended ? 'rgb(106, 189, 255)' : (isHolidayActive ? '#fef2f2' : 'transparent'),
                          borderLeft: d.dayName === 'LU' ? (isSuspended ? '2.5px solid white' : '2.5px solid #0078d733') : '0.5px solid rgba(0,0,0,0.05)',
                          borderRight: d.dayName === 'VIE' ? (isSuspended ? '2.5px solid white' : '2.5px solid #0078d733') : '0.5px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        {!isSuspended && (
                          <input 
                            list="attendance-codes"
                            className={`attendance-input ${(isBeforeAlta || isAfterBaja || isHolidayActive) ? 'val-blocked' : ''}`} 
                            value={isHolidayActive ? 'FE' : effVal} 
                            onChange={(e) => !isReadOnly && handleAttendanceChange(teacher.id, d.date, e.target.value)}
                            onBlur={(e) => !isReadOnly && handleBlur(teacher.id, d.date, e.target.value)}
                            readOnly={isReadOnly && !(isBeforeAlta || isAfterBaja || isHolidayActive)}
                            disabled={isBeforeAlta || isAfterBaja || isHolidayActive}
                            style={{ 
                              padding: '2px', 
                              fontSize: (isReadOnly || isHolidayActive) ? '0.55rem' : '0.7rem', 
                              width: '40px', 
                              textAlign: 'center', 
                              borderRadius: '4px', 
                              border: (isReadOnly || isHolidayActive) ? 'none' : '1px solid #ccc', 
                              color: (isBeforeAlta || isAfterBaja) ? '#94a3b8' : (isHolidayActive ? '#dc2626' : (isReadOnly ? 'red' : 'black')), 
                              fontWeight: (isReadOnly || isHolidayActive) ? 'bold' : 'normal',
                              background: (isBeforeAlta || isAfterBaja) ? '#f1f5f9' : (isHolidayActive ? '#fee2e2' : (isReadOnly ? 'transparent' : 'white')),
                              cursor: (isBeforeAlta || isAfterBaja || isHolidayActive) ? 'not-allowed' : 'inherit'
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center' }}><input type="text" className="input-field" style={{ width: '40px', padding: '2px', fontSize: '0.6rem', textAlign: 'center' }} /></td>
                  <td style={{ textAlign: 'center' }}><input type="text" className="input-field" style={{ width: '40px', padding: '2px', fontSize: '0.6rem', textAlign: 'center' }} /></td>
                  <td style={{ textAlign: 'center' }}><input type="text" className="input-field" style={{ width: '40px', padding: '2px', fontSize: '0.6rem', textAlign: 'center' }} /></td>
                  <td style={{ textAlign: 'center' }}><input type="text" className="input-field" style={{ width: '40px', padding: '2px', fontSize: '0.6rem', textAlign: 'center' }} /></td>
                  {user.rol === 'admin' && (
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="icon-btn" onClick={() => { 
                          setTeacherForm({
                            id: teacher.id, dni: teacher.dni, apellidos_nombres: teacher.apellidos_nombres,
                            cargo: teacher.cargo, estado_actual: teacher.estado_actual,
                            codigo_cargo: teacher.codigo_cargo, c_hs: teacher.c_hs,
                            c_hs_reducidas: teacher.c_hs_reducidas || '',
                            turno: teacher.turno, alta_fecha: teacher.alta_fecha,
                            baja_fecha: teacher.baja_fecha || '', 
                            reintegro_fecha: teacher.reintegro_fecha || '',
                            excluir_asistencia: teacher.excluir_asistencia || 0,
                            num_disposicion: teacher.num_disposicion || '',
                            adjunto_url: teacher.adjunto_url || '',
                            institucion_destino: teacher.institucion_destino || '',
                            tp_transitorias: teacher.tp_transitorias || 0,
                            tp_horario_reducido: teacher.tp_horario_reducido || 0,
                            tp_definitivas: teacher.tp_definitivas || 0,
                            tp_concentracion: teacher.tp_concentracion || 0
                          }); 
                          setShowTeacherForm(true); 
                        }}><Edit size={14}/></button>
                        <button className="icon-btn danger" onClick={() => handleDeleteTeacher(teacher.id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </>
  )}
      {showLicenseInitModal && (
        <Modal title="Inicio de Licencia (Larga Duración)" onClose={() => setShowLicenseInitModal(false)}>
          <div className="stack-form" style={{ marginTop: '1rem', gap: '1.2rem' }}>
            <div className="info-item">
              <label>Docente</label>
              <select 
                className="input-field" 
                value={licenseInitForm.teacherId} 
                onChange={e => setLicenseInitForm({...licenseInitForm, teacherId: e.target.value})}
              >
                <option value="">Seleccionar Docente...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.apellidos_nombres} ({t.dni})</option>
                ))}
              </select>
            </div>

            <div className="info-item">
              <label>Tipo de Licencia (Larga Duración)</label>
              <select 
                className="input-field" 
                value={licenseInitForm.codigo} 
                onChange={e => setLicenseInitForm({...licenseInitForm, codigo: e.target.value})}
              >
                <option value="">Seleccionar Licencia...</option>
                {(data.licencias || []).filter(l => l.larga_duracion === 1).map(l => (
                  <option key={l.codigo} value={l.codigo}>{l.codigo} - {l.descripcion}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="info-item">
                <label>Fecha de Inicio</label>
                <input 
                  type="date" lang="es" className="input-field" 
                  value={licenseInitForm.startDate} 
                  onChange={e => setLicenseInitForm({...licenseInitForm, startDate: e.target.value})} 
                />
              </div>
              <div className="info-item">
                <label>Fecha de Término</label>
                <input 
                  type="date" lang="es" className="input-field" 
                  value={licenseInitForm.endDate} 
                  onChange={e => setLicenseInitForm({...licenseInitForm, endDate: e.target.value})} 
                />
              </div>
            </div>

            <div className="info-item">
              <label>Contemplar</label>
              <select 
                className="input-field" 
                value={licenseInitForm.contemplar} 
                onChange={e => setLicenseInitForm({...licenseInitForm, contemplar: e.target.value})}
              >
                <option value="corridos">Días Corridos (Incluye fines de semana/feriados)</option>
                <option value="habiles">Días Hábiles (Solo días laborales)</option>
              </select>
            </div>

            {licenseInitForm.startDate && licenseInitForm.endDate && (
              <div style={{ background: 'rgba(0,120,215,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(0,120,215,0.1)' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Cantidad de días calculados:</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {(() => {
                    const start = new Date(licenseInitForm.startDate + 'T00:00:00');
                    const end = new Date(licenseInitForm.endDate + 'T00:00:00');
                    if (isNaN(start) || isNaN(end) || end < start) return 0;
                    
                    let count = 0;
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                      if (licenseInitForm.contemplar === 'habiles') {
                        const dateStr = d.toISOString().split('T')[0];
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const isSuspended = suspendedDays.includes(dateStr);
                        if (isWeekend || isSuspended) continue;
                      }
                      count++;
                    }
                    return count;
                  })()} días
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowLicenseInitModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleBulkLicense}>Aplicar Licencia</button>
            </div>
          </div>
        </Modal>
      )}

      {showJustificacionModal && (
        <Modal title={`Justificar Licencia ${justifModalData.codigo} - Año ${justifModalData.anio}`} onClose={() => setShowJustificacionModal(false)}>
          <div className="stack-form" style={{ marginTop: '1rem', gap: '1.2rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.9 }}>
              Esta licencia es de carácter <strong>Extensible</strong>. Puede regularizar el límite estipulado para el docente ingresando un motivo de justificación (resolución, nota formal, etc.).
            </div>
            <div className="info-item">
              <label>Año de la Licencia</label>
              <input 
                type="text" 
                className="input-field" 
                value={justifModalData.anio} 
                readOnly 
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'not-allowed' }}
              />
            </div>
            <div className="info-item">
              <label>Motivo de la Justificación *</label>
              <textarea 
                className="input-field" 
                placeholder="Escriba el motivo, resolución o justificación formal..." 
                value={justifModalData.motivo} 
                onChange={e => setJustifModalData({...justifModalData, motivo: e.target.value})}
                rows={4}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '8px 12px', fontSize: '0.9rem', background: 'white', color: 'black' }}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowJustificacionModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveJustificacion}>Guardar Justificación</button>
            </div>
          </div>
        </Modal>
      )}

      {activeHolidayDetail && (
        <Modal title="Detalle de Feriado Nacional" onClose={() => setActiveHolidayDetail(null)}>
          <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Flag size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>{activeHolidayDetail.descripcion}</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.7 }}>Fecha del Feriado: {activeHolidayDetail.fecha.split('-').reverse().join('/')}</p>
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', width: '100%' }}>
              * Este día está registrado como feriado nacional en el sistema. Bloquea la planilla por defecto, pero puedes desbloquearlo si necesitas cargar datos en esta columna.
            </div>
            <button className="btn btn-primary" onClick={() => setActiveHolidayDetail(null)} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default AttendancePanel;

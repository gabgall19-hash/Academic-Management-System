import { json } from "./_helpers.js";

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  
  try {
    if (type === 'list') {
      const { results } = await env.DB.prepare('SELECT * FROM docentes ORDER BY apellidos_nombres ASC').all();
      return json(results);
    }
    
    if (type === 'attendance_month') {
      const month = url.searchParams.get('month');
      if (!month) return json({ error: 'month requerido' }, 400);
      const { results } = await env.DB.prepare("SELECT * FROM asistencias_docentes WHERE fecha LIKE ?").bind(`${month}%`).all();
      return json(results);
    }

    if (type === 'attendance') {
      const docenteId = url.searchParams.get('docenteId');
      if (!docenteId) return json({ error: 'docenteId requerido' }, 400);
      const { results } = await env.DB.prepare('SELECT * FROM asistencias_docentes WHERE docente_id = ? ORDER BY fecha DESC').bind(docenteId).all();
      return json(results);
    }

    if (type === 'attendance_year') {
      const year = url.searchParams.get('year');
      if (!year) return json({ error: 'year requerido' }, 400);
      const { results } = await env.DB.prepare("SELECT docente_id, estado, fecha FROM asistencias_docentes WHERE fecha LIKE ?").bind(`${year}%`).all();
      return json(results);
    }
    
    if (type === 'justificaciones') {
      const docenteId = url.searchParams.get('docenteId');
      if (docenteId) {
        const { results } = await env.DB.prepare('SELECT * FROM justificaciones_licencias WHERE docente_id = ?').bind(docenteId).all();
        return json(results);
      } else {
        const { results } = await env.DB.prepare('SELECT * FROM justificaciones_licencias').all();
        return json(results);
      }
    }
    
    return json({ error: 'Tipo no especificado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    const body = await request.json();
    
    if (action === 'create_teacher') {
      const { dni, apellidos_nombres, cargo, alta_fecha, estado_actual, codigo_cargo, c_hs, c_hs_reducidas, turno, baja_fecha, reintegro_fecha, excluir_asistencia, num_disposicion, adjunto_url, institucion_destino, tp_transitorias, tp_horario_reducido, tp_definitivas, tp_concentracion } = body;
      const res = await env.DB.prepare("INSERT INTO docentes (dni, apellidos_nombres, cargo, alta_fecha, estado_actual, codigo_cargo, c_hs, c_hs_reducidas, turno, baja_fecha, reintegro_fecha, excluir_asistencia, num_disposicion, adjunto_url, institucion_destino, tp_transitorias, tp_horario_reducido, tp_definitivas, tp_concentracion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")
        .bind(dni, apellidos_nombres, cargo, alta_fecha, estado_actual || 'Activo en el cargo', codigo_cargo, c_hs, c_hs_reducidas, turno, baja_fecha, reintegro_fecha, excluir_asistencia || 0, num_disposicion, adjunto_url, institucion_destino, tp_transitorias || 0, tp_horario_reducido || 0, tp_definitivas || 0, tp_concentracion || 0).first();
      return json({ success: true, id: res.id });
    }
    
    if (action === 'update_teacher') {
      const { id, dni, apellidos_nombres, cargo, alta_fecha, estado_actual, codigo_cargo, c_hs, c_hs_reducidas, turno, baja_fecha, reintegro_fecha, excluir_asistencia, num_disposicion, adjunto_url, institucion_destino, tp_transitorias, tp_horario_reducido, tp_definitivas, tp_concentracion } = body;
      await env.DB.prepare("UPDATE docentes SET dni = ?, apellidos_nombres = ?, cargo = ?, alta_fecha = ?, estado_actual = ?, codigo_cargo = ?, c_hs = ?, c_hs_reducidas = ?, turno = ?, baja_fecha = ?, reintegro_fecha = ?, excluir_asistencia = ?, num_disposicion = ?, adjunto_url = ?, institucion_destino = ?, tp_transitorias = ?, tp_horario_reducido = ?, tp_definitivas = ?, tp_concentracion = ? WHERE id = ?")
        .bind(dni, apellidos_nombres, cargo, alta_fecha, estado_actual || 'Activo en el cargo', codigo_cargo, c_hs, c_hs_reducidas, turno, baja_fecha, reintegro_fecha, excluir_asistencia || 0, num_disposicion, adjunto_url, institucion_destino, tp_transitorias || 0, tp_horario_reducido || 0, tp_definitivas || 0, tp_concentracion || 0, id).run();
      return json({ success: true });
    }

    if (action === 'delete_teacher') {
      const { id } = body;
      await env.DB.prepare("DELETE FROM asistencias_docentes WHERE docente_id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM docentes WHERE id = ?").bind(id).run();
      return json({ success: true });
    }

    if (action === 'record_attendance') {
      const { docente_id, fecha, estado, detalle } = body;
      
      // Upsert optimization: attempt UPDATE first to avoid unnecessary SELECT reads.
      const res = await env.DB.prepare("UPDATE asistencias_docentes SET estado = ?, detalle = ? WHERE docente_id = ? AND fecha = ?")
        .bind(estado, detalle, docente_id, fecha).run();
        
      if (res.meta.changes === 0) {
        await env.DB.prepare("INSERT INTO asistencias_docentes (docente_id, fecha, estado, detalle) VALUES (?, ?, ?, ?)")
          .bind(docente_id, fecha, estado, detalle).run();
      }
      
      return json({ success: true });
    }
    
    if (action === 'delete_attendance') {
        const { docente_id, fecha } = body;
        await env.DB.prepare("DELETE FROM asistencias_docentes WHERE docente_id = ? AND fecha = ?").bind(docente_id, fecha).run();
        return json({ success: true });
    }
    
    if (action === 'save_justificacion') {
      const { docente_id, codigo_licencia, anio, motivo } = body;
      const res = await env.DB.prepare("UPDATE justificaciones_licencias SET motivo = ? WHERE docente_id = ? AND codigo_licencia = ? AND anio = ?")
        .bind(motivo, docente_id, codigo_licencia, anio).run();
        
      if (res.meta.changes === 0) {
        await env.DB.prepare("INSERT INTO justificaciones_licencias (docente_id, codigo_licencia, anio, motivo) VALUES (?, ?, ?, ?)")
          .bind(docente_id, codigo_licencia, anio, motivo).run();
      }
      return json({ success: true });
    }
    
    return json({ error: 'Acción no soportada' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

import { json } from "./_helpers.js";

// Funciones para manejar Settings
async function handleConfig(env, request, body) {
  if (body.action === 'update_mobile_login') {
    await env.DB.prepare("INSERT INTO ajustes (clave, valor) VALUES ('mobile_login_enabled', ?) ON CONFLICT(clave) DO UPDATE SET valor = ?")
      .bind(body.enabled, body.enabled).run();
    return json({ success: true });
  }
  if (body.action === 'update_suspended_days') {
    await env.DB.prepare("INSERT INTO ajustes (clave, valor) VALUES ('dias_suspendidos', ?) ON CONFLICT(clave) DO UPDATE SET valor = ?")
      .bind(body.days, body.days).run();
    return json({ success: true });
  }
  if (body.action === 'update_setting') {
    await env.DB.prepare("INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = ?")
      .bind(body.clave, body.valor, body.valor).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada en config' }, 400);
}

// Funciones para manejar Usuarios
async function handleUsers(env, request, body) {
  if (body.action === 'create') {
    // Hashear la clave inicial
    const bcrypt = require('bcryptjs'); // Nota: Cloudflare Workers soporta algunos polyfills o nuestra utilidad hashPassword
    // Como estamos en Worker, asumo que tenemos utils
    const { hashPassword } = require('./_utils.js');
    const hashed = hashPassword(body.password || '123456');

    await env.DB.prepare("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)")
      .bind(body.username, hashed, body.rol).run();
    return json({ success: true });
  }
  if (body.action === 'update') {
    if (body.password) {
      const { hashPassword } = require('./_utils.js');
      const hashed = hashPassword(body.password);
      await env.DB.prepare("UPDATE usuarios SET username = ?, password = ?, rol = ?, security_acknowledged = 0 WHERE id = ?")
        .bind(body.username, hashed, body.rol, body.id).run();
    } else {
      await env.DB.prepare("UPDATE usuarios SET username = ?, rol = ? WHERE id = ?")
        .bind(body.username, body.rol, body.id).run();
    }
    return json({ success: true });
  }
  if (body.action === 'delete') {
    await env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(body.id).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada en users' }, 400);
}

// Funciones para manejar Licencias
async function handleLicencias(env, request, body) {
  if (body.action === 'create') {
    await env.DB.prepare("INSERT INTO licencias (codigo, descripcion, limite_dias, larga_duracion) VALUES (?, ?, ?, ?)")
      .bind(body.codigo, body.descripcion, body.limite_dias, body.larga_duracion || 0).run();
    return json({ success: true });
  }
  if (body.action === 'update') {
    await env.DB.prepare("UPDATE licencias SET codigo = ?, descripcion = ?, limite_dias = ?, larga_duracion = ? WHERE id = ?")
      .bind(body.codigo, body.descripcion, body.limite_dias, body.larga_duracion || 0, body.id).run();
    return json({ success: true });
  }
  if (body.action === 'delete') {
    await env.DB.prepare("DELETE FROM licencias WHERE id = ?").bind(body.id).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada en licencias' }, 400);
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  
  try {
    if (type === 'dashboard_init') {
      // Devolver ajustes y usuarios (solo para admin)
      const { results: ajustesRaw } = await env.DB.prepare('SELECT clave, valor FROM ajustes').all();
      const config = {};
      ajustesRaw.forEach(r => config[r.clave] = r.valor);

      const { results: users } = await env.DB.prepare('SELECT id, username, rol, fecha_creacion FROM usuarios').all();
      const { results: licencias } = await env.DB.prepare('SELECT id, codigo, descripcion, limite_dias, larga_duracion FROM licencias').all();

      return json({ config, users, licencias });
    }
    
    if (type === 'settings') {
      const { results } = await env.DB.prepare("SELECT clave, valor FROM ajustes WHERE clave IN ('mobile_login_enabled', 'inst_nombre')").all();
      const settings = { mobile_login_enabled: 'true', inst_nombre: 'EGB 33' };
      results.forEach(r => {
        settings[r.clave] = r.valor;
      });
      return json(settings);
    }
    
    return json({ error: 'Tipo no especificado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  try {
    const body = await request.json();
    
    if (type === 'config') return await handleConfig(env, request, body);
    if (type === 'users') return await handleUsers(env, request, body);
    if (type === 'licencias') return await handleLicencias(env, request, body);
    
    if (type === 'self_password') {
      const { hashPassword } = require('./_utils.js');
      const hashed = hashPassword(body.newPassword);
      const userId = url.searchParams.get('userId');
      await env.DB.prepare("UPDATE usuarios SET password = ?, security_acknowledged = 1 WHERE id = ?").bind(hashed, userId).run();
      return json({ success: true });
    }
    
    if (type === 'acknowledge_security') {
      const userId = url.searchParams.get('userId');
      await env.DB.prepare("UPDATE usuarios SET security_acknowledged = 1 WHERE id = ?").bind(userId).run();
      return json({ success: true });
    }
    
    return json({ error: 'Tipo no soportado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

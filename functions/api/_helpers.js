import { verifyJWT } from "./_utils.js";

export const SYSTEM_VERSION = '3.5.7';

export const HIGH_ROLES = ['admin'];


export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toTitleCase(str) {
  if (!str) return '';
  return str.trim().toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function normalizeCurricularName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}


export async function validateUser(env, request, userId, ...requiredRoles) {
  const authHeader = request?.headers?.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('No se ha proporcionado un token de seguridad.');
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token, env.JWT_SECRET || "default_secret_for_dev_only");

  if (!payload) {
    throw new Error('Sesión inválida o expirada. Por favor, inicie sesión nuevamente.');
  }

  // Si userId es proporcionado, verificar que coincida con el token
  if (userId && Number(payload.id) !== Number(userId)) {
    throw new Error('Acceso no autorizado.');
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(payload.rol) && payload.rol !== 'admin') {
    throw new Error('No tienes permisos para realizar esta acción.');
  }

  return payload;
}

// ─── Curricular Helpers ──────────────────────────────────────────────────────

export function sanitizeTecMaterias(materias = []) {
  return materias
    .filter((materia) => String(materia?.nombre || '').trim())
    .map((materia) => ({
      ...materia,
      nombre: String(materia.nombre || '').trim(),
      tipo: materia?.tipo ?? 'comun',
      es_taller: materia?.es_taller ? 1 : 0
    }));
}

export function getDuplicateCurricularNames(materias = []) {
  const seen = new Map();
  const duplicates = new Set();

  materias.forEach((materia) => {
    const normalized = normalizeCurricularName(materia?.nombre);
    if (!normalized) return;
    if (seen.has(normalized)) duplicates.add(normalized);
    else seen.set(normalized, materia.nombre);
  });

  return Array.from(duplicates).map((key) => seen.get(key) || key);
}

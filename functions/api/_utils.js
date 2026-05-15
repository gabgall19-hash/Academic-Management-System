import bcrypt from 'bcryptjs';
const encoder = new TextEncoder();

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  if (!hash || !password) return false;
  // Check if it's a bcrypt hash
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    return password === hash;
  }
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    return false;
  }
}

export function isBcryptHash(hash) {
  return typeof hash === 'string' && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'));
}


function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const encodedSignature = base64UrlEncode(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = base64UrlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
    
    if (!isValid) return null;
    
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
    
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

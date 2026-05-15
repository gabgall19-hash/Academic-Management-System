import { signJWT, comparePassword, hashPassword, isBcryptHash } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const userAgent = request.headers.get("User-Agent") || "";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // 1. Check if user exists
    const user = await env.DB.prepare(
      "SELECT * FROM usuarios WHERE username = ?"
    ).bind(username).first();

    if (!user || !comparePassword(password, user.password)) {
      return new Response(JSON.stringify({ error: "Credenciales inválidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auto-migration: if password was plain text, update to hash
    if (!isBcryptHash(user.password)) {
      const hashed = hashPassword(password);
      await env.DB.prepare("UPDATE usuarios SET password = ? WHERE id = ?").bind(hashed, user.id).run();
    }

    // 2. Security Check: Mobile Access
    if (isMobile) {
      const setting = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'mobile_login_enabled'").first();
      const enabled = setting ? setting.valor === 'true' : true;
      if (!enabled) {
        return new Response(JSON.stringify({ error: "El acceso desde dispositivos móviles está deshabilitado por el administrador." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Retornamos el usuario y sus permisos
    return new Response(JSON.stringify({
      id: user.id,
      rol: user.rol,
      username: user.username,
      security_acknowledged: user.security_acknowledged,
      token: await signJWT(
        { id: user.id, rol: user.rol, exp: Date.now() + 1 * 60 * 60 * 1000 },
        env.JWT_SECRET || "default_secret_for_dev_only"
      )
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

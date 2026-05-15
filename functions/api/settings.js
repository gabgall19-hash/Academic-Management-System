export async function onRequestGet({ env }) {
  try {
    const settings = await env.DB.prepare("SELECT clave, valor FROM ajustes").all();
    const settingsMap = settings.results.reduce((acc, s) => ({ ...acc, [s.clave]: s.valor }), {});
    
    return new Response(JSON.stringify({ 
      mobile_login_enabled: settingsMap.mobile_login_enabled === 'true',
      tab_visibility: settingsMap.tab_visibility ? JSON.parse(settingsMap.tab_visibility) : {},
      version: '2.9.1'
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

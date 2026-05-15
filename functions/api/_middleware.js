import { verifyJWT, signJWT } from "./_utils.js";

export async function onRequest(context) {
  const { request, next, env } = context;
  const response = await next();
  
  // No procesar si ya hay un error de red o similar
  if (!response) return response;

  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token, env.JWT_SECRET || "default_secret_for_dev_only");
    
    if (payload) {
      // Si el token es válido, generamos uno nuevo con una hora adicional de vida
      // Esto implementa la expiración por inactividad
      const newToken = await signJWT(
        { ...payload, exp: Date.now() + 1 * 60 * 60 * 1000 },
        env.JWT_SECRET || "default_secret_for_dev_only"
      );
      
      // Clonamos la respuesta para poder modificar los headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Refresh-Token', newToken);
      // Exponemos el header para que el navegador pueda leerlo
      newResponse.headers.set('Access-Control-Expose-Headers', 'X-Refresh-Token');
      return newResponse;
    }
  }
  
  return response;
}

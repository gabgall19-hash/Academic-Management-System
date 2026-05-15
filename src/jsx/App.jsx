import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, Eye } from 'lucide-react';
import Dashboard from './panels/Dashboard';
import WelcomeSecurityModal from './components/WelcomeSecurityModal';

// Interceptor global para manejar la expiración por inactividad (Sliding Expiration)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const newToken = response.headers.get('X-Refresh-Token');
  if (newToken) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        user.token = newToken;
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {
        console.error("Error actualizando token de sesión:", e);
      }
    }
  }
  return response;
};

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [showSecurityModal, setShowSecurityModal] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return false;
    const u = JSON.parse(storedUser);
    return u.security_acknowledged !== 1 && u.security_acknowledged !== true;
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileLoginEnabled, setMobileLoginEnabled] = useState(true);
  const [schoolName, setSchoolName] = useState('EGB 33');

  const showToast = React.useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    document.title = `Asistencia - ${schoolName}`;
  }, [schoolName]);

  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      localStorage.removeItem('currentUser');
      navigate('/');
      showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'danger');
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, [navigate, showToast]);

  useEffect(() => {
    const saved = localStorage.getItem('loginData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLoginData(parsed);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch(`/api/data?type=settings&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const isEnabled = data.mobile_login_enabled === true || data.mobile_login_enabled === 'true';
        setMobileLoginEnabled(isEnabled);
        if (data.inst_nombre) setSchoolName(data.inst_nombre);
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (rememberMe) {
      localStorage.setItem('loginData', JSON.stringify({ username, password }));
    } else {
      localStorage.removeItem('loginData');
    }

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (data.error) {
        alert(data.error);
      } else {
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
        if (data.security_acknowledged !== 1 && data.security_acknowledged !== true) {
          setShowSecurityModal(true);
        }
        navigate('/dashboard');
        showToast('Te has conectado a tu sesión', 'success');
      }
    } catch (err) {
      alert("Error al conectar con el servidor: " + err.message);
    }
  };

  const handleUpdateSelfPassword = async (newPassword) => {
    if (!user) return;
    try {
      const resp = await fetch(`/api/data?type=self_password&userId=${user.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      
      if (user) {
        const updatedUser = { ...user, security_acknowledged: 1 };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      showToast('Contraseña actualizada correctamente', 'success');
      setShowSecurityModal(false);
    } catch (err) {
      alert("Error al actualizar contraseña: " + err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    navigate('/');
    showToast('Te has desconectado de tu sesión', 'danger');
  };

  const Toast = ({ message, type, onExited }) => {
    const [isExiting, setIsExiting] = React.useState(false);
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onExited, 400);
      }, 3500);
      return () => clearTimeout(timer);
    }, [onExited]);

    return (
      <div className={isExiting ? "toast-out" : "toast-in"} style={{ 
        position: 'fixed', bottom: '30px', right: '30px', 
        background: type === 'success' ? '#10b981' : '#ef4444', 
        color: 'white', padding: '12px 24px', borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)', zIndex: 10000,
        fontWeight: '700', fontSize: '0.9rem', display: 'flex', gap: '10px'
      }}>
        {type === 'success' ? '✓' : '✕'} {message}
      </div>
    );
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="container" style={{ maxWidth: isDashboard ? 'min(1680px, 96vw)' : '1200px', margin: '0 auto', padding: isDashboard ? '1.25rem' : '2rem' }}>
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onExited={() => setToast(null)} />}

      {showSecurityModal && user && (
        <WelcomeSecurityModal 
          user={user} 
          onConfirm={handleUpdateSelfPassword} 
          onBypass={async () => {
            try {
              await fetch(`/api/data?type=acknowledge_security&userId=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({})
              });
              const updatedUser = { ...user, security_acknowledged: 1 };
              setUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              setShowSecurityModal(false);
            } catch (err) {
              console.error("Error acknowledging security:", err);
              setShowSecurityModal(false);
            }
          }} 
        />
      )}

      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                  <h2 style={{ fontSize: '1.2rem', textAlign: 'center' }}>Asistencia Docentes {schoolName}</h2>
                </div>

                {isMobile && (
                  <div style={{ 
                    background: mobileLoginEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)', 
                    border: `1px solid ${mobileLoginEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.5)'}`, 
                    padding: '0.75rem', borderRadius: '12px', marginBottom: '1.2rem',
                    color: mobileLoginEnabled ? '#10b981' : '#ff4d4d', fontSize: '0.85rem', fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {mobileLoginEnabled ? "Acceso móvil habilitado" : "Acceso deshabilitado en móviles."}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Usuario</label>
                    <input type="text" name="username" className="input-field" placeholder="Usuario" required style={{ padding: '0.6rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        className="input-field" 
                        placeholder="••••••••" 
                        required 
                        style={{ padding: '0.6rem', paddingRight: '40px' }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPassword ? <Eye size={16} /> : <span>👁️</span>}
                      </button>
                    </div>
                  </div>
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                    <label htmlFor="remember" style={{ margin: 0, fontSize: '0.85rem' }}>Recordarme</label>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isMobile && !mobileLoginEnabled}>
                    <LogIn size={18} /> Ingresar
                  </button>
                </form>
              </div>
            </div>
          )
        } />

        <Route path="/dashboard/*" element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} showToast={showToast} isMobile={isMobile} schoolName={schoolName} onSchoolNameChange={setSchoolName} />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

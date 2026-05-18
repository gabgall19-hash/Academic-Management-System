import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './panels/Dashboard';
import WelcomeSecurityModal from './components/WelcomeSecurityModal';
import LoginPage from './components/LoginPage';
import Toast from './UI/Toast';
import {
  clearRememberedLogin,
  clearStoredUser,
  getRememberedLogin,
  getStoredUser,
  installRefreshTokenInterceptor,
  saveRememberedLogin,
  shouldShowSecurityModal,
  storeUser
} from './functions/session';

installRefreshTokenInterceptor();

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [showSecurityModal, setShowSecurityModal] = useState(() => shouldShowSecurityModal(getStoredUser()));
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileLoginEnabled, setMobileLoginEnabled] = useState(true);
  const [schoolName, setSchoolName] = useState('EGB 33');

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = React.useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    document.title = `Asistencia - ${schoolName}`;
  }, [schoolName]);

  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      clearStoredUser();
      navigate('/');
      showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'danger');
    };

    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, [navigate, showToast]);

  useEffect(() => {
    const saved = getRememberedLogin();
    if (saved) {
      setLoginData({
        username: saved.username || '',
        password: saved.password || ''
      });
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
      .then((res) => res.json())
      .then((data) => {
        const isEnabled = data.mobile_login_enabled === true || data.mobile_login_enabled === 'true';
        setMobileLoginEnabled(isEnabled);
        if (data.inst_nombre) setSchoolName(data.inst_nombre);
      })
      .catch((err) => console.error('Error fetching settings:', err));
  }, []);

  const updateUserSession = (updatedUser) => {
    setUser(updatedUser);
    storeUser(updatedUser);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const credentials = {
      username: loginData.username,
      password: loginData.password
    };

    if (rememberMe) {
      saveRememberedLogin(credentials);
    } else {
      clearRememberedLogin();
    }

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await resp.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      updateUserSession(data);
      setShowSecurityModal(shouldShowSecurityModal(data));
      navigate('/dashboard');
      showToast('Te has conectado a tu sesión', 'success');
    } catch (err) {
      alert(`Error al conectar con el servidor: ${err.message}`);
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

      updateUserSession({ ...user, security_acknowledged: 1 });
      showToast('Contraseña actualizada correctamente', 'success');
      setShowSecurityModal(false);
    } catch (err) {
      alert(`Error al actualizar contraseña: ${err.message}`);
    }
  };

  const handleSecurityBypass = async () => {
    if (!user) return;

    try {
      await fetch(`/api/data?type=acknowledge_security&userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({})
      });
      updateUserSession({ ...user, security_acknowledged: 1 });
    } catch (err) {
      console.error('Error acknowledging security:', err);
    } finally {
      setShowSecurityModal(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    clearStoredUser();
    navigate('/');
    showToast('Te has desconectado de tu sesión', 'danger');
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="container" style={{ maxWidth: isDashboard ? 'min(1680px, 96vw)' : '1200px', margin: '0 auto', padding: isDashboard ? '1.25rem' : '2rem' }}>
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onExited={() => setToast(null)} />}

      {showSecurityModal && user && (
        <WelcomeSecurityModal
          user={user}
          onConfirm={handleUpdateSelfPassword}
          onBypass={handleSecurityBypass}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage
                schoolName={schoolName}
                isMobile={isMobile}
                mobileLoginEnabled={mobileLoginEnabled}
                loginData={loginData}
                rememberMe={rememberMe}
                showPassword={showPassword}
                onLoginDataChange={setLoginData}
                onRememberMeChange={setRememberMe}
                onShowPasswordChange={setShowPassword}
                onLogin={handleLogin}
              />
            )
          }
        />

        <Route
          path="/dashboard/*"
          element={
            user ? (
              <Dashboard
                user={user}
                onLogout={handleLogout}
                showToast={showToast}
                isMobile={isMobile}
                schoolName={schoolName}
                onSchoolNameChange={setSchoolName}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

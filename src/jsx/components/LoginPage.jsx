import React from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = ({
  schoolName,
  isMobile,
  mobileLoginEnabled,
  loginData,
  rememberMe,
  showPassword,
  onLoginDataChange,
  onRememberMeChange,
  onShowPasswordChange,
  onLogin
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', textAlign: 'center' }}>Asistencia Docentes {schoolName}</h2>
        </div>

        {isMobile && (
          <div
            style={{
              background: mobileLoginEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${mobileLoginEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.5)'}`,
              padding: '0.75rem',
              borderRadius: '12px',
              marginBottom: '1.2rem',
              color: mobileLoginEnabled ? '#10b981' : '#ff4d4d',
              fontSize: '0.85rem',
              fontWeight: '600',
              textAlign: 'center'
            }}
          >
            {mobileLoginEnabled ? 'Acceso móvil habilitado' : 'Acceso deshabilitado en móviles.'}
          </div>
        )}

        <form onSubmit={onLogin}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Usuario</label>
            <input
              type="text"
              name="username"
              className="input-field"
              placeholder="Usuario"
              required
              value={loginData.username}
              onChange={(e) => onLoginDataChange({ ...loginData, username: e.target.value })}
              style={{ padding: '0.6rem' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input-field"
                placeholder="********"
                required
                value={loginData.password}
                onChange={(e) => onLoginDataChange({ ...loginData, password: e.target.value })}
                style={{ padding: '0.6rem', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => onShowPasswordChange(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <label htmlFor="remember" style={{ margin: 0, fontSize: '0.85rem' }}>Recordarme</label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isMobile && !mobileLoginEnabled}>
            <LogIn size={18} /> Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

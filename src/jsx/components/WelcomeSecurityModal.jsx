import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const WelcomeSecurityModal = ({ user, onConfirm, onBypass }) => {
  const [step, setStep] = useState('welcome'); // 'welcome' or 'reset'
  const [passwords, setPasswords] = useState({ password: '', repeat: '' });
  const [showPass, setShowPass] = useState(true);
  const [loading, setLoading] = useState(false);

  if (step === 'welcome') {
    return (
      <div className="modal-overlay" style={{ zIndex: 11000, backdropFilter: 'blur(10px)' }}>
        <div className="glass-card" style={{ maxWidth: '450px', padding: '2rem', textAlign: 'center', animation: 'modalIn 0.4s ease-out' }}>
          <div style={{ 
            background: user.reset_by_admin ? 'rgba(245, 158, 11, 0.2)' : 'var(--primary)', 
            width: '60px', 
            height: '60px', 
            borderRadius: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            border: user.reset_by_admin ? '1px solid rgba(245, 158, 11, 0.4)' : 'none'
          }}>
            {user.reset_by_admin ? <ShieldAlert size={30} color="#f59e0b" /> : <Lock size={30} color="white" />}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1rem', color: 'white' }}>
            {user.reset_by_admin ? 'Acción de Seguridad' : `¡Bienvenido ${user.nombre}!`}
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '2rem', color: 'rgba(255,255,255,0.8)' }}>
            {user.reset_by_admin 
              ? 'Tu contraseña ha sido restablecida por la administración. Por seguridad institucional, debes configurar una nueva clave personal para continuar.'
              : 'Como medida de seguridad, solicitamos a todo personal a cambiar su contraseña una vez haya ingresado:'}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setStep('reset')}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
              <CheckCircle2 size={18} /> Restablecer contraseña
            </button>
            
            <button 
              onClick={onBypass}
              style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#ff8080', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                padding: '0.8rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                cursor: 'pointer',
                marginTop: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              Continuar de todos modos con la contraseña actual
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.password !== passwords.repeat) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (passwords.password.length < 4) {
      alert("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(passwords.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 11000, backdropFilter: 'blur(10px)' }}>
      <div className="glass-card" style={{ maxWidth: '450px', padding: '2rem', animation: 'modalIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--success)', padding: '8px', borderRadius: '10px' }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>Crear nueva contraseña</h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block', opacity: 0.8 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPass ? "text" : "password"}
                className="input-field"
                value={passwords.password}
                onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                required
                placeholder="Nueva contraseña"
                style={{ paddingRight: '45px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block', opacity: 0.8 }}>Repetir contraseña</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPass ? "text" : "password"}
                className="input-field"
                value={passwords.repeat}
                onChange={(e) => setPasswords({ ...passwords, repeat: e.target.value })}
                required
                placeholder="Confirmar contraseña"
                style={{ paddingRight: '45px' }}
              />
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
            En caso de olvidar o perder la contraseña tendrá que ser solicitado el restablecimiento en la institución.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setStep('welcome')}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Volver
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !passwords.password || passwords.password !== passwords.repeat}
              style={{ flex: 2, fontWeight: 'bold' }}
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WelcomeSecurityModal;

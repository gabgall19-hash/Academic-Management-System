import React, { useState, useEffect } from 'react';
import { Layers, Settings, LogOut, Menu, X, ShieldAlert, Moon, Sun } from 'lucide-react';
import AttendancePanel from './AttendancePanel';
import SettingsPanel from './SettingsPanel';

const Dashboard = ({ user, onLogout, onUpdateSelfPassword, isMobile, showToast, schoolName, onSchoolNameChange, theme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('asistencia');
  const [data, setData] = useState({ users: [], config: {} });
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTeacherDetailOpen, setIsTeacherDetailOpen] = useState(false);

  // Estados para SettingsPanel
  const emptyUser = { id: null, nombre: '', username: '', password: '', rol: 'preceptor' };
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/data?type=dashboard_init`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error cargando datos globales');
      setData(json);
      if (json.config?.inst_nombre) {
        onSchoolNameChange(json.config.inst_nombre);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.token]);

  const apiService = {
    fetchData: async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          ...(options.headers || {})
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'API Error');
      return json;
    }
  };

  const handleUpdateSetting = async (clave, valor) => {
    try {
      await apiService.fetchData('/api/data?type=config', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_setting', clave, valor })
      });
      setData(prev => ({ ...prev, config: { ...prev.config, [clave]: valor } }));
      if (clave === 'inst_nombre') onSchoolNameChange(valor);
      showToast('Ajuste actualizado', 'success');
    } catch(err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateMobileLogin = async (enabled) => {
    handleUpdateSetting('mobile_login_enabled', enabled);
  };

  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setUserForm({ ...emptyUser, ...u, password: '' });
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${u.username}?`)) return;
    try {
      await apiService.fetchData('/api/data?type=users', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: u.id })
      });
      showToast('Usuario eliminado', 'success');
      loadData();
    } catch(err) {
      showToast(err.message, 'error');
    }
  };

  const saveUserForm = async (e) => {
    if(e) e.preventDefault();
    try {
      await apiService.fetchData('/api/data?type=users', {
        method: 'POST',
        body: JSON.stringify({ action: editingUserId === 'new' ? 'create' : 'update', ...userForm })
      });
      showToast(`Usuario ${editingUserId === 'new' ? 'creado' : 'actualizado'}`, 'success');
      setEditingUserId(null);
      loadData();
    } catch(err) {
      showToast(err.message, 'error');
    }
  };

  const handleLicenciaAction = async (action, payload) => {
    try {
      await apiService.fetchData('/api/data?type=licencias', {
        method: 'POST',
        body: JSON.stringify({ action, ...payload })
      });
      showToast(`Licencia ${action === 'create' ? 'creada' : action === 'update' ? 'actualizada' : 'eliminada'}`, 'success');
      loadData();
    } catch(err) {
      showToast(err.message, 'error');
    }
  };

  const tabs = [
    { id: 'asistencia', label: 'Asistencia', icon: <Layers size={18} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={18} />, adminOnly: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      


      {/* Header */}
      <header className="panel-toolbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isMobile && !isTeacherDetailOpen && <button className="icon-btn" onClick={() => setIsMenuOpen(true)}><Menu size={20} /></button>}
          <img src="/escudo.svg" alt="Escudo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ color: 'var(--primary)', fontSize: '1.4rem', margin: 0 }}>{schoolName}</h1>
            <p style={{ opacity: 0.6, fontSize: '0.8rem', margin: 0, marginTop: '2px' }}>Sistema de Asistencia</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.4rem 1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <button className="icon-btn" onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} title="Alternar tema" style={{ color: 'var(--text-main)' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {!isMobile && <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>}

          {!isMobile && <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'lowercase' }}>@{user.rol}</div>
            <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.65rem', textTransform: 'none', letterSpacing: '0.05em' }}>{user.username}</div>
          </div>}
          
          {!isMobile && <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>}

          <button className="icon-btn" style={{ color: 'var(--danger)', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)' }} onClick={onLogout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Navegación Desktop */}
      {!isMobile && !isTeacherDetailOpen && (
        <div className="tab-nav">
          {tabs.filter(t => !t.adminOnly || user.rol === 'admin').map(tab => (
            <button 
              key={tab.id} 
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Drawer Mobile */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
        <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
          <div className="menu-header">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Menú</h2>
            <button className="icon-btn" onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
          </div>
          <div className="menu-nav">
            {tabs.filter(t => !t.adminOnly || user.rol === 'admin').map(tab => (
              <button 
                key={tab.id} 
                className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>Cargando datos del sistema...</div>
        ) : (
          <>
            {activeTab === 'asistencia' && (
              <AttendancePanel 
                user={user} 
                data={data} 
                apiService={apiService} 
                showToast={showToast} 
                isMobile={isMobile} 
                onTeacherDetailToggle={setIsTeacherDetailOpen}
              />
            )}
            {activeTab === 'settings' && user.rol === 'admin' && (
              <SettingsPanel 
                user={user} 
                data={data} 
                isMobile={isMobile} 
                editingUserId={editingUserId}
                setEditingUserId={setEditingUserId}
                userForm={userForm}
                setUserForm={setUserForm}
                emptyUser={emptyUser}
                startEditUser={startEditUser}
                deleteUser={deleteUser}
                saveUserForm={saveUserForm}
                handleUpdateMobileLogin={handleUpdateMobileLogin}
                handleUpdateSetting={handleUpdateSetting}
                handleLicenciaAction={handleLicenciaAction}
                apiService={apiService}
                showToast={showToast}
                loadData={loadData}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
};

export default Dashboard;

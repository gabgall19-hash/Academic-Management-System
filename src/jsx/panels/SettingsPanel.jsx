import React from 'react';
import { Users, Plus, Wrench, Trash2, Smartphone, Building, MapPin, UserCheck, Search } from 'lucide-react';
import Modal from '../UI/Modal';
import SaveStatusButton from '../UI/SaveStatusButton';

const SettingsPanel = ({
  user, data, isMobile,
  editingUserId, setEditingUserId,
  userForm, setUserForm, emptyUser,
  startEditUser, deleteUser, saveUserForm,
  handleUpdateMobileLogin,
  handleUpdateSetting,
  handleLicenciaAction
}) => {
  const [showLicenseModal, setShowLicenseModal] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [licenseSearch, setLicenseSearch] = React.useState('');
  const [editingLicencia, setEditingLicencia] = React.useState(null); // { id, codigo, descripcion, limite_dias, larga_duracion } o 'new'
  const [licenciaForm, setLicenciaForm] = React.useState({ codigo: '', descripcion: '', limite_dias: '', larga_duracion: 0 });

  const [userSearch, setUserSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const usersPerPage = 10;

  const [instForm, setInstForm] = React.useState({
    inst_nombre: '',
    inst_codigo: '',
    inst_localidad: '',
    inst_director: '',
    imgbb_api_key: ''
  });

  React.useEffect(() => {
    if (data.config) {
      setInstForm({
        inst_nombre: data.config.inst_nombre || '',
        inst_codigo: data.config.inst_codigo || '',
        inst_localidad: data.config.inst_localidad || '',
        inst_director: data.config.inst_director || '',
        imgbb_api_key: data.config.imgbb_api_key || ''
      });
    }
  }, [data.config]);

  const saveInstSettings = async (type) => {
    if (type === 'inst') {
      await handleUpdateSetting('inst_nombre', instForm.inst_nombre);
      await handleUpdateSetting('inst_codigo', instForm.inst_codigo);
      await handleUpdateSetting('inst_localidad', instForm.inst_localidad);
      await handleUpdateSetting('inst_director', instForm.inst_director);
    } else if (type === 'imgbb') {
      await handleUpdateSetting('imgbb_api_key', instForm.imgbb_api_key);
    }
  };
  
  const isInstChanged = React.useMemo(() => {
    return instForm.inst_nombre !== (data.config?.inst_nombre || '') ||
           instForm.inst_codigo !== (data.config?.inst_codigo || '') ||
           instForm.inst_localidad !== (data.config?.inst_localidad || '') ||
           instForm.inst_director !== (data.config?.inst_director || '');
  }, [instForm, data.config]);

  const isImgBBChanged = React.useMemo(() => {
    return instForm.imgbb_api_key !== (data.config?.imgbb_api_key || '');
  }, [instForm.imgbb_api_key, data.config]);

  const filteredLicencias = (data.licencias || []).filter(lic => 
    lic.codigo.toLowerCase().includes(licenseSearch.toLowerCase()) || 
    lic.descripcion.toLowerCase().includes(licenseSearch.toLowerCase())
  );

  return (
    <section className="page-section management-grid">
      {/* Modal de Gestión de Licencias */}
      {showLicenseModal && (
        <Modal title="Gestión de Licencias y Nomenclaturas" onClose={() => { setShowLicenseModal(false); setEditingLicencia(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            
            {editingLicencia ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editingLicencia === 'new' ? 'Nueva Licencia' : 'Editar Licencia'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Código (Nomenclatura)
                    <input 
                      type="text" className="input-field" placeholder="Ej: L8, EC, PN..." 
                      value={licenciaForm.codigo} onChange={e => setLicenciaForm({...licenciaForm, codigo: e.target.value.toUpperCase()})}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>Descripción (Nombre de la licencia)
                    <input 
                      type="text" className="input-field" placeholder="Ej: Paro Nacional..." 
                      value={licenciaForm.descripcion} onChange={e => setLicenciaForm({...licenciaForm, descripcion: e.target.value})}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>Límite de días por año (opcional)
                    <input 
                      type="number" className="input-field" placeholder="Ej: 30" 
                      value={licenciaForm.limite_dias} onChange={e => setLicenciaForm({...licenciaForm, limite_dias: e.target.value})}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', marginTop: '5px' }}>
                    <input 
                      type="checkbox" checked={licenciaForm.larga_duracion === 1} 
                      onChange={e => setLicenciaForm({...licenciaForm, larga_duracion: e.target.checked ? 1 : 0})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Habilitar para "Inicio de Licencia" (Larga Duración)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                    <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditingLicencia(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                      if (licenciaForm.codigo && licenciaForm.descripcion) {
                        handleLicenciaAction(editingLicencia === 'new' ? 'create' : 'update', { 
                          id: editingLicencia === 'new' ? undefined : editingLicencia.id, 
                          ...licenciaForm 
                        });
                        setEditingLicencia(null);
                      }
                    }}>Guardar</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Buscar licencia..." 
                    value={licenseSearch}
                    onChange={e => setLicenseSearch(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    setLicenciaForm({ codigo: '', descripcion: '', limite_dias: '', larga_duracion: 0 });
                    setEditingLicencia('new');
                  }}>
                    <Plus size={16} /> Nueva Licencia
                  </button>
                </div>

                <div className="license-list" style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                  {filteredLicencias.map(lic => (
                    <div key={lic.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', minWidth: '55px', textAlign: 'center' }}>
                          {lic.codigo}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{lic.descripcion}</div>
                          {lic.limite_dias && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                              Límite: {lic.limite_dias} días/año
                            </div>
                          )}
                          {lic.larga_duracion === 1 && (
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>
                              [Larga Duración]
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="icon-btn" onClick={() => {
                          setLicenciaForm({ 
                            codigo: lic.codigo, 
                            descripcion: lic.descripcion, 
                            limite_dias: lic.limite_dias || '',
                            larga_duracion: lic.larga_duracion || 0 
                          });
                          setEditingLicencia(lic);
                        }}><Wrench size={14} /></button>
                        <button className="icon-btn danger" onClick={() => {
                          if (confirm(`¿Eliminar licencia ${lic.codigo}?`)) {
                            handleLicenciaAction('delete', { id: lic.id });
                          }
                        }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {!editingLicencia && <button className="btn" onClick={() => setShowLicenseModal(false)} style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}>Cerrar Ventana</button>}
          </div>
        </Modal>
      )}

      {/* Modal de Gestión de Usuarios */}
      {showUserModal && (
        <Modal title="Gestión de Cuentas de Usuarios" onClose={() => { setShowUserModal(false); setEditingUserId(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            
            {editingUserId ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editingUserId === 'new' ? 'Nuevo Usuario' : 'Editar Usuario'}</h3>
                <form className="stack-form" onSubmit={(e) => { e.preventDefault(); saveUserForm(); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Usuario (Login)
                    <input 
                      type="text" className="input-field" placeholder="Ej: maria.gonzalez..." 
                      value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} 
                      required
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>Rol
                    <select className="input-field" value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})}>
                      <option value="admin">Administrador</option>
                      <option value="profesor">Profesor (Lector)</option>
                    </select>
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>{editingUserId === 'new' ? 'Contraseña' : 'Nueva Contraseña (opcional)'}
                    <input 
                      type="password" className="input-field" placeholder={editingUserId === 'new' ? 'Escribe la contraseña...' : 'Dejar en blanco para no cambiar...'} 
                      value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} 
                      required={editingUserId === 'new'}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                    <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditingUserId(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Buscar por usuario o rol..." 
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setCurrentPage(1); }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    setEditingUserId('new');
                    setUserForm({ ...emptyUser, rol: 'profesor' });
                  }}>
                    <Plus size={16} /> Nuevo Usuario
                  </button>
                </div>

                <div className="user-list" style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                  {(() => {
                    const filtered = (data.users || []).filter(u => {
                      const lowerSearch = userSearch.toLowerCase();
                      if (u.username?.toLowerCase().includes(lowerSearch)) return true;
                      if (u.rol?.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)) return true;
                      return false;
                    });
                    const totalPages = Math.ceil(filtered.length / usersPerPage);
                    const paged = filtered.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

                    if (paged.length === 0) {
                      return <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No se encontraron usuarios</div>;
                    }

                    return (
                      <>
                        {paged.map((u) => (
                          <div key={u.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div style={{ width: '36px', height: '36px', background: 'rgba(0,120,215,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <UserCheck size={18} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{u.username}</div>
                                <div style={{ marginTop: '2px' }}>
                                  <span className={`badge badge-${u.rol}`} style={{ fontSize: '0.65rem' }}>{u.rol?.replace(/_/g, ' ')}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button className="icon-btn" onClick={() => startEditUser(u)} title="Editar Usuario"><Wrench size={14} /></button>
                              {(user.rol === 'admin' || user.rol === 'jefe_de_auxiliares') && (
                                <button 
                                  className="icon-btn danger" 
                                  onClick={() => deleteUser(u)} 
                                  disabled={u.id === user.id}
                                  title="Eliminar Usuario"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {totalPages > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button className="btn btn-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Anterior</button>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Página {currentPage} de {totalPages}</span>
                            <button className="btn btn-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Siguiente</button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {!editingUserId && <button className="btn" onClick={() => { setShowUserModal(false); setEditingUserId(null); }} style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}>Cerrar Ventana</button>}
          </div>
        </Modal>
      )}

      {/* Acceso a Gestión de Usuarios */}
      <section className="management-card" style={{ gridColumn: isMobile ? 'auto' : 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', background: 'rgba(0,120,215,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Gestión de Usuarios</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Administra las cuentas de acceso, roles y contraseñas de los preceptores y profesores.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
          Configurar Usuarios
        </button>
      </section>
      
      {/* Acceso a Gestión de Licencias */}
      <section className="management-card" style={{ gridColumn: isMobile ? 'auto' : 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', background: 'rgba(0,120,215,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Building size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Licencias y Nomenclaturas</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Administra los códigos y motivos de inasistencia del sistema.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLicenseModal(true)}>
          Configurar Licencias
        </button>
      </section>

      <section className="management-card" style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '1.5rem', marginTop: '0' }}>

          {/* Datos Institucionales */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} /> Datos de la Institución
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Nombre del Establecimiento
                <input 
                  type="text" className="input-field" 
                  value={instForm.inst_nombre} 
                  onChange={(e) => setInstForm({...instForm, inst_nombre: e.target.value})}
                />
              </label>
              <label style={{ fontSize: '0.85rem' }}>Código de la Escuela
                <input 
                  type="text" className="input-field" 
                  value={instForm.inst_codigo} 
                  onChange={(e) => setInstForm({...instForm, inst_codigo: e.target.value})}
                />
              </label>
              <label style={{ fontSize: '0.85rem' }}>Localidad
                <input 
                  type="text" className="input-field" 
                  value={instForm.inst_localidad} 
                  onChange={(e) => setInstForm({...instForm, inst_localidad: e.target.value})}
                />
              </label>
              <label style={{ fontSize: '0.85rem' }}>Director/a
                <input 
                  type="text" className="input-field" 
                  value={instForm.inst_director} 
                  onChange={(e) => setInstForm({...instForm, inst_director: e.target.value})}
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: 0 }}>* Estos datos aparecerán automáticamente en los encabezados de las planillas imprimibles.</p>
              <SaveStatusButton hasChanges={isInstChanged} onClick={() => saveInstSettings('inst')} />
            </div>
          </div>

          {/* Configuración ImgBB */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Configuración de Almacenamiento (ImgBB)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>ImgBB API Key
                <input 
                  type="password" className="input-field" 
                  placeholder="Tu API Key de ImgBB..."
                  value={instForm.imgbb_api_key} 
                  onChange={(e) => setInstForm({...instForm, imgbb_api_key: e.target.value})}
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: 0 }}>
                Obtén tu API Key gratuita en <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>api.imgbb.com</a>. 
              </p>
              <SaveStatusButton hasChanges={isImgBBChanged} onClick={() => saveInstSettings('imgbb')} />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default SettingsPanel;

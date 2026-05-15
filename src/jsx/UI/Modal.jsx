import React from 'react';

const Modal = ({ title, children, onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '95vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
        <div className="section-title"><h2 style={{ fontSize: '1.25rem' }}>{title}</h2></div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

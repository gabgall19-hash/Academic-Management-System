import React from 'react';
import { Check, X } from 'lucide-react';

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
    <div
      className={isExiting ? 'toast-out' : 'toast-in'}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        zIndex: 10000,
        fontWeight: '700',
        fontSize: '0.9rem',
        display: 'flex',
        gap: '10px'
      }}
    >
      {type === 'success' ? <Check size={16} /> : <X size={16} />} {message}
    </div>
  );
};

export default Toast;

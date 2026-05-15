import React from 'react';
import { Save } from 'lucide-react';

const SaveStatusButton = ({
  onClick,
  loading = false,
  hasChanges = false,
  disabled = false,
  canEdit = true,
  isMobile = false,
  className = '',
  style = {},
  fullLabel = 'Guardar Cambios',
  mobileLabel = 'Guardar',
  savedLabel = 'Guardado',
  iconSize = 18,
  type = 'button'
}) => {
  const isSaved = !hasChanges;
  const finalDisabled = disabled || loading || !canEdit || (!hasChanges && type === 'button');

  return (
    <button
      type={type}
      className={`btn btn-primary ${hasChanges ? 'btn-shake' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={finalDisabled}
      style={{
        transition: 'all 0.3s ease',
        background: isSaved ? 'rgba(16, 185, 129, 0.2)' : 'var(--primary)',
        color: isSaved ? '#10b981' : 'white',
        opacity: 1,
        ...style
      }}
    >
      {loading ? <Save size={iconSize} className="animate-spin" /> : <Save size={iconSize} />}
      <span>{isSaved ? savedLabel : (isMobile ? mobileLabel : fullLabel)}</span>
    </button>
  );
};

export default SaveStatusButton;

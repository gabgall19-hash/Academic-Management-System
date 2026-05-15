import React from 'react';
import '../../css/UI/Skeleton.css';

const Skeleton = ({ type = 'text', className = '' }) => {
  const classes = `skeleton skeleton-${type} ${className}`;
  return <div className={classes} />;
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="skeleton-table-wrapper">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row-flex">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} type="text" className={`skeleton-cell-dynamic ${j === 0 ? 'first' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

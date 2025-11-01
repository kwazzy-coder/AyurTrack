
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-lg shadow p-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;

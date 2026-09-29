import React from 'react';
import signatureSvg from '../../public/header-animation.svg?raw';

export const AnimatedIcon: React.FC = () => {
  return (
    <div
      className="header-animation"
      dangerouslySetInnerHTML={{ __html: signatureSvg }}
    />
  );
};

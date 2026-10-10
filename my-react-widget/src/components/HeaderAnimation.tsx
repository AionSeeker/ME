import React from 'react';
import signatureSvg from '../../public/header-animation.svg';

export const AnimatedIcon: React.FC = () => {
  return (
    <div
      className="header-animation"
      dangerouslySetInnerHTML={{ __html: signatureSvg }}
    />
  );
};

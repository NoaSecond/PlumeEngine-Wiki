import React, { useState, useEffect } from 'react';

interface SvgIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, className = '', size = 24 }) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(`/icons/${name}.svg`);
        const svgText = await response.text();
        // Replace stroke="currentColor" to ensure color is inherited
        const modifiedSvg = svgText.replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
        setSvgContent(modifiedSvg);
      } catch (error) {
        console.error(`Erreur lors du chargement de l'icône ${name}:`, error);
      }
    };

    loadSvg();
  }, [name]);

  if (!svgContent) {
    return <div className={`${className} w-${size/4} h-${size/4}`} />; // Placeholder
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default SvgIcon;

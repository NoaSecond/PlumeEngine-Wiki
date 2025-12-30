import React from 'react';

export const SectionDragHandle: React.FC<{ className?: string; isDarkMode?: boolean }> = ({ className = '', isDarkMode = false }) => (
  <div 
    className={`cursor-grab active:cursor-grabbing hover:bg-slate-500/20 p-1 rounded transition-colors ${className}`} 
    style={{ touchAction: 'none' }}
    title="Glisser pour réorganiser la section"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}
    >
      <circle cx="9" cy="12" r="1"/>
      <circle cx="9" cy="5" r="1"/>
      <circle cx="9" cy="19" r="1"/>
      <circle cx="15" cy="12" r="1"/>
      <circle cx="15" cy="5" r="1"/>
      <circle cx="15" cy="19" r="1"/>
    </svg>
  </div>
);

export default SectionDragHandle;

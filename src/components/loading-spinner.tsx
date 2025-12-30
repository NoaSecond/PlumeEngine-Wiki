import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  speed?: string;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "40",
  speed = "1.5",
  color = "#06b6d4",
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="animate-spin rounded-full border-4 border-t-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: `${color} transparent transparent transparent`,
          animationDuration: `${speed}s`
        }}
      ></div>
    </div>
  );
};

interface LoadingPageProps {
  title?: string;
  subtitle?: string;
  size?: string;
  speed?: string;
  color?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = "Loading...",
  subtitle = "Please wait while we prepare your session",
  size = "60",
  speed = "1.5",
  color = "#06b6d4"
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center z-50">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-slate-400 mb-8 text-lg">
        {subtitle}
      </p>
      <LoadingSpinner size={size} speed={speed} color={color} />
    </div>
  );
};

import React from 'react';

interface LoadingAnimationProps {
  progress: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-32 h-32 relative">
        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
        <div 
          className="absolute inset-0 border-4 border-indigo-500 rounded-full"
          style={{
            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(progress * Math.PI / 50)}% ${50 - 50 * Math.cos(progress * Math.PI / 50)}%)`
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-indigo-500">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="mt-4 text-lg text-indigo-700">正在计算城市数据，请稍候...</p>
    </div>
  );
};

export default LoadingAnimation;
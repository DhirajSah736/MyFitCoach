import React from 'react';

interface DumbbellImageProps {
  className?: string;
}

const DumbbellImage: React.FC<DumbbellImageProps> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* SVG Dumbbell with transparent background */}
      <svg
        width="400"
        height="200"
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
        style={{ 
          opacity: 0.87,
          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))'
        }}
      >
        {/* Left Weight Plate */}
        <g>
          {/* Outer Ring */}
          <circle
            cx="60"
            cy="100"
            r="45"
            fill="url(#leftGradient)"
            stroke="url(#metalStroke)"
            strokeWidth="2"
          />
          {/* Inner Ring */}
          <circle
            cx="60"
            cy="100"
            r="30"
            fill="url(#innerGradient)"
            stroke="#4a5568"
            strokeWidth="1"
          />
          {/* Center Hole */}
          <circle
            cx="60"
            cy="100"
            r="15"
            fill="#1a202c"
            stroke="#2d3748"
            strokeWidth="1"
          />
          {/* Weight Text */}
          <text
            x="60"
            y="105"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            25
          </text>
        </g>

        {/* Right Weight Plate */}
        <g>
          {/* Outer Ring */}
          <circle
            cx="340"
            cy="100"
            r="45"
            fill="url(#rightGradient)"
            stroke="url(#metalStroke)"
            strokeWidth="2"
          />
          {/* Inner Ring */}
          <circle
            cx="340"
            cy="100"
            r="30"
            fill="url(#innerGradient)"
            stroke="#4a5568"
            strokeWidth="1"
          />
          {/* Center Hole */}
          <circle
            cx="340"
            cy="100"
            r="15"
            fill="#1a202c"
            stroke="#2d3748"
            strokeWidth="1"
          />
          {/* Weight Text */}
          <text
            x="340"
            y="105"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            25
          </text>
        </g>

        {/* Main Bar */}
        <rect
          x="105"
          y="92"
          width="190"
          height="16"
          fill="url(#barGradient)"
          stroke="#2d3748"
          strokeWidth="1"
          rx="8"
        />

        {/* Bar Grip Texture */}
        <g opacity="0.6">
          {[...Array(15)].map((_, i) => (
            <line
              key={i}
              x1={115 + i * 12}
              y1="94"
              x2={115 + i * 12}
              y2="106"
              stroke="#4a5568"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Left Collar */}
        <rect
          x="95"
          y="88"
          width="20"
          height="24"
          fill="url(#collarGradient)"
          stroke="#2d3748"
          strokeWidth="1"
          rx="4"
        />

        {/* Right Collar */}
        <rect
          x="285"
          y="88"
          width="20"
          height="24"
          fill="url(#collarGradient)"
          stroke="#2d3748"
          strokeWidth="1"
          rx="4"
        />

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4a5568" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          
          <linearGradient id="collarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="metalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default DumbbellImage;
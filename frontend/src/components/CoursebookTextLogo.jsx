export default function CoursebookTextLogo({ className = "", isDarkMode = true, showUnderline = true }) {
  const textColor = isDarkMode ? "#ffffff" : "#111827";
  const textColorLight = isDarkMode ? "#f0f9ff" : "#1f2937";
  const lineColorBase = isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(59, 130, 246, 0.3)";
  const glowColor = isDarkMode ? "#ffffff" : "#3b82f6";
  
  return (
    <svg
      viewBox="0 0 300 60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: textColor, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: textColorLight, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: textColor, stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={lineColorBase}>
            <animate attributeName="stop-opacity" values="0.3;0.3;0.3;1;0.3" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="25%" stopColor={lineColorBase}>
            <animate attributeName="stop-opacity" values="0.4;0.3;1;0.3;0.4" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor={lineColorBase}>
            <animate attributeName="stop-opacity" values="0.5;1;0.3;0.3;0.5" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="75%" stopColor={lineColorBase}>
            <animate attributeName="stop-opacity" values="0.4;0.3;0.3;1;0.4" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor={lineColorBase}>
            <animate attributeName="stop-opacity" values="0.3;0.3;0.3;0.3;1" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.5" />
          <feComposite in2="blur" operator="in" result="softGlow" />
          <feMorphology operator="dilate" radius="1" in="softGlow" result="expanded" />
          <feGaussianBlur in="expanded" stdDeviation="2" result="finalGlow" />
          <feMerge>
            <feMergeNode in="finalGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="lineGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur1" />
          <feGaussianBlur in="blur1" stdDeviation="6" result="blur2" />
          <feGaussianBlur in="blur2" stdDeviation="4" result="blur3" />
          <feFlood floodColor={glowColor} floodOpacity="0.6" />
          <feComposite in2="blur3" operator="in" result="glowColor" />
          <feMerge>
            <feMergeNode in="glowColor" />
            <feMergeNode in="glowColor" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
          <stop offset="30%" stopColor="rgba(255, 255, 255, 0.7)" />
          <stop offset="60%" stopColor="rgba(255, 255, 255, 0.3)" />
          <stop offset="85%" stopColor="rgba(255, 255, 255, 0.1)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </radialGradient>
      </defs>
      
      {/* Main text */}
      <text
        x="150"
        y="40"
        textAnchor="middle"
        fill="url(#textGradient)"
        fontSize="36"
        fontWeight="700"
        fontFamily="Poppins, sans-serif"
        letterSpacing="1"
        filter="url(#glow)"
        style={{ textShadow: "0 0 20px rgba(255, 255, 255, 0.5)" }}
      >
        Coursebook
      </text>
      
      {showUnderline && (
        <>
          {/* Underline accent */}
          <line
            x1="40"
            y1="48"
            x2="260"
            y2="48"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Animated soft glow point with radial gradient */}
          <ellipse
            cx="40"
            cy="48"
            rx="8"
            ry="4"
            fill="url(#glowGradient)"
            filter="url(#lineGlow)"
          >
            <animate
              attributeName="cx"
              values="40;260;40"
              dur="30s"
              repeatCount="indefinite"
              keyTimes="0;0.5;1"
              keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
            />
          </ellipse>
        </>
      )}
    </svg>
  );
}

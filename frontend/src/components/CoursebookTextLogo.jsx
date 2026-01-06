export default function CoursebookTextLogo({ className = "", isDarkMode = true, showUnderline = true }) {
  const textColor = isDarkMode ? "#ffffff" : "#000000";
  
  return (
    <svg
      viewBox="0 0 300 60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ userSelect: 'none' }}
    >
      {/* Main text */}
      <text
        x="150"
        y="40"
        textAnchor="middle"
        fill={textColor}
        fontSize="44"
        fontWeight="700"
        fontFamily="Sofia Sans, sans-serif"
        letterSpacing="1"
      >
        Coursebook
      </text>
    </svg>
  );
}

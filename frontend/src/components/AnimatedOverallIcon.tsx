interface Props {
  status: 'good' | 'normal' | 'uncomfortable' | 'severe'
  selected: boolean
}

export default function AnimatedOverallIcon({ status, selected }: Props) {
  const svgClass = `w-14 h-14 ${selected ? 'animate-bounce-in' : ''}`

  switch (status) {
    case 'good':
      return (
        <svg viewBox="0 0 80 80" className={svgClass} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goodBg" cx="50%" cy="40%"><stop offset="0%" stopColor="#FDE68A"/><stop offset="100%" stopColor="#F59E0B"/></radialGradient>
          </defs>
          {/* Face */}
          <circle cx="40" cy="40" r="30" fill="url(#goodBg)" stroke="#D97706" strokeWidth="1.5"/>
          {/* Eyes */}
          <ellipse cx="30" cy="34" rx="3.5" ry="4" fill="#78350F"/>
          <ellipse cx="50" cy="34" rx="3.5" ry="4" fill="#78350F"/>
          {/* Eye sparkles */}
          <circle cx="31" cy="32" r="1.5" fill="white" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="51" cy="32" r="1.5" fill="white" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" begin="0.5s" repeatCount="indefinite"/>
          </circle>
          {/* Blush */}
          <ellipse cx="25" cy="44" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.7;0.5" dur="3s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="55" cy="44" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.7;0.5" dur="3s" begin="0.5s" repeatCount="indefinite"/>
          </ellipse>
          {/* Smile */}
          <path d="M26 47 Q40 60 54 47" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M26 47 Q40 60 54 47;M26 48 Q40 63 54 48;M26 47 Q40 60 54 47" dur="3s" repeatCount="indefinite"/>
          </path>
          {/* Sparkles */}
          <text x="58" y="22" fontSize="12" fill="#F59E0B">
            ✦
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,0;4,-6;0,0" dur="2s" repeatCount="indefinite"/>
          </text>
          <text x="14" y="18" fontSize="10" fill="#F59E0B">
            ✧
            <animate attributeName="opacity" values="1;0;1" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,0;-3,-5;0,0" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
          </text>
          {/* Float animation */}
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="3s" repeatCount="indefinite"/>
        </svg>
      )

    case 'normal':
      return (
        <svg viewBox="0 0 80 80" className={svgClass} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="normalBg" cx="50%" cy="40%"><stop offset="0%" stopColor="#FEF3C7"/><stop offset="100%" stopColor="#E5E7EB"/></radialGradient>
          </defs>
          <circle cx="40" cy="40" r="30" fill="url(#normalBg)" stroke="#9CA3AF" strokeWidth="1.5"/>
          {/* Eyes */}
          <circle cx="30" cy="34" r="3" fill="#4B5563"/>
          <circle cx="50" cy="34" r="3" fill="#4B5563"/>
          {/* Eye blink */}
          <ellipse cx="30" cy="34" rx="3" ry="0.5" fill="#E5E7EB" opacity="0">
            <animate attributeName="opacity" values="0;0;0;1;0" dur="4s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="50" cy="34" rx="3" ry="0.5" fill="#E5E7EB" opacity="0">
            <animate attributeName="opacity" values="0;0;0;1;0" dur="4s" begin="0.1s" repeatCount="indefinite"/>
          </ellipse>
          {/* Straight mouth */}
          <line x1="30" y1="50" x2="50" y2="50" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Breath pulse */}
          <circle cx="40" cy="40" r="32" fill="none" stroke="#D1D5DB" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="32;38;32" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.3;0" dur="4s" repeatCount="indefinite"/>
          </circle>
        </svg>
      )

    case 'uncomfortable':
      return (
        <svg viewBox="0 0 80 80" className={svgClass} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="uncomfyBg" cx="50%" cy="40%"><stop offset="0%" stopColor="#FED7AA"/><stop offset="100%" stopColor="#FB923C"/></radialGradient>
          </defs>
          <circle cx="40" cy="40" r="30" fill="url(#uncomfyBg)" stroke="#EA580C" strokeWidth="1.5"/>
          {/* Worried brows */}
          <path d="M22 26 Q30 22 36 28" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M22 26 Q30 22 36 28;M22 27 Q30 24 36 29;M22 26 Q30 22 36 28" dur="3s" repeatCount="indefinite"/>
          </path>
          <path d="M44 28 Q50 22 58 26" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M44 28 Q50 22 58 26;M44 29 Q50 24 58 27;M44 28 Q50 22 58 26" dur="3s" repeatCount="indefinite"/>
          </path>
          {/* Eyes */}
          <circle cx="30" cy="34" r="3.5" fill="#78350F"/>
          <circle cx="50" cy="34" r="3.5" fill="#78350F"/>
          {/* Sweat drop */}
          <path d="M58 22 Q62 28 58 32" fill="#93C5FD" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0;0.7" dur="3s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,0;2,4;0,0" dur="3s" repeatCount="indefinite"/>
          </path>
          {/* Worried mouth */}
          <path d="M28 52 Q40 44 52 52" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M28 52 Q40 44 52 52;M28 53 Q40 46 52 53;M28 52 Q40 44 52 52" dur="2s" repeatCount="indefinite"/>
          </path>
          {/* Wobble */}
          <animateTransform attributeName="transform" type="rotate" values="0,40,40;2,40,40;-2,40,40;1,40,40;-1,40,40;0,40,40" dur="2s" repeatCount="indefinite"/>
        </svg>
      )

    case 'severe':
      return (
        <svg viewBox="0 0 80 80" className={svgClass} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="severeBg" cx="50%" cy="40%"><stop offset="0%" stopColor="#FCA5A5"/><stop offset="100%" stopColor="#EF4444"/></radialGradient>
          </defs>
          {/* Alert rings */}
          <circle cx="40" cy="40" r="36" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0">
            <animate attributeName="r" values="30;40;30" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0">
            <animate attributeName="r" values="30;42;30" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
          </circle>
          {/* Face */}
          <circle cx="40" cy="40" r="30" fill="url(#severeBg)" stroke="#DC2626" strokeWidth="2"/>
          {/* Angry brows */}
          <path d="M20 26 L34 31" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round">
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="0.5s" repeatCount="indefinite"/>
          </path>
          <path d="M60 26 L46 31" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round">
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="0.5s" begin="0.25s" repeatCount="indefinite"/>
          </path>
          {/* Eyes - X shape */}
          <g>
            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="0.8s" repeatCount="indefinite"/>
            <line x1="25" y1="32" x2="35" y2="40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round"/>
            <line x1="35" y1="32" x2="25" y2="40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round"/>
            <line x1="45" y1="32" x2="55" y2="40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round"/>
            <line x1="55" y1="32" x2="45" y2="40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round"/>
          </g>
          {/* Open cry mouth */}
          <ellipse cx="40" cy="54" rx="7" ry="5" fill="#7F1D1D">
            <animate attributeName="ry" values="5;6;5" dur="0.8s" repeatCount="indefinite"/>
          </ellipse>
          {/* Tear drops */}
          <ellipse cx="24" cy="40" rx="2" ry="3" fill="#93C5FD" opacity="0.8">
            <animate attributeName="cy" values="40;55;40" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="56" cy="38" rx="2" ry="3" fill="#93C5FD" opacity="0.8">
            <animate attributeName="cy" values="38;53;38" dur="1.2s" begin="0.4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" begin="0.4s" repeatCount="indefinite"/>
          </ellipse>
        </svg>
      )

    default:
      return null
  }
}

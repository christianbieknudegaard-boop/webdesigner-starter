/** Thin-stroke line icons matching the technical-drafting theme.
 *  All icons inherit color via currentColor and size via className. */

interface IconProps {
  className?: string;
}

function base(className?: string) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

export function RulerIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="2.5" y="9.5" width="19" height="5.5" rx="1" />
      <path d="M6.5 9.5v2.5M10.5 9.5v3.5M14.5 9.5v2.5M18.5 9.5v3.5" />
    </svg>
  );
}

export function ShellIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" strokeDasharray="2 2" />
    </svg>
  );
}

export function RepairIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3.5 19h17L12 4.5 3.5 19Z" />
      <path d="M7.75 12h8.5" strokeDasharray="2 2" />
    </svg>
  );
}

export function OptimizeIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4.2 16 9 11.4l4.6 2.4 6-6.8" />
      <circle cx="4.2" cy="16" r="1.4" />
      <circle cx="9" cy="11.4" r="1.4" />
      <circle cx="13.6" cy="13.8" r="1.4" />
      <circle cx="19.6" cy="7" r="1.4" />
    </svg>
  );
}

export function MoldIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <circle cx="12" cy="12" r="3" strokeDasharray="2 2" />
    </svg>
  );
}

export function CutIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M12 3v18" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

export function EngraveIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m7.5 17 4.5-11 4.5 11" />
      <path d="M9.4 13.5h5.2" />
      <path d="M5 20.5h14" strokeDasharray="2 2" />
    </svg>
  );
}

export function ThicknessIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 4v16M19 4v16" />
      <path d="M8 12h8" />
      <path d="m10.5 9.5-3 2.5 3 2.5M13.5 9.5l3 2.5-3 2.5" />
    </svg>
  );
}

export function CombineIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="3.5" width="12" height="12" rx="2" />
      <path d="M20.5 12.5v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" />
      <path d="M15.5 8.5h3a2 2 0 0 1 2 2v2" strokeDasharray="2 2" />
    </svg>
  );
}

export function OverhangIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 20V4h6l8 10v6" />
      <path d="M12.5 9.5 5 17M15.5 13.5 8 21" strokeDasharray="2 2" />
    </svg>
  );
}

export function LithophaneIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="m3.5 17 5-5 4 4 3.5-3.5 4.5 4.5" />
    </svg>
  );
}

export function VectorIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 18c5-11 11-11 16 0" />
      <rect x="2.5" y="16.5" width="3" height="3" />
      <rect x="18.5" y="16.5" width="3" height="3" />
      <path d="M7 7h10" strokeDasharray="2 2" />
      <circle cx="12" cy="7" r="1.4" />
    </svg>
  );
}

export function RotateIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M18 2.5v4h-4" />
    </svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

import React from 'react';

/**
 * LoadingOverlay — Full-page blur overlay with the animated career-icon loader.
 *
 * Usage:
 *   <LoadingOverlay isVisible={isGeneratingProjects} message="Crafting Your Perfect Projects" />
 *
 * Props:
 *   isVisible — controls whether the overlay is shown
 *   message   — text shown below the animated icons (optional, defaults to "Loading...")
 *   submessage — smaller grey text below message (optional)
 */

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
}

const ICONS_SVG = [
  // Resume / FileText
  {
    delay: '0s',
    path: (
      <>
        <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </>
    ),
  },
  // Code brackets
  {
    delay: '0.15s',
    path: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
  },
  // Layers / Stack
  {
    delay: '0.3s',
    path: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
  },
  // Briefcase
  {
    delay: '0.45s',
    path: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </>
    ),
  },
  // Chat / Interview
  {
    delay: '0.6s',
    path: (
      <>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </>
    ),
  },
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading',
  submessage,
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* ── CSS Keyframes (injected once, removed with component) ─────────── */}
      <style>{`
        @keyframes cp-icon-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1);    color: #52525b; }
          50%       { opacity: 1;    transform: scale(1.18); color: #ffffff; }
        }
        @keyframes cp-dot-bounce {
          0%, 100% { transform: translateY(0);   opacity: 0.4; }
          50%       { transform: translateY(-6px); opacity: 1;   }
        }
        @keyframes cp-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .cp-loader-icon {
          width: 44px;
          height: 44px;
          color: #52525b;
          animation: cp-icon-pulse 1.5s ease-in-out infinite;
        }
        .cp-loader-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #818cf8;
          display: inline-block;
          animation: cp-dot-bounce 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── Backdrop: blurs the page content behind the overlay ──────────── */}
      <div
        aria-live="polite"
        aria-label={message}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          /* Frosted-glass backdrop */
          backdropFilter: 'blur(12px) saturate(0.7)',
          WebkitBackdropFilter: 'blur(12px) saturate(0.7)',
          background: 'rgba(9, 9, 11, 0.72)',
          animation: 'cp-overlay-in 0.2s ease-out',
        }}
      >
        {/* ── Glowing halo card ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            padding: '40px 48px',
            borderRadius: '24px',
            background: 'rgba(24, 24, 27, 0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 80px rgba(99,102,241,0.08), 0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Animated icon row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {ICONS_SVG.map((icon, i) => (
              <svg
                key={i}
                className="cp-loader-icon"
                style={{ animationDelay: icon.delay }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon.path}
              </svg>
            ))}
          </div>

          {/* Message + bouncing dots */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p
              style={{
                color: '#a1a1aa',
                fontSize: '14px',
                letterSpacing: '0.04em',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {message}
              <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                <span className="cp-loader-dot" style={{ animationDelay: '0s' }} />
                <span className="cp-loader-dot" style={{ animationDelay: '0.18s' }} />
                <span className="cp-loader-dot" style={{ animationDelay: '0.36s' }} />
              </span>
            </p>

            {submessage && (
              <p style={{ color: '#52525b', fontSize: '12px', letterSpacing: '0.02em' }}>
                {submessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingOverlay;

import React from 'react';

// Circular books logo — inspired by the reference design.
// Two stacked books in the center, surrounded by colorful arc segments.
// Teal segments span the upper arc; orange/yellow span the lower-right arc.
export default function Logo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Teal arc segments (upper arc, 185° → 325° clockwise) ── */}
      <path d="M 8.2 46.3 A 42 42 0 0 1 13.6 29.0" stroke="#0B8A91" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 15.6 25.9 A 42 42 0 0 1 29.0 13.6" stroke="#15A8B0" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 32.3 11.9 A 42 42 0 0 1 50.0 8.0"  stroke="#27C4CB" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 53.7 8.2  A 42 42 0 0 1 71.0 13.6" stroke="#5DD9DE" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 74.1 15.6 A 42 42 0 0 1 84.4 25.9" stroke="#90EAF0" strokeWidth="10" strokeLinecap="round"/>

      {/* ── Orange/yellow arc segments (lower-right arc, 345° → 130° clockwise) ── */}
      <path d="M 90.6 39.1 A 42 42 0 0 1 91.4 57.3" stroke="#FFD300" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 90.6 60.9 A 42 42 0 0 1 82.2 77.0" stroke="#FFA800" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 79.7 79.7 A 42 42 0 0 1 64.4 89.5" stroke="#FF7000" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 60.9 90.6 A 42 42 0 0 1 42.7 91.4" stroke="#FF4800" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 39.1 90.6 A 42 42 0 0 1 23.0 82.2" stroke="#E84000" strokeWidth="10" strokeLinecap="round"/>

      {/* ── Books in center ── */}
      {/* Top book – dark navy */}
      <rect x="15" y="32" width="68" height="14" rx="5" fill="#0D2255"/>
      <line x1="20" y1="36.5" x2="79" y2="36.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <line x1="20" y1="39.5" x2="79" y2="39.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <line x1="20" y1="42.5" x2="79" y2="42.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>

      {/* Bottom book – CSUF blue */}
      <rect x="18" y="49" width="63" height="14" rx="5" fill="#003DA5"/>
      <line x1="23" y1="53.5" x2="77" y2="53.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <line x1="23" y1="56.5" x2="77" y2="56.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <line x1="23" y1="59.5" x2="77" y2="59.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
    </svg>
  );
}

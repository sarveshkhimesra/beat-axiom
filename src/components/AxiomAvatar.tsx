/** AXIOM's visual identity — a geometric, glowing AI core. Pure SVG with SMIL
 * animation (no JS, works in server + client components). Not human: a rotating
 * hex frame, a pulsing ring, and a breathing core. */
export default function AxiomAvatar({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="AXIOM"
      style={{ display: "block", filter: "drop-shadow(0 0 6px rgba(123,47,255,0.5))" }}
    >
      {/* rotating hex frame */}
      <g fill="none" stroke="var(--accent-secondary)" strokeWidth="2" opacity="0.9">
        <polygon points="50,8 86,29 86,71 50,92 14,71 14,29">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="28s" repeatCount="indefinite" />
        </polygon>
      </g>
      {/* counter-rotating hex, fainter */}
      <g fill="none" stroke="var(--accent-secondary)" strokeWidth="1" opacity="0.4">
        <polygon points="50,20 76,35 76,65 50,80 24,65 24,35">
          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="20s" repeatCount="indefinite" />
        </polygon>
      </g>
      {/* pulsing ring */}
      <circle cx="50" cy="50" r="26" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.6">
        <animate attributeName="r" values="24;28;24" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3.2s" repeatCount="indefinite" />
      </circle>
      {/* breathing core */}
      <circle cx="50" cy="50" r="9" fill="var(--accent-primary)">
        <animate attributeName="r" values="8;11;8" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.95;0.7;0.95" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

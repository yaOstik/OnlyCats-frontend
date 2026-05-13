export default function PawIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="13.8" cy="23.2" rx="5.4" ry="7.4" transform="rotate(-22 13.8 23.2)" />
      <ellipse cx="26.2" cy="14.3" rx="5.3" ry="7.9" transform="rotate(-8 26.2 14.3)" />
      <ellipse cx="37.8" cy="14.3" rx="5.3" ry="7.9" transform="rotate(8 37.8 14.3)" />
      <ellipse cx="50.2" cy="23.2" rx="5.4" ry="7.4" transform="rotate(22 50.2 23.2)" />
      <path d="M32 29.6c-10.1 0-18.9 7.2-21.1 17-1.9 8 2.4 14.6 10.9 14.6h20.4c8.5 0 12.8-6.6 10.9-14.6-2.2-9.8-11-17-21.1-17z" />
      <path d="M22.8 55.2c2.3 1.5 5.3 2.3 9.2 2.3s6.9-.8 9.2-2.3c-1.3-2.1-4.5-3.4-9.2-3.4s-7.9 1.3-9.2 3.4z" />
    </svg>
  );
}


export function createAvatarDataUrl(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const safeInitials = initials.replace(/[^A-Z0-9]/g, '').slice(0, 2) || 'P';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#2b2a29" />
          <stop offset="100%" stop-color="#141312" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="44" fill="url(#bg)" />
      <rect x="10" y="10" width="140" height="140" rx="36" fill="none" stroke="#48473f" stroke-width="2" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#e6e2df" font-family="Manrope, Arial, sans-serif" font-size="54" font-weight="700">${safeInitials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
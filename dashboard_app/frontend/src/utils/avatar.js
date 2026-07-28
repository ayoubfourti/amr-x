const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2']

export function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function avatarColor(name) {
  const index = (name || '').charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] || AVATAR_COLORS[0]
}

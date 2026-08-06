import { initials, avatarColor } from '../../utils/avatar'

export default function AvatarChip({ name, style, onClick }) {
  return (
    <span className="avatar-chip" style={{ backgroundColor: avatarColor(name), ...style }} onClick={onClick}>
      {initials(name)}
    </span>
  )
}

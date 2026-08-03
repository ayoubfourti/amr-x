export default function Badge({ text, color, className = '' }) {
  return (
    <span
      className={className}
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        boxShadow: `0 2px 6px ${color}55`,
      }}
    >
      {text}
    </span>
  )
}

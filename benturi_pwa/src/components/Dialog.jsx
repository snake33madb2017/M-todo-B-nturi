export default function Dialog({ title, children, onClose, actions }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="dialog-actions">
          {actions ?? <button className="dialog-btn" onClick={onClose}>CERRAR</button>}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

export default function AdminScreen({ token }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setUsers(data)
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [token])

  const togglePremium = async (userId, currentPremium) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-premium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPremium: !currentPremium })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentPremium } : u))
      }
    } catch (err) {
      alert("Error al actualizar usuario")
    }
  }

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>PANEL DE ADMINISTRADOR</h1>
        <div className="subtitle mt-8">Gestión de Usuarios</div>
      </div>
      
      <div className="glass-card" style={{padding: '16px'}}>
        {loading ? <p>Cargando usuarios...</p> : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={u.isPremium ? "badge-premium" : "badge-free"}>
                        {u.isPremium ? "PREMIUM" : "GRATIS"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-small" 
                        onClick={() => togglePremium(u.id, u.isPremium)}
                        style={{
                          padding: '6px 12px',
                          background: '#00E5FF',
                          color: '#020617',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        {u.isPremium ? "Quitar Premium" : "Dar Premium"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.422 13.882c-.015-3.267 2.658-4.831 2.781-4.912-1.503-2.21-3.83-2.518-4.664-2.553-1.968-.198-3.844 1.161-4.843 1.161-.998 0-2.545-1.135-4.183-1.103-2.13.031-4.092 1.238-5.184 3.14-2.203 3.829-.561 9.493 1.579 12.593 1.054 1.517 2.302 3.238 3.931 3.169 1.584-.07 2.182-1.026 4.097-1.026 1.914 0 2.464 1.026 4.131.996 1.701-.033 2.778-1.554 3.824-3.085 1.213-1.78 1.714-3.504 1.737-3.593-.038-.016-3.211-1.233-3.206-4.787zm-2.888-7.234c.883-1.071 1.481-2.559 1.319-4.048-1.272.051-2.812.846-3.719 1.905-.724.84-1.439 2.353-1.258 3.818 1.417.11 2.774-.613 3.658-1.675z"/>
  </svg>
)

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register'
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('benturi_token', data.token)
        onLoginSuccess(data.user, data.token)
      } else {
        setError(data.error || 'Error de autenticación')
      }
    } catch (err) {
      setError('Error de red al conectar con el servidor')
    }
  }

  const handleSocialLogin = (provider) => {
    setError(`Conectando con ${provider}...`)
    setTimeout(() => {
      onLoginSuccess({ id: 999, email: `user@${provider}.com`, isPremium: true }, 'fake-token-123')
    }, 1500)
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <h2>{isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</h2>
        {error && <p style={{color:'red', fontSize:'12px', marginBottom:'12px'}}>{error}</p>}
        
        <button className="btn-social" onClick={() => handleSocialLogin('Google')} type="button">
          <GoogleIcon /> Continuar con Google
        </button>
        <button className="btn-social" onClick={() => handleSocialLogin('Apple')} type="button">
          <AppleIcon /> Continuar con Apple
        </button>

        <div className="divider">O usa tu email</div>

        <form onSubmit={handleSubmit} className="stack">
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary mt-8">
            {isLogin ? 'ENTRAR' : 'REGISTRARME'}
          </button>
        </form>
        
        <div className="mt-16 text-center">
          <button className="dialog-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
        
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}

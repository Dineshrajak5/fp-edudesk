import { useState, useEffect } from 'react'
import { subscribeToPush, unsubscribeFromPush, getNotificationStatus } from '../lib/notifications'

export default function Header({ onRefresh, loading, theme, onToggleTheme }) {
  const [notifStatus, setNotifStatus] = useState('default')
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    getNotificationStatus().then(setNotifStatus)
  }, [])

  const handleNotifToggle = async () => {
    setNotifLoading(true)
    if (notifStatus === 'granted') {
      const result = await unsubscribeFromPush()
      if (result.success) setNotifStatus('default')
    } else {
      const result = await subscribeToPush()
      if (result.success) setNotifStatus('granted')
      else if (result.reason === 'denied') setNotifStatus('denied')
    }
    setNotifLoading(false)
  }

  const notifOn = notifStatus === 'granted'

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-mark">
          <span className="logo-fp">FP</span>
        </div>
        <div className="header-titles">
          <h1 className="app-name">Edu<span className="accent">Desk</span></h1>
          <span className="app-tagline">India Education Intelligence</span>
        </div>
      </div>

      <div className="header-right">
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        <button
          className={`icon-btn ${loading ? 'spinning' : ''}`}
          onClick={onRefresh}
          title="Refresh feed"
          aria-label="Refresh"
          disabled={loading}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>

        <button
          className={`notif-btn ${notifOn ? 'on' : ''} ${notifStatus === 'denied' ? 'denied' : ''}`}
          onClick={handleNotifToggle}
          disabled={notifLoading || notifStatus === 'denied'}
          title={
            notifStatus === 'denied'
              ? 'Notifications blocked in browser settings'
              : notifOn
              ? 'Turn off notifications'
              : 'Turn on notifications'
          }
        >
          {notifLoading ? (
            <span className="btn-spinner" />
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={notifOn ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="notif-label">{notifOn ? 'On' : 'Notify'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}

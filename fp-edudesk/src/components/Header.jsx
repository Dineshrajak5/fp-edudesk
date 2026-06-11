import { useState, useEffect } from 'react'
import { subscribeToPush, unsubscribeFromPush, getNotificationStatus } from '../lib/notifications'
import { formatDistanceToNow } from 'date-fns'

export default function Header({ onRefresh, lastFetched, loading }) {
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
          <h1 className="app-name">EduDesk</h1>
          <span className="app-tagline">India Education News</span>
        </div>
      </div>

      <div className="header-right">
        {lastFetched && (
          <span className="last-updated">
            Updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
          </span>
        )}

        <button
          className={`icon-btn ${loading ? 'spinning' : ''}`}
          onClick={onRefresh}
          title="Refresh"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill={notifOn ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
                {!notifOn && <line x1="1" y1="1" x2="23" y2="23"/>}
              </svg>
              <span>{notifOn ? 'Notifs On' : 'Notifs Off'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}

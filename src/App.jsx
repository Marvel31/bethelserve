import { useState } from 'react'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import Layout from './components/Layout'
import VolunteerView from './components/VolunteerView'
import AdminView from './components/AdminView'
import AnnouncementView from './components/AnnouncementView'
import UniversalPrayerView from './components/UniversalPrayerView'
import ApplicationStatusView from './components/ApplicationStatusView'
import './App.css'
import 'antd/dist/reset.css'

// 관리자 모드 비밀번호 (실제 사용 시 환경 변수로 관리하세요)
const ADMIN_PASSWORD = 'admin123'

export default function App() {
  // 항상 공지사항 모드로 시작
  const [mode, setMode] = useState('announcement') // 'volunteer', 'admin', 'announcement', 'universal', 'applicationStatus'
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setMode('admin')
      setShowPasswordInput(false)
      setPasswordInput('')
      // 세션 중에만 유지, 앱 재시작 시 자동 로그인 안 함
      localStorage.setItem('isAdmin', 'true')
    } else {
      alert('비밀번호가 올바르지 않습니다.')
      setPasswordInput('')
    }
  }

  const handleLogout = () => {
    // 모든 관리자 관련 상태 및 저장 정보 제거
    localStorage.removeItem('isAdmin')
    setIsAdmin(false)
    setMode('announcement')
    setShowPasswordInput(false)
    setPasswordInput('')
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setShowPasswordInput(false)
  }

  return (
    <ConfigProvider locale={koKR}>
      <div className="app">
        <Layout
          mode={mode}
          onModeChange={handleModeChange}
          isAdmin={isAdmin}
          onLoginClick={() => setShowPasswordInput(true)}
          onLogoutClick={handleLogout}
        >
          {showPasswordInput && (
            <div className="password-modal">
              <div className="password-content">
                <h3>관리자 비밀번호</h3>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호 입력"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  autoFocus
                />
                <div className="password-buttons">
                  <button onClick={handleAdminLogin}>확인</button>
                  <button onClick={() => {
                    setShowPasswordInput(false)
                    setPasswordInput('')
                  }}>취소</button>
                </div>
              </div>
            </div>
          )}

          <main>
            {mode === 'volunteer' && <VolunteerView key="volunteer" />}
            {mode === 'admin' && isAdmin && <AdminView key="admin" />}
            {mode === 'announcement' && <AnnouncementView key="announcement" isAdmin={isAdmin} />}
            {mode === 'universal' && <UniversalPrayerView key="universal" />}
            {mode === 'applicationStatus' && <ApplicationStatusView key="applicationStatus" />}
          </main>
        </Layout>
      </div>
    </ConfigProvider>
  )
}



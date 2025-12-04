import { useState, useEffect } from 'react'
import { 
  getAnnouncementByMonth,
  setAnnouncementByMonth,
  getMonthOpenStatus
} from '../services/database'
import MonthlyVolunteerTable from './MonthlyVolunteerTable'
import './AnnouncementView.css'

export default function AnnouncementView({ isAdmin = false }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [announcement, setAnnouncement] = useState('')
  const [editingAnnouncement, setEditingAnnouncement] = useState('')
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMonthOpenStatus()
  }, [year, month])

  useEffect(() => {
    loadAnnouncementData()
  }, [year, month])

  const loadMonthOpenStatus = async () => {
    try {
      const status = await getMonthOpenStatus(year, month)
      setIsMonthOpen(status)
    } catch (error) {
      console.error('월별 오픈 상태 로드 오류:', error)
      setIsMonthOpen(false)
    }
  }

  const loadVolunteersData = async () => {
    setLoading(true)
    try {
      // 모든 봉사자 정보 먼저 로드
      const allVolunteers = await getAllVolunteers()
      const volunteerIdMap = {}
      allVolunteers.forEach(v => {
        volunteerIdMap[v.id] = v
      })
      setVolunteerMap(volunteerIdMap)

      const enabledDatesArray = Array.from(enabledDates)
      const volunteersMap = {}

      // 모든 활성화된 날짜에 대해 병렬로 봉사자 데이터 로드
      await Promise.all(
        enabledDatesArray.map(async (dateString) => {
          try {
            const selections = await getSelectedVolunteersByRole(dateString)
            // 해설은 배열로 저장 (두 명 가능), 나머지는 첫 번째 ID만 사용
            volunteersMap[dateString] = {
              [ROLES.COMMENTARY]: selections[ROLES.COMMENTARY] || [],
              [ROLES.READING_1]: selections[ROLES.READING_1]?.[0] || null,
              [ROLES.READING_2]: selections[ROLES.READING_2]?.[0] || null,
              [ROLES.PRAYER_1]: selections[ROLES.PRAYER_1]?.[0] || null,
              [ROLES.PRAYER_2]: selections[ROLES.PRAYER_2]?.[0] || null,
              [ROLES.PRAYER_3]: selections[ROLES.PRAYER_3]?.[0] || null,
              [ROLES.PRAYER_4]: selections[ROLES.PRAYER_4]?.[0] || null
            }
          } catch (error) {
            console.error(`날짜 ${dateString} 봉사자 데이터 로드 오류:`, error)
            volunteersMap[dateString] = {
              [ROLES.COMMENTARY]: [],
              [ROLES.READING_1]: null,
              [ROLES.READING_2]: null,
              [ROLES.PRAYER_1]: null,
              [ROLES.PRAYER_2]: null,
              [ROLES.PRAYER_3]: null,
              [ROLES.PRAYER_4]: null
            }
          }
        })
      )

      setVolunteersByDate(volunteersMap)
    } catch (error) {
      console.error('봉사자 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnnouncementData = async () => {
    try {
      const content = await getAnnouncementByMonth(year, month)
      setAnnouncement(content)
      setEditingAnnouncement(content)
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
    }
  }

  const handleAnnouncementChange = (value) => {
    setEditingAnnouncement(value)
  }

  const handleSaveAnnouncement = async () => {
    setSaving(true)
    try {
      await setAnnouncementByMonth(year, month, editingAnnouncement)
      setAnnouncement(editingAnnouncement)
      alert('공지사항이 저장되었습니다.')
    } catch (error) {
      console.error('공지사항 저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleMonthChange = (delta) => {
    let newMonth = month + delta
    let newYear = year
    
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    
    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <div className="announcement-view">
      <div className="header">
        <h1>봉사자 공지사항</h1>
      </div>

      <div className="month-selector">
        <button onClick={() => handleMonthChange(-1)}>◀</button>
        <span>{year}년 {month}월</span>
        <button onClick={() => handleMonthChange(1)}>▶</button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <MonthlyVolunteerTable
            year={year}
            month={month}
            compact={false}
          />

          <div className="announcement-section">
            <h3>공지사항</h3>
            {isAdmin ? (
              <>
                <textarea
                  className="announcement-textarea"
                  value={editingAnnouncement}
                  onChange={(e) => handleAnnouncementChange(e.target.value)}
                  placeholder="공지사항을 입력하세요..."
                  rows={6}
                />
                <button
                  className="save-announcement-button"
                  onClick={handleSaveAnnouncement}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '공지사항 저장'}
                </button>
              </>
            ) : (
              <div className="announcement-display">
                {announcement ? (
                  <p>{announcement}</p>
                ) : (
                  <p className="no-announcement">공지사항이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}



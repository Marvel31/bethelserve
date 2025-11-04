import { useState, useEffect } from 'react'
import { getAllDaysInMonth } from '../utils/dateUtils'
import { 
  getEnabledDates, 
  getSelectedVolunteersByRole,
  getAllVolunteers,
  getAnnouncementByMonth,
  setAnnouncementByMonth,
  getMonthOpenStatus,
  ROLES
} from '../services/database'
import './AnnouncementView.css'

export default function AnnouncementView({ isAdmin = false }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [allDays, setAllDays] = useState([])
  const [enabledDates, setEnabledDates] = useState(new Set())
  const [volunteersByDate, setVolunteersByDate] = useState({}) // { dateString: { role: volunteerId } }
  const [volunteerMap, setVolunteerMap] = useState({}) // { volunteerId: { name, ... } }
  const [announcement, setAnnouncement] = useState('')
  const [editingAnnouncement, setEditingAnnouncement] = useState('')
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    updateAllDays()
    loadEnabledDates()
    loadMonthOpenStatus()
  }, [year, month])

  useEffect(() => {
    if (enabledDates.size > 0) {
      loadVolunteersData()
    }
    loadAnnouncementData()
  }, [enabledDates, year, month])

  const updateAllDays = () => {
    const daysList = getAllDaysInMonth(year, month)
    setAllDays(daysList)
  }

  const loadEnabledDates = async () => {
    try {
      const savedEnabledDates = await getEnabledDates(year, month)
      if (savedEnabledDates === null) {
        setEnabledDates(new Set())
      } else {
        setEnabledDates(new Set(savedEnabledDates))
      }
    } catch (error) {
      console.error('활성화된 날짜 로드 오류:', error)
      setEnabledDates(new Set())
    }
  }

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
            // 각 역할별로 첫 번째 ID만 사용 (표 형식이므로 한 명씩만)
            volunteersMap[dateString] = {
              [ROLES.COMMENTARY]: selections[ROLES.COMMENTARY]?.[0] || null,
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
              [ROLES.COMMENTARY]: null,
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

  const selectedDays = allDays.filter(day => enabledDates.has(day.dateString))

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
          {selectedDays.length > 0 && (
            <div className="volunteers-table-container">
              <h2>{year}년 {month}월 봉사표</h2>
              <table className="volunteers-table">
                <thead>
                  <tr>
                    <th className="date-header">날짜/행사명</th>
                    <th>해설</th>
                    <th>1독서</th>
                    <th>2독서</th>
                    <th>보편1</th>
                    <th>보편2</th>
                    <th>보편3</th>
                    <th>보편4</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDays.map((day, index) => {
                    const dateString = day.dateString
                    const volunteers = volunteersByDate[dateString] || {}
                    const getVolunteerName = (volunteerId) => {
                      if (!volunteerId) return ''
                      return volunteerMap[volunteerId]?.name || ''
                    }
                    return (
                      <tr key={dateString} className={`table-row row-${index % 4}`}>
                        <td className="date-cell">{day.display}</td>
                        <td>{getVolunteerName(volunteers[ROLES.COMMENTARY]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.READING_1]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.READING_2]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.PRAYER_1]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.PRAYER_2]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.PRAYER_3]) || '-'}</td>
                        <td>{getVolunteerName(volunteers[ROLES.PRAYER_4]) || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

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



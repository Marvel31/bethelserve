import { useState, useEffect } from 'react'
import { getAllDaysInMonth } from '../utils/dateUtils'
import { 
  getAllVolunteers,
  getEnabledDates,
  getMonthOpenStatus,
  getVolunteerIdByName,
  setAvailability,
  getAvailableVolunteers
} from '../services/database'
import './VolunteerView.css'

export default function VolunteerView() {
  const [selectedVolunteerName, setSelectedVolunteerName] = useState('')
  const [volunteerId, setVolunteerId] = useState(null)
  const [volunteers, setVolunteers] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [allDays, setAllDays] = useState([])
  const [enabledDates, setEnabledDates] = useState(new Set())
  const [availabilityByDate, setAvailabilityByDate] = useState({}) // { dateString: { volunteerId: true/false } }
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateAllDays()
    loadVolunteers()
    loadEnabledDates()
    loadMonthOpenStatus()
  }, [year, month])

  useEffect(() => {
    if (volunteerId) {
      loadAvailability()
    }
  }, [year, month, volunteerId, enabledDates])

  const updateAllDays = () => {
    const daysList = getAllDaysInMonth(year, month)
    setAllDays(daysList)
  }

  const loadVolunteers = async () => {
    try {
      const volunteersList = await getAllVolunteers()
      volunteersList.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      setVolunteers(volunteersList)
    } catch (error) {
      console.error('봉사자 목록 로드 오류:', error)
      alert('봉사자 목록을 불러오는 중 오류가 발생했습니다.')
    }
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

  const loadAvailability = async () => {
    if (!volunteerId) return

    setLoading(true)
    try {
      const availabilityMap = {}
      
      for (const dateString of enabledDates) {
        try {
          const availableVolunteers = await getAvailableVolunteers(dateString)
          const isAvailable = availableVolunteers.some(v => v.id === volunteerId)
          availabilityMap[dateString] = {
            ...availabilityMap[dateString],
            [volunteerId]: isAvailable
          }
        } catch (error) {
          console.error(`날짜 ${dateString} 가능 여부 로드 오류:`, error)
        }
      }
      
      setAvailabilityByDate(availabilityMap)
    } catch (error) {
      console.error('가능 여부 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVolunteerSelect = async () => {
    if (!selectedVolunteerName.trim()) {
      alert('이름을 입력하거나 선택해주세요.')
      return
    }

    try {
      const id = await getVolunteerIdByName(selectedVolunteerName.trim())
      if (!id) {
        alert('등록되지 않은 봉사자입니다.')
        return
      }
      setVolunteerId(id)
      localStorage.setItem('volunteerId', id)
      localStorage.setItem('volunteerName', selectedVolunteerName.trim())
    } catch (error) {
      console.error('봉사자 선택 오류:', error)
      alert('봉사자 선택 중 오류가 발생했습니다.')
    }
  }

  const handleToggleAvailability = async (dateString) => {
    if (!volunteerId) {
      alert('먼저 이름을 선택해주세요.')
      return
    }

    if (!isMonthOpen) {
      alert('이번 달은 봉사 입력이 닫혀있습니다.')
      return
    }

    if (!enabledDates.has(dateString)) {
      alert('이 날짜는 봉사 신청이 불가능한 날짜입니다.')
      return
    }

    const currentAvailability = availabilityByDate[dateString]?.[volunteerId] || false
    const newAvailability = !currentAvailability

    // 즉시 UI 업데이트
    setAvailabilityByDate(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        [volunteerId]: newAvailability
      }
    }))

    try {
      await setAvailability(volunteerId, dateString, newAvailability)
    } catch (error) {
      console.error('가능 여부 저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
      // 롤백
      setAvailabilityByDate(prev => ({
        ...prev,
        [dateString]: {
          ...prev[dateString],
          [volunteerId]: currentAvailability
        }
      }))
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
    
    setEnabledDates(new Set())  // 이전 달 enabledDates 제거
    setAvailabilityByDate({})  // 이전 달 데이터 즉시 제거
    setMonth(newMonth)
    setYear(newYear)
  }

  // 선택된 날짜만 필터링
  const selectedDays = allDays.filter(day => enabledDates.has(day.dateString))

  // localStorage에서 이전 선택 로드
  useEffect(() => {
    const savedVolunteerId = localStorage.getItem('volunteerId')
    const savedVolunteerName = localStorage.getItem('volunteerName')
    if (savedVolunteerId && savedVolunteerName) {
      setVolunteerId(savedVolunteerId)
      setSelectedVolunteerName(savedVolunteerName)
    }
  }, [])

  return (
    <div className="volunteer-view">
      <div className="header">
        <h1>봉사 가능 날짜 등록</h1>
      </div>

      {!volunteerId ? (
        <div className="register-section">
          <h2>이름 선택</h2>
          <div className="input-group">
            <input
              type="text"
              list="volunteers-list"
              value={selectedVolunteerName}
              onChange={(e) => setSelectedVolunteerName(e.target.value)}
              placeholder="이름을 입력하거나 선택하세요"
              onKeyPress={(e) => e.key === 'Enter' && handleVolunteerSelect()}
            />
            <datalist id="volunteers-list">
              {volunteers.map(volunteer => (
                <option key={volunteer.id} value={volunteer.name} />
              ))}
            </datalist>
            <button onClick={handleVolunteerSelect}>선택</button>
          </div>
        </div>
      ) : (
        <>
          <div className="volunteer-info">
            <p><strong>{localStorage.getItem('volunteerName')}</strong></p>
            <button className="change-name-button" onClick={() => {
              setVolunteerId(null)
              setSelectedVolunteerName('')
              localStorage.removeItem('volunteerId')
              localStorage.removeItem('volunteerName')
            }}>이름 변경</button>
          </div>

          <div className="month-selector">
            <button onClick={() => handleMonthChange(-1)}>◀</button>
            <span>{year}년 {month}월</span>
            <button onClick={() => handleMonthChange(1)}>▶</button>
          </div>

          {!isMonthOpen && (
            <div className="closed-notice">
              이번 달은 봉사 입력이 닫혀있습니다.
            </div>
          )}

          {selectedDays.length === 0 && (
            <div className="empty-state">
              이번 달에는 선택된 봉사 날짜가 없습니다.
            </div>
          )}

          {selectedDays.length > 0 && (
            <>
              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <div className="dates-list">
                  {selectedDays.map((day) => {
                    const isAvailable = availabilityByDate[day.dateString]?.[volunteerId] || false
                    return (
                      <div key={day.dateString} className="date-card">
                        <div className="date-header">
                          <h3>{day.display}</h3>
                        </div>
                        <div className="volunteer-availability">
                          <div className="volunteer-name-display">
                            {localStorage.getItem('volunteerName')}
                          </div>
                          <button
                            className={`availability-button ${isAvailable ? 'available' : 'unavailable'}`}
                            onClick={() => handleToggleAvailability(day.dateString)}
                            disabled={!isMonthOpen}
                          >
                            {isAvailable ? 'O' : 'X'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

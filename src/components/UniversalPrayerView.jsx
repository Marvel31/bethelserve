import { useState, useEffect } from 'react'
import { getAllDaysInMonth } from '../utils/dateUtils'
import { 
  getEnabledDates,
  getAllVolunteers,
  getSelectedVolunteersByRole,
  setPrayerText,
  getAllPrayersForDate,
  ROLES
} from '../services/database'
import './UniversalPrayerView.css'

export default function UniversalPrayerView() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [enabledDates, setEnabledDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [prayers, setPrayers] = useState({
    prayer1: '',
    prayer2: '',
    prayer3: '',
    prayer4: ''
  })
  const [editingStates, setEditingStates] = useState({
    prayer1: false,
    prayer2: false,
    prayer3: false,
    prayer4: false
  })
  const [volunteers, setVolunteers] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    loadEnabledDates()
  }, [year, month])

  useEffect(() => {
    if (selectedDate) {
      loadPrayersForDate()
      loadVolunteersForDate()
    }
  }, [selectedDate])

  const loadEnabledDates = async () => {
    setLoading(true)
    try {
      const dates = await getEnabledDates(year, month)
      if (dates === null) {
        // 기본값: 모든 일요일
        const allDays = getAllDaysInMonth(year, month)
        const sundays = allDays.filter(day => day.date.getDay() === 0)
        setEnabledDates(sundays)
      } else {
        const allDays = getAllDaysInMonth(year, month)
        const enabled = allDays.filter(day => dates.includes(day.dateString))
        setEnabledDates(enabled)
      }
    } catch (error) {
      console.error('날짜 로드 오류:', error)
    }
    setLoading(false)
  }

  const loadPrayersForDate = async () => {
    if (!selectedDate) return
    
    try {
      const prayerData = await getAllPrayersForDate(selectedDate)
      setPrayers(prayerData)
      
      // 기도문이 있으면 편집 모드 해제
      setEditingStates({
        prayer1: false,
        prayer2: false,
        prayer3: false,
        prayer4: false
      })
    } catch (error) {
      console.error('기도문 로드 오류:', error)
    }
  }

  const loadVolunteersForDate = async () => {
    if (!selectedDate) return
    
    try {
      const selections = await getSelectedVolunteersByRole(selectedDate)
      const allVolunteers = await getAllVolunteers()
      const volunteerMap = {}
      
      allVolunteers.forEach(v => {
        volunteerMap[v.id] = v
      })
      
      // 각 기도별 봉사자 정보 가져오기
      const volunteerInfo = {
        prayer1: selections[ROLES.PRAYER_1]?.map(id => volunteerMap[id]).filter(v => v) || [],
        prayer2: selections[ROLES.PRAYER_2]?.map(id => volunteerMap[id]).filter(v => v) || [],
        prayer3: selections[ROLES.PRAYER_3]?.map(id => volunteerMap[id]).filter(v => v) || [],
        prayer4: selections[ROLES.PRAYER_4]?.map(id => volunteerMap[id]).filter(v => v) || []
      }
      
      setVolunteers(volunteerInfo)
    } catch (error) {
      console.error('봉사자 로드 오류:', error)
    }
  }

  const handlePrayerChange = (prayerNumber, value) => {
    setPrayers(prev => ({
      ...prev,
      [`prayer${prayerNumber}`]: value
    }))
  }

  const handleStartEditing = (prayerNumber) => {
    setEditingStates(prev => ({
      ...prev,
      [`prayer${prayerNumber}`]: true
    }))
  }

  const handleSavePrayer = async (prayerNumber) => {
    setSaving(prev => ({ ...prev, [`prayer${prayerNumber}`]: true }))
    
    try {
      await setPrayerText(selectedDate, prayerNumber, prayers[`prayer${prayerNumber}`])
      setEditingStates(prev => ({
        ...prev,
        [`prayer${prayerNumber}`]: false
      }))
      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
    
    setSaving(prev => ({ ...prev, [`prayer${prayerNumber}`]: false }))
  }

  const handleDateClick = (dateString) => {
    setSelectedDate(dateString)
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDate(null)
  }

  const renderPrayerCard = (prayerNumber) => {
    const prayerKey = `prayer${prayerNumber}`
    const isEditing = editingStates[prayerKey]
    const prayerText = prayers[prayerKey]
    const hasContent = prayerText && prayerText.trim().length > 0
    const volunteerList = volunteers[prayerKey] || []
    const isSaving = saving[prayerKey]

    return (
      <div className="prayer-card" key={prayerKey}>
        <div className="prayer-header">
          <h3>보편 지향 기도 {prayerNumber}</h3>
          {volunteerList.length > 0 && (
            <div className="volunteer-info">
              담당자: {volunteerList.map(v => v.name).join(', ')}
            </div>
          )}
        </div>
        
        <textarea
          className="prayer-textarea"
          value={prayerText}
          onChange={(e) => handlePrayerChange(prayerNumber, e.target.value)}
          disabled={!isEditing}
          placeholder="보편 지향 기도를 입력하세요..."
          rows={6}
        />
        
        <div className="prayer-actions">
          {!hasContent && !isEditing && (
            <button 
              className="btn-primary"
              onClick={() => handleStartEditing(prayerNumber)}
            >
              입력
            </button>
          )}
          
          {isEditing && (
            <button 
              className="btn-success"
              onClick={() => handleSavePrayer(prayerNumber)}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '완료'}
            </button>
          )}
          
          {hasContent && !isEditing && (
            <button 
              className="btn-secondary"
              onClick={() => handleStartEditing(prayerNumber)}
            >
              수정
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="universal-prayer-view">
      <div className="header">
        <h1>보편 지향 기도 작성</h1>
      </div>

      <div className="month-selector">
        <button onClick={handlePrevMonth}>◀</button>
        <span className="month-display">{year}년 {month}월</span>
        <button onClick={handleNextMonth}>▶</button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="date-list">
            <h2>날짜 선택</h2>
            {enabledDates.length === 0 ? (
              <p className="no-dates">활성화된 날짜가 없습니다.</p>
            ) : (
              <select 
                className="date-select"
                value={selectedDate || ''}
                onChange={(e) => handleDateClick(e.target.value)}
              >
                <option value="">날짜를 선택하세요</option>
                {enabledDates.map(day => (
                  <option key={day.dateString} value={day.dateString}>
                    {day.display}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDate && (
            <div className="prayers-container">
              <h2>{selectedDate} 보편 지향 기도</h2>
              <div className="prayers-grid">
                {[1, 2, 3, 4].map(num => renderPrayerCard(num))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


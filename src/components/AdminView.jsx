import { useState, useEffect } from 'react'
import { getWeekendsInMonth, getAllDaysInMonth } from '../utils/dateUtils'
import { 
  getEnabledDates, 
  setEnabledDates,
  getAllVolunteers,
  addVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getMonthOpenStatus,
  setMonthOpenStatus,
  getAvailableVolunteers,
  ROLES,
  setSelectedVolunteersByRole,
  getSelectedVolunteersByRole,
  getVolunteerServiceCount
} from '../services/database'
import MonthlyVolunteerTable from './MonthlyVolunteerTable'
import './AdminView.css'

export default function AdminView() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [weekends, setWeekends] = useState([])
  const [enabledDates, setEnabledDatesState] = useState(new Set())
  const [volunteers, setVolunteers] = useState([])
  const [newVolunteerName, setNewVolunteerName] = useState('')
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('dates') // 'dates', 'volunteers', 'selection', 'status'

  useEffect(() => {
    updateWeekends()
    loadEnabledDates()
    loadVolunteers()
    loadMonthOpenStatus()
  }, [year, month])

  const updateWeekends = () => {
    const weekendsList = getWeekendsInMonth(year, month)
    setWeekends(weekendsList)
  }

  const loadEnabledDates = async () => {
    setLoading(true)
    try {
      const savedEnabledDates = await getEnabledDates(year, month)
      
      if (savedEnabledDates === null) {
        setEnabledDatesState(new Set())
      } else {
        setEnabledDatesState(new Set(savedEnabledDates))
      }
    } catch (error) {
      console.error('활성화된 날짜 로드 오류:', error)
      alert('설정을 불러오는 중 오류가 발생했습니다.')
      setEnabledDatesState(new Set())
    } finally {
      setLoading(false)
    }
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

  const loadMonthOpenStatus = async () => {
    try {
      const status = await getMonthOpenStatus(year, month)
      setIsMonthOpen(status)
    } catch (error) {
      // Permission denied 에러는 Firebase 보안 규칙 문제이므로 기본값(false) 사용
      if (error.message && error.message.includes('Permission denied')) {
        console.warn('월별 오픈 상태 로드 권한 없음 (기본값: 닫힘으로 설정)')
        setIsMonthOpen(false)
      } else {
        console.error('월별 오픈 상태 로드 오류:', error)
        setIsMonthOpen(false)
      }
    }
  }

  const handleDateToggle = (dateString) => {
    const newEnabledDates = new Set(enabledDates)
    if (newEnabledDates.has(dateString)) {
      newEnabledDates.delete(dateString)
    } else {
      newEnabledDates.add(dateString)
    }
    setEnabledDatesState(newEnabledDates)
  }

  const handleSaveDates = async () => {
    setSaving(true)
    try {
      const enabledDatesArray = Array.from(enabledDates).sort()
      await setEnabledDates(year, month, enabledDatesArray)
      alert('날짜 설정이 저장되었습니다.')
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleMonthOpenToggle = async () => {
    const newStatus = !isMonthOpen
    try {
      await setMonthOpenStatus(year, month, newStatus)
      setIsMonthOpen(newStatus)
      alert(newStatus ? '봉사 입력이 오픈되었습니다.' : '봉사 입력이 닫혔습니다.')
    } catch (error) {
      console.error('오픈 상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleAddVolunteer = async () => {
    if (!newVolunteerName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    // 중복 확인
    if (volunteers.some(v => v.name === newVolunteerName.trim())) {
      alert('이미 등록된 봉사자입니다.')
      return
    }

    try {
      await addVolunteer(newVolunteerName.trim())
      setNewVolunteerName('')
      await loadVolunteers()
      alert('봉사자가 추가되었습니다.')
    } catch (error) {
      console.error('봉사자 추가 오류:', error)
      alert('봉사자 추가 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteVolunteer = async (volunteerId, volunteerName) => {
    if (!confirm(`"${volunteerName}" 봉사자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteVolunteer(volunteerId)
      await loadVolunteers()
      alert('봉사자가 삭제되었습니다.')
    } catch (error) {
      console.error('봉사자 삭제 오류:', error)
      alert('봉사자 삭제 중 오류가 발생했습니다.')
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

  const handleEnableAll = () => {
    const allDateStrings = weekends.map(d => d.dateString)
    setEnabledDatesState(new Set(allDateStrings))
  }

  const handleDisableAll = () => {
    setEnabledDatesState(new Set())
  }

  return (
    <div className="admin-view">
      <div className="header">
        <h1>관리자 설정</h1>
      </div>

      <div className="month-selector">
        <button onClick={() => handleMonthChange(-1)}>◀</button>
        <span>{year}년 {month}월</span>
        <button onClick={() => handleMonthChange(1)}>▶</button>
      </div>

      <div className="open-status-section">
        <div className="open-status-control">
          <span className="status-label">봉사 입력 상태:</span>
          <button 
            className={`toggle-button ${isMonthOpen ? 'open' : 'closed'}`}
            onClick={handleMonthOpenToggle}
          >
            {isMonthOpen ? '✓ 오픈' : '닫힘'}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'dates' ? 'active' : ''}`}
          onClick={() => setActiveTab('dates')}
        >
          날짜 선택
        </button>
        <button 
          className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          봉사 신청 현황
        </button>
        <button 
          className={`tab-button ${activeTab === 'selection' ? 'active' : ''}`}
          onClick={() => setActiveTab('selection')}
          disabled={isMonthOpen}
          title={isMonthOpen ? '봉사 신청이 닫힌 후 사용 가능합니다' : ''}
        >
          봉사자 선택 {isMonthOpen && '(닫힌 후 사용)'}
        </button>
        <button 
          className={`tab-button ${activeTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteers')}
        >
          봉사자 관리
        </button>
      </div>

      {activeTab === 'dates' && (
        <>
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <>
              <div className="dates-controls">
                <button className="control-button" onClick={handleEnableAll}>
                  전체 선택
                </button>
                <button className="control-button" onClick={handleDisableAll}>
                  전체 해제
                </button>
              </div>

              <div className="weekend-calendar">
                <div className="weekend-row">
                  <div className="weekend-label">일요일</div>
                  <div className="dates-row">
                    {weekends
                      .filter(day => day.dayOfWeekNum === 0)
                      .map((day) => {
                        const isEnabled = enabledDates.has(day.dateString)
                        return (
                          <button
                            key={day.dateString}
                            className={`date-button ${isEnabled ? 'enabled' : 'disabled'}`}
                            onClick={() => handleDateToggle(day.dateString)}
                          >
                            <div className="date-display">{day.display}</div>
                            <div className="date-status">
                              {isEnabled ? '✓' : ''}
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
                <div className="weekend-row">
                  <div className="weekend-label">토요일</div>
                  <div className="dates-row">
                    {weekends
                      .filter(day => day.dayOfWeekNum === 6)
                      .map((day) => {
                        const isEnabled = enabledDates.has(day.dateString)
                        return (
                          <button
                            key={day.dateString}
                            className={`date-button ${isEnabled ? 'enabled' : 'disabled'}`}
                            onClick={() => handleDateToggle(day.dateString)}
                          >
                            <div className="date-display">{day.display}</div>
                            <div className="date-status">
                              {isEnabled ? '✓' : ''}
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
              </div>

              <button
                className="save-button"
                onClick={handleSaveDates}
                disabled={saving}
              >
                {saving ? '저장 중...' : '날짜 설정 저장'}
              </button>
            </>
          )}
        </>
      )}

      {activeTab === 'status' && (
        <StatusTab 
          year={year}
          month={month}
          enabledDates={enabledDates}
          isMonthOpen={isMonthOpen}
          handleMonthChange={handleMonthChange}
        />
      )}

      {activeTab === 'selection' && !isMonthOpen && (
        <VolunteerSelectionTab
          enabledDates={enabledDates}
          weekends={weekends}
          volunteers={volunteers}
          year={year}
          month={month}
        />
      )}

      {activeTab === 'selection' && isMonthOpen && (
        <div className="empty-state">
          봉사 신청이 닫힌 후 봉사자를 선택할 수 있습니다.
        </div>
      )}

      {activeTab === 'volunteers' && (
        <VolunteersManagementTab
          volunteers={volunteers}
          newVolunteerName={newVolunteerName}
          setNewVolunteerName={setNewVolunteerName}
          handleAddVolunteer={handleAddVolunteer}
          loadVolunteers={loadVolunteers}
        />
      )}
    </div>
  )
}

// 봉사자 관리 탭 컴포넌트
function VolunteersManagementTab({ volunteers, newVolunteerName, setNewVolunteerName, handleAddVolunteer, loadVolunteers }) {
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [editingVolunteer, setEditingVolunteer] = useState(null)
  const [editName, setEditName] = useState('')

  const handleSettingsClick = (volunteerId, volunteerName, e) => {
    e.stopPropagation()
    if (openDropdownId === volunteerId) {
      setOpenDropdownId(null)
    } else {
      setOpenDropdownId(volunteerId)
    }
  }

  const handleEditClick = (volunteer) => {
    setEditingVolunteer(volunteer)
    setEditName(volunteer.name)
    setOpenDropdownId(null)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (volunteers.some(v => v.name === editName.trim() && v.id !== editingVolunteer.id)) {
      alert('이미 등록된 봉사자입니다.')
      return
    }

    try {
      await updateVolunteer(editingVolunteer.id, editName.trim())
      await loadVolunteers()
      setEditingVolunteer(null)
      setEditName('')
      alert('봉사자 이름이 수정되었습니다.')
    } catch (error) {
      console.error('이름 수정 오류:', error)
      alert('이름 수정 중 오류가 발생했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setEditingVolunteer(null)
    setEditName('')
  }

  const handleDeleteVolunteer = async (volunteerId, volunteerName) => {
    setOpenDropdownId(null)
    if (!confirm(`"${volunteerName}" 봉사자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteVolunteer(volunteerId)
      await loadVolunteers()
      alert('봉사자가 삭제되었습니다.')
    } catch (error) {
      console.error('봉사자 삭제 오류:', error)
      alert('봉사자 삭제 중 오류가 발생했습니다.')
    }
  }

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null)
    }
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  return (
    <div className="volunteers-section">
      {editingVolunteer && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>봉사자 이름 수정</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="새 이름을 입력하세요"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
              autoFocus
            />
            <div className="edit-modal-buttons">
              <button onClick={handleSaveEdit}>저장</button>
              <button onClick={handleCancelEdit}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="add-volunteer">
        <h3>봉사자 추가</h3>
        <div className="input-group">
          <input
            type="text"
            value={newVolunteerName}
            onChange={(e) => setNewVolunteerName(e.target.value)}
            placeholder="이름을 입력하세요"
            onKeyPress={(e) => e.key === 'Enter' && handleAddVolunteer()}
          />
          <button onClick={handleAddVolunteer}>추가</button>
        </div>
      </div>

      <div className="volunteers-list">
        <h3>봉사자 명단 ({volunteers.length}명)</h3>
        {volunteers.length === 0 ? (
          <div className="empty-state">등록된 봉사자가 없습니다.</div>
        ) : (
          <div className="volunteers-grid">
            {volunteers.map((volunteer) => (
              <div key={volunteer.id} className="volunteer-item">
                <span className="volunteer-name">{volunteer.name}</span>
                <div className="volunteer-settings">
                  <button
                    className="settings-icon-button"
                    onClick={(e) => handleSettingsClick(volunteer.id, volunteer.name, e)}
                    title="설정"
                  >
                    ⚙️
                  </button>
                  {openDropdownId === volunteer.id && (
                    <div className="volunteer-dropdown-menu">
                      <button onClick={() => handleEditClick(volunteer)}>이름 수정</button>
                      <button onClick={() => handleDeleteVolunteer(volunteer.id, volunteer.name)}>삭제</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 봉사 신청 현황 탭 컴포넌트
function StatusTab({ year, month, enabledDates, isMonthOpen, handleMonthChange }) {
  const [allDays, setAllDays] = useState([])
  const [volunteersByDate, setVolunteersByDate] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateAllDays()
    loadData()
  }, [year, month, enabledDates])

  const updateAllDays = () => {
    const daysList = getAllDaysInMonth(year, month)
    setAllDays(daysList)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const volunteersMap = {}
      for (const dateString of enabledDates) {
        try {
          const availableVolunteers = await getAvailableVolunteers(dateString)
          volunteersMap[dateString] = availableVolunteers
        } catch (error) {
          console.error(`날짜 ${dateString} 봉사자 로드 오류:`, error)
          volunteersMap[dateString] = []
        }
      }
      setVolunteersByDate(volunteersMap)
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const enabledDays = allDays.filter(day => enabledDates.has(day.dateString))

  return (
    <div className="status-section">
      <div className="open-status-info">
        <span className={`status-badge ${isMonthOpen ? 'open' : 'closed'}`}>
          {isMonthOpen ? '✓ 오픈' : '닫힘'}
        </span>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="dates-list">
          {enabledDays.length === 0 ? (
            <div className="empty-state">
              이번 달에는 선택된 봉사 날짜가 없습니다.
            </div>
          ) : (
            enabledDays.map((day) => {
              const availableVolunteers = volunteersByDate[day.dateString] || []
              return (
                <div key={day.dateString} className="date-card">
                  <div className="date-header">
                    <h3>{day.display}</h3>
                  </div>
                  {availableVolunteers.length > 0 ? (
                    <div className="volunteers-list">
                      {availableVolunteers.map((volunteer) => (
                        <div key={volunteer.id} className="volunteer-name">
                          {volunteer.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-volunteers">신청자가 없습니다.</div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// 역할별 봉사자 선택 탭 컴포넌트
function VolunteerSelectionTab({ enabledDates, weekends, volunteers, year, month }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableVolunteers, setAvailableVolunteers] = useState([])
  const [volunteerCounts, setVolunteerCounts] = useState({}) // { volunteerId: { commentary, reading, prayer } }
  const [roleSelections, setRoleSelections] = useState({
    [ROLES.COMMENTARY]: [],
    [ROLES.READING_1]: [],
    [ROLES.READING_2]: [],
    [ROLES.PRAYER_1]: [],
    [ROLES.PRAYER_2]: [],
    [ROLES.PRAYER_3]: [],
    [ROLES.PRAYER_4]: []
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      loadSelectionData()
    }
  }, [selectedDate])

  useEffect(() => {
    if (availableVolunteers.length > 0) {
      loadVolunteerCounts()
    }
  }, [availableVolunteers, year])

  const loadSelectionData = async () => {
    setLoading(true)
    try {
      // 해당 날짜의 가능한 봉사자 목록
      const available = await getAvailableVolunteers(selectedDate)
      setAvailableVolunteers(available)

      // 이미 선택된 봉사자들
      const selected = await getSelectedVolunteersByRole(selectedDate)
      setRoleSelections(selected)
    } catch (error) {
      console.error('선택 데이터 로드 오류:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadVolunteerCounts = async () => {
    const counts = {}
    await Promise.all(
      availableVolunteers.map(async (volunteer) => {
        const count = await getVolunteerServiceCount(volunteer.id, year)
        counts[volunteer.id] = count
      })
    )
    setVolunteerCounts(counts)
  }

  const getVolunteerDisplayName = (volunteer) => {
    const count = volunteerCounts[volunteer.id]
    if (!count) return volunteer.name
    
    const parts = []
    if (count.commentary > 0) parts.push(`${count.commentary}`)
    if (count.reading > 0) parts.push(`${count.reading}`)
    if (count.prayer > 0) parts.push(`${count.prayer}`)
    
    // 가장 높은 카운트를 표시 (해설 우선, 그 다음 독서, 보편)
    let countText = ''
    if (count.commentary > 0) {
      countText = count.commentary
    } else if (count.reading > 0) {
      countText = count.reading
    } else if (count.prayer > 0) {
      countText = count.prayer
    }
    
    // 현재 선택 중인 역할에 맞는 카운트 표시
    return countText > 0 ? `${volunteer.name} ${countText}` : volunteer.name
  }

  const getRoleSpecificCount = (volunteerId, roleType) => {
    const count = volunteerCounts[volunteerId]
    if (!count) return null
    
    if (roleType === 'commentary') return count.commentary
    if (roleType === 'reading') return count.reading
    if (roleType === 'prayer') return count.prayer
    return null
  }

  const handleRoleToggle = (volunteerId, role) => {
    const currentSelection = [...roleSelections[role]]
    const isSelected = currentSelection.includes(volunteerId)

    // 해설과 독서는 중복 불가 체크
    if (!isSelected && role === ROLES.COMMENTARY) {
      // 독서1, 독서2와 중복 체크
      if (roleSelections[ROLES.READING_1].includes(volunteerId) || 
          roleSelections[ROLES.READING_2].includes(volunteerId)) {
        alert('해설과 독서는 중복 선택할 수 없습니다.')
        return
      }
    }

    if (!isSelected && (role === ROLES.READING_1 || role === ROLES.READING_2)) {
      // 해설과 중복 체크
      if (roleSelections[ROLES.COMMENTARY].includes(volunteerId)) {
        alert('독서와 해설은 중복 선택할 수 없습니다.')
        return
      }

      // 독서1과 독서2는 서로 중복 선택 불가
      if (role === ROLES.READING_1 && roleSelections[ROLES.READING_2].includes(volunteerId)) {
        alert('이미 독서2로 선택된 봉사자는 독서1으로 선택할 수 없습니다.')
        return
      }

      if (role === ROLES.READING_2 && roleSelections[ROLES.READING_1].includes(volunteerId)) {
        alert('이미 독서1로 선택된 봉사자는 독서2로 선택할 수 없습니다.')
        return
      }
    }

    if (isSelected) {
      currentSelection.splice(currentSelection.indexOf(volunteerId), 1)
    } else {
      currentSelection.push(volunteerId)
    }

    // 인원수 제한 체크
    const maxCounts = {
      [ROLES.COMMENTARY]: 2,
      [ROLES.READING_1]: 1,
      [ROLES.READING_2]: 1,
      [ROLES.PRAYER_1]: 1,
      [ROLES.PRAYER_2]: 1,
      [ROLES.PRAYER_3]: 1,
      [ROLES.PRAYER_4]: 1
    }

    if (currentSelection.length > maxCounts[role]) {
      const roleNames = {
        [ROLES.COMMENTARY]: '해설',
        [ROLES.READING_1]: '독서1',
        [ROLES.READING_2]: '독서2',
        [ROLES.PRAYER_1]: '보편1',
        [ROLES.PRAYER_2]: '보편2',
        [ROLES.PRAYER_3]: '보편3',
        [ROLES.PRAYER_4]: '보편4'
      }
      alert(`${roleNames[role]}은(는) 최대 ${maxCounts[role]}명까지 선택할 수 있습니다.`)
      return
    }

    setRoleSelections({
      ...roleSelections,
      [role]: currentSelection
    })
  }

  const handleSave = async () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.')
      return
    }

    // 해설 최소 1명 체크
    if (roleSelections[ROLES.COMMENTARY].length === 0) {
      alert('해설은 최소 1명 선택해야 합니다.')
      return
    }

    // 필수 인원 체크
    if (roleSelections[ROLES.READING_1].length !== 1 || roleSelections[ROLES.READING_2].length !== 1) {
      alert('독서는 독서1과 독서2 각각 1명씩 선택해야 합니다.')
      return
    }

    if (roleSelections[ROLES.PRAYER_1].length !== 1 || roleSelections[ROLES.PRAYER_2].length !== 1 ||
        roleSelections[ROLES.PRAYER_3].length !== 1 || roleSelections[ROLES.PRAYER_4].length !== 1) {
      alert('보편지향기도는 보편1, 보편2, 보편3, 보편4 각각 1명씩 선택해야 합니다.')
      return
    }

    setSaving(true)
    try {
      await setSelectedVolunteersByRole(selectedDate, roleSelections)
      alert('봉사자 선택이 저장되었습니다.')
      await loadVolunteerCounts() // 카운트 다시 로드
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const selectedDays = weekends.filter(day => enabledDates.has(day.dateString))

  return (
    <div className="selection-section">
      <MonthlyVolunteerTable
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        compact={true}
      />

      <div className="date-selector">
        <h3>날짜 선택</h3>
        <div className="date-buttons-grid">
          {selectedDays.map(day => (
            <button
              key={day.dateString}
              className={`date-select-button ${selectedDate === day.dateString ? 'active' : ''}`}
              onClick={() => setSelectedDate(day.dateString)}
            >
              {day.display}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <>
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <div className="role-selection">
              <h3>{selectedDays.find(d => d.dateString === selectedDate)?.display} 봉사자 선택</h3>
              
              <div className="role-group">
                <h4>해설 (1-2명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.COMMENTARY].includes(volunteer.id)
                    const isSelectedInReading = roleSelections[ROLES.READING_1].includes(volunteer.id) || 
                                                  roleSelections[ROLES.READING_2].includes(volunteer.id)
                    const disabled = isSelectedInReading
                    const count = getRoleSpecificCount(volunteer.id, 'commentary')
                    return (
                      <label key={volunteer.id} className={`checkbox-label ${disabled ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.COMMENTARY)}
                        />
                        <span>
                          {volunteer.name} {count !== null && count > 0 && `(${count})`} {disabled && '(독서 선택됨)'}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.COMMENTARY].length}/2
                </div>
              </div>

              <div className="role-group">
                <h4>독서1 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.READING_1].includes(volunteer.id)
                    const isSelectedInCommentary = roleSelections[ROLES.COMMENTARY].includes(volunteer.id)
                    const isSelectedInReading2 = roleSelections[ROLES.READING_2].includes(volunteer.id)
                    const disabled = isSelectedInCommentary || isSelectedInReading2
                    const count = getRoleSpecificCount(volunteer.id, 'reading')
                    return (
                      <label key={volunteer.id} className={`checkbox-label ${disabled ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.READING_1)}
                        />
                        <span>
                          {volunteer.name} {count !== null && count > 0 && `(${count})`}{' '}
                          {disabled &&
                            (isSelectedInCommentary
                              ? '(해설 선택됨)'
                              : isSelectedInReading2
                                ? '(2독서 선택됨)'
                                : '')}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.READING_1].length}/1
                </div>
              </div>

              <div className="role-group">
                <h4>독서2 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.READING_2].includes(volunteer.id)
                    const isSelectedInCommentary = roleSelections[ROLES.COMMENTARY].includes(volunteer.id)
                    const isSelectedInReading1 = roleSelections[ROLES.READING_1].includes(volunteer.id)
                    const disabled = isSelectedInCommentary || isSelectedInReading1
                    const count = getRoleSpecificCount(volunteer.id, 'reading')
                    return (
                      <label key={volunteer.id} className={`checkbox-label ${disabled ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.READING_2)}
                        />
                        <span>
                          {volunteer.name} {count !== null && count > 0 && `(${count})`}{' '}
                          {disabled &&
                            (isSelectedInCommentary
                              ? '(해설 선택됨)'
                              : isSelectedInReading1
                                ? '(1독서 선택됨)'
                                : '')}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.READING_2].length}/1
                </div>
              </div>

              <div className="role-group">
                <h4>보편지향기도1 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.PRAYER_1].includes(volunteer.id)
                    const count = getRoleSpecificCount(volunteer.id, 'prayer')
                    return (
                      <label key={volunteer.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.PRAYER_1)}
                        />
                        <span>{volunteer.name} {count !== null && count > 0 && `(${count})`}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.PRAYER_1].length}/1
                </div>
              </div>

              <div className="role-group">
                <h4>보편지향기도2 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.PRAYER_2].includes(volunteer.id)
                    const count = getRoleSpecificCount(volunteer.id, 'prayer')
                    return (
                      <label key={volunteer.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.PRAYER_2)}
                        />
                        <span>{volunteer.name} {count !== null && count > 0 && `(${count})`}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.PRAYER_2].length}/1
                </div>
              </div>

              <div className="role-group">
                <h4>보편지향기도3 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.PRAYER_3].includes(volunteer.id)
                    const count = getRoleSpecificCount(volunteer.id, 'prayer')
                    return (
                      <label key={volunteer.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.PRAYER_3)}
                        />
                        <span>{volunteer.name} {count !== null && count > 0 && `(${count})`}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.PRAYER_3].length}/1
                </div>
              </div>

              <div className="role-group">
                <h4>보편지향기도4 (1명 선택)</h4>
                <div className="volunteers-checkboxes">
                  {availableVolunteers.map(volunteer => {
                    const isSelected = roleSelections[ROLES.PRAYER_4].includes(volunteer.id)
                    const count = getRoleSpecificCount(volunteer.id, 'prayer')
                    return (
                      <label key={volunteer.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRoleToggle(volunteer.id, ROLES.PRAYER_4)}
                        />
                        <span>{volunteer.name} {count !== null && count > 0 && `(${count})`}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="selection-count">
                  선택: {roleSelections[ROLES.PRAYER_4].length}/1
                </div>
              </div>

              {/* 선택 요약 */}
              <div className="selection-summary">
                <h4>선택 요약</h4>
                <textarea
                  className="summary-textarea"
                  readOnly
                  onClick={(e) => e.target.select()}
                  value={`- 해설: ${roleSelections[ROLES.COMMENTARY].length > 0 ? roleSelections[ROLES.COMMENTARY].map(id => availableVolunteers.find(v => v.id === id)?.name || '').join(', ') : ''}\n- 1독서: ${roleSelections[ROLES.READING_1].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.READING_1][0])?.name || '' : ''}\n- 2독서: ${roleSelections[ROLES.READING_2].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.READING_2][0])?.name || '' : ''}\n- 보편1: ${roleSelections[ROLES.PRAYER_1].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.PRAYER_1][0])?.name || '' : ''}\n- 보편2: ${roleSelections[ROLES.PRAYER_2].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.PRAYER_2][0])?.name || '' : ''}\n- 보편3: ${roleSelections[ROLES.PRAYER_3].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.PRAYER_3][0])?.name || '' : ''}\n- 보편4: ${roleSelections[ROLES.PRAYER_4].length > 0 ? availableVolunteers.find(v => v.id === roleSelections[ROLES.PRAYER_4][0])?.name || '' : ''}`}
                />
              </div>

              <button
                className="save-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '선택 저장'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

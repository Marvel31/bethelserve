import { useState, useEffect } from 'react'
import { getAllDaysInMonth } from '../utils/dateUtils'
import {
  getEnabledDates,
  getSelectedVolunteersByRole,
  getAllVolunteers,
  ROLES
} from '../services/database'
import './AnnouncementView.css'

/**
 * 월별 봉사표 공통 컴포넌트
 * - 공지사항 화면과 관리자 봉사자 선택 탭에서 재사용
 *
 * props:
 * - year, month: 년/월
 * - selectedDate: 현재 선택된 날짜(YYYY-MM-DD) - 선택 강조용
 * - onSelectDate: (dateString) => void - 행 클릭 시 호출 (없으면 조회 전용)
 * - compact: boolean - true이면 조금 더 촘촘한 스타일 사용
 */
export default function MonthlyVolunteerTable({
  year,
  month,
  selectedDate = null,
  onSelectDate = null,
  compact = false
}) {
  const [allDays, setAllDays] = useState([])
  const [enabledDates, setEnabledDates] = useState(new Set())
  const [volunteersByDate, setVolunteersByDate] = useState({})
  const [volunteerMap, setVolunteerMap] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateAllDays()
    loadEnabledDates()
  }, [year, month])

  useEffect(() => {
    if (enabledDates.size > 0) {
      loadVolunteersData()
    } else {
      setVolunteersByDate({})
    }
  }, [enabledDates])

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
      console.error('활성화된 날짜 로드 오류 (MonthlyVolunteerTable):', error)
      setEnabledDates(new Set())
    }
  }

  const loadVolunteersData = async () => {
    setLoading(true)
    try {
      const allVolunteers = await getAllVolunteers()
      const volunteerIdMap = {}
      allVolunteers.forEach(v => {
        volunteerIdMap[v.id] = v
      })
      setVolunteerMap(volunteerIdMap)

      const enabledDatesArray = Array.from(enabledDates)
      const volunteersMap = {}

      await Promise.all(
        enabledDatesArray.map(async (dateString) => {
          try {
            const selections = await getSelectedVolunteersByRole(dateString)
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
            console.error(`날짜 ${dateString} 봉사자 데이터 로드 오류 (MonthlyVolunteerTable):`, error)
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
      console.error('봉사자 데이터 로드 오류 (MonthlyVolunteerTable):', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDays = allDays.filter(day => enabledDates.has(day.dateString))

  const getVolunteerName = (volunteerId) => {
    if (!volunteerId) return ''
    return volunteerMap[volunteerId]?.name || ''
  }

  const renderCommentaryNames = (volunteersForDate) => {
    const commentaryIds = volunteersForDate[ROLES.COMMENTARY] || []
    if (!Array.isArray(commentaryIds) || commentaryIds.length === 0) return '-'
    const names = commentaryIds.map(id => getVolunteerName(id)).filter(name => name)
    if (names.length === 0) return '-'
    return names.map((name, idx) => (
      <span key={idx}>
        {name}
        {idx < names.length - 1 && <br />}
      </span>
    ))
  }

  if (loading) {
    return <div className="loading">로딩 중...</div>
  }

  if (selectedDays.length === 0) {
    return (
      <div className="volunteers-table-container">
        <h2>{year}년 {month}월 봉사표</h2>
        <div className="empty-state">이번 달에는 선택된 봉사 날짜가 없습니다.</div>
      </div>
    )
  }

  return (
    <div className={`volunteers-table-container ${compact ? 'volunteers-table-compact' : ''}`}>
      <h2>{year}년 {month}월 봉사표</h2>
      <table className="volunteers-table">
        <thead>
          <tr>
            <th className="date-header">날짜</th>
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
            const isActive = selectedDate === dateString

            const rowClassNames = [
              `table-row`,
              `row-${index % 4}`,
              onSelectDate ? 'clickable-row' : '',
              isActive ? 'active-row' : ''
            ].filter(Boolean).join(' ')

            const handleRowClick = () => {
              if (onSelectDate) {
                onSelectDate(dateString)
              }
            }

            return (
              <tr
                key={dateString}
                className={rowClassNames}
                onClick={handleRowClick}
              >
                <td className="date-cell">{day.display}</td>
                <td>{renderCommentaryNames(volunteers)}</td>
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
  )
}



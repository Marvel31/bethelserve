import { useState, useEffect } from 'react'
import { getAllDaysInMonth } from '../utils/dateUtils'
import { getEnabledDates, getAvailableVolunteers } from '../services/database'
import './ApplicationStatusView.css'

export default function ApplicationStatusView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [allDays, setAllDays] = useState([])
  const [enabledDates, setEnabledDatesState] = useState(new Set())
  const [volunteersByDate, setVolunteersByDate] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    setLoading(true)
    try {
      const daysList = getAllDaysInMonth(year, month)
      setAllDays(daysList)

      const savedEnabledDates = await getEnabledDates(year, month)
      const enabledSet = new Set(savedEnabledDates || [])
      setEnabledDatesState(enabledSet)

      const volunteersMap = {}
      for (const dateString of enabledSet) {
        try {
          const availableVolunteers = await getAvailableVolunteers(dateString)
          availableVolunteers.sort((a, b) =>
            a.name.localeCompare(b.name, 'ko')
          )
          volunteersMap[dateString] = availableVolunteers
        } catch (error) {
          console.error(`날짜 ${dateString} 봉사자 로드 오류:`, error)
          volunteersMap[dateString] = []
        }
      }
      setVolunteersByDate(volunteersMap)
    } catch (error) {
      console.error('봉사 신청 현황 로드 오류:', error)
    } finally {
      setLoading(false)
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

    setYear(newYear)
    setMonth(newMonth)
    setAllDays([])
    setEnabledDatesState(new Set())
    setVolunteersByDate({})
  }

  const enabledDays = allDays.filter((day) =>
    enabledDates.has(day.dateString)
  )

  return (
    <div className="application-status-view">
      <div className="header">
        <h1>봉사 신청 현황</h1>
      </div>

      <div className="month-selector">
        <button onClick={() => handleMonthChange(-1)}>◀</button>
        <span>
          {year}년 {month}월
        </span>
        <button onClick={() => handleMonthChange(1)}>▶</button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : enabledDays.length === 0 ? (
        <div className="empty-state">
          이번 달에는 봉사 신청 가능한 날짜가 없습니다.
        </div>
      ) : (
        <div className="status-table-container">
          <table className="status-table">
            <thead>
              <tr>
                <th className="date-column">날짜/행사명</th>
                <th className="volunteers-column">봉사 신청자</th>
              </tr>
            </thead>
            <tbody>
              {enabledDays.map((day) => {
                const volunteers = volunteersByDate[day.dateString] || []
                return (
                  <tr key={day.dateString}>
                    <td className="date-cell">{day.display}</td>
                    <td className="volunteers-cell">
                      {volunteers.length === 0 ? (
                        <span className="no-volunteers">
                          신청자가 없습니다.
                        </span>
                      ) : (
                        <div className="volunteer-names">
                          {volunteers.map((v) => (
                            <div key={v.id}>{v.name}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



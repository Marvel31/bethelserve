import { startOfMonth, endOfMonth, eachWeekOfInterval, format, eachDayOfInterval } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 특정 월의 모든 일요일 날짜를 반환
 */
export function getSundaysInMonth(year, month) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  
  // 해당 월의 모든 주의 시작일(일요일)을 가져옴
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 0 } // 일요일이 주의 시작
  )
  
  // 각 주의 일요일만 필터링 (월 내에 포함되는 일요일만)
  const sundays = weeks
    .map(weekStart => {
      // 일요일이 주의 시작이므로 바로 일요일
      const date = new Date(weekStart)
      return {
        date: date,
        dateString: format(date, 'yyyy-MM-dd'),
        display: format(date, 'M월 d일 (E)', { locale: ko })
      }
    })
    .filter(({ date }) => {
      // 해당 월에 포함되는 날짜만 반환
      return date.getMonth() === month - 1
    })
  
  return sundays
}

/**
 * 날짜 문자열을 포맷팅
 */
export function formatDate(dateString) {
  const date = new Date(dateString)
  return format(date, 'yyyy-MM-dd')
}

/**
 * 오늘 날짜 문자열 반환
 */
export function getTodayString() {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * 특정 월의 모든 날짜를 반환 (임의 날짜 선택용)
 */
export function getAllDaysInMonth(year, month) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  return days.map(date => ({
    date: date,
    dateString: format(date, 'yyyy-MM-dd'),
    display: format(date, 'M월 d일 (E)', { locale: ko }),
    dayOfWeek: format(date, 'E', { locale: ko })
  }))
}

/**
 * 특정 월의 토요일과 일요일만 반환 (일요일 먼저, 토요일 나중)
 * 일요일을 첫 번째 줄, 토요일을 두 번째 줄로 정렬
 */
export function getWeekendsInMonth(year, month) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const weekends = days
    .filter(date => {
      const dayOfWeek = date.getDay()
      return dayOfWeek === 0 || dayOfWeek === 6 // 0: 일요일, 6: 토요일
    })
    .map(date => ({
      date: date,
      dateString: format(date, 'yyyy-MM-dd'),
      display: format(date, 'M월 d일 (E)', { locale: ko }),
      dayOfWeek: format(date, 'E', { locale: ko }),
      dayOfWeekNum: date.getDay() // 0: 일요일, 6: 토요일
    }))
  
  // 일요일(0)을 먼저, 토요일(6)을 나중에 정렬
  weekends.sort((a, b) => {
    // 같은 날짜면 일요일을 먼저
    if (a.date.getTime() === b.date.getTime()) {
      return a.dayOfWeekNum - b.dayOfWeekNum
    }
    // 다른 날짜면 날짜 순으로
    return a.date.getTime() - b.date.getTime()
  })
  
  return weekends
}


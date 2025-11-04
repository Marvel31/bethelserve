import { ref, set, get, push, update, remove } from 'firebase/database'
import { db } from '../firebase/config'

// 데이터베이스 경로 상수
const PATHS = {
  volunteers: 'volunteers',
  availability: 'availability',
  selected: 'selected',
  enabledDates: 'enabledDates',
  monthOpenStatus: 'monthOpenStatus',
  selectedByRole: 'selectedByRole',
  announcements: 'announcements'
}

// 역할 상수
export const ROLES = {
  COMMENTARY: 'commentary', // 해설
  READING_1: 'reading_1', // 독서1
  READING_2: 'reading_2', // 독서2
  PRAYER_1: 'prayer_1', // 보편지향기도1
  PRAYER_2: 'prayer_2', // 보편지향기도2
  PRAYER_3: 'prayer_3', // 보편지향기도3
  PRAYER_4: 'prayer_4' // 보편지향기도4
}

/**
 * 봉사자 이름으로 등록
 */
export async function registerVolunteer(name) {
  const volunteerRef = push(ref(db, PATHS.volunteers))
  await set(volunteerRef, {
    name,
    createdAt: new Date().toISOString()
  })
  return volunteerRef.key
}

/**
 * 봉사자가 특정 날짜에 가능 여부 등록
 */
export async function setAvailability(volunteerId, dateString, available) {
  const availabilityRef = ref(db, `${PATHS.availability}/${dateString}/${volunteerId}`)
  if (available) {
    await set(availabilityRef, {
      volunteerId,
      dateString,
      timestamp: new Date().toISOString()
    })
  } else {
    await remove(availabilityRef)
  }
}

/**
 * 특정 날짜에 가능한 모든 봉사자 가져오기
 */
export async function getAvailableVolunteers(dateString) {
  const availabilityRef = ref(db, `${PATHS.availability}/${dateString}`)
  const snapshot = await get(availabilityRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const availabilities = snapshot.val()
  const volunteerIds = Object.keys(availabilities)
  
  // 봉사자 정보도 함께 가져오기
  const volunteers = await Promise.all(
    volunteerIds.map(async (volunteerId) => {
      const volunteerRef = ref(db, `${PATHS.volunteers}/${volunteerId}`)
      const volunteerSnapshot = await get(volunteerRef)
      if (volunteerSnapshot.exists()) {
        return {
          id: volunteerId,
          ...volunteerSnapshot.val(),
          availabilityTimestamp: availabilities[volunteerId].timestamp
        }
      }
      return null
    })
  )
  
  return volunteers.filter(v => v !== null)
}

/**
 * 선택된 봉사자 저장
 */
export async function setSelectedVolunteers(dateString, volunteerIds) {
  const selectedRef = ref(db, `${PATHS.selected}/${dateString}`)
  await set(selectedRef, {
    dateString,
    volunteerIds,
    updatedAt: new Date().toISOString()
  })
}

/**
 * 선택된 봉사자 가져오기
 */
export async function getSelectedVolunteers(dateString) {
  const selectedRef = ref(db, `${PATHS.selected}/${dateString}`)
  const snapshot = await get(selectedRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const data = snapshot.val()
  return data.volunteerIds || []
}

/**
 * 모든 봉사자 목록 가져오기
 */
export async function getAllVolunteers() {
  const volunteersRef = ref(db, PATHS.volunteers)
  const snapshot = await get(volunteersRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const volunteers = snapshot.val()
  return Object.keys(volunteers).map(id => ({
    id,
    ...volunteers[id]
  }))
}

/**
 * 활성화된 날짜 저장 (관리자가 설정한 봉사 신청 가능 날짜)
 */
export async function setEnabledDates(year, month, enabledDates) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const enabledDatesRef = ref(db, `${PATHS.enabledDates}/${monthKey}`)
  await set(enabledDatesRef, {
    year,
    month,
    enabledDates,
    updatedAt: new Date().toISOString()
  })
}

/**
 * 활성화된 날짜 불러오기
 */
export async function getEnabledDates(year, month) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const enabledDatesRef = ref(db, `${PATHS.enabledDates}/${monthKey}`)
  const snapshot = await get(enabledDatesRef)
  
  if (!snapshot.exists()) {
    return null // 설정이 없으면 null 반환 (디폴트: 모든 일요일 활성화)
  }
  
  const data = snapshot.val()
  return data.enabledDates || []
}

/**
 * 관리자용: 봉사자 추가
 */
export async function addVolunteer(name) {
  const volunteerRef = push(ref(db, PATHS.volunteers))
  await set(volunteerRef, {
    name: name.trim(),
    createdAt: new Date().toISOString()
  })
  return volunteerRef.key
}

/**
 * 관리자용: 봉사자 이름 수정
 */
export async function updateVolunteer(volunteerId, newName) {
  const volunteerRef = ref(db, `${PATHS.volunteers}/${volunteerId}`)
  await update(volunteerRef, {
    name: newName.trim(),
    updatedAt: new Date().toISOString()
  })
}

/**
 * 관리자용: 봉사자 삭제
 */
export async function deleteVolunteer(volunteerId) {
  const volunteerRef = ref(db, `${PATHS.volunteers}/${volunteerId}`)
  await remove(volunteerRef)
  
  // 해당 봉사자의 모든 availability도 삭제
  const availabilityRef = ref(db, PATHS.availability)
  const snapshot = await get(availabilityRef)
  
  if (snapshot.exists()) {
    const availabilities = snapshot.val()
    const deletePromises = Object.keys(availabilities).map(async (dateString) => {
      const dateAvailabilityRef = ref(db, `${PATHS.availability}/${dateString}/${volunteerId}`)
      await remove(dateAvailabilityRef)
    })
    await Promise.all(deletePromises)
  }
}

/**
 * 봉사자 이름으로 ID 찾기
 */
export async function getVolunteerIdByName(name) {
  const volunteersRef = ref(db, PATHS.volunteers)
  const snapshot = await get(volunteersRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  const volunteers = snapshot.val()
  for (const [id, volunteer] of Object.entries(volunteers)) {
    if (volunteer.name === name.trim()) {
      return id
    }
  }
  return null
}

/**
 * 월별 봉사 입력 오픈 상태 저장
 */
export async function setMonthOpenStatus(year, month, isOpen) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const statusRef = ref(db, `${PATHS.monthOpenStatus}/${monthKey}`)
  await set(statusRef, {
    year,
    month,
    isOpen,
    updatedAt: new Date().toISOString()
  })
}

/**
 * 월별 봉사 입력 오픈 상태 조회
 */
export async function getMonthOpenStatus(year, month) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const statusRef = ref(db, `${PATHS.monthOpenStatus}/${monthKey}`)
  const snapshot = await get(statusRef)
  
  if (!snapshot.exists()) {
    return false // 기본값: 닫힘
  }
  
  const data = snapshot.val()
  return data.isOpen || false
}

/**
 * 역할별 선택된 봉사자 저장
 * 구조: { commentary: [ids], reading_1: [ids], reading_2: [ids], prayer_1: [ids], prayer_2: [ids], prayer_3: [ids], prayer_4: [ids] }
 */
export async function setSelectedVolunteersByRole(dateString, selections) {
  const selectedRef = ref(db, `${PATHS.selectedByRole}/${dateString}`)
  await set(selectedRef, {
    dateString,
    selections: {
      [ROLES.COMMENTARY]: selections[ROLES.COMMENTARY] || [],
      [ROLES.READING_1]: selections[ROLES.READING_1] || [],
      [ROLES.READING_2]: selections[ROLES.READING_2] || [],
      [ROLES.PRAYER_1]: selections[ROLES.PRAYER_1] || [],
      [ROLES.PRAYER_2]: selections[ROLES.PRAYER_2] || [],
      [ROLES.PRAYER_3]: selections[ROLES.PRAYER_3] || [],
      [ROLES.PRAYER_4]: selections[ROLES.PRAYER_4] || []
    },
    updatedAt: new Date().toISOString()
  })
}

/**
 * 역할별 선택된 봉사자 가져오기
 */
export async function getSelectedVolunteersByRole(dateString) {
  const selectedRef = ref(db, `${PATHS.selectedByRole}/${dateString}`)
  const snapshot = await get(selectedRef)
  
  if (!snapshot.exists()) {
    return {
      [ROLES.COMMENTARY]: [],
      [ROLES.READING_1]: [],
      [ROLES.READING_2]: [],
      [ROLES.PRAYER_1]: [],
      [ROLES.PRAYER_2]: [],
      [ROLES.PRAYER_3]: [],
      [ROLES.PRAYER_4]: []
    }
  }
  
  const data = snapshot.val()
  return {
    [ROLES.COMMENTARY]: data.selections?.[ROLES.COMMENTARY] || [],
    [ROLES.READING_1]: data.selections?.[ROLES.READING_1] || [],
    [ROLES.READING_2]: data.selections?.[ROLES.READING_2] || [],
    [ROLES.PRAYER_1]: data.selections?.[ROLES.PRAYER_1] || [],
    [ROLES.PRAYER_2]: data.selections?.[ROLES.PRAYER_2] || [],
    [ROLES.PRAYER_3]: data.selections?.[ROLES.PRAYER_3] || [],
    [ROLES.PRAYER_4]: data.selections?.[ROLES.PRAYER_4] || []
  }
}

/**
 * 역할별 선택된 봉사자 정보 가져오기 (봉사자 이름 포함)
 * 독서1+독서2는 READING으로, 보편1-4는 PRAYER로 합쳐서 반환
 */
export async function getSelectedVolunteersByRoleWithNames(dateString) {
  const selections = await getSelectedVolunteersByRole(dateString)
  const allVolunteers = await getAllVolunteers()
  const volunteerMap = {}
  
  allVolunteers.forEach(v => {
    volunteerMap[v.id] = v
  })
  
  const result = {
    [ROLES.COMMENTARY]: [],
    READING: [], // 독서1 + 독서2 합침
    PRAYER: []   // 보편1-4 합침
  }
  
  // 해설
  const commentaryIds = selections[ROLES.COMMENTARY] || []
  result[ROLES.COMMENTARY] = commentaryIds
    .map(id => volunteerMap[id])
    .filter(v => v !== undefined)
  
  // 독서 (독서1 + 독서2 합침, 중복 제거)
  const reading1Ids = selections[ROLES.READING_1] || []
  const reading2Ids = selections[ROLES.READING_2] || []
  const allReadingIds = [...new Set([...reading1Ids, ...reading2Ids])]
  result.READING = allReadingIds
    .map(id => volunteerMap[id])
    .filter(v => v !== undefined)
  
  // 보편지향기도 (보편1-4 합침, 중복 제거)
  const prayer1Ids = selections[ROLES.PRAYER_1] || []
  const prayer2Ids = selections[ROLES.PRAYER_2] || []
  const prayer3Ids = selections[ROLES.PRAYER_3] || []
  const prayer4Ids = selections[ROLES.PRAYER_4] || []
  const allPrayerIds = [...new Set([...prayer1Ids, ...prayer2Ids, ...prayer3Ids, ...prayer4Ids])]
  result.PRAYER = allPrayerIds
    .map(id => volunteerMap[id])
    .filter(v => v !== undefined)
  
  return result
}

/**
 * 공지사항 저장 (날짜별 - 레거시)
 */
export async function setAnnouncement(dateString, announcement) {
  const announcementRef = ref(db, `${PATHS.announcements}/${dateString}`)
  await set(announcementRef, {
    dateString,
    content: announcement,
    updatedAt: new Date().toISOString()
  })
}

/**
 * 공지사항 가져오기 (날짜별 - 레거시)
 */
export async function getAnnouncement(dateString) {
  const announcementRef = ref(db, `${PATHS.announcements}/${dateString}`)
  const snapshot = await get(announcementRef)
  
  if (!snapshot.exists()) {
    return ''
  }
  
  const data = snapshot.val()
  return data.content || ''
}

/**
 * 월별 공지사항 저장
 */
export async function setAnnouncementByMonth(year, month, announcement) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const announcementRef = ref(db, `${PATHS.announcements}/${monthKey}`)
  await set(announcementRef, {
    year,
    month,
    content: announcement,
    updatedAt: new Date().toISOString()
  })
}

/**
 * 월별 공지사항 가져오기
 */
export async function getAnnouncementByMonth(year, month) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const announcementRef = ref(db, `${PATHS.announcements}/${monthKey}`)
  const snapshot = await get(announcementRef)
  
  if (!snapshot.exists()) {
    return ''
  }
  
  const data = snapshot.val()
  return data.content || ''
}

/**
 * 올해 특정 봉사자의 각 역할별 선택 횟수 가져오기
 * @param {string} volunteerId - 봉사자 ID
 * @param {number} year - 년도
 * @returns {Object} { commentary: number, reading: number, prayer: number }
 */
export async function getVolunteerServiceCount(volunteerId, year) {
  const selectedByRoleRef = ref(db, PATHS.selectedByRole)
  const snapshot = await get(selectedByRoleRef)
  
  const counts = {
    commentary: 0,
    reading: 0,
    prayer: 0
  }
  
  if (!snapshot.exists()) {
    return counts
  }
  
  const allSelections = snapshot.val()
  
  // 해당 연도의 모든 날짜 데이터 순회
  for (const dateString in allSelections) {
    // 날짜가 해당 연도인지 확인
    if (dateString.startsWith(year)) {
      const dateSelections = allSelections[dateString]?.selections || {}
      
      // 해설 카운트
      const commentaryIds = dateSelections[ROLES.COMMENTARY] || []
      if (commentaryIds.includes(volunteerId)) {
        counts.commentary++
      }
      
      // 독서 카운트 (독서1 + 독서2 합계)
      const reading1Ids = dateSelections[ROLES.READING_1] || []
      const reading2Ids = dateSelections[ROLES.READING_2] || []
      if (reading1Ids.includes(volunteerId) || reading2Ids.includes(volunteerId)) {
        counts.reading++
      }
      
      // 보편지향기도 카운트 (보편1 + 보편2 + 보편3 + 보편4 합계)
      const prayer1Ids = dateSelections[ROLES.PRAYER_1] || []
      const prayer2Ids = dateSelections[ROLES.PRAYER_2] || []
      const prayer3Ids = dateSelections[ROLES.PRAYER_3] || []
      const prayer4Ids = dateSelections[ROLES.PRAYER_4] || []
      if (prayer1Ids.includes(volunteerId) || prayer2Ids.includes(volunteerId) || 
          prayer3Ids.includes(volunteerId) || prayer4Ids.includes(volunteerId)) {
        counts.prayer++
      }
    }
  }
  
  return counts
}


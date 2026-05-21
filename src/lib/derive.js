import { parseISO, differenceInCalendarDays, format } from 'date-fns'

const WEEKDAYS_KO = ['일','월','화','수','목','금','토']

export function weekday(isoDate) {
  if (!isoDate) return ''
  try {
    const d = parseISO(isoDate)
    return WEEKDAYS_KO[d.getDay()]
  } catch { return '' }
}

// 일수 = 리턴일 - 출발일 + 2  (사용자 확인된 규칙)
export function tripDays(depISO, retISO) {
  if (!depISO || !retISO) return ''
  try {
    const diff = differenceInCalendarDays(parseISO(retISO), parseISO(depISO))
    return diff + 2
  } catch { return '' }
}

// 화면 표시용 날짜 (DD/MM/YYYY)
export function fmtDate(isoDate) {
  if (!isoDate) return ''
  try { return format(parseISO(isoDate), 'dd/MM/yyyy') } catch { return isoDate }
}

export function patternKey(req) {
  if (!req?.depAirport || !req?.retAirport) return ''
  return `${req.depAirport}/${req.retAirport}`
}

export function buildEscalation(req) {
  if (!req) return ''
  const parts = []
  parts.push(`[GSO 요청]`)
  if (req.requester) parts.push(`요청자: ${req.requester}`)
  parts.push(`구간: ${req.depAirport || '?'} ${req.outFlt || ''} ${fmtDate(req.depDate)} (${weekday(req.depDate)})`)
  parts.push(`     ${req.retAirport || '?'} ${req.inFlt || ''} ${fmtDate(req.retDate)} (${weekday(req.retDate)})`)
  parts.push(`일수: ${tripDays(req.depDate, req.retDate)}`)
  if (req.reqSeats) parts.push(`요청석: ${req.reqSeats}`)
  if (req.fare) parts.push(`운임: ${req.fare}`)
  if (req.demandName) parts.push(`수요명: ${req.demandName}`)
  if (req.pnr) parts.push(`PNR: ${req.pnr}`)
  return parts.join('\n')
}

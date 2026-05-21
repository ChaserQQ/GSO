import { differenceInCalendarDays, parseISO, format } from 'date-fns'

const KOR_WD = ['일','월','화','수','목','금','토']

export function weekday(isoDate) {
  if (!isoDate) return ''
  try {
    const d = parseISO(isoDate)
    return KOR_WD[d.getDay()]
  } catch { return '' }
}

// 엑셀: 리턴일 - 출발일 + 2
export function tripDays(dep, ret) {
  if (!dep || !ret) return ''
  try {
    return differenceInCalendarDays(parseISO(ret), parseISO(dep)) + 2
  } catch { return '' }
}

export function fmtDate(isoDate) {
  if (!isoDate) return ''
  try {
    return format(parseISO(isoDate), 'dd/MM/yyyy')
  } catch { return isoDate }
}

// 패턴: 현지도착공항/현지출발공항 (예: CDG/MXP)
export function makePattern(arrCode, depCode) {
  if (!arrCode || !depCode) return ''
  return `${arrCode}/${depCode}`
}

// Escalation 복붙용 텍스트 (AE열 대체)
export function buildEscalation(req) {
  if (!req) return ''
  const lines = []
  lines.push(`[GSO 요청]`)
  lines.push(`요청자: ${req.requester || '-'}`)
  lines.push(`구간: ${req.arrAirport || '-'} → ${req.depAirport || '-'}`)
  lines.push(`O-FLT: ${req.oFlt || '-'} (${fmtDate(req.depDate)} ${weekday(req.depDate)})`)
  lines.push(`I-FLT: ${req.iFlt || '-'} (${fmtDate(req.retDate)} ${weekday(req.retDate)})`)
  lines.push(`일수: ${tripDays(req.depDate, req.retDate)}일`)
  lines.push(`요청석: ${req.reqSeats ?? '-'} / 지원석: ${req.suppSeats ?? '-'}`)
  if (req.fare) lines.push(`운임: ${req.fare}`)
  if (req.pnr) lines.push(`PNR: ${req.pnr}`)
  if (req.bookingId) lines.push(`Booking ID: ${req.bookingId}`)
  if (req.demandName) lines.push(`수요명: ${req.demandName}`)
  return lines.join('\n')
}

// ADM 상세틀 (Q열 대체)
export function buildAdmDetail(adm, linkedReq) {
  if (!adm) return ''
  const kind = adm.kind || ''  // '모객성' | '테마성' | ...
  const r = linkedReq || {}
  const lines = []
  lines.push(`[ADM ${kind}]`)
  if (r.arrAirport) lines.push(`구간: ${r.arrAirport} → ${r.depAirport || ''}`)
  if (r.oFlt) lines.push(`편명: ${r.oFlt} / ${r.iFlt || ''}`)
  if (r.depDate) lines.push(`출발: ${fmtDate(r.depDate)} (${weekday(r.depDate)})`)
  if (adm.amount) lines.push(`금액: ${adm.amount}`)
  if (adm.note) lines.push(`비고: ${adm.note}`)
  return lines.join('\n')
}

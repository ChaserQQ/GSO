// CRS 스케줄 텍스트 파서
//
// 예시 입력:
//   1  KE 901 K 11NOV 3 ICNCDG DK1  1205 1830  11NOV  E  0 77W DL
//   2  KE 928 K 18NOV 3 MXPICN DK1  2005 1535  19NOV  E  0 789 M
//
// 추출:
//   - 편명 (KE901)
//   - 출발일 (11NOV → 현재/다음 연도 추정)
//   - 출발지/도착지 (ICN/CDG)
//
// HUB(보통 ICN) 기준으로:
//   - 도착지가 HUB가 아닌 줄  → 아웃바운드 (현지 도착)
//   - 도착지가 HUB인 줄        → 인바운드 (현지 출발)

const MONTH = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 }

export const HUB = 'ICN'

function parseDayMon(token, referenceYear) {
  // '11NOV' → { day:11, month:10 }
  const m = token.match(/^(\d{1,2})([A-Z]{3})$/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const month = MONTH[m[2]]
  if (month === undefined) return null
  return { day, month }
}

function toISO(year, month, day) {
  const dt = new Date(Date.UTC(year, month, day))
  return dt.toISOString().slice(0, 10)
}

function pickYear(month, todayYear, todayMonth) {
  // 과거 6개월보다 이전이면 다음해로 추정
  if (month < todayMonth - 6) return todayYear + 1
  if (month > todayMonth + 6) return todayYear - 1
  return todayYear
}

// 한 줄을 세그먼트로 파싱
export function parseSegment(line, referenceYear) {
  // 줄 앞 공백/번호 무시, 토큰 분리
  const clean = line.trim().replace(/^\d+\s+/, '')
  const tokens = clean.split(/\s+/)
  if (tokens.length < 6) return null

  // KE 901 K 11NOV 3 ICNCDG ...
  const carrier = tokens[0]
  if (!/^[A-Z]{2,3}$/.test(carrier)) return null
  const flightNum = tokens[1]
  if (!/^\d{1,4}$/.test(flightNum)) return null

  // 클래스(1자) - 옵션
  let idx = 2
  if (/^[A-Z]$/.test(tokens[idx])) idx++

  // 날짜
  const dateTok = tokens[idx]
  const dm = parseDayMon(dateTok, referenceYear)
  if (!dm) return null
  idx++

  // 요일(숫자 1자) - 옵션
  if (/^\d$/.test(tokens[idx])) idx++

  // 구간 6자
  const segTok = tokens[idx]
  if (!/^[A-Z]{6}$/.test(segTok)) return null
  const from = segTok.slice(0, 3)
  const to = segTok.slice(3, 6)
  idx++

  const now = new Date()
  const year = referenceYear || pickYear(dm.month, now.getFullYear(), now.getMonth())
  const isoDate = toISO(year, dm.month, dm.day)

  return {
    flight: `${carrier}${flightNum}`,
    date: isoDate,
    from,
    to,
    raw: line,
  }
}

// 여러 줄 → 1개 요청 row로 합치기 (왕복 1쌍)
export function parseCrsBlock(text, { hub = HUB, referenceYear = null } = {}) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const segments = lines.map(l => parseSegment(l, referenceYear)).filter(Boolean)
  if (segments.length === 0) return { ok: false, error: '파싱 가능한 세그먼트가 없습니다', segments: [] }

  const outbound = segments.find(s => s.from === hub && s.to !== hub)
  const inbound  = segments.find(s => s.to === hub && s.from !== hub)

  if (!outbound && !inbound) {
    return { ok: false, error: `HUB(${hub}) 기준 in/out을 찾지 못했습니다`, segments }
  }

  return {
    ok: true,
    segments,
    result: {
      arrAirport: outbound?.to || '',    // 현지 도착 공항
      oFlt: outbound?.flight || '',
      depDate: outbound?.date || '',
      depAirport: inbound?.from || '',   // 현지 출발 공항
      iFlt: inbound?.flight || '',
      retDate: inbound?.date || '',
    }
  }
}

// 패턴 일괄 생성: 시작일 + 반복주기 + 횟수 → 여러 일정
export function generateScheduleByPattern({ pattern, startDate, intervalDays, count }) {
  if (!pattern || !startDate || !intervalDays || !count) return []
  const tripDays = pattern.tripDays || 9 // 일수 = ret - dep + 2 → ret = dep + (days-2)
  const out = []
  let cur = new Date(startDate + 'T00:00:00Z')
  for (let i = 0; i < count; i++) {
    const dep = new Date(cur)
    const ret = new Date(cur)
    ret.setUTCDate(ret.getUTCDate() + tripDays - 2)
    out.push({
      arrAirport: pattern.arrAirport,
      oFlt: pattern.oFlt,
      depDate: dep.toISOString().slice(0,10),
      depAirport: pattern.depAirport,
      iFlt: pattern.iFlt,
      retDate: ret.toISOString().slice(0,10),
      patternId: pattern.id,
      patternName: pattern.name,
    })
    cur.setUTCDate(cur.getUTCDate() + intervalDays)
  }
  return out
}

// CRS 라인 파서
// 예: "  1  KE 901 K 11NOV 3 ICNCDG DK1  1205 1830  11NOV  E  0 77W DL"
// 추출: 편명(KE901), 출발일(11NOV), 출발지(ICN), 도착지(CDG)

const MONTHS = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 }
const HUB = 'ICN'

function toISO(dayStr, monStr, refYear) {
  const day = parseInt(dayStr, 10)
  const mon = MONTHS[monStr.toUpperCase()]
  if (Number.isNaN(day) || mon === undefined) return ''
  // 연도 추정: 기준 연도 ± 6개월 범위에서 가장 가까운 해
  const today = new Date()
  const baseYear = refYear || today.getFullYear()
  const candidates = [baseYear - 1, baseYear, baseYear + 1].map(y => new Date(y, mon, day))
  let best = candidates[1]
  let bestDiff = Math.abs(best - today)
  for (const c of candidates) {
    const d = Math.abs(c - today)
    if (d < bestDiff) { best = c; bestDiff = d }
  }
  const y = best.getFullYear()
  const m = String(best.getMonth()+1).padStart(2,'0')
  const dd = String(best.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

// 라인 1개 파싱
export function parseLine(line) {
  if (!line) return null
  const s = line.trim()
  // 편명: 'KE 901' 또는 'KE901'
  const fltM = s.match(/\b([A-Z]{2})\s*(\d{1,4})\b/)
  if (!fltM) return null
  const flight = fltM[1] + fltM[2]

  // 모든 날짜 토큰 (DDMON)
  const dateMatches = [...s.matchAll(/\b(\d{1,2})([A-Z]{3})\b/g)]
  if (dateMatches.length === 0) return null
  const [, depD, depM] = dateMatches[0]
  const depDate = toISO(depD, depM)

  // 구간: 6글자 알파벳 (ICNCDG)
  const segM = s.match(/\b([A-Z]{6})\b/)
  if (!segM) return null
  const from = segM[1].slice(0,3)
  const to   = segM[1].slice(3,6)

  return { flight, depDate, from, to, raw: line }
}

// 텍스트 블록 파싱 -> 세그먼트 배열
export function parseBlock(text) {
  return text.split(/\r?\n/)
    .map(parseLine)
    .filter(Boolean)
}

// 세그먼트 배열을 1개의 요청 객체로 변환
// HUB=ICN 기준: from===ICN -> OUT(아웃바운드), to===ICN -> IN(인바운드)
export function buildRequestFromSegments(segs) {
  let out = null, ret = null
  for (const seg of segs) {
    if (seg.from === HUB && !out) out = seg
    else if (seg.to === HUB && !ret) ret = seg
  }
  return {
    depAirport: out ? out.to : '',
    outFlt:     out ? out.flight : '',
    depDate:    out ? out.depDate : '',
    retAirport: ret ? ret.from : '',
    inFlt:      ret ? ret.flight : '',
    retDate:    ret ? ret.depDate : '',
    _segments: segs,
    _out: out, _ret: ret
  }
}

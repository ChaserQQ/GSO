export function toCsv(rows, columns) {
  const head = columns.map(c => c.label).join(',')
  const body = rows.map(r => columns.map(c => {
    const v = c.get ? c.get(r) : r[c.key]
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
  return head + '\n' + body
}

export function download(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Quote every cell and neutralize spreadsheet formula execution, including whitespace prefixes. */
export function csvCell(value: unknown): string {
    let text = value === null || value === undefined ? "" : String(value)
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
}

export function makeCsv(headers: string[], rows: unknown[][]): string {
    return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n"
}

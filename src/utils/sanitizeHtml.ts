export function sanitizeHtml(html: string | null | undefined): string {
  // Return empty string if html is null or undefined
  if (!html) return ''
  
  // Remove any cid: protocol images as they won't work in the browser
  return html.replace(/src="cid:[^"]+"/g, 'src=""')
}

export const buildDisplayTitle = (title: string, place: string) =>
  title && place ? `${title} at ${place}` : ''

export const getCourseFromDisplayTitle = (title: string, institution: string) => {
  const suffix = ` at ${institution.trim()}`
  return institution && title.toLowerCase().endsWith(suffix.toLowerCase())
    ? title.slice(0, -suffix.length).trim()
    : ''
}

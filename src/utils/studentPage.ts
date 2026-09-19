import { pagesService } from '@/services/pages'
import type { useAuthStore } from '@/stores/auth'
import type { usePagesStore } from '@/stores/pages'
import { slugify } from '@/utils/slugify'

type AuthStore = ReturnType<typeof useAuthStore>
type PagesStore = ReturnType<typeof usePagesStore>

export const ensureStudentPageFromSignup = async (authStore: AuthStore, pagesStore: PagesStore) => {
  if (authStore.signUpDraft.accountType !== 'student' || !authStore.authToken) {
    return false
  }

  await pagesStore.loadStudentPageStatus({ force: true })

  if (pagesStore.hasStudentPage) {
    return false
  }

  const categoryResponse = await pagesService.listPageCategories(authStore.authToken)
  const studentCategory = categoryResponse.data.find((category) => {
    const signal = `${category.slug || ''} ${category.name || ''}`.toLowerCase()
    return signal.includes('student')
  })
  const university = authStore.signUpDraft.university.trim()
  const courseOfStudy = authStore.signUpDraft.courseOfStudy.trim()
  const yearStarted = authStore.signUpDraft.yearStarted.trim()
  const displayTitle = [courseOfStudy, university].filter(Boolean).join(' | ')
  const description = [
    courseOfStudy ? `Studying ${courseOfStudy}` : '',
    university ? `at ${university}` : '',
  ].filter(Boolean).join(' ') || 'Student page'

  await pagesStore.createPageFromApi({
    type: 'student',
    categoryId: studentCategory?.id || undefined,
    name: authStore.signUpDraft.name.trim(),
    slug: slugify(authStore.signUpDraft.name),
    description,
    metadata: {
      email: authStore.signUpDraft.email.trim(),
      university,
      yearStarted,
      courseOfStudy,
      displayTitle,
      display_title: displayTitle,
      graduationDate: yearStarted,
      skills: courseOfStudy ? [courseOfStudy] : [],
    },
  })

  return true
}

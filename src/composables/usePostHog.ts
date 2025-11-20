import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_LY8rPPlzn8DqOaMqwFz1CZGzRfa5rXFN3XZsqVth8e6', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2025-05-24',
    person_profiles: 'identified_only',
  })

  return { posthog }
}

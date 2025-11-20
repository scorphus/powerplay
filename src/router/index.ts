import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import CallbackView from '../views/CallbackView.vue'
import { usePostHog } from '../composables/usePostHog'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainView,
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView,
    },
  ],
})

usePostHog()

export default router

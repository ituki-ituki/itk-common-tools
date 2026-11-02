import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Create from './views/Create.vue'
import Profile from './views/Profile.vue'
import Edit from './views/Edit.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/create', name: 'create', component: Create },
    { path: '/:id/edit', name: 'edit', component: Edit, props: true },
    { path: '/:id', name: 'profile', component: Profile, props: true },
  ],
})

export default router

import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/match',
    name: 'MatchGame',
    component: () => import('../views/MatchGame.vue')
  },
  {
    path: '/spell',
    name: 'SpellGame',
    component: () => import('../views/SpellGame.vue')
  },
  {
    path: '/fill',
    name: 'FillGame',
    component: () => import('../views/FillGame.vue')
  },
  {
    path: '/recite',
    name: 'ReciteGame',
    component: () => import('../views/ReciteGame.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(), // 使用 hash 路由便于静态托管
  routes
});

export default router;

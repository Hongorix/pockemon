import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { Layout } from '../components/layout'
import { CreateListPage } from './create-list-page'
import { HomePage } from './home-page'
import { ListDetailPage } from './list-detail-page'

const rootRoute = createRootRoute({
  component: Layout,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const createListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreateListPage,
})

const listDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lists/$listId',
  component: ListDetailPage,
})

const routeTree = rootRoute.addChildren([homeRoute, createListRoute, listDetailRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

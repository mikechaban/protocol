import { Navigate, createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundry'
//Layouts
import AuthLayout from '@/layouts/AuthLayout/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout/DashboardLayout'
import BridgePage from '@/pages/BridgePage/BridgePage'
import FaucetPage from '@/pages/FaucetPage/FaucetPage'
//Pages
import LoginPage from '@/pages/LoginPage/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import SignUpPage from '@/pages/SignUpPage/SignUpPage'

const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    path: '/',
    children: [
      {
        path: '/',
        element: <Navigate to='/bridge' />,
        errorElement: <ErrorBoundary />
      }
    ]
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/bridge/*',
        element: <BridgePage />
      }
    ]
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/faucet/*',
        element: <FaucetPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router

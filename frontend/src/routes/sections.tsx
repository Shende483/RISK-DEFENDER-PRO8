import { lazy, Suspense } from 'react';
import { Outlet, useRoutes } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { varAlpha } from '../theme/styles';
import { DashboardLayout } from '../pages/layouts/dashboard';

export const AddBrokerPage = lazy(() => import('../pages/layouts/dashboard/sections/my-account/add-broker/add-broker-page'));
export const AddMyRulesPage = lazy(() => import('../pages/layouts/dashboard/sections/my-account/add-broker-rules/add-broker-rules'));
export const UpdateMyRulesPage = lazy(() => import('../pages/layouts/dashboard/sections/my-account/update-broker-rules/update-broker-rules'));
export const RenewBrokerPage = lazy(() => import('../pages/layouts/dashboard/sections/my-account/renew-broker/renew-broker-page'));
export const DeleteBrokerPage = lazy(() => import('../pages/layouts/dashboard/sections/my-account/delete-brokers/delete-broker-page'));
export const SubscribeTradingJournalPage = lazy(() => import('../pages/layouts/dashboard/sections/my-trading-journal/subscribe-trading-journal/subscribe-trading-journal-page'));
export const RenewTradingJournalPage = lazy(() => import('../pages/layouts/dashboard/sections/my-trading-journal/renew-trading-journal/renew-trading-journal-page'));
export const DownloadTradingJournalPage = lazy(() => import('../pages/layouts/dashboard/sections/my-trading-journal/download-trading-journal/download-trading-journal-page'));
export const DeleteTradingJournalPage = lazy(() => import('../pages/layouts/dashboard/sections/my-trading-journal/delete-trading-journal/delete-trading-journal-page'));
export const AddReplaceTimeframePage = lazy(() => import('../pages/layouts/dashboard/sections/my-trading-journal/add-replace-timeframe/add-replace-timeframe-page'));
export const SubscribeAlertsPage = lazy(() => import('../pages/layouts/dashboard/sections/my-market-alerts/subscribe-alerts/subscribe-alerts-page'));
export const RenewAlertsPage = lazy(() => import('../pages/layouts/dashboard/sections/my-market-alerts/renew-alerts/renew-alerts-page'));
export const DeleteAlertsPage = lazy(() => import('../pages/layouts/dashboard/sections/my-market-alerts/delete-alerts/delete-alerts-page'));
export const AddReplaceMethodPage = lazy(() => import('../pages/layouts/dashboard/sections/my-market-alerts/add-replace-method/add-replace-method-page'))
export const HomePage = lazy(() => import('../pages/layouts/dashboard/sections/trading-dashboard/view/home'));
export const BlogPage = lazy(() => import('../pages/layouts/dashboard/sections/blog/view/blog'));
export const SubscriptionPage = lazy(() => import('../pages/layouts/dashboard/sections/subcription/SubscriptionPage'));
export const SignInPage = lazy(() => import('../pages/layouts/auth/sign-in'));
export const SignUpPage = lazy(() => import('../pages/layouts/auth/sign-up'));
export const ProfileUpdate = lazy(() => import('../pages/layouts/auth/profile-update'));
export const ForgetPassword = lazy(() => import('../pages/layouts/auth/forget-password'));
export const ProductsPage = lazy(() => import('../pages/layouts/dashboard/sections/product/products'));
export const ConnectBrokerPage = lazy(() => import('../pages/layouts/dashboard/sections/broker/ConnectBrokerPage'));
export const MarketTypeDetails = lazy(() => import('../Admin/component/marketType/MarketTypeDetails'));
export const BrokerDetails = lazy(() => import('../Admin/component/brokermanagement/BrokerManagementDetails'));
export const PlanManage = lazy(() => import('../Admin/component/plan/PlanForm'));
export const TradingRule = lazy(() => import('../Admin/component/tradingrule/TradingRule'));

const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export function Router() {
  return useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense fallback={renderFallback}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { element: <HomePage />, index: true },
        { path: 'add-broker/subscription', element: <AddBrokerPage/> },
        { path: 'add-broker-rules', element:<AddMyRulesPage/> },
        { path: 'renew-broker/subcription', element: <RenewBrokerPage/> },
        { path: 'delete-broker', element: <DeleteBrokerPage/> },
        { path: 'update-broker-rules', element:<UpdateMyRulesPage/> },

        { path: 'download-trading-journal', element: <DownloadTradingJournalPage/> },
        { path: 'subscribe-trading-journal/subscription', element: <SubscribeTradingJournalPage/> },
        { path: 'add-replace-timeframe', element:<AddReplaceTimeframePage/> },
        { path: 'renew-trading-journal/subscription', element: <RenewTradingJournalPage/> },
        { path: 'delete-trading-journal', element: <DeleteTradingJournalPage/> },

        { path: 'subscribe-alerts/subscription', element: <SubscribeAlertsPage/> },
        { path: 'add-replace-method', element:<AddReplaceMethodPage/> },
        { path: 'renew-alerts/subscription', element: <RenewAlertsPage/> },
        { path: 'delete-alerts', element: <DeleteAlertsPage/> },

        { path: 'products', element: <ProductsPage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'broker', element: <ConnectBrokerPage /> },
        { path: 'admin/marketdetails', element: <MarketTypeDetails /> },
        { path: 'admin/brokerdetails', element: <BrokerDetails /> },
        { path: 'admin/plan', element: <PlanManage /> },
        { path: 'admin/tradingrule', element: <TradingRule /> },
      ],
    },
    {
      path: 'sign-in',
      element: <SignInPage />,
    },
    {
      path: '/sign-up',
      element: <SignUpPage />,
    },
    {
      path: '/profile',
      element: <ProfileUpdate />,
    },
    {
      path: '/forget-password',
      element: <ForgetPassword />,
    },

  ]);
}

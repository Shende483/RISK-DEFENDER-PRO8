
import { Card } from '@mui/material';
import Grid from '@mui/material/Grid';
import UserBalanceCard from '../overview/cards-data/UserBalanceCard';
import OrderEntryComponent from '../overview/cards-data/OrderEntryComponent';
import { MyAccountsDetails } from '../overview/cards-data/my-account-details';
import TradingviewChartAndData from '../overview/tradingview/TradingViewChartCard';

export function OverviewAnalyticsView() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Grid container spacing={3}>
          <Grid item lg={12} md={6} sm={6} xs={12}>
            <MyAccountsDetails  />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <TradingviewChartAndData />
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: 'white', height: 670 }}>
              <UserBalanceCard />
              <OrderEntryComponent  />
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
import { useState, useEffect } from 'react';

import { Card, Grid, Select, MenuItem, InputLabel, Typography, FormControl } from '@mui/material';

import UserExitService from '../../../../../../../Services/api-services/UserExitService';

// Define TradingRulesData locally if not exported from '../../view'
interface TradingRulesData {
  marketTypeId: string;
  brokerId: string;
  // Add other properties as needed
}

interface MyDefinedRulesProps {
  tradingRules: TradingRulesData;
  activeTab: string;
}

interface NormalizedEntryData {
  entryToday: number;
  entryCount: number;
  nextEntryTime: string;
  status: string;
}

export default function UserBalanceCard({ tradingRules, activeTab }: MyDefinedRulesProps) {
  const [symbol, setSymbol] = useState('');
  const [avaiLableBalance, setAvaiLableBalance] = useState<Partial<NormalizedEntryData>>(
    {} as NormalizedEntryData
  );

  const normalizeData = (data: Record<string, any>): Partial<NormalizedEntryData> => {
    const dynamicKeyMap: Record<string, keyof NormalizedEntryData> = {
      myEntryToday: 'entryToday',
      myEntryCountInSymbol: 'entryCount',
      myNextEntryTime: 'nextEntryTime',
      status: 'status',
    };

    const partialData = Object.entries(data).reduce(
      (normalized: Partial<NormalizedEntryData>, [key, value]) => {
        const baseKey = key.replace(/-(stock|crypto|forex)-[cof]$/, '');
        const consistentKey = dynamicKeyMap[baseKey];

        if (consistentKey) {
          normalized[consistentKey] = value;
        }

        return normalized;
      },
      {}
    );

    return {
      entryToday: partialData.entryToday ?? 0,
      entryCount: partialData.entryCount ?? 0,
      nextEntryTime: partialData.nextEntryTime ?? '',
      status: partialData.status ?? '',
    } as NormalizedEntryData;
  };

  useEffect(() => {
    async function fetchData() {
      const response = await UserExitService.getUserExitAccount(
        tradingRules.marketTypeId,
        tradingRules?.brokerId,
        activeTab
      );
      console.log('hello', response.data);
      const normalize = normalizeData(response.data as Record<string, any>);
      setAvaiLableBalance(normalize);
    }
    fetchData();
  }, [tradingRules, activeTab]);

  return (
    <Card sx={{ bgcolor: '#ede7f6', m: 2 }}>
      <Grid container sx={{ p: 2, pb: 0, color: '#fff' }}>
        <Grid item xs={12}>
          <Grid container display="flex" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1" sx={{ color: 'secondary.dark' }}>
                Avbl Balance :
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6" sx={{ color: 'grey.800' }}>
                $1839 USDT
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Grid container display="flex" alignItems="center" mb={1}>
            <Grid item>
              <Typography variant="subtitle1" sx={{ color: 'secondary.dark' }}>
                Today Entries Count :
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6" sx={{ color: 'grey.800' }}>
                {avaiLableBalance?.entryCount}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container display="flex" alignItems="center" mb={1}>
            <Grid item>
              <Typography variant="subtitle1" sx={{ color: 'secondary.dark' }}>
                Next Entry Time :
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6" sx={{ color: 'grey.800' }}>
                {avaiLableBalance?.nextEntryTime}
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <FormControl fullWidth variant="filled" sx={{ mb: 2, py: 0, minWidth: 120 }}>
          <InputLabel sx={{ color: 'grey.800' }}>Entry Count in symbol</InputLabel>
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <MenuItem value="Select Broker"> Select symbol </MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Card>
  );
}

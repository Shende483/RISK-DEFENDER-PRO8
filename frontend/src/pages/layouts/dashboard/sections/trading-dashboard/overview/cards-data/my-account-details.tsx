import { useState, useEffect } from 'react';
import { Tab, Tabs, Select, MenuItem, InputLabel, FormControl, Typography, List, ListItem, ListItemText, Grid } from '@mui/material';
import BrokerService, { BrokerAccount } from '../../../../../../../Services/api-services/dashboard-services/sections-services/trading-dashboard-services/my-account-details-service';
import AlertingDetails from './AlertingDetails';
import CardWrapper from '../../../../../../../components/common-cards/card-wrapper';
import { MARKET_TYPES, TRADING_TYPES } from '../../../../../common-tyeps/market-and-trading-types'; // Updated import

type TradingRulesData = {
  brokerAccountName: string;
  marketTypeId: string;
  brokerId: string;
  cash?: any;
  option?: any;
  future?: any;
};

export interface TradingRule {
  key: string;
  value: string;
}

interface MyAccountsDetailsProps {
  onTradingRulesChange?: (data: TradingRulesData) => void;
}

export function MyAccountsDetails({ onTradingRulesChange }: MyAccountsDetailsProps) {

  const [selectedMarketTypeId, setSelectedMarketTypeId] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [selectedSubbroker, setSelectedSubbroker] = useState('');
  const [brokers, setBrokers] = useState<BrokerAccount[]>([]);
  const [subBrokers, setSubBrokers] = useState<BrokerAccount[]>([]);
  const [selectedTradingType, setSelectedTradingType] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<BrokerAccount | null>(null);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);

  const fetchBrokersByMarketType = async (marketType: string) => {
    setLoading(true);
    try {
      const response = await BrokerService.getBrokerDetails({ marketTypeId: marketType });
      const brokersData = response.data || [];
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubBrokers = async (marketTypeId: string, brokerId: string) => {
    setLoading(true);
    try {
      const response = await BrokerService.getSubBrokerDetails({
        marketTypeId,
        brokerId
      });
      const subBrokersData = response.data || [];
      setSubBrokers(Array.isArray(subBrokersData) ? subBrokersData : []);
    } catch (error) {
      console.error('Error fetching sub-brokers:', error);
      setSubBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingRules = async (subBrokerId: string, tradingType: string) => {
    try {
      const response = await BrokerService.getTradingRules({
        subBrokerId,
        tradingType
      });
      const rulesData = response.data.data || [];
      setTradingRules(Array.isArray(rulesData) ? rulesData : []);
      return rulesData;
    } catch (error) {
      console.error('Error fetching trading rules:', error);
      setTradingRules([]);
      return null;
    }
  };

  const uniqueBrokers = Array.from(new Set(brokers.map((broker) => broker.brokerName)))
    .map((brokerName) => brokers.find((broker) => broker.brokerName === brokerName))
    .filter((broker): broker is BrokerAccount => broker !== undefined);

  const handleTabChange = (marketType: string) => {
    setSelectedMarketTypeId(marketType);
    setBrokers([]);
    setSubBrokers([]);
    setSelectedBrokerId('');
    setSelectedSubbroker('');
    setSelectedTradingType('');
    setSelectedBrokerAccount(null);
    setTradingRules([]);
    fetchBrokersByMarketType(marketType);
  };

  useEffect(() => {
    if (MARKET_TYPES.length > 0 && !selectedMarketTypeId) {
      setSelectedMarketTypeId(MARKET_TYPES[0].shortName);
      fetchBrokersByMarketType(MARKET_TYPES[0].shortName);
    }
  }, [selectedMarketTypeId]); // Removed marketTypes from dependencies since it's now imported

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <CardWrapper sx={{ height: '400px', width: '100%' }}>
          <Tabs value={selectedMarketTypeId}>
            {MARKET_TYPES.map((marketType) => (
              <Tab
                key={marketType.shortName}
                label={<span style={{ fontWeight: 'bold' }}>{marketType.name}</span>}
                value={marketType.shortName}
                onClick={() => handleTabChange(marketType.shortName)}
                sx={{ gap: 8 }}
              />
            ))}
          </Tabs>
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
              <InputLabel>Broker</InputLabel>
              <Select
                value={selectedBrokerId}
                onChange={(e) => {
                  setSelectedBrokerId(e.target.value);
                  setSubBrokers([]);
                  setSelectedSubbroker('');
                  setSelectedTradingType('');
                  setTradingRules([]);
                  fetchSubBrokers(selectedMarketTypeId, e.target.value);
                }}
                disabled={loading || brokers.length === 0}
              >
                <MenuItem value="">
                  <em>Select Broker</em>
                </MenuItem>
                {uniqueBrokers.map((broker) => (
                  <MenuItem key={broker._id} value={broker._id}>
                    {broker.brokerName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
              <InputLabel>Sub-broker</InputLabel>
              <Select
                value={selectedSubbroker}
                onChange={(e) => {
                  const selectedAccount = subBrokers.find((b) => b._id === e.target.value);
                  if (selectedAccount) {
                    setSelectedSubbroker(e.target.value);
                    setSelectedBrokerAccount(selectedAccount);
                    setSelectedTradingType('future');
                    setTradingRules([]);
                  }
                }}
                disabled={loading || subBrokers.length === 0 || !selectedBrokerId}
              >
                <MenuItem value="">
                  <em>Select Sub-broker</em>
                </MenuItem>
                {subBrokers.map((broker) => (
                  <MenuItem key={broker._id} value={broker._id}>
                    {broker.brokerAccountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
              <InputLabel>Trading Type</InputLabel>
              <Select
                value={selectedTradingType}
                onChange={(e) => {
                  setSelectedTradingType(e.target.value);
                  if (selectedBrokerId && selectedSubbroker) {
                    fetchTradingRules(
                      selectedSubbroker,
                      e.target.value
                    ).then((rules) => {
                      if (rules && onTradingRulesChange && selectedBrokerAccount) {
                        onTradingRulesChange({
                          brokerAccountName: selectedBrokerAccount.brokerAccountName,
                          marketTypeId: selectedMarketTypeId,
                          brokerId: selectedBrokerId,
                          cash: rules.cash,
                          option: rules.option,
                          future: rules.future,
                        });
                      }
                    });
                  }
                }}
                disabled={loading || !selectedSubbroker}
              >
                <MenuItem value="">
                  <em>Select Trading Type</em>
                </MenuItem>
                {TRADING_TYPES.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </CardWrapper>
      </Grid>

      <Grid item xs={12} sm={4}>
        <CardWrapper sx={{ height: '400px', width: '100%' }}>
          {tradingRules.length > 0 ? (
            <div style={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom>
                Trading Rules
              </Typography>
              <List>
                {tradingRules.map((rule, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={rule.key}
                      secondary={rule.value}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                ))}
              </List>
            </div>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No trading rules available. Please select a trading type.
            </Typography>
          )}
        </CardWrapper>
      </Grid>

      <Grid item xs={12} sm={4}>
        <AlertingDetails />
      </Grid>
    </Grid>
  );
}
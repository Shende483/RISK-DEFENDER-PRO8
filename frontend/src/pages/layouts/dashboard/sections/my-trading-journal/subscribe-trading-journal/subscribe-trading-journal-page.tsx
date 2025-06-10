import type { SelectChangeEvent } from '@mui/material';

import axios from 'axios';
import { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Card,
  Alert,
  Button,
  Select,
  MenuItem,
  Snackbar,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  FormHelperText,
} from '@mui/material';




import { getToken } from '../../../../../../utils/getTokenFn';
import MarketTypeService from '../../../../../../Services/api-services/MarketTypeService';
import BrokerAccountService from '../../../../../../Services/api-services/BrokerAccountService';

import { MarketTypeList } from '../../../../../../Services/interface-types-services/MarketTypes';

type TradingRuleData = {
  cash: string[];
  option: string[];
  future: string[];
};

type Plan = {
  _id: string;
  planName: string;
  numberOfBroker: number;
  createdAt: string;
  startDate: string;
};

type Broker = {
  _id: string;
  name: string;
};

type FormErrors = {
  planName?: string;
  marketType?: string;
  brokerId?: string;
  brokerAccountName?: string;
  apiKey?: string;
  secretKey?: string;
  tradingRuleData?: {
    cash?: string[];
    option?: string[];
    future?: string[];
  };
};

export default function SubscribeTradingJournalPage() {
  const [formData, setFormData] = useState({
    planName: '',
    marketType: '',
    subscriptionId: '',
    brokerId: '',
    brokerAccountName: '',
    apiKey: '',
    secretKey: '',
    status: 'active',
    tradingRuleData: {
      cash: [] as string[],
      option: [] as string[],
      future: [] as string[],
    },
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [marketTypes, setMarketTypes] = useState<MarketTypeList[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRuleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Fetch plans and market types on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [plansResponse, marketTypesResponse] = await Promise.all([
          BrokerAccountService.getUserSubscriptionPlans(),
          MarketTypeService.getAllActiveMarketTypes(),
        ]);

        setPlans(plansResponse.data);
        setMarketTypes(marketTypesResponse.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load initial data',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate main form fields using switch-case
    const fieldsToValidate = [
      { field: 'planName', value: formData.planName, message: 'Plan is required' },
      { field: 'marketType', value: formData.marketType, message: 'Market type is required' },
      { field: 'brokerId', value: formData.brokerId, message: 'Broker is required' },
      {
        field: 'brokerAccountName',
        value: formData.brokerAccountName,
        message: 'Broker account name is required',
      },
      { field: 'apiKey', value: formData.apiKey, message: 'API key is required' },
      { field: 'secretKey', value: formData.secretKey, message: 'API secret is required' },
    ];

    fieldsToValidate.forEach(({ field, value, message }) => {
      switch (field) {
        case 'planName':
          if (!value) newErrors.planName = message;
          break;
        case 'marketType':
          if (!value) newErrors.marketType = message;
          break;
        case 'brokerId':
          if (!value) newErrors.brokerId = message;
          break;
        case 'brokerAccountName':
          if (!value) newErrors.brokerAccountName = message;
          break;
        case 'apiKey':
          if (!value) newErrors.apiKey = message;
          break;
        case 'secretKey':
          if (!value) newErrors.secretKey = message;
          break;
        default:
          break;
      }
    });

    if (tradingRules) {
      const ruleErrors: any = {};
      let hasRuleErrors = false;

      (Object.keys(tradingRules) as Array<keyof TradingRuleData>).forEach((tradeType) => {
        tradingRules[tradeType].forEach((template, index) => {
          if (!formData.tradingRuleData[tradeType][index]) {
            if (!ruleErrors[tradeType]) {
              ruleErrors[tradeType] = [];
            }
            const [fieldName] = template.split(':').map((s) => s.trim());
            ruleErrors[tradeType][index] = `${fieldName} is required`;
            hasRuleErrors = true;
          }
        });
      });

      if (hasRuleErrors) {
        newErrors.tradingRuleData = ruleErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMarketTypeChange = async (event: SelectChangeEvent<string>) => {
    const marketTypeId = event.target.value;
    setFormData((prev) => ({
      ...prev,
      marketType: marketTypeId,
      brokerId: '',
      tradingRuleData: { cash: [], option: [], future: [] },
    }));
    setErrors((prev) => ({ ...prev, marketType: undefined, brokerId: undefined }));

    try {
      setIsLoading(true);
      const token = getToken();

      // Fetch brokers and trading rules in parallel
      const [brokersResponse, rulesResponse] = await Promise.all([
        axios.get(`http://localhost:3040/broker/by-market-type?marketTypeId=${marketTypeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(
          `http://localhost:3040/trading-rules/rulesByMarketTypeId?marketTypeId=${marketTypeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      setBrokers(brokersResponse.data);

      // Process trading rules response
      let rulesData = rulesResponse.data;
      if (Array.isArray(rulesData)) {
        rulesData = rulesData.find((rule: any) => rule.marketTypeId === marketTypeId)?.rules;
      } else if (rulesData && typeof rulesData === 'object' && 'rules' in rulesData) {
        rulesData = rulesData.rules;
      }

      if (rulesData) {
        setTradingRules({
          cash: Array.isArray(rulesData.cash) ? rulesData.cash : [],
          option: Array.isArray(rulesData.option) ? rulesData.option : [],
          future: Array.isArray(rulesData.future) ? rulesData.future : [],
        });
      } else {
        setTradingRules(null);
      }
    } catch (error) {
      console.error('Error fetching market type data:', error);
      setBrokers([]);
      setTradingRules(null);
      setSnackbar({
        open: true,
        message: 'Failed to load market type data',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (event: SelectChangeEvent<string>) => {
    const planId = event.target.value;
    setFormData((prev) => ({
      ...prev,
      planName: planId,
      subscriptionId: planId,
      marketType: '',
      brokerId: '',
      tradingRuleData: { cash: [], option: [], future: [] },
    }));
    setErrors((prev) => ({
      ...prev,
      planName: undefined,
      marketType: undefined,
      brokerId: undefined,
    }));
    setBrokers([]);
    setTradingRules(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const processedTradingRules: TradingRuleData = {
        cash: [],
        option: [],
        future: [],
      };

      if (tradingRules) {
        (Object.keys(tradingRules) as Array<keyof TradingRuleData>).forEach((tradeType) => {
          tradingRules[tradeType].forEach((template: string, index: number) => {
            const [fieldName] = template.split(':').map(s => s.trim());
            const value = formData.tradingRuleData[tradeType][index] || '';
            processedTradingRules[tradeType].push(`${fieldName}: ${value}`);
          });
        });
      }

      const payload = {
        brokerAccountName: formData.brokerAccountName,
        marketTypeId: formData.marketType,
        brokerId: formData.brokerId,
        subscriptionId: formData.planName,
        apiKey: formData.apiKey,
        secretKey: formData.secretKey,
        status: formData.status,
        tradingRuleData: processedTradingRules,
      };

      const response = await BrokerAccountService.createBrokerAccount(payload);

      console.log('Broker account created:', response);

      setSnackbar({
        open: true,
        message: response.message || 'Broker account created successfully!',
        severity: 'success',
      });

      // Reset form
      setFormData({
        planName: '',
        marketType: '',
        subscriptionId: '',
        brokerId: '',
        brokerAccountName: '',
        apiKey: '',
        secretKey: '',
        status: 'active',
        tradingRuleData: { cash: [], option: [], future: [] },
      });
      setTradingRules(null);
      setErrors({});
    } catch (error: any) {
      console.error('Error creating broker account:', error);

      let errorMessage = 'Failed to create broker account';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleChange = (tradeType: keyof TradingRuleData, index: number, value: string) => {
    setFormData((prev) => {
      const newRules = [...prev.tradingRuleData[tradeType]];
      newRules[index] = value;

      // Clear error for this field if it exists
      if (errors.tradingRuleData?.[tradeType]?.[index]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (newErrors.tradingRuleData?.[tradeType]) {
            newErrors.tradingRuleData[tradeType]![index] = '';
            if (newErrors.tradingRuleData[tradeType]!.every((e) => !e)) {
              delete newErrors.tradingRuleData[tradeType];
            }
            if (Object.keys(newErrors.tradingRuleData).length === 0) {
              delete newErrors.tradingRuleData;
            }
          }
          return newErrors;
        });
      }

      return {
        ...prev,
        tradingRuleData: {
          ...prev.tradingRuleData,
          [tradeType]: newRules,
        },
      };
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (

    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
     Subscribe Trading Journal Page
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.planName}>
          <InputLabel id="plan-label">Select Plan</InputLabel>
          <Select
            labelId="plan-label"
            id="plan"
            value={formData.planName}
            onChange={handlePlanChange}
            label="Select Plan"
            disabled={isLoading}
          >
            {plans.map((plan) => (
              <MenuItem key={plan._id} value={plan._id}>
                <Box>
                  <Typography>{plan.planName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Brokers: {plan.numberOfBroker} | Start:{' '}
                    {new Date(plan.startDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.planName && <FormHelperText>{errors.planName}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.marketType}>
          <InputLabel id="market-type-label">Market Type</InputLabel>
          <Select
            labelId="market-type-label"
            id="market-type"
            value={formData.marketType}
            onChange={handleMarketTypeChange}
            label="Market Type"
            disabled={!formData.planName || isLoading}
          >
            {marketTypes.map((market) => (
              <MenuItem key={market._id} value={market._id}>
                {market.name}
              </MenuItem>
            ))}
          </Select>
          {errors.marketType && <FormHelperText>{errors.marketType}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.brokerId}>
          <InputLabel id="broker-label">Broker</InputLabel>
          <Select
            labelId="broker-label"
            id="broker"
            value={formData.brokerId}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, brokerId: e.target.value }));
              setErrors((prev) => ({ ...prev, brokerId: undefined }));
            }}
            label="Broker"
            disabled={!formData.marketType || isLoading}
          >
            {brokers.map((broker) => (
              <MenuItem key={broker._id} value={broker._id}>
                {broker.name}
              </MenuItem>
            ))}
          </Select>
          {errors.brokerId && <FormHelperText>{errors.brokerId}</FormHelperText>}
        </FormControl>

        <TextField
          fullWidth
          label="Broker Account Name"
          value={formData.brokerAccountName}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, brokerAccountName: e.target.value }));
            setErrors((prev) => ({ ...prev, brokerAccountName: undefined }));
          }}
          error={!!errors.brokerAccountName}
          helperText={errors.brokerAccountName}
          sx={{ mb: 3 }}
          disabled={isLoading}
        />

        <TextField
          fullWidth
          label="API Key"
          value={formData.apiKey}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, apiKey: e.target.value }));
            setErrors((prev) => ({ ...prev, apiKey: undefined }));
          }}
          error={!!errors.apiKey}
          helperText={errors.apiKey}
          sx={{ mb: 3 }}
          disabled={isLoading}
        />

        <TextField
          fullWidth
          label="API Secret"
          value={formData.secretKey}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, secretKey: e.target.value }));
            setErrors((prev) => ({ ...prev, secretKey: undefined }));
          }}
          error={!!errors.secretKey}
          helperText={errors.secretKey}
          sx={{ mb: 3 }}
          disabled={isLoading}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            label="Status"
            disabled={isLoading}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Card>

      {/* Trading Rules Section */}
      {tradingRules && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Trading Rules
          </Typography>

          <Grid container spacing={3}>
            {(Object.entries(tradingRules) as [keyof TradingRuleData, string[]][])
              .filter(([_, fields]) => fields.length > 0)
              .map(([tradeType, ruleTemplates]) => (
                <Grid item xs={12} md={4} key={tradeType}>
                  <Card sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                      {tradeType.toUpperCase()} Rules
                    </Typography>

                    {ruleTemplates.map((template, index) => {
                      const [fieldName] = template.split(':').map((s) => s.trim());
                      const errorMessage = errors.tradingRuleData?.[tradeType]?.[index];

                      return (
                        <TextField
                          key={`${tradeType}-${index}`}
                          fullWidth
                          label={fieldName}
                          value={formData.tradingRuleData[tradeType][index] || ''}
                          onChange={(e) => handleRuleChange(tradeType, index, e.target.value)}
                          error={!!errorMessage}
                          helperText={errorMessage}
                          sx={{ mb: 2 }}
                          disabled={isLoading}
                        />
                      );
                    })}
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Card>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={isLoading || !formData.brokerId || !formData.marketType || !formData.planName}
        >
          {isLoading ? 'Creating...' : 'Create Broker Account'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

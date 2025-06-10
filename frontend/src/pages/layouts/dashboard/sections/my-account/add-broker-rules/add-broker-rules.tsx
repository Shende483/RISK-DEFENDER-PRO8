
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Alert,
  Button,
  Checkbox,
  Snackbar,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  styled,
  useTheme,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, YouTube } from "@mui/icons-material";
import TradingRulesService from "../../../../../../Services/api-services/dashboard-services/sections-services/my-account-services/add-broker-rules-service";

interface SubBrokerAccount {
  _id: string;
  marketTypeId: string;
  brokerId: string;
  brokerName: string;
  brokerKey: string;
  subAccountName: string;
  startDate: string;
  endDate: string;
  hasProxy: boolean;
  proxyServiceId: string;
}

interface Rule {
  name: string;
  description: string;
  key: string;
  type: 'boolean' | 'number' | 'time' | 'timerange' | 'enum';
  options?: string[];
}

interface RuleValue {
  key: string;
  value: any;
  error?: string;
}

interface TradingRules {
  cash: RuleValue[];
  future: RuleValue[];
  option: RuleValue[];
}

const RuleCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderRadius: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  minHeight: 80,
  width: '100%',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  minHeight: '100%',
}));

function TabPanel(props: { children: React.ReactNode; value: number; index: number }) {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ p: 8 }}>{children}</Box>}
    </div>
  );
}

export default function AddTradingRulesPage() {
  const theme = useTheme();
  const [subBrokerAccounts, setSubBrokerAccounts] = useState<SubBrokerAccount[]>([]);
  const [selectedSubBroker, setSelectedSubBroker] = useState<SubBrokerAccount | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [responseMessage, setResponseMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [tradingRules, setTradingRules] = useState<TradingRules>({
    cash: [],
    future: [],
    option: [],
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [subApiKey, setSubApiKey] = useState<string>('');
  const [subSecretKey, setSubSecretKey] = useState<string>('');
  const [mainApiKey, setMainApiKey] = useState<string>('');
  const [mainSecretKey, setMainSecretKey] = useState<string>('');
  const [isMainApiVerified, setIsMainApiVerified] = useState<boolean>(false);
  const [isSubApiVerified, setIsSubApiVerified] = useState<boolean>(false);
  const [isMainApiKeyEditable, setIsMainApiKeyEditable] = useState<boolean>(true);
  const [isSubApiKeyEditable, setIsSubApiKeyEditable] = useState<boolean>(true);
  const [isMainVerifying, setIsMainVerifying] = useState<boolean>(false);
  const [isSubVerifying, setIsSubVerifying] = useState<boolean>(false);
  const [showSubApiKey, setShowSubApiKey] = useState<boolean>(false);
  const [showSubSecretKey, setShowSubSecretKey] = useState<boolean>(false);
  const [showMainApiKey, setShowMainApiKey] = useState<boolean>(false);
  const [showMainSecretKey, setShowMainSecretKey] = useState<boolean>(false);
  const [verifyRules, setVerifyRules] = useState<boolean>(false);
  const [noRulesChange, setNoRulesChange] = useState<boolean>(true);

  // Map marketTypeId to display name
  const getMarketTypeDisplayName = (marketTypeId: string): string => {
    switch (marketTypeId.toLowerCase()) {
      case 'stockmarket':
        return 'Stock Market';
      case 'cryptocurrency':
        return 'Cryptocurrency';
      case 'forex':
        return 'Forex';
      default:
        return marketTypeId;
    }
  };

  const rules: Rule[] = [
    {
      name: "Auto Place SL And Target Price",
      description: "Automatically reapply previous day's stop-loss and target prices at market open",
      key: "autoPlaceSLAndTargetPrice",
      type: "boolean",
    },
    {
      name: "Auto Close Position On Market Reverse",
      description: "Automatically close position when market moves against your position by a set threshold",
      key: "autoClosePositionOnMarketReverse",
      type: "boolean",
    },
    {
      name: "Max Entries In Specific Symbol",
      description: "Maximum entries allowed per symbol",
      key: "maxEntriesInSpecificSymbol",
      type: "number",
    },
    {
      name: "Entry Side",
      description: "Choose which direction entries are allowed",
      key: "entrySide",
      type: "enum",
      options: ["Buy", "Sell", "Both"],
    },
    {
      name: "Max Pending Entry In Specific Symbol",
      description: "Maximum pending entries allowed per symbol",
      key: "maxPendingEntryInSpecificSymbol",
      type: "number",
    },
    {
      name: "Margin Types",
      description: "Select allowed margin type(s) for trading",
      key: "marginTypes",
      type: "enum",
      options: ["Isolated", "Cross", "None"],
    },
    {
      name: "Max Entry Per Day",
      description: "Maximum number of trades allowed per day",
      key: "maxEntryPerDay",
      type: "number",
    },
    {
      name: "Entry Type",
      description: "Select allowed order types for entries",
      key: "entryType",
      type: "enum",
      options: ["Market", "Limit", "Stop"],
    },
    {
      name: "Max Pending Order",
      description: "Maximum number of pending orders allowed",
      key: "maxPendingOrder",
      type: "number",
    },
    {
      name: "Consecutive Entry Duration",
      description: "Minimum waiting period required between trades to prevent overtrading",
      key: "consecutiveEntryDuration",
      type: "time",
    },
    {
      name: "Max Risk Entry",
      description: "Maximum risk allowed per trade (in %)",
      key: "maxRiskEntry",
      type: "number",
    },
    {
      name: "SL And TP Trailing Duration",
      description: "Disable SL & TP changes for this duration after any modification",
      key: "slAndTPTrailingDuration",
      type: "time",
    },
    {
      name: "Max Leverage",
      description: "Set the maximum leverage allowed",
      key: "maxLeverage",
      type: "number",
    },
    {
      name: "Position Min Hold Duration",
      description: "Minimum time to hold a position before it can be closed",
      key: "positionMinHoldDuration",
      type: "time",
    },
    {
      name: "Entry Block Period",
      description: "Block trade entries during this time range",
      key: "entryBlockPeriod",
      type: "timerange",
    },
    {
      name: "Pending Entry Block Period",
      description: "Block editing pending orders during this time range",
      key: "pendingOrderModifyBlockPeriod",
      type: "timerange",
    },
  ];

  useEffect(() => {
    const fetchSubBrokerAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await TradingRulesService.getSubBrokerAccountDetails();
        if (response.statusCode === 200 && response.success) {
          setSubBrokerAccounts(Array.isArray(response.data) ? response.data : []);
          if (response.data.length === 0) {
            setResponseMessage({
              text: "No subbroker accounts found",
              type: "info",
            });
            setShowSnackbar(true);
          }
        } else {
          setResponseMessage({
            text: response.message || "Failed to fetch subbroker accounts",
            type: "error",
          });
          setShowSnackbar(true);
        }
      } catch (error: any) {
        console.error("Error fetching subbroker accounts:", error);
        setResponseMessage({ text: error.message || "Failed to fetch subbroker accounts", type: "error" });
        setShowSnackbar(true);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchSubBrokerAccounts();
  }, []);

  const handleSubBrokerSelection = (account: SubBrokerAccount) => {
    if (!account.hasProxy) {
      setResponseMessage({
        text: "This account is in process and cannot be selected until activated",
        type: "info",
      });
      setShowSnackbar(true);
      return;
    }
    setSelectedSubBroker(account);
    setSelectedTab(0);
    setSubApiKey('');
    setSubSecretKey('');
    setMainApiKey('');
    setMainSecretKey('');
    setIsMainApiVerified(false);
    setIsSubApiVerified(false);
    setIsMainApiKeyEditable(true);
    setIsSubApiKeyEditable(true);
    setShowSubApiKey(false);
    setShowSubSecretKey(false);
    setShowMainApiKey(false);
    setShowMainSecretKey(false);
    const initialRules = rules.map((rule) => ({
      key: rule.key,
      value: rule.type === 'boolean' ? false :
             rule.type === 'number' ? 0 :
             rule.type === 'time' ? '00:00:00' :
             rule.type === 'timerange' ? { start: '00:00', end: '00:00' } :
             rule.type === 'enum' ? (rule.options ? rule.options[0] : '') : '',
      error: undefined,
    }));
    setTradingRules({
      cash: initialRules,
      future: initialRules,
      option: initialRules,
    });
    setTermsAccepted(false);
      setVerifyRules(false);
    setNoRulesChange(true);
  };

  const validateRule = (rule: Rule, value: any): string | undefined => {
    if (rule.type === 'number' && (typeof value !== 'number' || value < 0)) {
      return 'Must be a non-negative number';
    }
    if (rule.type === 'time' && !/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return 'Must be in HH:mm:ss format';
    }
    if (rule.type === 'timerange') {
      if (!value || !value.start || !value.end || !/^\d{2}:\d{2}$/.test(value.start) || !/^\d{2}:\d{2}$/.test(value.end)) {
        return 'Must be valid HH:mm times';
      }
    }
    if (rule.type === 'enum' && rule.options && !rule.options.includes(value)) {
      return 'Invalid option selected';
    }
    return undefined;
  };

  const handleRuleChange = (subType: 'cash' | 'future' | 'option', key: string, value: any) => {
    setTradingRules((prev) => {
      const updatedRules = prev[subType].map((rule) => {
        if (rule.key !== key) return rule;
        const ruleDef = rules.find((r) => r.key === key);
        const error = ruleDef ? validateRule(ruleDef, value) : undefined;
        return { ...rule, value, error };
      });
      return { ...prev, [subType]: updatedRules };
    });
  };

  const handleVerifyMainApiKeys = async () => {
    if (!selectedSubBroker || !mainApiKey || !mainSecretKey) {
      setResponseMessage({
        text: "Please enter Main Account API key and secret",
        type: "error",
      });
      setShowSnackbar(true);
      return;
    }
    setIsMainVerifying(true);
    try {
      const response = await TradingRulesService.verifyMainApiKeys({
        marketTypeId: selectedSubBroker.marketTypeId,
        brokerId: selectedSubBroker.brokerId,
        brokerKey: selectedSubBroker.brokerKey,
        mainApiKey,
        mainSecretKey,
      });
      if (response.statusCode === 200 && response.success) {
        setIsMainApiVerified(true);
        setIsMainApiKeyEditable(false);
        setResponseMessage({
          text: "Main Account API keys verified successfully",
          type: "success",
        });
      } else {
        setResponseMessage({
          text: response.message || "Failed to verify Main Account API keys",
          type: "error",
        });
      }
      setShowSnackbar(true);
    } catch (error: any) {
      console.error("Error verifying Main Account API keys:", error);
      setResponseMessage({
        text: error.message || "Failed to verify Main Account API keys",
        type: "error",
      });
      setShowSnackbar(true);
    } finally {
      setIsMainVerifying(false);
    }
  };

  const handleVerifySubApiKeys = async () => {
    if (!selectedSubBroker || !subApiKey || !subSecretKey) {
      setResponseMessage({
        text: "Please enter Sub-Account API key and secret",
        type: "error",
      });
      setShowSnackbar(true);
      return;
    }
    setIsSubVerifying(true);
    try {
      const response = await TradingRulesService.verifySubApiKeys({
        marketTypeId: selectedSubBroker.marketTypeId,
        brokerId: selectedSubBroker.brokerId,
        brokerKey: selectedSubBroker.brokerKey,
        subApiKey,
        subSecretKey,
      });
      if (response.statusCode === 200 && response.success) {
        setIsSubApiVerified(true);
        setIsSubApiKeyEditable(false);
        setResponseMessage({
          text: "Sub-Account API keys verified successfully",
          type: "success",
        });
      } else {
        setResponseMessage({
          text: response.message || "Failed to verify Sub-Account API keys",
          type: "error",
        });
      }
      setShowSnackbar(true);
    } catch (error: any) {
      console.error("Error verifying Sub-Account API keys:", error);
      setResponseMessage({
        text: error.message || "Failed to verify Sub-Account API keys",
        type: "error",
      });
      setShowSnackbar(true);
    } finally {
      setIsSubVerifying(false);
    }
  };

  const handleEditMainApiKeys = () => {
    setIsMainApiKeyEditable(true);
    setIsMainApiVerified(false);
    setShowMainApiKey(false);
    setShowMainSecretKey(false);
  };

  const handleEditSubApiKeys = () => {
    setIsSubApiKeyEditable(true);
    setIsSubApiVerified(false);
    setShowSubApiKey(false);
    setShowSubSecretKey(false);
  };

  const handleResetRules = (subType: 'cash' | 'future' | 'option') => {
    const initialRules = rules.map((rule) => ({
      key: rule.key,
      value: rule.type === 'boolean' ? false :
             rule.type === 'number' ? 0 :
             rule.type === 'time' ? '00:00:00' :
             rule.type === 'timerange' ? { start: '00:00', end: '00:00' } :
             rule.type === 'enum' ? (rule.options ? rule.options[0] : '') : '',
      error: undefined,
    }));
    setTradingRules((prev) => ({
      ...prev,
      [subType]: initialRules,
    }));
    setResponseMessage({ text: `${subType.charAt(0).toUpperCase() + subType.slice(1)} rules reset`, type: "info" });
    setShowSnackbar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedSubBroker) return;
    if (!isMainApiVerified || !isSubApiVerified) {
      setResponseMessage({
        text: "Please verify both Main and Sub-Account API keys before applying trading rules",
        type: "error",
      });
      setShowSnackbar(true);
      return;
    }
    setIsSubmitting(true);

    for (const subType of ['cash', 'future', 'option'] as const) {
      for (const rule of tradingRules[subType]) {
        const ruleDef = rules.find((r) => r.key === rule.key);
        if (!ruleDef) continue;
        const error = validateRule(ruleDef, rule.value);
        if (error) {
          setResponseMessage({ text: `Invalid value for ${ruleDef.name} in ${subType}: ${error}`, type: "error" });
          setShowSnackbar(true);
          setIsSubmitting(false);
          return;
        }
      }
    }

    if (!termsAccepted) {
      setResponseMessage({ text: "Please accept the terms and conditions", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await TradingRulesService.setTradingRules({
        _id: selectedSubBroker._id,
        brokerKey: selectedSubBroker.brokerKey,
        subApiKey,
        subSecretKey,
        mainApiKey,
        mainSecretKey,
        marketTypeId:selectedSubBroker.marketTypeId,
        proxyServiceId:selectedSubBroker.proxyServiceId,
        noRulesChange,
        tradingRuleData: {
          cash: tradingRules.cash.map(({ key, value }) => ({ key, value })),
          future: tradingRules.future.map(({ key, value }) => ({ key, value })),
          option: tradingRules.option.map(({ key, value }) => ({ key, value })),
        },
      });

      if (response.statusCode === 200 && response.success) {
        setResponseMessage({ text:response.message, type: "success" });
        setShowSnackbar(true);
        setTradingRules({ cash: [], future: [], option: [] });
        setSelectedSubBroker(null);
        setSubApiKey('');
        setSubSecretKey('');
        setMainApiKey('');
        setMainSecretKey('');
        setIsMainApiVerified(false);
        setIsSubApiVerified(false);
        setIsMainApiKeyEditable(true);
        setIsSubApiKeyEditable(true);
        setShowSubApiKey(false);
        setShowSubSecretKey(false);
        setShowMainApiKey(false);
        setShowMainSecretKey(false);
        setSelectedTab(0);
        setTermsAccepted(false);
         setVerifyRules(false);
        setNoRulesChange(false);
      } else {
        setResponseMessage({ text: response.message || "Failed to apply trading rules", type: "error" });
        setShowSnackbar(true);
      }
    } catch (error: any) {
      console.error("Error applying trading rules:", error);
      setResponseMessage({ text: error.message || "Failed to apply trading rules", type: "error" });
      setShowSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleTabClick = () => {
    if (!isMainApiVerified || !isSubApiVerified && !showSnackbar) {
      setResponseMessage({
        text: "Please add and verify both Main and Sub-Account API key and secret",
        type: "error",
      });
      setShowSnackbar(true);
    }
  };

  const handleRuleInputClick = () => {
    if (!isMainApiVerified || !isSubApiVerified && !showSnackbar) {
      setResponseMessage({
        text: "Please add and verify both Main and Sub-Account API key and secret",
        type: "error",
      });
      setShowSnackbar(true);
    }
  };

  const renderRuleInput = (rule: Rule, subType: 'cash' | 'future' | 'option') => {
    const ruleValue = tradingRules[subType].find((r) => r.key === rule.key);
    const value = ruleValue?.value;
    const error = ruleValue?.error;
    const errorId = error ? `error-${subType}-${rule.key}` : undefined;

    const input = (() => {
      switch (rule.type) {
        case 'boolean':
          return (
            <Box sx={{ minHeight: 40 }}>
              <Checkbox
                checked={value || false}
                onChange={(e) => handleRuleChange(subType, rule.key, e.target.checked)}
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                color="primary"
                data-testid={`rule-${subType}-${rule.key}`}
              />
            </Box>
          );
        case 'number':
          return (
            <Box sx={{ minHeight: 38 }}>
              <TextField
                type="number"
                value={value || 0}
                onChange={(e) => handleRuleChange(subType, rule.key, Number(e.target.value))}
                variant="outlined"
                size="small"
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                InputProps={{ inputProps: { min: 0 } }}
                sx={{
                  width: 100,
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                }}
                error={!!error}
                helperText={error}
                inputProps={{ 'aria-describedby': errorId }}
                data-testid={`rule-${subType}-${rule.key}`}
              />
              {error && (
                <Typography id={errorId} variant="caption" color="error" sx={{ display: 'none' }}>
                  {error}
                </Typography>
              )}
            </Box>
          );
        case 'time':
          return (
            <Box sx={{ minHeight: 38 }}>
              <TextField
                type="text"
                value={value || '00:00:00'}
                onChange={(e) => handleRuleChange(subType, rule.key, e.target.value)}
                variant="outlined"
                size="small"
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                placeholder="HH:mm:ss"
                sx={{
                  width: 100,
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                }}
                error={!!error}
                helperText={error}
                inputProps={{ 'aria-describedby': errorId }}
                data-testid={`rule-${subType}-${rule.key}`}
              />
              {error && (
                <Typography id={errorId} variant="caption" color="error" sx={{ display: 'none' }}>
                  {error}
                </Typography>
              )}
            </Box>
          );
        case 'timerange':
          const startErrorId = error ? `error-${subType}-${rule.key}-start` : undefined;
          const endErrorId = error ? `error-${subType}-${rule.key}-end` : undefined;
          return (
            <Box sx={{ display: 'flex', gap: theme.spacing(0.5), minHeight: 38 }}>
              <TextField
                type="text"
                value={value?.start || '00:00'}
                onChange={(e) =>
                  handleRuleChange(subType, rule.key, { ...value, start: e.target.value })
                }
                variant="outlined"
                size="small"
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                placeholder="HH:mm"
                sx={{
                  width: 100,
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                }}
                error={!!error}
                helperText={error && 'Start'}
                inputProps={{ 'aria-describedby': startErrorId }}
                data-testid={`rule-${subType}-${rule.key}-start`}
              />
              <TextField
                type="text"
                value={value?.end || '00:00'}
                onChange={(e) =>
                  handleRuleChange(subType, rule.key, { ...value, end: e.target.value })
                }
                variant="outlined"
                size="small"
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                placeholder="HH:mm"
                sx={{
                  width: 100,
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                }}
                error={!!error}
                helperText={error && 'End'}
                inputProps={{ 'aria-describedby': endErrorId }}
                data-testid={`rule-${subType}-${rule.key}-end`}
              />
              {error && (
                <>
                  <Typography id={startErrorId} variant="caption" color="error" sx={{ display: 'none' }}>
                    {error} (Start)
                  </Typography>
                  <Typography id={endErrorId} variant="caption" color="error" sx={{ display: 'none' }}>
                    {error} (End)
                  </Typography>
                </>
              )}
            </Box>
          );
        case 'enum':
          return (
            <Box sx={{ minHeight: 38 }}>
              <FormControl
                variant="outlined"
                size="small"
                sx={{ minWidth: 120 }}
                disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                error={!!error}
                data-testid={`rule-${subType}-${rule.key}`}
              >
                <InputLabel sx={{ color: theme.palette.text.secondary }}>{rule.name}</InputLabel>
                <Select
                  value={value || (rule.options ? rule.options[0] : '')}
                  onChange={(e) => handleRuleChange(subType, rule.key, e.target.value)}
                  label={rule.name}
                  sx={{
                    '& .MuiInputBase-input': { color: theme.palette.text.primary },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  }}
                >
                  {rule.options?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {error && <Typography id={errorId} variant="caption" color="error">{error}</Typography>}
              </FormControl>
            </Box>
          );
        default:
          return null;
      }
    })();

    return (
      <Box
        onClick={(!selectedSubBroker || !isMainApiVerified || !isSubApiVerified) ? handleRuleInputClick : undefined}
        sx={{ cursor: (!selectedSubBroker || !isMainApiVerified || !isSubApiVerified) ? 'not-allowed' : 'auto' }}
      >
        {input}
      </Box>
    );
  };

  return (
    <PageContainer>
      <Card sx={{ p: 3, boxShadow: 4, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
        <Box sx={{ display: "flex", gap: 3, flexDirection: "column" }}>
          <Snackbar
            open={showSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            sx={{ mt: 8 }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={responseMessage?.type || "info"}
              sx={{ width: "100%", boxShadow: 2 }}
            >
              {responseMessage?.text}
            </Alert>
          </Snackbar>

          <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={2} color={theme.palette.primary.main}>
                My Account List (Total:{subBrokerAccounts.length})
                {selectedSubBroker && `[ Selected: ${selectedSubBroker.subAccountName}]`}
              </Typography>
              {isLoadingAccounts ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : subBrokerAccounts.length > 0 ? (
                <List
                  sx={{
                    maxHeight: 200,
                    overflowY: "auto",
                    mt: 1,
                    p: 1,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                  }}
                >
                  {subBrokerAccounts.map((account) => (
                    <ListItem
                      key={account._id}
                      dense
                      onClick={() => handleSubBrokerSelection(account)}
                      sx={{
                        cursor: account.hasProxy ? "pointer" : "default",
                        "&:hover": account.hasProxy ? { bgcolor: theme.palette.action.hover } : {},
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedSubBroker?._id === account._id}
                          disabled={!account.hasProxy || !!(selectedSubBroker && selectedSubBroker._id !== account._id)}
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500} color={theme.palette.text.primary}>
                            {account.subAccountName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color={theme.palette.text.secondary}>
                            <strong>Market:</strong> {getMarketTypeDisplayName(account.marketTypeId)} |{' '}
                            <strong>Broker:</strong> {account.brokerName} |{' '}
                            <strong>Start:</strong>{" "}
                            {new Date(account.startDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })} |{' '}
                            <strong>End:</strong>{" "}
                            {new Date(account.endDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {!account.hasProxy && (
                              <> | <strong>Status:</strong> In process</>
                            )}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color={theme.palette.text.secondary}>
                  No subbroker accounts available.
                </Typography>
              )}
            </CardContent>
          </Card>

          { (
            <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
              <CardContent>
                <RuleCard sx={{ mb: 3, position: 'relative' }}>
                  <CardContent sx={{ py: 2, px: 3 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body1" fontWeight={500}>
                        Watch YouTube Video
                      </Typography>
                      <Typography>
                        <a
                          href="https://www.youtube.com/watch?v=API_KEY_TUTORIAL"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          aria-label="Watch tutorial video on generating API key and secret for Broker"
                          onMouseOver={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                          onMouseOut={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                        >
                          <YouTube sx={{ color: '#FF0000' }} /> How to Generate API Key and Secret for Broker
                        </a>
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600} mb={2} color={theme.palette.text.primary}>
                      API Key Verification
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, alignItems: { sm: 'center' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                          <Typography variant="body2" fontWeight={500} color={theme.palette.text.primary}>
                            Main Account
                          </Typography>
                          <TextField
                            label="Main Account API Key"
                            type={showMainApiKey ? 'text' : 'password'}
                            value={mainApiKey}
                            onChange={(e) => setMainApiKey(e.target.value)}
                            variant="outlined"
                            size="small"
                            disabled={!isMainApiKeyEditable}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowMainApiKey(!showMainApiKey)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {showMainApiKey ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              ),
                            }}
                            inputProps={{ maxLength: 128, 'aria-describedby': mainApiKey ? `error-main-api-key` : undefined }}
                            sx={{
                              width: { xs: '100%', sm: 350, md: 400 },
                              '& .MuiInputBase-input': { color: theme.palette.text.primary },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                            }}
                          />
                          <TextField
                            label="Main Account API Secret"
                            type={showMainSecretKey ? 'text' : 'password'}
                            value={mainSecretKey}
                            onChange={(e) => setMainSecretKey(e.target.value)}
                            variant="outlined"
                            size="small"
                            disabled={!isMainApiKeyEditable}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowMainSecretKey(!showMainSecretKey)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {showMainSecretKey ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              ),
                            }}
                            inputProps={{ maxLength: 128, 'aria-describedby': mainSecretKey ? `error-main-api-secret` : undefined }}
                            sx={{
                              width: { xs: '100%', sm: 350, md: 400 },
                              '& .MuiInputBase-input': { color: theme.palette.text.primary },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={handleVerifyMainApiKeys}
                              disabled={isMainVerifying || !isMainApiKeyEditable}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { bgcolor: theme.palette.action.hover },
                              }}
                            >
                              {isMainVerifying ? (
                                <>
                                  <CircularProgress size={20} />
                                  <Box ml={1}>Verifying...</Box>
                                </>
                              ) : (
                                'Verify'
                              )}
                            </Button>
                            {isMainApiVerified && (
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleEditMainApiKeys}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  '&:hover': { bgcolor: theme.palette.action.hover },
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, alignItems: { sm: 'center' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                          <Typography variant="body2" fontWeight={500} color={theme.palette.text.primary}>
                            Sub-Account
                          </Typography>
                          <TextField
                            label="Sub-Account API Key"
                            type={showSubApiKey ? 'text' : 'password'}
                            value={subApiKey}
                            onChange={(e) => setSubApiKey(e.target.value)}
                            variant="outlined"
                            size="small"
                            disabled={!isSubApiKeyEditable}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowSubApiKey(!showSubApiKey)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {showSubApiKey ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              ),
                            }}
                            inputProps={{ maxLength: 128, 'aria-describedby': subApiKey ? `error-sub-api-key` : undefined }}
                            sx={{
                              width: { xs: '100%', sm: 350, md: 400 },
                              '& .MuiInputBase-input': { color: theme.palette.text.primary },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                            }}
                          />
                          <TextField
                            label="Sub-Account API Secret"
                            type={showSubSecretKey ? 'text' : 'password'}
                            value={subSecretKey}
                            onChange={(e) => setSubSecretKey(e.target.value)}
                            variant="outlined"
                            size="small"
                            disabled={!isSubApiKeyEditable}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowSubSecretKey(!showSubSecretKey)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {showSubSecretKey ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              ),
                            }}
                            inputProps={{ maxLength: 128, 'aria-describedby': subSecretKey ? `error-sub-api-secret` : undefined }}
                            sx={{
                              width: { xs: '100%', sm: 350, md: 400 },
                              '& .MuiInputBase-input': { color: theme.palette.text.primary },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={handleVerifySubApiKeys}
                              disabled={isSubVerifying || !isSubApiKeyEditable}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { bgcolor: theme.palette.action.hover },
                              }}
                            >
                              {isSubVerifying ? (
                                <>
                                  <CircularProgress size={20} />
                                  <Box ml={1}>Verifying...</Box>
                                </>
                              ) : (
                                'Verify'
                              )}
                            </Button>
                            {isSubApiVerified && (
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleEditSubApiKeys}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  '&:hover': { bgcolor: theme.palette.action.hover },
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </RuleCard>

                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  onClick={handleTabClick}
                  aria-label="trading rules tabs"
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: theme.palette.divider,
                  }}
                  TabIndicatorProps={{
                    style: { backgroundColor: theme.palette.primary.main },
                  }}
                >
                  <StyledTab label="Cash" id="tab-0" aria-controls="tabpanel-0" disabled={!isMainApiVerified || !isSubApiVerified} />
                  <StyledTab label="Futures" id="tab-1" aria-controls="tabpanel-1" disabled={!isMainApiVerified || !isSubApiVerified} />
                  <StyledTab label="Options" id="tab-2" aria-controls="tabpanel-2" disabled={!isMainApiVerified || !isSubApiVerified} />
                </Tabs>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleResetRules(['cash', 'future', 'option'][selectedTab] as 'cash' | 'future' | 'option')}
                    disabled={!selectedSubBroker || !isMainApiVerified || !isSubApiVerified}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': { bgcolor: theme.palette.action.hover },
                    }}
                  >
                    Reset {['Cash', 'Futures', 'Options'][selectedTab]} Rules
                  </Button>
                </Box>

                <TabPanel value={selectedTab} index={0}>
                  <Typography variant="h6" fontWeight={600} mb={3} color={theme.palette.text.primary}>
                    Cash Trading Rules
                  </Typography>
                  <Grid container spacing={2}>
                    {rules.map((rule) => (
                      <Grid item xs={12} sm={6} key={rule.key}>
                        <RuleCard>
                          <CardContent sx={{ py: 2, px: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minWidth: 0 }}>
                              <Tooltip
                                title={rule.description}
                                placement="top"
                                arrow
                                sx={{ '& .MuiTooltip-tooltip': { fontSize: '0.9rem', maxWidth: 300 } }}
                              >
                                <Typography
                                  variant="body1"
                                  fontWeight={500}
                                  sx={{
                                    cursor: 'pointer',
                                    flex: 1,
                                    color: theme.palette.text.primary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'calc(100% - 140px)',
                                  }}
                                >
                                  {rule.name}
                                </Typography>
                              </Tooltip>
                              {renderRuleInput(rule, 'cash')}
                            </Box>
                          </CardContent>
                        </RuleCard>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>

                <TabPanel value={selectedTab} index={1}>
                  <Typography variant="h6" fontWeight={600} mb={3} color={theme.palette.text.primary}>
                    Futures Trading Rules
                  </Typography>
                  <Grid container spacing={2}>
                    {rules.map((rule) => (
                      <Grid item xs={12} sm={6} key={rule.key}>
                        <RuleCard>
                          <CardContent sx={{ py: 2, px: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minWidth: 0 }}>
                              <Tooltip
                                title={rule.description}
                                placement="top"
                                arrow
                                sx={{ '& .MuiTooltip-tooltip': { fontSize: '0.9rem', maxWidth: 300 } }}
                              >
                                <Typography
                                  variant="body1"
                                  fontWeight={500}
                                  sx={{
                                    cursor: 'pointer',
                                    flex: 1,
                                    color: theme.palette.text.primary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'calc(100% - 140px)',
                                  }}
                                >
                                  {rule.name}
                                </Typography>
                              </Tooltip>
                              {renderRuleInput(rule, 'future')}
                            </Box>
                          </CardContent>
                        </RuleCard>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>

                <TabPanel value={selectedTab} index={2}>
                  <Typography variant="h6" fontWeight={600} mb={3} color={theme.palette.text.primary}>
                    Options Trading Rules
                  </Typography>
                  <Grid container spacing={2}>
                    {rules.map((rule) => (
                      <Grid item xs={12} sm={6} key={rule.key}>
                        <RuleCard>
                          <CardContent sx={{ py: 2, px: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minWidth: 0 }}>
                              <Tooltip
                                title={rule.description}
                                placement="top"
                                arrow
                                sx={{ '& .MuiTooltip-tooltip': { fontSize: '0.9rem', maxWidth: 300 } }}
                              >
                                <Typography
                                  variant="body1"
                                  fontWeight={500}
                                  sx={{
                                    cursor: 'pointer',
                                    flex: 1,
                                    color: theme.palette.text.primary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'calc(100% - 140px)',
                                  }}
                                >
                                  {rule.name}
                                </Typography>
                              </Tooltip>
                              {renderRuleInput(rule, 'option')}
                            </Box>
                          </CardContent>
                        </RuleCard>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>
              </CardContent>
            </Card>
          )}





          <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={2}
              >


                   <Box display="flex" alignItems="center" gap={1}>
                      <Checkbox
                      checked={verifyRules}
                      onChange={() => setVerifyRules(!verifyRules)}
                      color="primary"
                      disabled={!isMainApiVerified || !isSubApiVerified}
                    />
                    <Typography variant="body2" color={theme.palette.text.secondary}>
                      I verified my enter Rules Properly
                    </Typography>
                  </Box>


                  <Box display="flex" alignItems="center" gap={1}>
                    <Checkbox
                      checked={noRulesChange}
                      onChange={() => setNoRulesChange(!noRulesChange)}
                      color="primary"
                     // disabled={  !isSubApiVerified}
                    />
                    <Typography variant="body2" color={theme.palette.text.secondary}>
                     I Dont want to Change Rule Ever
                    </Typography>
                  </Box>







                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                    color="primary"
                    disabled={!isMainApiVerified || !isSubApiVerified}
                  />
                  <Typography variant="body2" color={theme.palette.text.secondary}>
                    I agree to the <a href="#" style={{ color: theme.palette.primary.main }}>Terms and Conditions</a>
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || !selectedSubBroker || !isMainApiVerified || !isSubApiVerified || !verifyRules}
                  sx={{
                    maxWidth: { sm: 300 },
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': { boxShadow: 6 },
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" />
                      <Box ml={1}>Add Trading Rules...</Box>
                    </>
                  ) : (
                    "Add Trading Rules"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Card>
    </PageContainer>
  );
}
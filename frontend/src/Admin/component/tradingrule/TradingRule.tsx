import type { SelectChangeEvent } from '@mui/material';

import React, { useState, useEffect } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Edit, Delete } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  List,
  Paper,
  Table,
  Select,
  Button,
  MenuItem,
  TableRow,
  ListItem,
  TextField,
  TableCell,
  TableHead,
  TableBody,
  InputLabel,
  Typography,
  IconButton,
  FormControl,
  ListItemText,
  TableContainer,
} from '@mui/material';

import MarketTypeService from '../../../Services/api-services/MarketTypeService';
import TradingRuleService from '../../../Services/api-services/TradingRuleService';

import type { TradingRuletype, TradingRuleDetails } from '../../../Types/TradingRuleType';

export interface TradingRuleRequest {
  _id: string;
  marketTypeId: string;
  rules: {
    cash: string[];
    option: string[];
    future: string[];
  };
}

const initialData: TradingRuleRequest = {
  _id: '',
  marketTypeId: '',
  rules: {
    cash: [],
    option: [],
    future: [],
  },
};

interface MarketType {
  _id: string;
  name: string;
}

export default function TradingRule() {
  const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [trader, setTrader] = useState<TradingRuletype>(initialData);
  const [error, setError] = useState<Record<string, string>>({});
  const [selectedRuleType, setSelectedRuleType] = useState<'cash' | 'option' | 'future' | ''>('');
  const [newRule, setNewRule] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [traderdetails, setTraderDetails] = useState<TradingRuleDetails[]>([]);

  useEffect(() => {
    const fetchMarketTypes = async () => {
      try {
        const response = await MarketTypeService.getAllActiveMarketTypes();
        if (response?.data) {
          setMarketTypes(response.data);
        } else {
          throw new Error('Invalid API Response');
        }
      } catch (err: any) {
        console.error('Error fetching market types:', err.response?.data?.message || err.message);
      }
    };
    fetchMarketTypes();
  }, []);

  const fetchTradingRule = async () => {
    try {
      const response = await TradingRuleService.getTradingRules();
      setTraderDetails(response.data);
    } catch (catchError: any) {
      console.error('Error fetching trading rule:', catchError);
    }
  };
  useEffect(() => {
    fetchTradingRule();
  }, []);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    setTrader((prev) => ({
      ...prev,
      marketTypeId: event.target.value || '',
    }));
    setError((prev) => ({ ...prev, marketTypeId: '' }));
  };

  const handleRuleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedRuleType(event.target.value as 'cash' | 'option' | 'future');
    setNewRule('');
    setEditingIndex(null);
  };

  const handleAddOrUpdateRule = () => {
    if (!newRule.trim() || !selectedRuleType) return;

    setTrader((prev) => {
      const updatedRules = [...prev.rules[selectedRuleType]];

      if (editingIndex !== null) {
        updatedRules[editingIndex] = newRule.trim();
      } else {
        updatedRules.push(newRule.trim());
      }

      return {
        ...prev,
        rules: {
          ...prev.rules,
          [selectedRuleType]: updatedRules,
        },
      };
    });

    setNewRule('');
    setEditingIndex(null);
  };

  const handleEditRule = (index: number) => {
    if (selectedRuleType) {
      setNewRule(trader.rules[selectedRuleType][index]);
    }
    setEditingIndex(index);
  };

  const handleDeleteRule = (index: number) => {
    if (selectedRuleType) {
      setTrader((prev) => ({
        ...prev,
        rules: {
          ...prev.rules,
          [selectedRuleType]: prev.rules[selectedRuleType].filter((_, i) => i !== index),
        },
      }));
    }
  };

  const formatRules = (rules: Record<string, any>) => (
    <List dense sx={{ padding: 0 }}>
      {Object.entries(rules).map(([key, value]) => (
        <ListItem key={value} sx={{ padding: 0 }}>
          <ListItemText primary={`• ${value}`} />
        </ListItem>
      ))}
    </List>
  );

  const handleEditTradingRule = (index: number) => {
    const selected = traderdetails[index];
    setTrader({
      _id: selected._id,
      marketTypeId: selected.marketTypeId,
      rules: selected.rules,
    });
    if (selected.rules.cash.length > 0) {
      setSelectedRuleType('cash');
    } else if (selected.rules.future.length > 0) {
      setSelectedRuleType('future');
    } else if (selected.rules.option.length > 0) {
      setSelectedRuleType('option');
    } else {
      setSelectedRuleType('');
    }
    setNewRule('');
    setEditingIndex(null);
  };

  const handleDeleteTradingRule = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this plan?');

    if (!confirmDelete) return
    try {
      const response = await TradingRuleService.deleteTradingRules(id);
      if (response.success) {
        setTraderDetails((prevTraders) => prevTraders.filter((traders) => traders._id !== id));
      } else {
        alert('Failed to delete the plan. Please try again later.');
      }
    } catch (catchError: any) {
      console.error('Error deleting the plan:', catchError);
      alert('An error occurred while deleting the plan.');
    }

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trader.marketTypeId || typeof trader.marketTypeId !== 'string') {
      setError({ marketTypeId: 'Market Type is required.' });
      return;
    }
    setSelectedRuleType('');
    setNewRule('');
    setMessage('');
    fetchTradingRule();
    try {
      if (trader._id) {
        await TradingRuleService.updateTradingRules(trader);
      } else {
        await TradingRuleService.CreateTradingRules(trader);
      }
      setTrader(initialData);
      setSelectedRuleType('');
      setNewRule('');
      setMessage('');
      fetchTradingRule();
    } catch (err: any) {
      console.error('Error creating trading rule:', err.response?.data?.message);
      setMessage(err.response?.data?.message || 'Failed to create trading rule.');
    }
  };

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      height="60vh"
      bgcolor="#f5f5f5"
      marginTop="3%"
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 2,
          minWidth: { xs: '90%', sm: '50%', md: '40%' },
          bgcolor: 'white',
          borderRadius: 2,
        }}
      >
        <form>
          <Typography variant="h5" align="center" gutterBottom>
            Trading Rules Details
          </Typography>

          {/* Market Type Selection */}
          <FormControl fullWidth sx={{ py: 2, mt: 4 }} error={!!error.marketTypeId}>
            <InputLabel>Market Type</InputLabel>
            <Select
              name="marketTypeId"
              value={trader.marketTypeId || ''}
              onChange={handleSelectChange}
            >
              {marketTypes.map((type) => (
                <MenuItem key={type._id} value={String(type._id)}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Rule Type Selection */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Rule Type</InputLabel>
            <Select value={selectedRuleType} onChange={handleRuleTypeChange}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="option">Option</MenuItem>
              <MenuItem value="future">Future</MenuItem>
            </Select>
          </FormControl>

          {/* Rule Input Field */}
          {selectedRuleType && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TextField
                label={`Add ${selectedRuleType} Rule`}
                variant="outlined"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 2 }}
                onClick={handleAddOrUpdateRule}
              >
                {trader._id ? 'Update' : 'Add'}
              </Button>
            </Box>
          )}

          {/* Rules List */}
          {selectedRuleType && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: '14px' }}>
                {selectedRuleType.toUpperCase()} Rules
              </Typography>
              {trader.rules[selectedRuleType].length === 0 ? (
                <Typography>No rules added yet.</Typography>
              ) : (
                trader.rules[selectedRuleType].map((rule, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      my: 1,
                      p: 1,
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <Typography sx={{ flex: 1 }}>{rule}</Typography>
                    <Box>
                      <IconButton onClick={() => handleEditRule(index)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRule(index)}>
                        <Delete color="error" />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
            Create
          </Button>
        </form>
      </Paper>
      <Typography variant="h6" align="center" sx={{ mt: 5 }} gutterBottom>
        Trading Rules
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Market Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cash Rules</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Option Rules</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Future Rules</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <b>Action</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traderdetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No Trading Rules Found
                </TableCell>
              </TableRow>
            ) : (
              traderdetails.map((rule, index) => (
                <TableRow key={rule._id}>
                  <TableCell>
                    {marketTypes.find((type) => type._id === rule.marketTypeId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{formatRules(rule.rules.cash)}</TableCell>
                  <TableCell>{formatRules(rule.rules.option)}</TableCell>
                  <TableCell>{formatRules(rule.rules.future)}</TableCell>
                  <TableCell>
                    <Button>
                      <EditIcon onClick={() => handleEditTradingRule(index)} />
                      <DeleteIcon onClick={() => handleDeleteTradingRule(rule._id)} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

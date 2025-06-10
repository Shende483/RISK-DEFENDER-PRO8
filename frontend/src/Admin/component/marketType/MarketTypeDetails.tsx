import type { SelectChangeEvent } from '@mui/material';

import { useState, useEffect } from 'react';

import {
  Box,
  Table,
  Paper,
  Select,
  Button,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  TableContainer,
} from '@mui/material';

import MarketTypeService from '../../../Services/api-services/MarketTypeService';

import type { MarketTypeList, MarketTypeDetails } from '../../../Types/MarketTypes';

const initialData: MarketTypeDetails = {
  id: 0,
  name: '',
  status: '',
};

export default function Marketdetail() {
  const [marketData, setMarketData] = useState<MarketTypeList[]>([]);
  const [marketDetails, setMarketDetails] = useState<MarketTypeDetails>(initialData);
  const [error, setError] = useState<{ name?: string; status?: string }>({});

  const validateForm = () => {
    const tempErrors: { name?: string; status?: string } = {};
    if (!marketDetails.name.trim()) {
      tempErrors.name = 'Market Type is required';
    }
    if (!marketDetails.status?.trim()) {
      tempErrors.status = 'Status is required';
    }
    setError(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm() && marketDetails.name.trim() && marketDetails.status?.trim()) {
      try {
        await MarketTypeService.createMarketType(marketDetails);
        setMarketDetails({ id: 0, name: '', status: '' });
        setError({});
        fetchMarketTypes();
      } catch (catchError: any) {
        const errorMessage = catchError.response?.data?.message;
        console.error(errorMessage);
      }
    }
  };

  const handleChangeStatus = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setMarketDetails((preDetails: any) => ({ ...preDetails, status: value }));
    setError((prev) => ({ ...prev, status: '' }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMarketDetails((prev) => ({ ...prev, name: event.target.value }));
    setError((prev) => ({ ...prev, name: '' }));
  };

  const fetchMarketTypes = async () => {
    try {
      const response = await MarketTypeService.getAllActiveMarketTypes();
      console.log('API Response:', response.data);
      setMarketData(response.data);
    } catch (catchError: any) {
      console.error('Error fetching market types:', catchError);
    }
  };

  useEffect(() => {
    fetchMarketTypes();
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          minWidth: { xs: '90%', sm: '50%', md: '30%' },
          bgcolor: 'white',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Market Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Market Type"
            value={marketDetails.name}
            onChange={handleNameChange}
            error={Boolean(error.name)}
            helperText={error.name}
            variant="outlined"
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Status</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={marketDetails.status}
              onChange={handleChangeStatus}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            {error.status && <Typography color="error">{error.status}</Typography>}
          </FormControl>
        </Box>

        <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
          Submit
        </Button>
      </Paper>
      <TableContainer component={Paper} sx={{ mt: 4, mx: 'auto', maxWidth: '1200px' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ py: 2 }}>
          Active Market Types
        </Typography>
        <Table sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>
                <b>Name</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marketData.map((market, index) => (
              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                <TableCell>{market.name}</TableCell>
                <TableCell>{market.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

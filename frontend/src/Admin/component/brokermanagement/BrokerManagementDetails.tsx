import type { SelectChangeEvent } from '@mui/material';

import { useState, useEffect } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Table,
  Paper,
  Select,
  Button,
  Snackbar,
  TableRow,
  MenuItem,
  TextField,
  Container,
  TableBody,
  TableCell,
  TableHead,
  InputLabel,
  Typography,
  FormControl,
  TableContainer,
} from '@mui/material';

import MarketTypeService from '../../../Services/api-services/MarketTypeService';
import BrokerManagmentService from '../../../Services/api-services/BrokerManagementService';

import type { BrokerManagmentdetails } from '../../../Types/BrokerManagementTypes';

interface BrokerManagement {
  _id: string;
  name: string;
  status: string;
  marketTypeId: string;
  createdDate: string;
  modifiedDate: string;
}

interface MarketType {
  _id: string;
  name: string;
}

const initialData: BrokerManagement = {
  _id: '',
  name: '',
  status: '',
  marketTypeId: '',
  createdDate: '',
  modifiedDate: '',
};

export default function BrokerManagementDetails() {
  const [brokersdetails, setBrokersDetails] = useState<BrokerManagmentdetails[]>([]);
  const [broker, setBroker] = useState<BrokerManagement>(initialData);
  const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [selectedMarketType, setSelectedMarketType] = useState<string>(''); // Store selected market type ID

  const [message, setMessage] = useState('');
  const [error, setError] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!broker.name.trim()) errors.name = 'Broker Name is required.';
    if (!broker.marketTypeId) errors.marketTypeId = 'Market Type is required.';
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBroker({ ...broker, [event.target.name]: event.target.value });
    setError((prev) => ({ ...prev, [event.target.name]: '' }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    console.log(`Select Change - Name: ${name}, Value: ${value}`);

    setBroker((prev) => ({
      ...prev,
      [name]: value || '',
    }));
    setError((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEdit = (index: number) => {
    const selectedBroker = brokersdetails[index];
    setBroker({
      ...selectedBroker,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        if (broker._id) {
          await BrokerManagmentService.updateBroker(broker);
        } else {
          await BrokerManagmentService.createBroker(broker);
        }
        setBroker(initialData);
        setError({});
        fetchBrokers();
        setMessage('Broker created successfully!');
      } catch (err: any) {
        console.error('Error creating broker:', err.response?.data?.message);
        setMessage(err.response?.data?.message || 'Failed to create broker.');
      }
    }
  };

  // =========================broker detials =================================

  const fetchBrokers = async () => {
    try {
      const response = await BrokerManagmentService.getBrokers();

      console.log('Full API Response:', response);

      if (Array.isArray(response)) {
        setBrokersDetails(response);
      } else if (Array.isArray(response.data)) {
        setBrokersDetails(response.data);
      } else {
        console.error('Unexpected API response structure:', response);
      }
    } catch (catchError: any) {
      console.error('Error fetching brokers:', catchError);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this plan?');

    if (confirmDelete) {
      try {
        const response = await BrokerManagmentService.deleteByIdBroker(id);

        if (response.success || response?.statusCode === 200) {
          alert('Broker deleted successfully');

          setBrokersDetails((prevBrokers) =>
            prevBrokers.filter((brokerlist) => brokerlist._id.toString() !== id)
          );
        } else {
          alert('Failed to delete the plan. Please try again later.');
        }
      } catch (catchError: any) {
        console.error('Error deleting the plan:', catchError);
        alert('An error occurred while deleting the plan.');
      }
    }
  };
  const handleMarketTypeChange = (event: any) => {
    setSelectedMarketType(event.target.value);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, p: 2 }}>
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
          Create Broker
        </Typography>
        <form>
          <TextField
            label="Broker Name"
            name="name"
            fullWidth
            value={broker.name}
            onChange={handleInputChange}
            error={!!error.name}
            helperText={error.name}
          />

          <FormControl fullWidth sx={{ py: 2, mt: 4 }} error={!!error.marketTypeId}>
            <InputLabel>Market Type</InputLabel>
            <Select
              name="marketTypeId"
              value={broker.marketTypeId || ''}
              onChange={handleSelectChange}
            >
              {marketTypes.map((type) => (
                <MenuItem key={type._id} value={String(type._id)}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ py: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={broker.status} onChange={handleSelectChange}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" onClick={handleSubmit}>
            {broker._id ? 'Update' : 'Create'}
          </Button>
        </form>

        <Snackbar
          open={!!message}
          message={message}
          autoHideDuration={3000}
          onClose={() => setMessage('')}
        />
      </Paper>

      {/* =======================broker details ================================== */}
      <FormControl fullWidth sx={{ py: 2, mt: 5 }} error={!!error.marketTypeId}>
        <InputLabel>Market Type</InputLabel>
        <Select value={selectedMarketType} onChange={handleMarketTypeChange}>
          <MenuItem value="">All</MenuItem>
          {marketTypes.map((type) => (
            <MenuItem key={type._id} value={String(type._id)}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TableContainer component={Paper} sx={{ mt: 4, mx: 'auto', maxWidth: '1200px' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ py: 2 }}>
          Active Brokers
        </Typography>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Name</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
              <TableCell>
                <b>Market Type</b>
              </TableCell>
              <TableCell>
                <b>Created Date</b>
              </TableCell>
              <TableCell>
                <b>Modified Date</b>
              </TableCell>
              <TableCell>
                <b>Actions</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brokersdetails
              .filter((brokerdata) =>
                selectedMarketType ? brokerdata.marketTypeId === selectedMarketType : true
              )
              .map((brokerdata, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                  <TableCell>{brokerdata.name}</TableCell>
                  <TableCell>{brokerdata.status}</TableCell>
                  <TableCell>
                    {marketTypes.find((type) => type._id === brokerdata.marketTypeId)?.name ||
                      'N/A'}
                  </TableCell>
                  <TableCell>{brokerdata.createdDate}</TableCell>
                  <TableCell>{brokerdata.modifiedDate}</TableCell>
                  <TableCell>
                    <Button>
                      <EditIcon onClick={() => handleEdit(index)} />
                      <DeleteIcon onClick={() => handleDelete(brokerdata._id.toString())} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

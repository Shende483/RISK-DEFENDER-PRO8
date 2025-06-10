import type { SelectChangeEvent } from '@mui/material';

import { useState, useEffect } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Edit, Delete } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Paper,
  Table,
  Button,
  Select,
  MenuItem,
  TableRow,
  TextField,
  TableHead,
  TableCell,
  TableBody,
  IconButton,
  InputLabel,
  Typography,
  FormControl,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import PlanService from '../../../Services/api-services/plan-info-service/add-broker-plan-service';

import type { PlanManagetype } from '../../../Types/PlanType';

const initialData: PlanManagetype = {
  name: '',
  description: '',
  price: 0,
  billingCycle: '',
  features: [],
  status: '',
  _id: '',
  createdDate: '',
  modifiedDate: '',
};

// -----------fetch dubscription plan-------------
export interface SubscriptionPlan {
  gstRate: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features: string[];
  status: string;
  _id: string;
  createdDate: string;
  modifiedDate: string;
}

export default function PlanForm() {
  const [planDetails, setPlanDetails] = useState<PlanManagetype>(initialData);
  const [error, setError] = useState<Partial<Record<keyof PlanManagetype, string>>>({});

  //   ------------------- const -------
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [validationerror, setValidationError] = useState<string>('');

  const [newFeature, setNewFeature] = useState(''); // For input field
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track index for editing

  // =============features =================

  // Add or update feature
  const handleAddFeature = () => {
    if (!newFeature.trim()) return; // Prevent empty values

    if (editingIndex !== null) {
      // If editing, update the existing feature
      setPlanDetails((prev) => {
        const updatedFeatures = [...prev.features];
        updatedFeatures[editingIndex] = newFeature.trim();
        return { ...prev, features: updatedFeatures };
      });
      setEditingIndex(null); // Reset editing state
    } else {
      // Add new feature
      setPlanDetails((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
    }
    setNewFeature(''); // Clear input
  };

  // Edit feature
  const handleEditFeature = (index: number) => {
    setNewFeature(planDetails.features[index]); // Set value in input field
    setEditingIndex(index); // Set editing index
  };

  // Delete feature
  const handleDeleteFeature = (index: number) => {
    setPlanDetails((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Handle input change
  const handleFeatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewFeature(event.target.value);
  };

  const validateForm = () => {
    const tempErrors: Partial<Record<keyof PlanManagetype, string>> = {};

    if (!planDetails.name.trim()) {
      tempErrors.name = 'Name is required';
    }
    if (!planDetails.description.trim()) {
      tempErrors.description = 'Description is required';
    }
    if (planDetails.price <= 0) {
      tempErrors.price = 'Price must be greater than 0';
    }
    if (!planDetails.billingCycle.trim()) {
      tempErrors.billingCycle = 'Billing Cycle is required';
    }
    if (planDetails.features.length === 0) {
      tempErrors.features = 'At least one feature is required';
    }
    if (!planDetails.status.trim()) {
      tempErrors.status = 'Status is required';
    }

    setError(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | { name?: string; value: any }>
  ) => {
    const { name, value } = event.target;
    setPlanDetails((prev) => ({ ...prev, [name!]: value }));
    setError((prev) => ({ ...prev, [name!]: '' }));
  };

  const handlepriceChange = (
    event: React.ChangeEvent<HTMLInputElement | { name?: string; value: any }>
  ) => {
    const { name, value } = event.target;

    setPlanDetails((prev) => ({
      ...prev,
      [name!]: name === 'price' && value === '' ? '' : Number(value), // Convert price to number
    }));

    setError((prev) => ({ ...prev, [name!]: '' }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string | string[]>) => {
    const { name, value } = event.target;

    setPlanDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleEdit = (index: number) => {
    const selectedPlan = plans[index];
    setPlanDetails({
      ...selectedPlan,
    });
  };

  const fetchPlans = async () => {
    try {
      const response = await PlanService.GetPlan();
      if (response.success) {
        setPlans(response.data as SubscriptionPlan[]);
      } else {
        setValidationError('No active plans found.');
      }
    } catch (err) {
      setValidationError('❌ Failed to fetch plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        if (planDetails._id) {
          await PlanService.updatePlan(planDetails);
        } else {
          await PlanService.CreatePlan(planDetails);
        }
        setPlanDetails(initialData);
        setError({});
        setTimeout(() => {
          fetchPlans();
        }, 500);
      } catch (catchError: any) {
        const errorMessage = catchError.response?.data?.message;
        console.error(errorMessage);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this plan?');

    if (confirmDelete) {
      try {
        const response = await PlanService.deletePlan(id);

        if (response.success) {
          setPlans((prevPlans) => prevPlans.filter((plan) => plan._id !== id));
        } else {
          alert('Failed to delete the plan. Please try again later.');
        }
      } catch (catchError: any) {
        console.error('Error deleting the plan:', catchError);
        alert('An error occurred while deleting the plan.');
      }
    }
  };

  return (
    <div>
      <Box
        sx={{ maxWidth: 1000, mx: 'auto', mt: 4, p: 2 }}
      >
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
            Plan Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="name"
              name="name"
              value={planDetails.name}
              variant="outlined"
              fullWidth
              onChange={handleChange}
              error={!!error.name}
              helperText={error.name}
            />
            <TextField
              label="description"
              name="description"
              variant="outlined"
              onChange={handleChange}
              value={planDetails.description}
              fullWidth
              error={!!error.description}
              helperText={error.description}
            />
          </Box>
          <Box>
            <TextField
              label="price"
              name="price"
              type="number"
              value={planDetails.price === 0 ? '' : planDetails.price}
              variant="outlined"
              fullWidth
              onChange={handlepriceChange}
              error={!!error.description}
              helperText={error.description}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Billing Cycle</InputLabel>
              <Select
                value={planDetails.billingCycle}
                name="billingCycle"
                onChange={handleSelectChange}
              >
                <MenuItem value="monthly">1 Monthly</MenuItem>
                <MenuItem value="monthly">3 Monthly</MenuItem>
                <MenuItem value="Yearly">Yearly</MenuItem>
              </Select>
              {error.billingCycle && <Typography color="error">{error.billingCycle}</Typography>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Status</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={planDetails.status}
                name="status"
                onChange={handleSelectChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {error.status && <Typography color="error">{error.status}</Typography>}
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Features
              </Typography>
              {/* Feature Input Field and Button */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Feature"
                  value={newFeature}
                  onChange={handleFeatureChange}
                  fullWidth
                />
                <Button variant="contained" onClick={handleAddFeature}>
                  {editingIndex !== null ? 'Update' : 'Add'}
                </Button>
              </Box>

              {/* Display Added Features */}
              <Box sx={{ mt: 2 }}>
                {planDetails.features.map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <Typography>{feature}</Typography>
                    <Box>
                      <IconButton onClick={() => handleEditFeature(index)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteFeature(index)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </FormControl>
          </Box>
          <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
            {planDetails._id ? 'Update' : 'Create'}
          </Button>
        </Paper>
      </Box>
      {/* ========================= plan table details ====================================== */}
      <Box sx={{ mt: 9 }}>
        <Paper sx={{ padding: 3, margin: 3 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Subscription Plans
          </Typography>

          {loading ? (
            <Typography align="center">
              <CircularProgress />
            </Typography>
          ) : validationerror ? (
            <Typography align="center" color="error">
              {validationerror}
            </Typography>
          ) : plans.length === 0 ? (
            <Typography align="center">No active plans found.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 4, mx: 'auto', maxWidth: '1200px' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>
                      <b>Name</b>
                    </TableCell>
                    <TableCell>
                      <b>Description</b>
                    </TableCell>
                    <TableCell>
                      <b>Price</b>
                    </TableCell>
                    <TableCell>
                      <b>Billing Cycle</b>
                    </TableCell>
                    <TableCell>
                      <b>Features</b>
                    </TableCell>
                    <TableCell>
                      <b>Status</b>
                    </TableCell>
                    <TableCell>
                      <b>Action</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map((plan, index) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell>${plan.price}</TableCell>
                      <TableCell>{plan.billingCycle}</TableCell>
                      <TableCell>{plan.features.join(', ')}</TableCell>
                      <TableCell>{plan.status}</TableCell>
                      <TableCell>
                        <Button>
                          <EditIcon onClick={() => handleEdit(index)} />
                          <DeleteIcon onClick={() => handleDelete(plan._id)} />{' '}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </div>
  );
}

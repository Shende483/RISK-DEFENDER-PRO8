

import React, { useMemo, useState, useEffect } from "react";

import {
  Box,
  Card,
  Grid,
  Alert,
  Button,
  Select,
  MenuItem,
  Checkbox,
  Snackbar,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";


import PlanService from "../../../../../Services/api-services/plan-info-service/add-broker-plan-service";
import SubscriptionService from "../../../../../Services/api-services/SubscriptionService";

import type { PlanType } from "../../../../../Services/interface-types-services/SubscriptionTypes";
import PaymentGateway from "../../../../../payment-gateways/currency-gateway/razorpay-gateway";



interface SubscriptionDetails {
  planName: string;
  numberOfBroker: number;
  expireDateTime: string;
  duration: string;
  status: string;
}

interface StatusMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  field?: string;
}

export default function AccountManagement() {
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails>({
    planName: '',
    numberOfBroker: 0,
    expireDateTime: '',
    duration: '1 month',
    status: 'active',
  });

  const [responseMessage, setResponseMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [planId, setPlanId] = useState<string>("");
  const [netPayment, setNetPayment] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');
  const [plan, setPlan] = useState<PlanType[]>([]);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const durationInDays = useMemo(
    () => ({
      '1 month': 30,
      '3 months': 90,
      '6 months': 180,
      '1 year': 360,
    }),
    []
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setSubscriptionDetails((prevDetails) => ({
      ...prevDetails,
      [name!]: value,
    }));

    if (name === 'numberOfBroker' || name === 'duration') {
      calculateTotalCost(value as string | number, name);
    }
  };

  const calculateTotalCost = (value: string | number, fieldName: string) => {
    if (!plan.length) return;

    const numberOfBrokers =
      fieldName === 'numberOfBroker' ? Number(value) : subscriptionDetails.numberOfBroker;
    const duration = fieldName === 'duration' ? (value as string) : subscriptionDetails.duration;

    if (!duration || !durationInDays[duration as keyof typeof durationInDays]) return;

    const days = durationInDays[duration as keyof typeof durationInDays];
    const months = days / 30; // Convert days to 30-day months
    const pricePerBroker = planPrice;
    const total = pricePerBroker * numberOfBrokers * months;
    const gst = total * 0.18;
    const totalWithGST = total + gst;

    // Calculate expiry date with current time
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);

    setTotalCost(total);
    setTotalGst(gst);
    setTotalPayment(totalWithGST);
    setSubscriptionDetails((prev) => ({
      ...prev,
      expireDateTime: currentDate.toISOString().slice(0, 16), // Preserve time
    }));

    // Apply coupon discount
    const discountAmount = couponCode === 'radha123' ? totalWithGST * 0.1 : 0;
    setDiscountPrice(discountAmount);
    setNetPayment(totalWithGST - discountAmount);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const planData = await PlanService.GetPlan();
        setPlan(planData.data);
        console.log("planData", planData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subscribeDto = {
        planId: plan[0]._id,
        planName: subscriptionDetails.planName,
        numberOfBroker: subscriptionDetails.numberOfBroker,
        startDate: new Date(),
        endDate: subscriptionDetails.expireDateTime,
        status: subscriptionDetails.status,
      };

      const response = await SubscriptionService.CreateSubscription(subscribeDto);

      if (response.statusCode === 201) {
        setSubscriptionId(response.subscriptionId);
        setResponseMessage({ text: response.message, type: 'success' });
        setShowSnackbar(true);
      } else {
        setResponseMessage({ text: response.message, type: 'error' });
        setShowSnackbar(true);
      }
    } catch (error: any) {
      setResponseMessage({
        text: error.message || 'Failed to create subscription.',
        type: 'error',
      });
      setShowSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  const handleSelect = (id: string, price: number) => {
    setPlanId(id);
    setPlanPrice(price);
    setSubscriptionDetails({ ...subscriptionDetails, numberOfBroker: 0 });
    setNetPayment(0);
    setDiscountPrice(0);
    setTotalPayment(0);
    setTotalCost(0);
    setTotalGst(0);
  };

  return (
    <Card
      sx={{ py: 3, my: 3, width: '100%', mx: 'auto', boxShadow: 3, borderRadius: 3 }}
    >
      <Box marginX={3} marginBottom={3} display="flex" gap={2} flexDirection="column">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {plan.map((plans) => (
            <Box key={plans._id} bgcolor={planId === plans._id ? "lightsalmon" : "lightblue"} borderRadius={1} marginBottom={3}>
              <MenuItem sx={{ display: "flex", alignItems: "start", flexDirection: "column" }} onClick={() => handleSelect(plans._id, plans.price)}>
                <Typography variant="h3" marginBottom={2} marginTop={2} color={planId === plans._id ? "salmon" : "#00b0ff"} textAlign="center" fontWeight={600}>
                  {plans.name}
                </Typography>
                <Typography variant="subtitle1" marginBottom={1} color="white" gutterBottom>
                  {plans.description}
                </Typography>
                <Typography variant="h4" color="white" gutterBottom>
                  1 BROKER = ₹{plans.price}
                </Typography>
                <Typography variant="h5" marginBottom={2} color="white" gutterBottom>
                  INR /{plans.billingCycle} + GST
                </Typography>
                {plans.features.map((feature, index) => (
                  <Typography key={index} variant="h6" color="white" gutterBottom>
                    • {feature}
                  </Typography>
                ))}
              </MenuItem>
            </Box>
          ))}
        </Box>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={responseMessage?.type || 'info'}
            sx={{ width: '100%' }}
          >
            {responseMessage?.text}
          </Alert>
        </Snackbar>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Plan Name"
              name="planName"
              value={subscriptionDetails.planName}
              onChange={(e) => handleInputChange(e as SelectChangeEvent<string>)}
              variant="outlined"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Number of Brokers"
              name="numberOfBroker"
              type="number"
              value={subscriptionDetails.numberOfBroker}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                name="duration"
                value={subscriptionDetails.duration}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="1 month">1 Month (30 days)</MenuItem>
                <MenuItem value="3 months">3 Months (90 days)</MenuItem>
                <MenuItem value="6 months">6 Months (180 days)</MenuItem>
                <MenuItem value="1 year">1 Year (360 days)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Expiry Date"
              name="expireDateTime"
              value={subscriptionDetails.expireDateTime}
              type="datetime-local"
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              disabled
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select name="status" value={subscriptionDetails.status} onChange={handleInputChange}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              variant="outlined"
              fullWidth
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Total Cost: ₹{totalCost.toFixed(2)}</Typography>
          <Typography variant="h6">GST: ₹{totalGst.toFixed(2)}</Typography>
          <Typography variant="h6">Total Payment: ₹{totalPayment.toFixed(2)}</Typography>
          <Typography variant="h6">Discount: - ₹{discountPrice.toFixed(2)}</Typography>
          <Typography variant="h6">Net Payment: ₹{netPayment.toFixed(2)}</Typography>
        </Box>

        <Box
          sx={{ mt: 2 }}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <Box width="100%" display="flex" alignItems="center">
            <Checkbox checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} />
            <Typography variant="body2">
              I agree to the <a href="#">Terms and Conditions</a>
            </Typography>
          </Box>

          {subscriptionId ? (
            <PaymentGateway
              subscriptionId={subscriptionId}
              amount={Math.round(netPayment * 100)} // Convert to paise
            />
          ) : (
            <Button fullWidth onClick={handleSubmit} variant="contained" disabled={!termsAccepted}>
              Make Secure Payment
            </Button>
          )}

        </Box>
      </Box>
    </Card>
  );
}

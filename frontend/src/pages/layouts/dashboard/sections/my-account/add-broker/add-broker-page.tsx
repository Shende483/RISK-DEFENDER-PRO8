
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Alert,
  Button,
  Select,
  Checkbox,
  Snackbar,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  MenuItem,
  CardContent,
  Divider,
} from "@mui/material";

import PaymentGateway from "../../../../../../payment-gateways/currency-gateway/razorpay-gateway";
import BrokerPlanService from "../../../../../../Services/api-services/plan-info-service/add-broker-plan-service";
import BrokerListService from "../../../../../../Services/api-services/dashboard-services/sections-services/my-account-services/add-broker-service";
import { MARKET_TYPES } from "../../../../common-tyeps/market-and-trading-types";

interface PlanType {
  _id: string;
  name: string;
  price: {
    INR: number;
    USD: number;
    EUR: number;
    GBP: number;
    AED: number;
    SGD: number;
    CAD: number;
    AUD: number;
  };
  duration: string;
  durationInMonths: number;
  description: string;
  features: string[];
  gstRate: number;
  discountPercent: number;
  createdDate: string;
  modifiedDate: string;
  __v: number;
  currency: string;
}

interface StatusMessage {
  text: string;
  type: "success" | "error" | "info" | "warning";
  field?: string;
}

interface BrokerList {
  _id: string;
  name: string;
  brokerName: string;
  brokerAccountName: string;
}

interface BrokerResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: BrokerList[];
}

interface CouponResponse {
  statusCode: number;
  success: boolean;
  discountPercentage: number;
  message: string;
}

interface SubaccountValidationResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export default function AddBrokerPage() {
  const [subAccountName, setSubAccountName] = useState<string>("");
  const [responseMessage, setResponseMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [planId, setPlanId] = useState<string>("");
  const [netPayment, setNetPayment] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [marketType, setMarketType] = useState<string>("");
  const [brokers, setBrokers] = useState<BrokerList[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState<boolean>(false);
  const [isValidatingSubaccount, setIsValidatingSubaccount] = useState<boolean>(false);
  const [isSubaccountValid, setIsSubaccountValid] = useState<boolean | null>(null);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR");

  // Currency symbols
  const currencySymbols: { [key: string]: string } = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SGD: "S$",
    CAD: "C$",
    AUD: "A$",
  };

  // Helper function to calculate expiry date
  const getExpiryDate = (durationInMonths: number): string => {
    const today = new Date();
    const expiryDate = new Date(today.setMonth(today.getMonth() + durationInMonths));
    return expiryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if (name === "subAccountName") {
      setSubAccountName(value as string);
      setIsSubaccountValid(null);
    }
  };

  const handleCurrencyChange = (e: SelectChangeEvent<string>) => {
    setSelectedCurrency(e.target.value);
    const selectedPlan = plans.find((p) => p._id === planId);
    if (selectedPlan) {
      calculateTotalCost(selectedPlan); // Use current couponDiscount
    }
  };

  const handleValidateSubaccount = () => {
    if (!marketType) {
      setResponseMessage({ text: "Please select a market type", type: "error" });
      setShowSnackbar(true);
      return;
    }
    if (!selectedBrokerId) {
      setResponseMessage({ text: "Please select a broker", type: "error" });
      setShowSnackbar(true);
      return;
    }
    if (!subAccountName) {
      setResponseMessage({ text: "Please enter a subaccount name", type: "error", field: "subAccountName" });
      setShowSnackbar(true);
      return;
    }
    validateSubaccountName(marketType, subAccountName, selectedBrokerId);
  };

  const validateSubaccountName = async (marketTypeId: string, subAccountNameParam: string, brokerId: string) => {
    setIsValidatingSubaccount(true);
    try {
      const response: SubaccountValidationResponse = await BrokerListService.validateSubaccountName({
        marketTypeId,
        brokerId,
        subAccountName: subAccountNameParam,
      });
      if (response.statusCode === 200 && response.success) {
        setIsSubaccountValid(true);
        setResponseMessage({
          text: response.message,
          type: "success",
          field: "subAccountName",
        });
        setShowSnackbar(true);
      } else {
        setIsSubaccountValid(false);
        setResponseMessage({
          text: response.message,
          type: "error",
          field: "subAccountName",
        });
        setShowSnackbar(true);
      }
    } catch (error) {
      setIsSubaccountValid(false);
      setResponseMessage({
        text: "Failed validate subaccount name",
        type: "error",
        field: "subAccountName",
      });
      setShowSnackbar(true);
    } finally {
      setIsValidatingSubaccount(false);
    }
  };

  const calculateTotalCost = (selectedPlan: PlanType, couponDiscountOverride?: number) => {
    const months = selectedPlan.durationInMonths;
    let total = selectedPlan.price[selectedCurrency as keyof typeof selectedPlan.price] * months;
    total = Number(total.toFixed(2)); // Round to 2 decimal places
    const discountPercentage = selectedPlan.discountPercent || 0;
    const discountAmount = total * (discountPercentage / 100);
    const totalAfterDiscount = total - Number(discountAmount.toFixed(2)); // Round discount
    const gst = totalAfterDiscount * (selectedPlan.gstRate / 100); // GST for all currencies
    const totalWithGST = totalAfterDiscount + Number(gst.toFixed(2)); // Round GST

    setTotalCost(total);
    setTotalGst(gst);
    setTotalPayment(totalWithGST);
    setDiscountPrice(discountAmount);

    // Use couponDiscountOverride if provided, otherwise use state
    const effectiveCouponDiscount = couponDiscountOverride !== undefined ? couponDiscountOverride : couponDiscount;
    const couponDiscountAmount = effectiveCouponDiscount > 0 ? Math.abs(totalWithGST * (effectiveCouponDiscount / 100)) : 0;
    const couponDiscountRounded = Number(couponDiscountAmount.toFixed(2)); // Round coupon discount
    setNetPayment(totalWithGST - couponDiscountRounded);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const planData = await BrokerPlanService.GetPlan();
        if (planData.statusCode === 200 && planData.success) {
          const mappedPlans: PlanType[] = planData.data.map((p: any) => {
            // Validate price object
            const defaultPrice = { INR: 0, USD: 0, EUR: 0, GBP: 0, AED: 0, SGD: 0, CAD: 0, AUD: 0 };
            const price = typeof p.price === "object" ? { ...defaultPrice, ...p.price } : defaultPrice;
            return {
              ...p,
              _id: p._id,
              price,
              gstRate: p.gstRate ?? 18,
              discountPercent: p.discountPercent ?? 0,
              duration: p.duration ?? "1 month",
              durationInMonths: p.durationInMonths ?? 1,
              createdDate: p.createdDate ?? new Date().toISOString(),
              modifiedDate: p.modifiedDate ?? new Date().toISOString(),
              __v: p.__v ?? 0,
            };
          });
          setPlans(mappedPlans);
          setGstRate(mappedPlans[0]?.gstRate || 18);
        } else {
          setResponseMessage({ text: "Failed to load plans", type: "error" });
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error("Error loading plans:", error);
        setResponseMessage({ text: "Failed to load plans", type: "error" });
        setShowSnackbar(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchBrokers = async () => {
      if (!marketType) {
        setBrokers([]);
        setSelectedBrokerId(null);
        return;
      }

      setIsLoadingBrokers(true);
      try {
        const response: BrokerResponse = await BrokerListService.getBrokerDetails({
          marketTypeId: marketType,
        });
        if (response.statusCode === 200 && response.success) {
          const brokersList = response.data || [];
          setBrokers(Array.isArray(brokersList) ? brokersList : []);
          if (brokersList.length === 0) {
            setResponseMessage({
              text: `No recruiters available for ${marketType}`,
              type: "info",
            });
            setShowSnackbar(true);
          }
        } else {
          setResponseMessage({
            text: response.message || "Failed to fetch recruiters",
            type: "error",
          });
          setShowSnackbar(true);
          setBrokers([]);
        }
      } catch (error) {
        console.error("Error fetching recruiters:", error);
        setResponseMessage({ text: "Failed to fetch recruiters", type: "error" });
        setShowSnackbar(true);
        setBrokers([]);
      } finally {
        setIsLoadingBrokers(false);
      }
    };
    fetchBrokers();
  }, [marketType]);

  const handleMarketTypeChange = (e: SelectChangeEvent<string>) => {
    setMarketType(e.target.value);
    setBrokers([]);
    setSelectedBrokerId(null);
    setSubAccountName("");
    setIsSubaccountValid(null);
  };

  const handleBrokerSelection = (brokerId: string) => {
    setSelectedBrokerId((prev) => (prev === brokerId ? null : brokerId));
    setSubAccountName("");
    setIsSubaccountValid(null);
  };

  const handleCouponVerify = async () => {
    if (!couponCode) {
      setResponseMessage({ text: "Please enter a coupon code", type: "error" });
      setShowSnackbar(true);
      return;
    }

    if (!planId) {
      setResponseMessage({ text: "Please select a plan first", type: "error" });
      setShowSnackbar(true);
      return;
    }

    try {
      const response: CouponResponse = await BrokerPlanService.VerifyCoupon(couponCode);
      const selectedPlan = plans.find((p) => p._id === planId);
      if (!selectedPlan) {
        setResponseMessage({ text: "Please select a plan first", type: "error" });
        setShowSnackbar(true);
        return;
      }
      if (response.statusCode === 200 && response.success) {
        setCouponDiscount(response.discountPercentage);
        setResponseMessage({ text: "Coupon applied successfully", type: "success" });
        calculateTotalCost(selectedPlan, response.discountPercentage);
      } else {
        setCouponDiscount(0);
        setResponseMessage({ text: response.message || "Invalid coupon code", type: "error" });
        calculateTotalCost(selectedPlan, 0);
      }
      setShowSnackbar(true);
    } catch (error) {
      setCouponDiscount(0);
      setResponseMessage({ text: "Failed to verify coupon", type: "error" });
      setShowSnackbar(true);
      const selectedPlan = plans.find((p) => p._id === planId);
      if (selectedPlan) {
        calculateTotalCost(selectedPlan, 0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!planId) {
      setResponseMessage({ text: "Please select a plan", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!marketType) {
      setResponseMessage({ text: "Please select a market type", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!selectedBrokerId) {
      setResponseMessage({ text: "Please select one recruiter", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!subAccountName) {
      setResponseMessage({ text: "Please enter a subaccount name", type: "error", field: "subAccountName" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!isSubaccountValid) {
      setResponseMessage({ text: "Please validate the subaccount name", type: "error", field: "subAccountName" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!termsAccepted) {
      setResponseMessage({ text: "Please accept the terms and conditions", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedPlan = plans.find((p) => p._id === planId);
      if (!selectedPlan) {
        setResponseMessage({ text: "Selected plan not found", type: "error" });
        setShowSnackbar(true);
        setIsSubmitting(false);
        return;
      }

      setIsFormValid(true);
    } catch (error) {
      setResponseMessage({ text: "An error occurred", type: "error" });
      setShowSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  const handleSelect = (selectedPlan: PlanType) => {
    setPlanId(selectedPlan._id);
    setPlanPrice(selectedPlan.price[selectedCurrency as keyof typeof selectedPlan.price]);
    setGstRate(selectedPlan.gstRate);
    setSubAccountName("");
    setCouponDiscount(0);
    setMarketType("");
    setBrokers([]);
    setSelectedBrokerId(null);
    setIsSubaccountValid(null);
    setIsFormValid(false);
    calculateTotalCost(selectedPlan);
  };

  return (
    <Card sx={{ py: 3, my: 3, width: "100%", mx: "auto", boxShadow: 3, borderRadius: 3 }}>
      <Box sx={{ mx: 3, mb: 3, display: "flex", gap: 3, flexDirection: "column" }}>
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
            sx={{ width: "100%" }}
          >
            {responseMessage?.text}
          </Alert>
        </Snackbar>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Payment Currency
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Pay with Currency</InputLabel>
                  <Select
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                  >
                    {Object.keys(currencySymbols).map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency} ({currencySymbols[currency]})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Pay with Crypto
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (Coming Soon: BTC, ETH, USDT, and more)
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Select Your Plan
            </Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {plans.map((plan) => {
                const months = plan.durationInMonths;
                const actualPrice = plan.price[selectedCurrency as keyof typeof plan.price] * months;
                const discountPercentage = plan.discountPercent || 0;
                const offerPrice = actualPrice * (1 - discountPercentage / 100);

                return (
                  <Box
                    key={plan._id}
                    sx={{
                      bgcolor: planId === plan._id ? "lightsalmon" : "lightblue",
                      borderRadius: 1,
                      p: 2,
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.02)" },
                      position: "relative",
                    }}
                    onClick={() => handleSelect(plan)}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-17px",
                        left: "70%",
                        transform: "translateX(-50%)",
                        bgcolor: "green",
                        color: "white",
                        borderRadius: "12px",
                        px: 2,
                        py: 0.5,
                        boxShadow: 1,
                        zIndex: 1,
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        {discountPercentage}% OFF
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      color={planId === plan._id ? "salmon" : "#00b0ff"}
                      textAlign="center"
                      fontWeight={600}
                      mb={1}
                    >
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {plan.description}
                    </Typography>
                    <Typography variant="body1" sx={{ textDecoration: "line-through" }} mb={1}>
                      Actual Price: {currencySymbols[selectedCurrency]}{actualPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} mb={1}>
                      Offer Price: {currencySymbols[selectedCurrency]}{offerPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {selectedCurrency} + GST
                    </Typography>
                    {plan.features.map((feature, index) => (
                      <Typography key={index} variant="body2" color="text.primary">
                        • {feature}
                      </Typography>
                    ))}
                    <Typography variant="body1" color="red" mt={2}>
                      Expires on: {getExpiryDate(plan.durationInMonths)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Pricing Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" gap={1}>
                  <TextField
                    label="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    variant="outlined"
                    fullWidth
                    placeholder="e.g., SAVE10"
                  />
                  <Button
                    variant="contained"
                    onClick={handleCouponVerify}
                    disabled={!planId}
                    sx={{ minWidth: 100 }}
                  >
                    Apply
                  </Button>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">Actual Cost: {currencySymbols[selectedCurrency]}{totalCost.toFixed(2)}</Typography>
              <Typography variant="body1">Plan Discount: - {currencySymbols[selectedCurrency]}{discountPrice.toFixed(2)}</Typography>
              <Typography variant="body1">GST ({gstRate}%): {currencySymbols[selectedCurrency]}{totalGst.toFixed(2)}</Typography>
              <Typography variant="body1">
                Coupon Discount: - {currencySymbols[selectedCurrency]}{(totalPayment * (couponDiscount / 100)).toFixed(2)}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                Net Payment: {currencySymbols[selectedCurrency]}{netPayment.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Recruiter Setup
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Market Type</InputLabel>
                  <Select value={marketType} onChange={handleMarketTypeChange}>
                    <MenuItem value="">Select Market Type</MenuItem>
                    {MARKET_TYPES.map((type) => (
                      <MenuItem key={type.shortName} value={type.shortName}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" mb={1}>
                Select Recruiter ({selectedBrokerId ? 1 : 0}/1):
              </Typography>
              {isLoadingBrokers ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : brokers.length > 0 ? (
                <List
                  sx={{
                    maxHeight: 200,
                    overflowY: "auto",
                    mt: 1,
                    p: 1,
                    bgcolor: "",
                    borderRadius: 1,
                  }}
                >
                  {brokers.map((broker) => (
                    <ListItem
                      key={broker._id}
                      dense
                      onClick={() => handleBrokerSelection(broker._id)}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "" } }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedBrokerId === broker._id}
                          disabled={!!selectedBrokerId && selectedBrokerId !== broker._id}
                        />
                      </ListItemIcon>
                      <ListItemText primary={broker.name} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {marketType ? `No recruiters available for ${marketType}.` : "Select a market type to view recruiters."}
                </Typography>
              )}
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" gap={1}>
                  <TextField
                    label="Subaccount Name"
                    name="subAccountName"
                    value={subAccountName}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    required
                    disabled={!selectedBrokerId}
                    error={responseMessage?.field === "subAccountName" && responseMessage?.type === "error"}
                    helperText={
                      responseMessage?.field === "subAccountName" ? responseMessage.text : ""
                    }
                    InputProps={{
                      endAdornment: isValidatingSubaccount ? <CircularProgress size={20} /> : null,
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleValidateSubaccount}
                    disabled={!selectedBrokerId || !subAccountName}
                    sx={{ minWidth: 100 }}
                  >
                    Validate Subaccount Name
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
            >
              <Box display="flex" alignItems="center">
                <Checkbox checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} />
                <Typography variant="body2">
                  I agree to the <a href="#">Terms and Conditions</a>
                </Typography>
              </Box>

              {isFormValid ? (
                <PaymentGateway
                  planId={planId}
                  paymentType="createBroker"
                  data={{
                    marketTypeId: marketType,
                    brokerId: selectedBrokerId || "",
                    subAccountName: subAccountName,
                  }}
                  couponCode={couponCode}
                  amount={Math.round(netPayment * 100)} // Razorpay expects amount in smallest unit (cents/paise)
                  currency={selectedCurrency}
                />
              ) : (
                <Button
                  fullWidth
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || isFormValid}
                  sx={{ maxWidth: { sm: 300 }, display: "flex", alignItems: "center", gap: 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" />
                      Processing...
                    </>
                  ) : (
                    "Make Secure Payment"
                  )}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Card>
  );
}

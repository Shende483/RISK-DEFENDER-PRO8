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
  Divider,
} from "@mui/material";
import PaymentGateway from "../../../../../../payment-gateways/currency-gateway/razorpay-gateway";
import BrokerPlanService from "../../../../../../Services/api-services/plan-info-service/add-broker-plan-service";
import BrokerExpireListService from "../../../../../../Services/api-services/dashboard-services/sections-services/my-account-services/renew-broker-accounts.service";

interface PlanType {
  _id: string;
  name: string;
  price: { INR: number; USD: number; EUR: number; GBP: number; AED: number; SGD: number; CAD: number; AUD: number };
  duration: string;
  durationInMonths: number;
  description: string;
  features: string[];
  gstRate: number;
  discountPercent: number;
  createdDate: string;
  modifiedDate: string;
  __v: number;
}

interface StatusMessage {
  text: string;
  type: "success" | "error" | "info" | "warning";
}

interface ExpiredBrokerAccount {
  _id: string;
  subAccountName: string;
  brokerName: string;
  marketTypeId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface BrokerResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: ExpiredBrokerAccount[];
}

interface CouponResponse {
  statusCode: number;
  success: boolean;
  discountPercentage: number;
  message: string;
}

export default function RenewBrokerPlanPage() {
  const [expiredAccounts, setExpiredAccounts] = useState<ExpiredBrokerAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [netPayment, setNetPayment] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

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

  // Fetch expired accounts
  useEffect(() => {
    const fetchExpiredAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response: BrokerResponse = await BrokerExpireListService.getExpiredBrokerAccounts();
        if (response.statusCode === 200 && response.success) {
          setExpiredAccounts(Array.isArray(response.data) ? response.data : []);
          if (response.data.length === 0) {
            setResponseMessage({ text: "No expired accounts found", type: "info" });
            setShowSnackbar(true);
          }
        } else {
          setResponseMessage({ text: response.message || "Failed to fetch expired accounts", type: "error" });
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error("Error fetching expired accounts:", error);
        setResponseMessage({ text: "Failed to fetch expired accounts", type: "error" });
        setShowSnackbar(true);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchExpiredAccounts();
  }, []);

  // Fetch plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const planData = await BrokerPlanService.GetPlan();
        if (planData.statusCode === 200 && planData.success) {
          const mappedPlans: PlanType[] = planData.data.map((p: any) => ({
            ...p,
            _id: p._id,
            gstRate: p.gstRate ?? 18,
            discountPercent: p.discountPercent ?? 0,
            duration: p.duration ?? "1 month",
            durationInMonths: p.durationInMonths ?? 1,
            createdDate: p.createdDate ?? new Date().toISOString(),
            modifiedDate: p.modifiedDate ?? new Date().toISOString(),
            __v: p.__v ?? 0,
          }));
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
    loadPlans();
  }, []);

  // Calculate total cost
  const calculateTotalCost = (selectedPlan: PlanType, couponDiscountOverride?: number) => {
    const months = selectedPlan.durationInMonths;
    let total = selectedPlan.price.INR * months;
    total = Number(total.toFixed(2));
    const discountPercentage = selectedPlan.discountPercent || 0;
    const discountAmount = total * (discountPercentage / 100);
    const totalAfterDiscount = total - Number(discountAmount.toFixed(2));
    const gst = totalAfterDiscount * (selectedPlan.gstRate / 100);
    const totalWithGST = totalAfterDiscount + Number(gst.toFixed(2));

    setTotalCost(total);
    setTotalGst(gst);
    setTotalPayment(totalWithGST);
    setDiscountPrice(discountAmount);

    const effectiveCouponDiscount = couponDiscountOverride !== undefined ? couponDiscountOverride : couponDiscount;
    const couponDiscountAmount = effectiveCouponDiscount > 0 ? Math.abs(totalWithGST * (effectiveCouponDiscount / 100)) : 0;
    const couponDiscountRounded = Number(couponDiscountAmount.toFixed(2));
    setNetPayment(totalWithGST - couponDiscountRounded);
  };

  // Handle plan selection
  const handleSelect = (selectedPlan: PlanType) => {
    setPlanId(selectedPlan._id);
    setGstRate(selectedPlan.gstRate);
    setCouponDiscount(0);
    setIsFormValid(false);
    calculateTotalCost(selectedPlan);
  };

  // Handle account selection
  const handleAccountSelection = (accountId: string) => {
    setSelectedAccountId((prev) => (prev === accountId ? null : accountId));
  };

  // Handle coupon verification
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!selectedAccountId) {
      setResponseMessage({ text: "Please select an expired account", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!planId) {
      setResponseMessage({ text: "Please select a plan", type: "error" });
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
              Expired Accounts (Total: {expiredAccounts.length})
            </Typography>
            {isLoadingAccounts ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : expiredAccounts.length > 0 ? (
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
                {expiredAccounts.map((account) => (
                  <ListItem
                    key={account._id}
                    dense
                    onClick={() => handleAccountSelection(account._id)}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "" } }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedAccountId === account._id}
                        disabled={!!selectedAccountId && selectedAccountId !== account._id}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={account.subAccountName}
                      secondary={
                        <>
                          <strong>Broker:</strong> {account.brokerName} |{" "}
                          <strong>Market:</strong> {account.marketTypeId} |{" "}
                          <strong>Start:</strong>{" "}
                          {new Date(account.startDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })} |{" "}
                          <strong>Expired:</strong>{" "}
                          {new Date(account.endDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })} |{" "}
                          <strong>Status:</strong> {account.status}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No expired accounts available.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Select Renewal Plan
            </Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {plans.map((plan) => {
                const months = plan.durationInMonths;
                const actualPrice = plan.price.INR * months;
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
                      Actual Price: ₹{actualPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} mb={1}>
                      Offer Price: ₹{offerPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      INR + GST
                    </Typography>
                    {plan.features.map((feature, index) => (
                      <Typography key={index} variant="body2" color="text.primary">
                        • {feature}
                      </Typography>
                    ))}
                    <Typography variant="body1" color="red" mt={2}>
                      New Expiry: {getExpiryDate(plan.durationInMonths)}
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
              <Typography variant="body1">Actual Cost: ₹{totalCost.toFixed(2)}</Typography>
              <Typography variant="body1">Plan Discount: - ₹{discountPrice.toFixed(2)}</Typography>
              <Typography variant="body1">GST ({gstRate}%): ₹{totalGst.toFixed(2)}</Typography>
              <Typography variant="body1">
                Coupon Discount: - ₹{(totalPayment * (couponDiscount / 100)).toFixed(2)}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                Net Payment: ₹{netPayment.toFixed(2)}
              </Typography>
            </Box>
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
                  couponCode={couponCode}
                  amount={Math.round(netPayment * 100)} // Convert to paisa
                  currency="INR"
                  paymentType="renewBroker"
                  data={{ brokerRenewId: selectedAccountId || "" }}
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
                    "Renew Plan"
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
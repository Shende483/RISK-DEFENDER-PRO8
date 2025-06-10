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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import BrokerListService from "../../../../../../Services/api-services/dashboard-services/sections-services/my-account-services/add-broker-service";


interface ActiveBrokerAccount {
  _id: string;
  subAccountName: string;
  brokerName: string;
  marketTypeId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface PendingDeleteRequest {
  _id: string;
  accountId: string;
  subAccountName: string;
  brokerName: string;
  marketTypeId: string;
  requestedAt: string;
  status: string;
}

interface StatusMessage {
  text: string;
  type: "success" | "error" | "info" | "warning";
}

interface BrokerResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: ActiveBrokerAccount[];
}

interface PendingDeleteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: PendingDeleteRequest[];
}

interface OtpResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export default function DeleteBrokerAccountPage() {
  const [activeAccounts, setActiveAccounts] = useState<ActiveBrokerAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState<PendingDeleteRequest[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [openOtpDialog, setOpenOtpDialog] = useState<boolean>(false);
  const [emailOtp, setEmailOtp] = useState<string>("");
  const [mobileOtp, setMobileOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);

  // Fetch active accounts
  useEffect(() => {
    const fetchActiveAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response: BrokerResponse = await BrokerListService.getActiveBrokerAccounts();
        if (response.statusCode === 200 && response.success) {
          setActiveAccounts(Array.isArray(response.data) ? response.data : []);
          if (response.data.length === 0) {
            setResponseMessage({ text: "No active accounts found", type: "info" });
            setShowSnackbar(true);
          }
        } else {
          setResponseMessage({ text: response.message || "Failed to fetch active accounts", type: "error" });
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error("Error fetching active accounts:", error);
        setResponseMessage({ text: "Failed to fetch active accounts", type: "error" });
        setShowSnackbar(true);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchActiveAccounts();
  }, []);

  // Fetch pending delete requests
  useEffect(() => {
    const fetchPendingDeleteRequests = async () => {
      setIsLoadingPending(true);
      try {
        const response: PendingDeleteResponse = await BrokerListService.getPendingDeleteRequests();
        if (response.statusCode === 200 && response.success) {
          setPendingDeleteRequests(Array.isArray(response.data) ? response.data : []);
          if (response.data.length === 0) {
            setResponseMessage({ text: "No pending delete requests", type: "info" });
            setShowSnackbar(true);
          }
        } else {
          setResponseMessage({ text: response.message || "Failed to fetch pending delete requests", type: "error" });
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error("Error fetching pending delete requests:", error);
        setResponseMessage({ text: "Failed to fetch pending delete requests", type: "error" });
        setShowSnackbar(true);
      } finally {
        setIsLoadingPending(false);
      }
    };
    fetchPendingDeleteRequests();
  }, []);

  // Handle account selection
  const handleAccountSelection = (accountId: string) => {
    setSelectedAccountId((prev) => (prev === accountId ? null : accountId));
  };

  // Handle delete request initiation
  const handleRequestDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!selectedAccountId) {
      setResponseMessage({ text: "Please select an account to delete", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    if (!termsAccepted) {
      setResponseMessage({ text: "Please accept the deletion terms and conditions", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    try {
      setOpenOtpDialog(true);
    } catch (error) {
      setResponseMessage({ text: "An error occurred", type: "error" });
      setShowSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP sending
  const handleSendOtp = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response: OtpResponse = await BrokerListService.requestDeleteAccount(selectedAccountId!);
      if (response.statusCode === 200 && response.success) {
        setOtpSent(true);
        setResponseMessage({ text: "OTP sent to your email and mobile", type: "success" });
        setShowSnackbar(true);
      } else {
        setResponseMessage({ text: response.message || "Failed to send OTP", type: "error" });
        setShowSnackbar(true);
        setOpenOtpDialog(false);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setResponseMessage({ text: "Failed to send OTP", type: "error" });
      setShowSnackbar(true);
      setOpenOtpDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification and deletion
  const handleVerifyOtp = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!emailOtp || !mobileOtp) {
      setResponseMessage({ text: "Please enter both OTPs", type: "error" });
      setShowSnackbar(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response: OtpResponse = await BrokerListService.verifyDeleteOtp(selectedAccountId!, emailOtp, mobileOtp);
      if (response.statusCode === 200 && response.success) {
        setResponseMessage({ text: "Deletion request submitted successfully. Account will be deleted in 5 days.", type: "success" });
        setShowSnackbar(true);
        setOpenOtpDialog(false);
        setEmailOtp("");
        setMobileOtp("");
        setOtpSent(false);
        setSelectedAccountId(null);
        setTermsAccepted(false);
        // Refresh pending delete requests
        const pendingResponse = await BrokerListService.getPendingDeleteRequests();
        if (pendingResponse.statusCode === 200 && pendingResponse.success) {
          setPendingDeleteRequests(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);
        }
        // Refresh active accounts
        const accountsResponse = await BrokerListService.getActiveBrokerAccounts();
        if (accountsResponse.statusCode === 200 && accountsResponse.success) {
          setActiveAccounts(Array.isArray(accountsResponse.data) ? accountsResponse.data : []);
        }
      } else {
        setResponseMessage({ text: response.message || "Invalid OTPs", type: "error" });
        setShowSnackbar(true);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setResponseMessage({ text: "Failed to verify OTP", type: "error" });
      setShowSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel delete request
  const handleCancelDeleteRequest = async (requestId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response: OtpResponse = await BrokerListService.cancelDeleteRequest(requestId);
      if (response.statusCode === 200 && response.success) {
        setResponseMessage({ text: "Deletion request canceled successfully", type: "success" });
        setShowSnackbar(true);
        // Refresh pending delete requests
        const pendingResponse = await BrokerListService.getPendingDeleteRequests();
        if (pendingResponse.statusCode === 200 && pendingResponse.success) {
          setPendingDeleteRequests(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);
        }
        // Refresh active accounts
        const accountsResponse = await BrokerListService.getActiveBrokerAccounts();
        if (accountsResponse.statusCode === 200 && accountsResponse.success) {
          setActiveAccounts(Array.isArray(accountsResponse.data) ? accountsResponse.data : []);
        }
      } else {
        setResponseMessage({ text: response.message || "Failed to cancel deletion request", type: "error" });
        setShowSnackbar(true);
      }
    } catch (error) {
      console.error("Error canceling deletion request:", error);
      setResponseMessage({ text: "Failed to cancel deletion request", type: "error" });
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
              Active Accounts (Total: {activeAccounts.length})
            </Typography>
            {isLoadingAccounts ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : activeAccounts.length > 0 ? (
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
                {activeAccounts.map((account) => (
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
                          <strong>End:</strong>{" "}
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
                No active accounts available.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Pending Deletion Requests (Total: {pendingDeleteRequests.length})
            </Typography>
            {isLoadingPending ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : pendingDeleteRequests.length > 0 ? (
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
                {pendingDeleteRequests.map((request) => (
                  <ListItem
                    key={request._id}
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <ListItemText
                      primary={request.subAccountName}
                      secondary={
                        <>
                          <strong>Broker:</strong> {request.brokerName} |{" "}
                          <strong>Market:</strong> {request.marketTypeId} |{" "}
                          <strong>Requested:</strong>{" "}
                          {new Date(request.requestedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })} |{" "}
                          <strong>Status:</strong> {request.status}
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleCancelDeleteRequest(request._id)}
                      disabled={isSubmitting}
                    >
                      Cancel Delete
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No pending deletion requests.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} mb={2}>
              Deletion Terms
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary" mb={1}>
                By requesting deletion, you acknowledge:
              </Typography>
              <Typography variant="body2" color="text.primary">
                • Account will be deleted 5 days after the request.
              </Typography>
              <Typography variant="body2" color="text.primary">
                • No new broker accounts can be created for the same market type during this period.
              </Typography>
              <Typography variant="body2" color="text.primary">
                • No new orders, stop-loss, or target modifications are allowed during this period.
              </Typography>
              <Typography variant="body2" color="text.primary">
                • Accounts with open positions cannot be deleted. You are responsible for any profit or loss.
              </Typography>
              <Typography variant="body2" color="text.primary">
                • You can cancel the deletion request within 5 days.
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
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
                  I agree to the <a href="#">Deletion Terms and Conditions</a>
                </Typography>
              </Box>
              <Button
                fullWidth
                onClick={handleRequestDelete}
                variant="contained"
                color="primary"
                disabled={isSubmitting || !selectedAccountId}
                sx={{ maxWidth: { sm: 300 }, display: "flex", alignItems: "center", gap: 1 }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={20} color="inherit" />
                    Processing...
                  </>
                ) : (
                  "Request Delete"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Dialog open={openOtpDialog} onClose={() => setOpenOtpDialog(false)}>
          <DialogTitle>Verify Deletion Request</DialogTitle>
          <DialogContent>
            {!otpSent ? (
              <Typography variant="body1">
                Click "Send OTP" to receive verification codes on your email and mobile.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <TextField
                  label="Email OTP"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  variant="outlined"
                  fullWidth
                />
                <TextField
                  label="Mobile OTP"
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value)}
                  variant="outlined"
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOtpDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                Send OTP
              </Button>
            ) : (
              <Button
                onClick={handleVerifyOtp}
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                Verify OTP
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Card>
  );
}
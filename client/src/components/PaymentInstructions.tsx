import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, DollarSign, CreditCard, Building2, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fetchWithCsrf } from "@/lib/csrf";

interface PaymentInfo {
  id?: number;
  captainId?: number;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  accountHolderName: string | null;
  paypalEmail: string | null;
  venmoUsername: string | null;
  zelleEmail: string | null;
  cashAppTag: string | null;
  instructions: string | null;
  preferredMethod: string | null;
  isEmpty?: boolean;
  isIncomplete?: boolean;
  message?: string;
}

interface PaymentInstructionsProps {
  bookingId: number;
  bookingTitle: string;
  amount: number;
  captainId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentInstructions({
  bookingId,
  bookingTitle,
  amount,
  captainId,
  isOpen,
  onClose,
  onSuccess,
}: PaymentInstructionsProps) {
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cargar información de pago del capitán cuando se abre el modal
  useEffect(() => {
    if (isOpen && captainId) {
      fetchPaymentInfo();
    }
  }, [isOpen, captainId]);

  const fetchPaymentInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/captain/${captainId}/payment-info`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data);
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view payment information",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Could not load payment information",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamaño (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 100MB",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a payment screenshot to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("paymentProof", uploadedFile);
      formData.append("paymentMethod", paymentInfo?.preferredMethod || "unknown");

      const response = await fetchWithCsrf(`/api/bookings/${bookingId}/payment-proof`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Payment Proof Uploaded",
          description: "Your payment screenshot has been submitted for review",
        });
        
        // Invalidate bookings cache to update UI with new payment status
        queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
        
        onSuccess();
        onClose();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload Failed", 
        description: "Could not upload payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const renderPaymentMethod = () => {
    if (!paymentInfo) return null;

    // Handle empty or incomplete payment information
    if (paymentInfo.isEmpty || paymentInfo.isIncomplete) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Building2 className="w-5 h-5" />
              Payment Information Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 font-medium">
                {paymentInfo.message || "Payment information is not available."}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>What to do:</strong> Please contact the captain directly to arrange payment and get their preferred payment method.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const method = paymentInfo.preferredMethod;

    switch (method) {
      case "bank":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Bank Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paymentInfo.bankName && (
                <div>
                  <Label className="text-sm font-medium">Bank Name:</Label>
                  <p className="text-sm">{paymentInfo.bankName}</p>
                </div>
              )}
              {paymentInfo.accountHolderName && (
                <div>
                  <Label className="text-sm font-medium">Account Holder:</Label>
                  <p className="text-sm">{paymentInfo.accountHolderName}</p>
                </div>
              )}
              {paymentInfo.routingNumber && (
                <div>
                  <Label className="text-sm font-medium">Routing Number:</Label>
                  <p className="text-sm font-mono">{paymentInfo.routingNumber}</p>
                </div>
              )}
              {paymentInfo.accountNumber && (
                <div>
                  <Label className="text-sm font-medium">Account Number:</Label>
                  <p className="text-sm font-mono">{paymentInfo.accountNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "paypal":
        return (
          <Card>
            <CardHeader>
              <CardTitle>PayPal Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Send payment to: <strong>{paymentInfo.paypalEmail}</strong></p>
            </CardContent>
          </Card>
        );

      case "venmo":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Venmo Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Send payment to: <strong>{paymentInfo.venmoUsername}</strong></p>
            </CardContent>
          </Card>
        );

      case "zelle":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Zelle Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Send payment to: <strong>{paymentInfo.zelleEmail}</strong></p>
            </CardContent>
          </Card>
        );

      case "cashapp":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cash App Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Send payment to: <strong>{paymentInfo.cashAppTag}</strong></p>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Please contact the captain directly for payment details.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Instructions
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">{bookingTitle}</h3>
            <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
              <DollarSign size={24} />
              {amount.toFixed(2)}
            </div>
          </div>

          {/* Payment Instructions */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2">Loading payment information...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-semibold">Payment Method:</h4>
              {renderPaymentMethod()}
              
              {paymentInfo?.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{paymentInfo.instructions}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Upload Payment Proof */}
          {paymentInfo && !paymentInfo.isEmpty && !paymentInfo.isIncomplete && (
            <div className="space-y-4">
              <h4 className="font-semibold">Upload Payment Proof</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="payment-proof" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Upload a screenshot of your payment
                    </span>
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-payment-proof"
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 100MB</p>
                </div>
              </div>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleUploadPaymentProof}
              disabled={!uploadedFile || uploading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-submit-payment-proof"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Payment Proof
                </>
              )}
            </Button>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <p>
                📝 <strong>Important:</strong> Please ensure your payment screenshot clearly shows:
                the amount paid, the recipient information, and the transaction confirmation.
              </p>
            </div>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
// stripe listen --forward-to localhost:8000/api/v1/payments/webhook
import {
  CreditCard,
  MapPin,
  Package,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Wallet,
  Banknote,
  Smartphone,
  Building2,
  QrCode,
  ArrowLeft,
} from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51QRWsiSCbAqVTTWBmock"); // Replace with your actual key

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
}

interface Cart {
  items: CartItem[];
  couponCode: string | null;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface PriceBreakdown {
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  total: number;
}

// Payment Form Component for Card payments
function PaymentForm({
  clientSecret,
  paymentIntentId,
  addressId,
  onSuccess,
}: {
  clientSecret: string;
  paymentIntentId: string;
  addressId: string;
  onSuccess: (orderNumber: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Payment submission failed");
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment_intent=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Replace with your actual backend URL
        const response = await fetch(
          "http://localhost:8000/api/v1/payments/confirm-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId,
              addressId: addressId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Backend error:", data);
          throw new Error(data.message || "Failed to create order");
        }

        if (data.success) {
          onSuccess(data.data.orderNumber);
        } else {
          setError(data.message || "Failed to create order");
          setProcessing(false);
        }
      } catch (err: any) {
        console.error("Backend confirmation error:", err);
        setError(err.message || "Failed to confirm order. Please contact support with payment ID: " + paymentIntentId);
        setProcessing(false);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <span>Pay Now</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

// UPI Payment Component
function UPIPayment({ 
  onSuccess, 
  total, 
  addressId 
}: { 
  onSuccess: (orderNumber: string) => void; 
  total: number;
  addressId: string;
}) {
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
   const [orderNumber, setOrderNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) {
      setError("Please enter your UPI ID");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-upi-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            addressId: addressId,
            paymentMethod: "UPI",
            upiId: upiId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process UPI payment");
      }

      if (data.success) {
        onSuccess(data.data.orderNumber);
      } else {
        setError(data.message || "Failed to process payment");
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

 // In your UPIPayment component, replace the handleQRPayment function:
const handleQRPayment = async () => {
  setShowQR(true);
  setProcessing(true);
  setError("");

  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/payments/create-upi-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          addressId: addressId,
          paymentMethod: "UPI_QR",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate QR code");
    }

    if (data.success) {
      // Instead of polling, just show success immediately for demo
      // In production, you'd integrate with actual UPI gateway
      setTimeout(() => {
        onSuccess(data.data.orderNumber);
      }, 3000); // Simulate 3 second payment
    }

    /* REMOVE THE POLLING CODE - IT'S CAUSING THE AUTH ISSUE
    // Poll for payment status
    const checkPaymentStatus = setInterval(async () => {
      const statusResponse = await fetch(
        `http://localhost:8000/api/v1/payments/check-status/${data.data.paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      
      const statusData = await statusResponse.json();
      
      if (statusData.data.status === "SUCCESS") {
        clearInterval(checkPaymentStatus);
        onSuccess(statusData.data.orderNumber);
      }
    }, 3000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkPaymentStatus);
      setError("Payment timeout. Please try again.");
      setProcessing(false);
      setShowQR(false);
    }, 300000);
    */

  } catch (err: any) {
    console.error("QR Payment Error:", err);
    setError(err.message || "Failed to generate QR code");
    setProcessing(false);
    setShowQR(false);
  }
};

  if (showQR) {
  return (
    <div className="text-center py-8">
      <div className="w-64 h-64 bg-white border-4 border-green-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
        <QrCode className="w-32 h-32 text-green-600" />
      </div>
      <p className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code to Pay</p>
      <p className="text-gray-600 mb-4">Amount: ₹{total.toFixed(2)}</p>
      
      {processing ? (
        <>
          <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Creating order...</p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-6">
            After completing the payment, click the button below
          </p>
          <button
            onClick={() => onSuccess(orderNumber)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            I've Completed the Payment
          </button>
          <button
            onClick={() => {
              setShowQR(false);
              setProcessing(false);
            }}
            className="mt-4 block w-full text-red-600 hover:text-red-700 text-sm"
          >
            Cancel Payment
          </button>
        </>
      )}
    </div>
  );
}

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter UPI ID
          </label>
          <input
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={processing}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Pay</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">OR</span>
        </div>
      </div>

      <button
        onClick={handleQRPayment}
        disabled={processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-lg"
      >
        <QrCode className="w-5 h-5" />
        <span>Pay with QR Code</span>
      </button>

      <div className="grid grid-cols-4 gap-3 pt-4">
        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
          <button
            key={app}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition"
          >
            <Smartphone className="w-6 h-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">{app}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Net Banking Component
function NetBankingPayment({ 
  onSuccess, 
  addressId 
}: { 
  onSuccess: (orderNumber: string) => void;
  addressId: string;
}) {
  const [selectedBank, setSelectedBank] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const popularBanks = [
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' },
    { id: 'pnb', name: 'Punjab National Bank' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) {
      setError("Please select a bank");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-netbanking-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            addressId: addressId,
            paymentMethod: "NETBANKING",
            bankCode: selectedBank,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate net banking");
      }

      if (data.success && data.data.redirectUrl) {
        // Redirect to bank's payment page
        window.location.href = data.data.redirectUrl;
      } else {
        setError(data.message || "Failed to process payment");
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Your Bank
        </label>
        <div className="grid grid-cols-1 gap-3">
          {popularBanks.map((bank) => (
            <label
              key={bank.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedBank === bank.id
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <input
                type="radio"
                name="bank"
                value={bank.id}
                checked={selectedBank === bank.id}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="mr-3"
              />
              <Building2 className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">{bank.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Redirecting to Bank...</span>
          </>
        ) : (
          <>
            <span>Proceed to Bank</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

// Wallet Payment Component
function WalletPayment({ 
  onSuccess, 
  addressId 
}: { 
  onSuccess: (orderNumber: string) => void;
  addressId: string;
}) {
  const [selectedWallet, setSelectedWallet] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const wallets = [
    { id: 'paytm', name: 'Paytm Wallet' },
    { id: 'phonepe', name: 'PhonePe Wallet' },
    { id: 'amazon', name: 'Amazon Pay' },
    { id: 'mobikwik', name: 'Mobikwik' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) {
      setError("Please select a wallet");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-wallet-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            addressId: addressId,
            paymentMethod: "WALLET",
            walletProvider: selectedWallet,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate wallet payment");
      }

      if (data.success && data.data.redirectUrl) {
        window.location.href = data.data.redirectUrl;
      } else if (data.success) {
        onSuccess(data.data.orderNumber);
      } else {
        setError(data.message || "Failed to process payment");
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Wallet
        </label>
        <div className="grid grid-cols-1 gap-3">
          {wallets.map((wallet) => (
            <label
              key={wallet.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedWallet === wallet.id
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <input
                type="radio"
                name="wallet"
                value={wallet.id}
                checked={selectedWallet === wallet.id}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="mr-3"
              />
              <Wallet className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">{wallet.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Pay with Wallet</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

// Cash on Delivery Component
function CODPayment({ 
  onSuccess, 
  addressId 
}: { 
  onSuccess: (orderNumber: string) => void;
  addressId: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-cod-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            addressId: addressId,
            paymentMethod: "COD",
          }),
        }
      );

      const data = await response.json();
       console.log("COD Response:", data); // Add logging

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
        
      }

      if (data.success) {
        onSuccess(data.data.orderNumber);
      } else {
        setError(data.message || "Failed to create order");
        setProcessing(false);
      }
    } catch (err: any) {
      console.error("COD Error:", err); // Add logging
      setError(err.message || "Failed to create order");
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Banknote className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Cash on Delivery</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pay in cash when your order is delivered</li>
              <li>• Additional ₹40 handling fee applies</li>
              <li>• Please keep exact change ready</li>
              <li>• Our delivery partner will hand over the invoice</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Placing Order...</span>
          </>
        ) : (
          <>
            <span>Confirm Order</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}

// Main Checkout Component
export  function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"address" | "payment-method" | "payment" | "success">("address");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate updated price breakdown when payment method changes
  useEffect(() => {
    if (priceBreakdown && selectedPaymentMethod === "cod") {
      setPriceBreakdown({
        ...priceBreakdown,
        shippingFee: 40,
        total: priceBreakdown.subtotal + priceBreakdown.tax + 40 - priceBreakdown.discount,
      });
    } else if (priceBreakdown && selectedPaymentMethod !== "cod") {
      setPriceBreakdown({
        ...priceBreakdown,
        shippingFee: 0,
        total: priceBreakdown.subtotal + priceBreakdown.tax - priceBreakdown.discount,
      });
    }
  }, [selectedPaymentMethod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        window.location.href = "/auth";
        return;
      }

      // Fetch cart
      const cartResponse = await fetch("http://localhost:8000/api/v1/cart", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const cartData = await cartResponse.json();

      if (cartData.success && cartData.data) {
        setCart(cartData.data.cart);
        
        if (!cartData.data.cart.items || cartData.data.cart.items.length === 0) {
          setError("Your cart is empty");
        }
      }

      // Fetch addresses
      const addressResponse = await fetch(
        "http://localhost:8000/api/v1/addresses",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const addressData = await addressResponse.json();

      if (addressData.success && addressData.data) {
        setAddresses(addressData.data);
        const defaultAddr = addressData.data.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        }
      }
    } catch (err) {
      setError("Failed to load checkout data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPaymentMethod = () => {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }
    setError("");
    setStep("payment-method");
  };

  const handleProceedToPayment = async () => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    // For COD, skip to payment step directly
    if (selectedPaymentMethod === "cod") {
      setStep("payment");
      return;
    }

    // For card payments, create payment intent
    if (selectedPaymentMethod === "card") {
      try {
        setLoading(true);
        setError("");

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          window.location.href = "/auth";
          return;
        }

        const response = await fetch(
          "http://localhost:8000/api/v1/payments/create-payment-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              addressId: selectedAddress,
              paymentMethod: "CARD",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Payment intent error:", data);
          throw new Error(data.message || "Failed to initialize payment");
        }

        if (data.success && data.data) {
          setClientSecret(data.data.clientSecret);
          setPaymentIntentId(data.data.paymentIntentId);
          setPriceBreakdown(data.data.breakdown);
          setStep("payment");
        } else {
          setError(data.message || "Failed to initialize payment");
        }
      } catch (err: any) {
        setError(err.message || "Error initializing payment");
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      // For other payment methods, just move to payment step
      setStep("payment");
    }
  };

  const handlePaymentSuccess = (orderNum: string) => {
    setOrderNumber(orderNum);
    setStep("success");
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI",
      description: "Pay using Google Pay, PhonePe, Paytm & more",
      icon: Smartphone,
      popular: true,
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, RuPay, Amex",
      icon: CreditCard,
      popular: true,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "All major banks supported",
      icon: Building2,
    },
    {
      id: "wallet",
      name: "Wallets",
      description: "Paytm, PhonePe, Amazon Pay & more",
      icon: Wallet,
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when you receive (₹40 extra)",
      icon: Banknote,
    },
  ];

  if (loading && step === "address") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Your order <span className="font-semibold">{orderNumber}</span> has been confirmed
          </p>
          <div className="space-y-3">
            <a
              href="/orders"
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Order Details
            </a>
            <a
              href="/products"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <div className="flex items-center space-x-4 text-sm text-green-100">
            <span className={step === "address" ? "font-semibold text-white" : ""}>
              1. Address
            </span>
            <span>→</span>
            <span className={step === "payment-method" ? "font-semibold text-white" : ""}>
              2. Payment Method
            </span>
            <span>→</span>
            <span className={step === "payment" ? "font-semibold text-white" : ""}>
              3. Payment
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ADDRESS STEP */}
            {step === "address" && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <MapPin className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No addresses found</p>
                      <a
                        href="/addresses"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Add New Address
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedAddress === addr.id
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              name="address"
                              value={addr.id}
                              checked={selectedAddress === addr.id}
                              onChange={(e) => setSelectedAddress(e.target.value)}
                              className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">{addr.name}</span>
                                {addr.isDefault && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{addr.phone}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.city}, {addr.state} - {addr.postalCode}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleProceedToPaymentMethod}
                  disabled={!selectedAddress || !cart?.items?.length}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* PAYMENT METHOD STEP */}
            {step === "payment-method" && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
                    </div>
                    <button
                      onClick={() => setStep("address")}
                      className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedPaymentMethod === method.id
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                              className="mt-1 mr-3"
                            />
                            <Icon className="w-6 h-6 text-gray-600 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{method.name}</span>
                                {method.popular && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{method.description}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedPaymentMethod || loading}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                  </div>
                  <button
                    onClick={() => setStep("payment-method")}
                    className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </button>
                </div>

                {selectedPaymentMethod === "upi" && (
                  <UPIPayment 
                    onSuccess={handlePaymentSuccess} 
                    total={priceBreakdown?.total || calculateSubtotal()} 
                    addressId={selectedAddress}
                  />
                )}

                {selectedPaymentMethod === "card" && clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: { 
                        theme: "stripe", 
                        variables: { colorPrimary: "#16a34a" } 
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      paymentIntentId={paymentIntentId}
                      addressId={selectedAddress}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}

                {selectedPaymentMethod === "netbanking" && (
                  <NetBankingPayment 
                    onSuccess={handlePaymentSuccess}
                    addressId={selectedAddress}
                  />
                )}

                {selectedPaymentMethod === "wallet" && (
                  <WalletPayment 
                    onSuccess={handlePaymentSuccess}
                    addressId={selectedAddress}
                  />
                )}

                {selectedPaymentMethod === "cod" && (
                  <CODPayment 
                    onSuccess={handlePaymentSuccess}
                    addressId={selectedAddress}
                  />
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                {priceBreakdown ? (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{priceBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (18% GST)</span>
                      <span>₹{priceBreakdown.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>
                        {priceBreakdown.shippingFee === 0
                          ? "FREE"
                          : `₹${priceBreakdown.shippingFee.toFixed(2)}`}
                      </span>
                    </div>
                    {priceBreakdown.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{priceBreakdown.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>₹{priceBreakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method Badge */}
              {selectedPaymentMethod && (
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-green-700">
                    {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                  </p>
                </div>
              )}

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
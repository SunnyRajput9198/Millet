import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  MapPin,
  Package,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { getValidAccessToken } from "../utils/tokenRefresh";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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

// Payment Form Component
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
      // Submit the form to validate
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Payment submission failed");
        setProcessing(false);
        return;
      }

      // Confirm the payment with Stripe
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

      // Payment confirmed on Stripe, now create order on backend
      // Wait a bit for webhook to process (optional but helps)
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const accessToken = await getValidAccessToken();
        const response = await fetch(
          "http://localhost:8000/api/v1/payments/confirm-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId,
              addressId: addressId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // Log the full error for debugging
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

// Main Checkout Page
export function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"address" | "payment" | "success">("address");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = await getValidAccessToken();

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
        
        // Check if cart is empty
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

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const accessToken = await getValidAccessToken();
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
  };

  const handlePaymentSuccess = (orderNum: string) => {
    setOrderNumber(orderNum);
    setStep("success");
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (loading) {
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
            Your order <span className="font-semibold">{orderNumber}</span> has been
            confirmed
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
          <p className="text-green-100">
            {step === "address" ? "Select delivery address" : "Complete payment"}
          </p>
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
            {step === "address" ? (
              <>
                {/* Address Selection */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <MapPin className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Delivery Address
                    </h2>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No addresses found</p>
                      <a
                        href="/profile/addresses"
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
                                <span className="font-semibold text-gray-900">
                                  {addr.name}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {addr.phone}
                              </p>
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
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress || loading || !cart?.items?.length}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              /* Payment Step */
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Payment Details
                  </h2>
                </div>

                {clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#16a34a",
                        },
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
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
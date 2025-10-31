import { useState, useEffect } from "react";
import {
  MapPin,
  Package,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Banknote,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID!

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
// UPI Payment Component with Razorpay Integration
function UPIPayment({
  onSuccess,
  total,
  addressId
}: {
  onSuccess: (orderNumber: string) => void;
  total: number;
  addressId: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError("");

    try {
      // Step 1: Create Razorpay order
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            amount: total,
            currency: "INR",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      const { order } = data;

      // Step 2: Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Your Store Name",
        description: "Order Payment",
        order_id: order.id,
        handler: async function (response: any) {
          // Step 3: Verify payment signature
          try {
            const verifyResponse = await fetch(
              "http://localhost:8000/api/v1/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Step 4: Create order in your system
              const createOrderResponse = await fetch(
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
                    upiTransactionId: response.razorpay_payment_id,
                  }),
                }
              );

              const orderData = await createOrderResponse.json();

              if (orderData.success) {
                onSuccess(orderData.data.orderNumber);
              } else {
                setError(orderData.message || "Failed to create order");
                setProcessing(false);
              }
            } else {
              setError("Payment verification failed");
              setProcessing(false);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setError(err.message || "Payment verification failed");
            setProcessing(false);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          address_id: addressId,
        },
        theme: {
          color: "#16a34a",
        },
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setError("Payment cancelled by user");
          },
        },
      };

      // Step 5: Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">UPI Payment</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pay using any UPI app</li>
              <li>• Google Pay, PhonePe, Paytm & more</li>
              <li>• Instant payment confirmation</li>
              <li>• 100% secure and encrypted</li>
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
        onClick={handleRazorpayPayment}
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
            <Smartphone className="w-5 h-5" />
            <span>Pay with UPI</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="grid grid-cols-4 gap-3 pt-4">
        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
          <button
            key={app}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition"
            disabled
          >
            <Smartphone className="w-6 h-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">{app}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Razorpay. We never store your UPI PIN.
      </p>
    </div>
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
export function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"address" | "payment-method" | "payment" | "success">("address");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
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
    setError("");
    setStep("payment");
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
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition ${selectedAddress === addr.id
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
                      <Smartphone className="w-6 h-6 text-green-600" />
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
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition ${selectedPaymentMethod === method.id
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
                    <Smartphone className="w-6 h-6 text-green-600" />
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
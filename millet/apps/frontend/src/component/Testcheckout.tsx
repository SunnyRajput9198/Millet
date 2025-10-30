import { useState, useEffect } from "react";
import {
  MapPin,
  Package,
  ArrowRight,
  AlertCircle,
  Loader,
  CheckCircle,
} from "lucide-react";
import { getValidAccessToken } from "../utils/tokenRefresh";

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

export function TestCheckout() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      console.error("Error:", err);
      setError("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  const testPaymentIntent = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        window.location.href = "/auth";
        return;
      }

      console.log("Testing payment intent creation...");
      console.log("Address ID:", selectedAddress);
      console.log("Cart:", cart);

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
      
      console.log("Payment Intent Response:", data);

      if (data.success && data.data) {
        setSuccess(true);
        setError("");
        alert(`✅ Payment Intent Created!\n\nAmount: ₹${data.data.amount}\nClient Secret: ${data.data.clientSecret.substring(0, 20)}...`);
      } else {
        setError(data.message || "Failed to initialize payment");
        console.error("Error:", data);
      }
    } catch (err: any) {
      console.error("Full error:", err);
      setError("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
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

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">Test Checkout (No Stripe)</h1>
          <p className="text-green-100">Testing backend payment integration</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Payment intent created successfully!</span>
          </div>
        )}

        {isEmpty ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products first!</p>
            <a
              href="/products"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Address Selection */}
            <div className="lg:col-span-2">
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
                    <p className="text-sm text-gray-500">
                      You need to add an address first to test checkout
                    </p>
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
                onClick={testPaymentIntent}
                disabled={!selectedAddress || processing}
                className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <span>Test Payment Intent Creation</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                This will test the backend without loading Stripe.js
              </p>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

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

                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
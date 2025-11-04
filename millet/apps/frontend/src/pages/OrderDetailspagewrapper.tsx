import { useParams } from "react-router-dom";
import { OrderDetailPage } from "./OrderDetailspage";

export function OrderDetailPageWrapper() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-xl">Order ID is missing</p>
      </div>
    );
  }
  
  return <OrderDetailPage orderId={id} />;
}
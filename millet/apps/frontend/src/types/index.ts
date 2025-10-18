export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;           // Or 'number' if your API sends it as a number
  comparePrice?: string;  // Or 'number'. Mapped from 'comparePrice'
  image: string;           // The URL of the primary product image
  rating: number;
  reviews: number;         // Mapped from 'reviewCount'
  shortDescription?: string;        // Mapped from 'shortDescription'
  badge?: string;          // Optional badge text (e.g., "BESTSELLER")
}
export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export type ProductSnapshot = {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  createdAt: string;
};

export type Quote = {
  id: string;
  productSnapshotId: string;
  size: string;
  color: string;
  qty: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
};

export type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type TimelineEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export type AddressInput = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
};
// Mock data for the logistics platform

export type OrderStatus = 
  | 'paid'
  | 'purchasing'
  | 'purchased'
  | 'inbound_uk'
  | 'received_uk'
  | 'shipped_nigeria'
  | 'out_for_delivery'
  | 'delivered'
  | 'action_required';

export type PurchaseMode = 'AUTO' | 'MANUAL';

export interface TimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  trackingNumber?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  storeDomain: string;
  productName: string;
  productUrl: string;
  productImage: string;
  size?: string;
  color?: string;
  quantity: number;
  itemPrice: number;
  serviceFee: number;
  ukDelivery: number;
  internationalShipping: number;
  dutiesBuffer: number;
  fxConversion: number;
  paymentFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  purchaseMode: PurchaseMode;
  paymentStatus: 'paid' | 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  requiresAction?: boolean;
  actionReason?: string;
  assignedStaff?: string;
}

export interface StoreAdapter {
  id: string;
  domain: string;
  status: 'active' | 'disabled';
  successRate: number;
  lastFailureReason?: string;
  lastRun: string;
  totalAttempts: number;
  successfulAttempts: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  type: 'inbound' | 'outbound';
  carrier: string;
  trackingNumber: string;
  status: string;
  eta?: string;
  weight?: string;
  photos?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  createdAt: string;
  addresses: Address[];
  defaultAddressId?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  phone: string;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-2024-0147',
    customerId: 'USR-001',
    customerName: 'Chioma Adeleke',
    customerEmail: 'chioma.a@email.com',
    storeDomain: 'asos.com',
    productName: 'Nike Air Max 270 React - Triple Black',
    productUrl: 'https://www.asos.com/nike/product/12345',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    size: 'UK 9',
    color: 'Black',
    quantity: 1,
    itemPrice: 119.99,
    serviceFee: 15.00,
    ukDelivery: 0,
    internationalShipping: 45.00,
    dutiesBuffer: 25.00,
    fxConversion: 8.50,
    paymentFee: 4.20,
    total: 217.69,
    currency: 'GBP',
    status: 'shipped_nigeria',
    purchaseMode: 'AUTO',
    paymentStatus: 'paid',
    createdAt: '2026-01-18T10:23:00Z',
    updatedAt: '2026-01-20T08:15:00Z',
    timeline: [
      { status: 'Paid', timestamp: '2026-01-18T10:23:00Z', description: 'Payment confirmed via card' },
      { status: 'Purchasing', timestamp: '2026-01-18T10:25:00Z', description: 'Automated purchase initiated' },
      { status: 'Purchased', timestamp: '2026-01-18T10:28:00Z', description: 'Order placed successfully on ASOS' },
      { status: 'Inbound to UK', timestamp: '2026-01-19T14:30:00Z', description: 'Dispatched by ASOS', trackingNumber: 'ASOS123456789GB' },
      { status: 'Received in UK', timestamp: '2026-01-19T18:45:00Z', description: 'Package received at UK warehouse' },
      { status: 'Shipped to Nigeria', timestamp: '2026-01-20T08:15:00Z', description: 'Dispatched via DHL', trackingNumber: 'DHL987654321NG' },
    ]
  },
  {
    id: 'ORD-2024-0148',
    customerId: 'USR-002',
    customerName: 'Oluwaseun Bankole',
    customerEmail: 'seun.b@email.com',
    storeDomain: 'zara.com',
    productName: 'Linen Blazer - Navy Blue',
    productUrl: 'https://www.zara.com/product/67890',
    productImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
    size: 'L',
    color: 'Navy',
    quantity: 1,
    itemPrice: 89.99,
    serviceFee: 12.00,
    ukDelivery: 0,
    internationalShipping: 45.00,
    dutiesBuffer: 18.00,
    fxConversion: 6.50,
    paymentFee: 3.45,
    total: 174.94,
    currency: 'EUR',
    status: 'action_required',
    purchaseMode: 'AUTO',
    paymentStatus: 'paid',
    createdAt: '2026-01-19T14:10:00Z',
    updatedAt: '2026-01-19T14:15:00Z',
    requiresAction: true,
    actionReason: 'Out of stock - size L unavailable',
    timeline: [
      { status: 'Paid', timestamp: '2026-01-19T14:10:00Z', description: 'Payment confirmed via bank transfer' },
      { status: 'Purchasing', timestamp: '2026-01-19T14:12:00Z', description: 'Automated purchase initiated' },
      { status: 'Action Required', timestamp: '2026-01-19T14:15:00Z', description: 'Size L unavailable - awaiting customer response' },
    ]
  },
  {
    id: 'ORD-2024-0149',
    customerId: 'USR-003',
    customerName: 'Amaka Okonkwo',
    customerEmail: 'amaka.o@email.com',
    storeDomain: 'amazon.co.uk',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    productUrl: 'https://www.amazon.co.uk/product/xyz',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    color: 'Silver',
    quantity: 1,
    itemPrice: 379.00,
    serviceFee: 25.00,
    ukDelivery: 0,
    internationalShipping: 55.00,
    dutiesBuffer: 45.00,
    fxConversion: 15.20,
    paymentFee: 9.95,
    total: 529.15,
    currency: 'GBP',
    status: 'delivered',
    purchaseMode: 'AUTO',
    paymentStatus: 'paid',
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-20T16:20:00Z',
    timeline: [
      { status: 'Paid', timestamp: '2026-01-15T09:30:00Z', description: 'Payment confirmed' },
      { status: 'Purchasing', timestamp: '2026-01-15T09:32:00Z', description: 'Automated purchase initiated' },
      { status: 'Purchased', timestamp: '2026-01-15T09:35:00Z', description: 'Order placed on Amazon UK' },
      { status: 'Inbound to UK', timestamp: '2026-01-16T11:00:00Z', description: 'Dispatched by Amazon', trackingNumber: 'AMZN123ABC' },
      { status: 'Received in UK', timestamp: '2026-01-17T08:30:00Z', description: 'Package received and inspected' },
      { status: 'Shipped to Nigeria', timestamp: '2026-01-17T14:00:00Z', description: 'Dispatched via FedEx', trackingNumber: 'FDX456789NG' },
      { status: 'Out for Delivery', timestamp: '2026-01-20T08:00:00Z', description: 'Out for delivery in Lagos' },
      { status: 'Delivered', timestamp: '2026-01-20T16:20:00Z', description: 'Successfully delivered to customer' },
    ]
  },
  {
    id: 'ORD-2024-0150',
    customerId: 'USR-001',
    customerName: 'Chioma Adeleke',
    customerEmail: 'chioma.a@email.com',
    storeDomain: 'hm.com',
    productName: 'Cotton T-shirt 3-pack - Basic Colors',
    productUrl: 'https://www2.hm.com/product/abc',
    productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    size: 'M',
    color: 'Multi',
    quantity: 1,
    itemPrice: 24.99,
    serviceFee: 8.00,
    ukDelivery: 0,
    internationalShipping: 35.00,
    dutiesBuffer: 8.00,
    fxConversion: 3.50,
    paymentFee: 1.99,
    total: 81.48,
    currency: 'GBP',
    status: 'purchasing',
    purchaseMode: 'MANUAL',
    paymentStatus: 'paid',
    createdAt: '2026-01-20T11:05:00Z',
    updatedAt: '2026-01-20T11:10:00Z',
    requiresAction: true,
    actionReason: 'Unsupported store - requires manual purchase',
    assignedStaff: 'John Doe',
    timeline: [
      { status: 'Paid', timestamp: '2026-01-20T11:05:00Z', description: 'Payment confirmed' },
      { status: 'Purchasing', timestamp: '2026-01-20T11:10:00Z', description: 'Assigned to staff for manual purchase' },
    ]
  },
  {
    id: 'ORD-2024-0151',
    customerId: 'USR-004',
    customerName: 'Emeka Nwankwo',
    customerEmail: 'emeka.n@email.com',
    storeDomain: 'zara.com',
    productName: 'Leather Chelsea Boots',
    productUrl: 'https://www.zara.com/product/boots123',
    productImage: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400',
    size: 'EU 43',
    color: 'Brown',
    quantity: 1,
    itemPrice: 129.00,
    serviceFee: 18.00,
    ukDelivery: 0,
    internationalShipping: 45.00,
    dutiesBuffer: 22.00,
    fxConversion: 7.80,
    paymentFee: 4.85,
    total: 226.65,
    currency: 'EUR',
    status: 'received_uk',
    purchaseMode: 'AUTO',
    paymentStatus: 'paid',
    createdAt: '2026-01-17T16:20:00Z',
    updatedAt: '2026-01-19T10:30:00Z',
    timeline: [
      { status: 'Paid', timestamp: '2026-01-17T16:20:00Z', description: 'Payment confirmed' },
      { status: 'Purchasing', timestamp: '2026-01-17T16:22:00Z', description: 'Automated purchase initiated' },
      { status: 'Purchased', timestamp: '2026-01-17T16:25:00Z', description: 'Order placed on Zara' },
      { status: 'Inbound to UK', timestamp: '2026-01-18T09:00:00Z', description: 'Dispatched by Zara' },
      { status: 'Received in UK', timestamp: '2026-01-19T10:30:00Z', description: 'Package received at warehouse - awaiting consolidation' },
    ]
  },
];

export const mockStoreAdapters: StoreAdapter[] = [
  {
    id: 'ADAPTER-001',
    domain: 'asos.com',
    status: 'active',
    successRate: 94.5,
    lastRun: '2026-01-20T11:30:00Z',
    totalAttempts: 1247,
    successfulAttempts: 1178,
  },
  {
    id: 'ADAPTER-002',
    domain: 'zara.com',
    status: 'active',
    successRate: 89.2,
    lastRun: '2026-01-20T10:45:00Z',
    totalAttempts: 856,
    successfulAttempts: 764,
  },
  {
    id: 'ADAPTER-003',
    domain: 'amazon.co.uk',
    status: 'active',
    successRate: 96.8,
    lastRun: '2026-01-20T11:25:00Z',
    totalAttempts: 2134,
    successfulAttempts: 2066,
  },
  {
    id: 'ADAPTER-004',
    domain: 'hm.com',
    status: 'disabled',
    successRate: 45.3,
    lastFailureReason: 'Bot detection - captcha required',
    lastRun: '2026-01-19T08:20:00Z',
    totalAttempts: 432,
    successfulAttempts: 196,
  },
  {
    id: 'ADAPTER-005',
    domain: 'next.co.uk',
    status: 'active',
    successRate: 91.7,
    lastRun: '2026-01-20T09:15:00Z',
    totalAttempts: 678,
    successfulAttempts: 622,
  },
];

export const mockShipments: Shipment[] = [
  {
    id: 'SHIP-UK-001',
    orderId: 'ORD-2024-0151',
    type: 'inbound',
    carrier: 'Royal Mail',
    trackingNumber: 'RM123456789GB',
    status: 'Delivered to warehouse',
    weight: '0.8 kg',
  },
  {
    id: 'SHIP-NG-001',
    orderId: 'ORD-2024-0147',
    type: 'outbound',
    carrier: 'DHL',
    trackingNumber: 'DHL987654321NG',
    status: 'In transit',
    eta: '2026-01-22',
  },
  {
    id: 'SHIP-NG-002',
    orderId: 'ORD-2024-0149',
    type: 'outbound',
    carrier: 'FedEx',
    trackingNumber: 'FDX456789NG',
    status: 'Delivered',
  },
];

export const mockUsers: User[] = [
  {
    id: 'USR-001',
    name: 'Chioma Adeleke',
    email: 'chioma.a@email.com',
    orderCount: 12,
    totalSpend: 2456.78,
    createdAt: '2025-11-15T10:00:00Z',
    addresses: [
      {
        id: 'ADDR-001',
        label: 'Home',
        street: '45 Ogudu Road',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+234 801 234 5678',
      },
      {
        id: 'ADDR-002',
        label: 'Office',
        street: '12 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+234 802 345 6789',
      },
    ],
    defaultAddressId: 'ADDR-001',
  },
  {
    id: 'USR-002',
    name: 'Oluwaseun Bankole',
    email: 'seun.b@email.com',
    orderCount: 8,
    totalSpend: 1823.45,
    createdAt: '2025-12-02T14:30:00Z',
    addresses: [
      {
        id: 'ADDR-003',
        label: 'Home',
        street: '23 Allen Avenue',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+234 803 456 7890',
      },
    ],
    defaultAddressId: 'ADDR-003',
  },
  {
    id: 'USR-003',
    name: 'Amaka Okonkwo',
    email: 'amaka.o@email.com',
    orderCount: 15,
    totalSpend: 3912.34,
    createdAt: '2025-10-08T09:15:00Z',
    addresses: [
      {
        id: 'ADDR-004',
        label: 'Home',
        street: '78 Independence Layout',
        city: 'Enugu',
        state: 'Enugu',
        country: 'Nigeria',
        phone: '+234 804 567 8901',
      },
    ],
    defaultAddressId: 'ADDR-004',
  },
  {
    id: 'USR-004',
    name: 'Emeka Nwankwo',
    email: 'emeka.n@email.com',
    orderCount: 5,
    totalSpend: 1245.67,
    createdAt: '2026-01-05T11:20:00Z',
    addresses: [
      {
        id: 'ADDR-005',
        label: 'Home',
        street: '34 GRA',
        city: 'Port Harcourt',
        state: 'Rivers',
        country: 'Nigeria',
        phone: '+234 805 678 9012',
      },
    ],
    defaultAddressId: 'ADDR-005',
  },
];

export const currentUser = mockUsers[0]; // Chioma Adeleke as default logged-in user


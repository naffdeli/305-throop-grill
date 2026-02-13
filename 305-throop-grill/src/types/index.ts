import { Decimal } from "@prisma/client/runtime/library";

export type UserRole = "ADMIN" | "CASHIER" | "KITCHEN";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "PICKED_UP" | "NO_SHOW" | "CANCELLED";
export type OrderSource = "POS" | "KIOSK" | "ONLINE";
export type SelectionType = "SINGLE" | "MULTIPLE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  noShowCount: number;
  isFlagged: boolean;
  totalOrders: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: Decimal | number | string;
  imageUrl?: string | null;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
  preparationTime: number;
  modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  menuItemId: string;
  selectionType: SelectionType;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: Decimal | number | string;
  modifierGroupId: string;
  isAvailable: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId?: string | null;
  customer?: Customer | null;
  staffId?: string | null;
  staff?: User | null;
  status: OrderStatus;
  source: OrderSource;
  subtotal: Decimal | number | string;
  tax: Decimal | number | string;
  total: Decimal | number | string;
  specialInstructions?: string | null;
  pickupTime?: Date | null;
  readyAt?: Date | null;
  pickedUpAt?: Date | null;
  createdAt: Date;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: Decimal | number | string;
  notes?: string | null;
  customizations?: ItemCustomization[];
}

export interface ItemCustomization {
  id: string;
  orderItemId: string;
  modifierId: string;
  modifier?: Modifier;
  priceAdjustment: Decimal | number | string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  selectedModifiers: SelectedModifier[];
  totalPrice: number;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  modifierName: string;
  priceAdjustment: number;
}

export interface NoShow {
  id: string;
  customerId: string;
  customer?: Customer;
  orderId: string;
  order?: Order;
  orderValue: Decimal | number | string;
  reason?: string | null;
  occurredAt: Date;
}

export interface Inventory {
  id: string;
  name: string;
  menuItemId?: string | null;
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: Decimal | number | string;
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { name: string; count: number; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
  noShowRate: number;
}

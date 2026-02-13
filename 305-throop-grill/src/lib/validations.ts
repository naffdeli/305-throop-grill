import { z } from "zod";

const httpsUrl = z.string().url().refine(
  (url) => url.startsWith("https://"),
  "Image URL must use HTTPS"
);

export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  notes: z.string().max(200, "Notes too long").optional(),
  customizations: z.array(z.object({
    modifierId: z.string().min(1),
    priceAdjustment: z.number(),
  })).optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required").max(100).optional(),
  customerPhone: z.string().min(10, "Valid phone number required").max(20).optional(),
  customerEmail: z.string().email().optional().nullable(),
  staffId: z.string().optional(),
  source: z.enum(["POS", "KIOSK", "ONLINE"], {
    errorMap: () => ({ message: "Source must be POS, KIOSK, or ONLINE" }),
  }),
  subtotal: z.number().positive("Subtotal must be positive"),
  specialInstructions: z.string().max(500, "Special instructions too long").optional(),
  pickupTime: z.string().datetime().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});

export const UpdateOrderSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "PICKED_UP", "NO_SHOW", "CANCELLED"]).optional(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string()
    .min(10, "Phone must be at least 10 digits")
    .max(20)
    .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number format"),
  email: z.string().email().optional().nullable(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).regex(/^[\d\s\-\(\)\+]+$/).optional(),
  email: z.string().email().optional().nullable(),
  isFlagged: z.boolean().optional(),
});

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(1000, "Description too long").optional(),
  price: z.number().positive("Price must be positive"),
  imageUrl: httpsUrl.optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().int().positive().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const CreateModifierGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  menuItemId: z.string().min(1, "Menu item ID is required"),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1).max(50),
    priceAdjustment: z.number().optional(),
    isAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })).optional(),
});

export const CreateInventorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().max(20).optional(),
  minThreshold: z.number().int().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  menuItemId: z.string().optional(),
});

export const UpdateInventorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().max(20).optional(),
  minThreshold: z.number().int().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
});

export const UpdateMenuItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().positive().optional(),
  imageUrl: httpsUrl.optional().nullable(),
  categoryId: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().int().positive().optional(),
});

export const UpdateModifierGroupSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1).max(50),
    priceAdjustment: z.number().optional(),
    isAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })).optional(),
});

export const OrderSearchSchema = z.object({
  phone: z.string().min(10).max(20).optional(),
  orderNumber: z.number().int().positive().optional(),
}).refine((data) => data.phone || data.orderNumber, {
  message: "Either phone or order number is required",
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

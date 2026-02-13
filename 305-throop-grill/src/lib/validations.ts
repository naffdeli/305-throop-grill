import { z } from "zod";

export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  notes: z.string().optional(),
  customizations: z.array(z.object({
    modifierId: z.string().min(1),
    priceAdjustment: z.number(),
  })).optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required").optional(),
  customerPhone: z.string().min(10, "Valid phone number required").optional(),
  customerEmail: z.string().email().optional().nullable(),
  staffId: z.string().optional(),
  source: z.enum(["POS", "KIOSK", "ONLINE"], {
    errorMap: () => ({ message: "Source must be POS, KIOSK, or ONLINE" }),
  }),
  subtotal: z.number().positive("Subtotal must be positive"),
  specialInstructions: z.string().optional(),
  pickupTime: z.string().datetime().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});

export const UpdateOrderSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "PICKED_UP", "NO_SHOW", "CANCELLED"]).optional(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number format"),
  email: z.string().email().optional().nullable(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).regex(/^[\d\s\-\(\)\+]+$/).optional(),
  email: z.string().email().optional().nullable(),
  isFlagged: z.boolean().optional(),
});

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().int().positive().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreateModifierGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  menuItemId: z.string().min(1, "Menu item ID is required"),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1),
    priceAdjustment: z.number().optional(),
    isAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })).optional(),
});

export const CreateInventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  minThreshold: z.number().int().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  menuItemId: z.string().optional(),
});

export const UpdateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  minThreshold: z.number().int().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
});

export const UpdateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().int().positive().optional(),
});

export const UpdateModifierGroupSchema = z.object({
  name: z.string().min(1).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1),
    priceAdjustment: z.number().optional(),
    isAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })).optional(),
});

export const OrderSearchSchema = z.object({
  phone: z.string().min(10).optional(),
  orderNumber: z.number().int().positive().optional(),
}).refine((data) => data.phone || data.orderNumber, {
  message: "Either phone or order number is required",
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

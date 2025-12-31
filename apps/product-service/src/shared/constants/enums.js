/**
 * Product Enums
 * Shared enums for product attributes used across the application
 */

/**
 * Standard product colors
 * Used for filtering and product variants
 */
export const ProductColors = {
  BLACK: 'Black',
  WHITE: 'White',
  GRAY: 'Gray',
  NAVY: 'Navy',
  RED: 'Red',
  BLUE: 'Blue',
  GREEN: 'Green',
  YELLOW: 'Yellow',
  ORANGE: 'Orange',
  PURPLE: 'Purple',
  PINK: 'Pink',
  BROWN: 'Brown',
  BEIGE: 'Beige',
  SILVER: 'Silver',
  GOLD: 'Gold',
  MULTI: 'Multi-Color',
};

/**
 * Get all color values as array
 */
export const getProductColors = () => Object.values(ProductColors);

/**
 * Standard product sizes
 * Used for clothing, shoes, and other sizeable products
 */
export const ProductSizes = {
  // Clothing sizes
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
  XXXL: 'XXXL',
  
  // Shoe sizes (US)
  SHOE_7: '7',
  SHOE_7_5: '7.5',
  SHOE_8: '8',
  SHOE_8_5: '8.5',
  SHOE_9: '9',
  SHOE_9_5: '9.5',
  SHOE_10: '10',
  SHOE_10_5: '10.5',
  SHOE_11: '11',
  SHOE_11_5: '11.5',
  SHOE_12: '12',
  SHOE_13: '13',
  
  // Storage sizes
  STORAGE_256GB: '256GB',
  STORAGE_512GB: '512GB',
  STORAGE_1TB: '1TB',
  STORAGE_2TB: '2TB',
  STORAGE_4TB: '4TB',
  STORAGE_8TB: '8TB',
  
  // Generic sizes
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  ONE_SIZE: 'One Size',
};

/**
 * Get all size values as array
 */
export const getProductSizes = () => Object.values(ProductSizes);

/**
 * Product status
 */
export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
};

/**
 * Get all status values as array
 */
export const getProductStatuses = () => Object.values(ProductStatus);

/**
 * Simplified product categories
 * Flat structure for easy filtering
 */
export const ProductCategories = {
  ELECTRONICS: 'Electronics',
  CLOTHING: 'Clothing',
  SHOES: 'Shoes',
  ACCESSORIES: 'Accessories',
  HOME_GARDEN: 'Home & Garden',
  SPORTS_OUTDOORS: 'Sports & Outdoors',
  BEAUTY_PERSONAL_CARE: 'Beauty & Personal Care',
  BOOKS_MEDIA: 'Books & Media',
  TOYS_GAMES: 'Toys & Games',
  AUTOMOTIVE: 'Automotive',
  FOOD_BEVERAGES: 'Food & Beverages',
  HEALTH_WELLNESS: 'Health & Wellness',
};

/**
 * Get all category values as array
 */
export const getProductCategories = () => Object.values(ProductCategories);

/**
 * Product tags (common tags for filtering)
 */
export const ProductTags = {
  NEW: 'new',
  SALE: 'sale',
  FEATURED: 'featured',
  BESTSELLER: 'bestseller',
  PREMIUM: 'premium',
  ECO_FRIENDLY: 'eco-friendly',
  LIMITED_EDITION: 'limited-edition',
  TRENDING: 'trending',
};

/**
 * Get all tag values as array
 */
export const getProductTags = () => Object.values(ProductTags);

/**
 * Validate if a color is valid
 */
export const isValidColor = (color) => {
  return getProductColors().includes(color);
};

/**
 * Validate if a size is valid
 */
export const isValidSize = (size) => {
  return getProductSizes().includes(size);
};

/**
 * Validate if a status is valid
 */
export const isValidStatus = (status) => {
  return getProductStatuses().includes(status);
};

/**
 * Validate if a category is valid
 */
export const isValidCategory = (category) => {
  return getProductCategories().includes(category);
};

/**
 * Common product brands
 * Used for autocomplete and suggestions in product forms
 */
export const ProductBrands = {
  // Electronics
  APPLE: 'Apple',
  SAMSUNG: 'Samsung',
  SONY: 'Sony',
  BOSE: 'Bose',
  MICROSOFT: 'Microsoft',
  GOOGLE: 'Google',
  HP: 'HP',
  DELL: 'Dell',
  LENOVO: 'Lenovo',
  ASUS: 'ASUS',
  ACER: 'Acer',
  
  // Clothing & Fashion
  NIKE: 'Nike',
  ADIDAS: 'Adidas',
  ZARA: 'Zara',
  H_M: 'H&M',
  UNIQLO: 'Uniqlo',
  GAP: 'Gap',
  LEVI: 'Levi\'s',
  CALVIN_KLEIN: 'Calvin Klein',
  TOMMY_HILFIGER: 'Tommy Hilfiger',
  
  // Footwear
  PUMA: 'Puma',
  NEW_BALANCE: 'New Balance',
  CONVERSE: 'Converse',
  VANS: 'Vans'
};

/**
 * Get all brand values as array
 */
export const getProductBrands = () => Object.values(ProductBrands);


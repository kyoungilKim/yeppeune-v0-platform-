export interface BeautyProduct {
  id: string
  name: string
  brand: string
  category: "skincare" | "makeup" | "haircare" | "bodycare" | "fragrance" | "tools"
  subCategory: string
  price: number
  currency: string
  size: string
  description: string
  shortDescription: string
  ingredients: string[]
  benefits: string[]
  howToUse: string
  suitableFor: {
    skinTypes: ("dry" | "oily" | "combination" | "sensitive" | "normal")[]
    skinConcerns: string[]
    ageRanges: string[]
  }
  rating: number
  reviewCount: number
  images: string[]
  tags: string[]
  featured: boolean
  isNew: boolean
  bestSeller: boolean
  inStock: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductReview {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  content: string
  images: string[]
  helpfulCount: number
  verifiedPurchase: boolean
  createdAt: Date
  skinType?: string
  skinConcerns?: string[]
  ageRange?: string
}

export interface ProductRecommendation {
  id: string
  userId: string
  productId: string
  score: number
  reason: string[]
  category: string
  priority: "high" | "medium" | "low"
  createdAt: Date
  clicked: boolean
  purchased: boolean
}

export interface ShoppingCart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
  name: string
  brand: string
  image: string
}

export interface ProductCollection {
  id: string
  name: string
  description: string
  imageUrl: string
  products: string[] // 제품 ID 배열
  featured: boolean
  createdAt: Date
}

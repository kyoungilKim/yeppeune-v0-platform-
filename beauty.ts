export interface BeautyAnalysis {
  id: string
  userId: string
  timestamp: Date
  skinScore: number
  skinType: "dry" | "oily" | "combination" | "sensitive" | "normal"
  concerns: string[]
  recommendations: string[]
  imageUrl?: string
  analysisData: {
    hydration: number
    oiliness: number
    elasticity: number
    pigmentation: number
    wrinkles: number
    pores: number
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string
  age?: number
  skinType?: "dry" | "oily" | "combination" | "sensitive" | "normal"
  skinConcerns: string[]
  beautyGoals: string[]
  preferredProducts: string[]
  allergies: string[]
  createdAt: Date
  updatedAt: Date
  totalAnalyses: number
  averageSkinScore: number
  lastAnalysisDate?: Date
}

export interface BeautyRecommendation {
  id: string
  userId: string
  type: "product" | "routine" | "tip"
  title: string
  description: string
  category: string
  priority: "high" | "medium" | "low"
  basedOn: string[] // 추천 근거
  createdAt: Date
  isRead: boolean
}

export interface BeautyProduct {
  id: string
  name: string
  brand: string
  category: string
  skinTypes: string[]
  concerns: string[]
  ingredients: string[]
  price: number
  rating: number
  imageUrl: string
  description: string
}

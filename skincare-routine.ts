export interface SkincareStep {
  id: string
  order: number
  name: string
  category:
    | "cleanser"
    | "toner"
    | "essence"
    | "serum"
    | "moisturizer"
    | "sunscreen"
    | "treatment"
    | "mask"
    | "exfoliant"
  description: string
  instructions: string
  timing: ("morning" | "evening")[]
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly" | "as-needed"
  duration: number // 분
  products: SkincareProduct[]
  benefits: string[]
  warnings?: string[]
}

export interface SkincareProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  volume: string
  ingredients: string[]
  skinTypes: string[]
  concerns: string[]
  rating: number
  reviews: number
  imageUrl: string
  purchaseUrl?: string
  description: string
  howToUse: string
}

export interface SkincareRoutine {
  id: string
  userId: string
  name: string
  description: string
  skinType: string
  primaryConcerns: string[]
  lifestyle: LifestyleFactors
  morningSteps: SkincareStep[]
  eveningSteps: SkincareStep[]
  weeklyTreatments: SkincareStep[]
  monthlyTreatments: SkincareStep[]
  goals: string[]
  expectedResults: string[]
  timeline: string
  totalCost: number
  difficulty: "beginner" | "intermediate" | "advanced"
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface LifestyleFactors {
  activityLevel: "low" | "moderate" | "high"
  climate: "humid" | "dry" | "temperate" | "tropical"
  pollution: "low" | "moderate" | "high"
  stress: "low" | "moderate" | "high"
  sleep: "poor" | "average" | "good"
  diet: "poor" | "average" | "healthy"
  timeAvailable: "minimal" | "moderate" | "flexible"
  budget: "budget" | "mid-range" | "high-end" | "luxury"
  skinSensitivity: "none" | "mild" | "moderate" | "severe"
  currentProducts: string[]
  allergies: string[]
}

export interface RoutineProgress {
  id: string
  userId: string
  routineId: string
  date: Date
  completedSteps: string[]
  skippedSteps: string[]
  notes?: string
  skinCondition: {
    hydration: number
    oiliness: number
    irritation: number
    overall: number
  }
  photos?: string[]
}

export interface SkincareRecommendation {
  id: string
  userId: string
  type: "product" | "step" | "routine" | "adjustment"
  title: string
  description: string
  reason: string
  priority: "high" | "medium" | "low"
  category: string
  suggestion: any
  validUntil?: Date
  implemented: boolean
  createdAt: Date
}

export interface SkinAnalysisHistory {
  id: string
  userId: string
  date: Date
  analysisType: "camera" | "questionnaire" | "professional"
  results: {
    skinType: string
    hydration: number
    oiliness: number
    sensitivity: number
    acne: number
    pigmentation: number
    wrinkles: number
    pores: number
    redness: number
    overall: number
  }
  concerns: string[]
  improvements: string[]
  recommendations: string[]
  routineId?: string
}

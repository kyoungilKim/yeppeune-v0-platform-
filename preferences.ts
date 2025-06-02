export interface UserPreferences {
  id: string
  userId: string
  beautyStyle: {
    makeupStyle: ("natural" | "glamorous" | "bold" | "minimal" | "vintage" | "trendy")[]
    skincare: ("anti-aging" | "hydrating" | "brightening" | "acne-care" | "sensitive" | "oil-control")[]
    hairStyle: ("classic" | "trendy" | "edgy" | "romantic" | "casual" | "professional")[]
    fashionStyle: ("casual" | "formal" | "bohemian" | "minimalist" | "streetwear" | "vintage")[]
  }
  brandPreferences: {
    preferred: string[]
    avoided: string[]
    priceRange: {
      skincare: "budget" | "mid-range" | "high-end" | "luxury"
      makeup: "budget" | "mid-range" | "high-end" | "luxury"
      haircare: "budget" | "mid-range" | "high-end" | "luxury"
      fashion: "budget" | "mid-range" | "high-end" | "luxury"
    }
  }
  colorPreferences: {
    favoriteColors: string[]
    avoidedColors: string[]
    neutralPreference: "warm" | "cool" | "neutral"
    boldnessLevel: number // 1-10
  }
  skinCarePreferences: {
    routine: "minimal" | "moderate" | "extensive"
    concerns: string[]
    ingredients: {
      preferred: string[]
      avoided: string[]
    }
    texturePreferences: ("gel" | "cream" | "oil" | "serum" | "foam" | "balm")[]
  }
  lifestyle: {
    activityLevel: "low" | "moderate" | "high"
    climate: "humid" | "dry" | "temperate" | "tropical"
    workEnvironment: "office" | "outdoor" | "home" | "mixed"
    timeForRoutine: "minimal" | "moderate" | "extensive"
  }
  notifications: {
    analysisReminders: boolean
    productRecommendations: boolean
    trendUpdates: boolean
    communityActivity: boolean
  }
  privacy: {
    shareAnalysisResults: boolean
    allowDataForResearch: boolean
    publicProfile: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface StylePreference {
  id: string
  userId: string
  seasonalColors: {
    spring: boolean
    summer: boolean
    autumn: boolean
    winter: boolean
  }
  colorPreferences: {
    warm: number // 0-10
    cool: number // 0-10
    bright: number // 0-10
    muted: number // 0-10
    deep: number // 0-10
    light: number // 0-10
  }
  makeupStyle: {
    natural: number // 0-10
    dramatic: number // 0-10
    classic: number // 0-10
    trendy: number // 0-10
    bold: number // 0-10
    subtle: number // 0-10
  }
  fashionStyle: string[]
  dislikedStyles: string[]
  updatedAt: Date
}

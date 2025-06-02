export interface AgeTrend {
  id: string
  ageGroup: "20s" | "30s" | "40s" | "50s" | "60s"
  year: number
  season: "spring" | "summer" | "fall" | "winter"
  trends: {
    skincare: {
      popularCategories: string[]
      popularIngredients: string[]
      concerns: string[]
      routineComplexity: "minimal" | "moderate" | "extensive"
    }
    makeup: {
      colorPalette: string[]
      finishType: ("matte" | "dewy" | "satin" | "natural" | "glossy")[]
      focusAreas: ("eyes" | "lips" | "cheeks" | "brows" | "contour")[]
      intensity: "subtle" | "moderate" | "bold"
    }
    hairStyle: {
      popularStyles: string[]
      popularColors: string[]
      lengthTrend: "short" | "medium" | "long" | "varied"
      texturePreference: ("straight" | "wavy" | "curly" | "natural")[]
    }
    fashion: {
      styles: string[]
      colors: string[]
      keyItems: string[]
      accessories: string[]
    }
    footwear: {
      styles: string[]
      heelHeights: ("flat" | "low" | "medium" | "high")[]
      popularMaterials: string[]
      seasonalTrends: string[]
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface AgeGroupRecommendation {
  id: string
  ageGroup: "20s" | "30s" | "40s" | "50s" | "60s"
  title: string
  description: string
  skincare: {
    recommendedCategories: string[]
    keyIngredients: string[]
    avoidIngredients: string[]
    routineTips: string[]
    productTypes: string[]
  }
  makeup: {
    recommendedProducts: string[]
    techniques: string[]
    colorRecommendations: string[]
    applicationTips: string[]
  }
  hairCare: {
    recommendedStyles: string[]
    careRoutine: string[]
    colorAdvice: string[]
    commonIssues: string[]
    solutions: string[]
  }
  fashion: {
    styleGuide: string[]
    essentialItems: string[]
    colorPalette: string[]
    occasionSpecific: {
      casual: string[]
      workwear: string[]
      formal: string[]
    }
  }
  footwear: {
    recommendedTypes: string[]
    comfortTips: string[]
    styleTips: string[]
    seasonalRecommendations: {
      spring: string[]
      summer: string[]
      fall: string[]
      winter: string[]
    }
  }
  createdAt: Date
  updatedAt: Date
}

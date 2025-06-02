export interface AIRecommendationInput {
  faceAnalysis: {
    faceShape: "oval" | "round" | "square" | "heart" | "long" | "diamond"
    skinTone: "fair" | "light" | "medium" | "olive" | "tan" | "deep"
    skinUndertone: "cool" | "warm" | "neutral"
    eyeShape: "almond" | "round" | "monolid" | "hooded" | "downturned" | "upturned"
    eyeColor: string
    lipShape: "full" | "thin" | "wide" | "heart" | "round"
    facialFeatures: {
      symmetry: number
      proportions: number
      harmony: number
    }
    skinAnalysis: {
      wrinkles: number
      spots: number
      pores: number
      redness: number
      evenness: number
      hydration: number
      oiliness: number
    }
  }
  userPreferences?: {
    style: "natural" | "glamorous" | "bold" | "minimal" | "vintage" | "trendy"
    occasion: "daily" | "work" | "party" | "date" | "wedding" | "special"
    intensity: "light" | "medium" | "full"
    favoriteColors: string[]
    avoidColors: string[]
  }
  contextualFactors?: {
    timeOfDay: "morning" | "afternoon" | "evening" | "night"
    season: "spring" | "summer" | "autumn" | "winter"
    lighting: "natural" | "indoor" | "fluorescent" | "warm" | "cool"
    weather: "sunny" | "cloudy" | "rainy" | "humid" | "dry"
  }
}

export interface AIRecommendedMakeup {
  id: string
  confidence: number // 0-100
  overallScore: number // 0-100
  reasoning: string[]

  foundation: {
    shade: string
    coverage: "sheer" | "light" | "medium" | "full"
    finish: "matte" | "natural" | "dewy" | "satin"
    reason: string
    confidence: number
  }

  concealer?: {
    shade: string
    areas: string[]
    technique: string
    reason: string
    confidence: number
  }

  eyebrows: {
    shape: "natural" | "arched" | "straight" | "rounded" | "angular"
    color: string
    intensity: number
    technique: string
    reason: string
    confidence: number
  }

  eyeshadow: {
    palette: string[]
    placement: {
      lid: string
      crease: string
      highlight: string
      lowerLash?: string
    }
    technique: "gradient" | "cut-crease" | "smoky" | "halo" | "monochrome"
    intensity: number
    reason: string
    confidence: number
  }

  eyeliner?: {
    style: "thin" | "thick" | "winged" | "smudged" | "tightline" | "graphic"
    color: string
    placement: "upper" | "lower" | "both" | "waterline"
    reason: string
    confidence: number
  }

  mascara: {
    type: "lengthening" | "volumizing" | "waterproof" | "natural"
    color: string
    technique: string
    reason: string
    confidence: number
  }

  blush: {
    color: string
    placement: "apples" | "temples" | "cheekbones" | "draping"
    intensity: number
    technique: string
    reason: string
    confidence: number
  }

  highlighter?: {
    color: string
    placement: string[]
    intensity: number
    finish: "subtle" | "intense" | "metallic" | "pearl"
    reason: string
    confidence: number
  }

  contour?: {
    color: string
    areas: string[]
    intensity: number
    technique: "cream" | "powder" | "hybrid"
    reason: string
    confidence: number
  }

  lipstick: {
    color: string
    finish: "matte" | "cream" | "gloss" | "satin" | "stain"
    intensity: number
    technique: string
    reason: string
    confidence: number
  }

  settingProducts: {
    primer: boolean
    powder: boolean
    spray: boolean
    reason: string
  }
}

export interface ColorHarmonyAnalysis {
  primaryColors: string[]
  complementaryColors: string[]
  analogousColors: string[]
  triadicColors: string[]
  seasonalPalette: string[]
  recommendedColors: string[]
  avoidColors: string[]
}

export interface FaceShapeGuidelines {
  enhanceFeatures: string[]
  minimizeFeatures: string[]
  eyebrowShape: string
  blushPlacement: string
  contourAreas: string[]
  highlightAreas: string[]
}

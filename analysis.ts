export interface FaceAnalysis {
  id: string
  userId: string
  timestamp: Date
  imageUrl: string
  faceShape: "oval" | "round" | "square" | "heart" | "long" | "diamond"
  skinTone: "fair" | "light" | "medium" | "olive" | "tan" | "deep"
  skinUndertone: "cool" | "warm" | "neutral"
  eyeShape: "almond" | "round" | "monolid" | "hooded" | "downturned" | "upturned"
  eyeColor: string
  lipShape: "full" | "thin" | "wide" | "heart" | "round"
  noseShape: "straight" | "button" | "roman" | "bulbous" | "wide"
  cheekbones: "high" | "medium" | "low"
  jawline: "strong" | "medium" | "soft"
  facialFeatures: {
    symmetry: number // 0-100
    proportions: number // 0-100
    harmony: number // 0-100
  }
  skinAnalysis: {
    wrinkles: number // 0-100
    spots: number // 0-100
    pores: number // 0-100
    redness: number // 0-100
    evenness: number // 0-100
    hydration: number // 0-100
    oiliness: number // 0-100
    sensitivity: number // 0-100
    acne: number // 0-100
    blackheads: number // 0-100
  }
  colorAnalysis: {
    season: "spring" | "summer" | "autumn" | "winter"
    bestColors: string[]
    avoidColors: string[]
  }
  beautyScore: number // 0-100
}

export interface BodyAnalysis {
  id: string
  userId: string
  timestamp: Date
  imageUrl: string
  bodyShape: "hourglass" | "pear" | "apple" | "rectangle" | "inverted-triangle"
  bodyMeasurements: {
    shoulderWidth: number
    bust: number
    waist: number
    hips: number
    height: number
  }
  bodyProportions: {
    shoulderToWaist: number
    waistToHip: number
    legToHeight: number
  }
  styleRecommendations: {
    enhanceFeatures: string[]
    balanceFeatures: string[]
  }
  colorAnalysis: {
    season: "spring" | "summer" | "autumn" | "winter"
    bestColors: string[]
    avoidColors: string[]
  }
}

export interface StylePreference {
  id: string
  userId: string
  casualStyle: string[] // "minimal" | "bohemian" | "streetwear" | "classic" | "romantic" | "sporty"
  formalStyle: string[]
  favoriteColors: string[]
  dislikedStyles: string[]
  favoritePatterns: string[]
  favoriteAccessories: string[]
  budget: {
    clothing: "budget" | "moderate" | "premium" | "luxury"
    makeup: "budget" | "moderate" | "premium" | "luxury"
    skincare: "budget" | "moderate" | "premium" | "luxury"
    accessories: "budget" | "moderate" | "premium" | "luxury"
  }
  updatedAt: Date
}

export interface BeautyConsultation {
  id: string
  userId: string
  timestamp: Date
  faceAnalysisId?: string
  bodyAnalysisId?: string
  makeupRecommendations: {
    foundation: {
      shade: string
      brand: string
      productName: string
      price: number
      coverage: "sheer" | "light" | "medium" | "full"
      finish: "matte" | "natural" | "dewy" | "satin"
      imageUrl: string
      reason: string
    }
    concealer?: {
      shade: string
      brand: string
      productName: string
      price: number
      imageUrl: string
      reason: string
    }
    eyeshadow?: {
      palette: string
      brand: string
      colors: string[]
      price: number
      imageUrl: string
      reason: string
    }
    blush?: {
      shade: string
      brand: string
      productName: string
      price: number
      imageUrl: string
      reason: string
    }
    lipstick?: {
      shade: string
      brand: string
      productName: string
      price: number
      finish: "matte" | "cream" | "gloss" | "satin"
      imageUrl: string
      reason: string
    }
  }
  skincareRecommendations: {
    cleanser?: {
      brand: string
      productName: string
      price: number
      skinConcerns: string[]
      keyIngredients: string[]
      imageUrl: string
      reason: string
    }
    toner?: {
      brand: string
      productName: string
      price: number
      skinConcerns: string[]
      keyIngredients: string[]
      imageUrl: string
      reason: string
    }
    serum?: {
      brand: string
      productName: string
      price: number
      skinConcerns: string[]
      keyIngredients: string[]
      imageUrl: string
      reason: string
    }
    moisturizer?: {
      brand: string
      productName: string
      price: number
      skinConcerns: string[]
      keyIngredients: string[]
      imageUrl: string
      reason: string
    }
    sunscreen?: {
      brand: string
      productName: string
      price: number
      spf: number
      finish: "matte" | "natural" | "dewy"
      imageUrl: string
      reason: string
    }
  }
  hairRecommendations: {
    hairstyles: {
      name: string
      description: string
      imageUrl: string
      reason: string
    }[]
    hairColor: {
      name: string
      description: string
      imageUrl: string
      reason: string
    }
    haircare: {
      brand: string
      productName: string
      price: number
      hairConcerns: string[]
      imageUrl: string
      reason: string
    }[]
  }
  fashionRecommendations: {
    outfits: {
      name: string
      description: string
      imageUrl: string
      reason: string
      items: {
        type: string
        brand: string
        productName: string
        price: number
        imageUrl: string
      }[]
    }[]
    accessories: {
      type: string
      brand: string
      productName: string
      price: number
      imageUrl: string
      reason: string
    }[]
    avoidStyles: string[]
  }
}

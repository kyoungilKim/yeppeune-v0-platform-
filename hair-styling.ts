export interface HairModel {
  id: string
  name: string
  category: "short" | "medium" | "long" | "curly" | "straight" | "wavy" | "updo"
  thumbnail: string
  modelUrl: string
  supportedGenders: ("female" | "male" | "unisex")[]
  defaultColor: string
  description?: string
}

export interface HairColor {
  id: string
  name: string
  hexColor: string
  category: "natural" | "fantasy" | "highlights" | "ombre" | "balayage"
  thumbnail: string
}

export interface HairStylePreset {
  id: string
  name: string
  modelId: string
  colorId: string
  styling: HairStylingParams
  thumbnail: string
  popularity: number
}

export interface HairStylingParams {
  volume: number // 0-100
  curl: number // 0-100
  length: number // 0-100
  layering: number // 0-100
  bangs: number // 0-100
  parting: "left" | "center" | "right" | "none"
  highlights?: {
    color: string
    intensity: number
    pattern: "streaks" | "tips" | "random" | "roots"
  }
}

export interface HairSimulationSettings {
  physics: {
    gravity: number
    stiffness: number
    damping: number
    wind: number
  }
  quality: "low" | "medium" | "high" | "ultra"
  renderSettings: {
    shadows: boolean
    reflection: boolean
    subsurfaceScattering: boolean
    antiAliasing: boolean
  }
}

export interface HairStylingSession {
  id: string
  userId: string
  timestamp: Date
  selectedModel: HairModel
  selectedColor: HairColor
  stylingParams: HairStylingParams
  capturedImage?: string
  notes?: string
}

export interface HairRecommendation {
  hairStyle: HairModel
  color: HairColor
  confidence: number
  reason: string
  faceShape: string
}

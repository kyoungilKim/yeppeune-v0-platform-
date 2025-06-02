export interface MakeupFilter {
  id: string
  name: string
  category: "foundation" | "lipstick" | "eyeshadow" | "blush" | "eyeliner" | "eyebrow"
  color: string
  intensity: number
  imageUrl: string
  coordinates?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number }
  rightEye: { x: number; y: number }
  nose: { x: number; y: number }
  mouth: { x: number; y: number }
  leftCheek: { x: number; y: number }
  rightCheek: { x: number; y: number }
  forehead: { x: number; y: number }
  chin: { x: number; y: number }
}

export interface ARMakeupSession {
  id: string
  userId: string
  timestamp: Date
  appliedFilters: MakeupFilter[]
  capturedImage?: string
  faceAnalysisId?: string
}

export interface MakeupProduct {
  id: string
  brand: string
  name: string
  category: string
  color: string
  price: number
  imageUrl: string
  arFilterId?: string
}

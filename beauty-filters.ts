export interface BeautyFilter {
  id: string
  name: string
  category: "beauty" | "mood" | "effect" | "color"
  type: "static" | "animated" | "interactive"
  intensity: number
  parameters: Record<string, number>
  thumbnail: string
  premium?: boolean
}

export interface FilterEffect {
  id: string
  name: string
  type: "particles" | "overlay" | "distortion" | "glow"
  animation?: {
    duration: number
    easing: string
    loop: boolean
  }
  particles?: {
    count: number
    size: number
    speed: number
    color: string
    shape: "circle" | "heart" | "star" | "sparkle"
  }
}

export interface BeautyAdjustment {
  smoothing: number // 피부 보정 (0-100)
  whitening: number // 화이트닝 (0-100)
  eyeEnlarge: number // 눈 확대 (0-100)
  faceSlim: number // 얼굴 슬림 (0-100)
  noseThin: number // 코 축소 (0-100)
  lipEnhance: number // 입술 강화 (0-100)
  brightness: number // 밝기 (-100 to 100)
  contrast: number // 대비 (-100 to 100)
  saturation: number // 채도 (-100 to 100)
  warmth: number // 색온도 (-100 to 100)
  vignette: number // 비네팅 (0-100)
  blur: number // 배경 블러 (0-100)
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  thumbnail: string
  filters: BeautyFilter[]
  adjustments: Partial<BeautyAdjustment>
  effects: FilterEffect[]
  creator?: string
  likes: number
  downloads: number
  tags: string[]
}

export interface SocialShare {
  platform: "instagram" | "tiktok" | "snapchat" | "twitter" | "facebook"
  format: "image" | "video" | "story"
  resolution: "720p" | "1080p" | "4k"
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5"
}

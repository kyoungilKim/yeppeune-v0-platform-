export interface MakeupTutorial {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number // 분 단위
  category: "daily" | "office" | "party" | "wedding" | "seasonal" | "trend"
  thumbnail: string
  authorId: string
  authorName: string
  authorAvatar?: string
  rating: number
  ratingCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
  tags: string[]
  featured: boolean
}

export interface TutorialStep {
  id: string
  tutorialId: string
  order: number
  title: string
  description: string
  duration: number // 초 단위
  productCategory: string
  productName?: string
  productImage?: string
  arFilterId?: string
  videoUrl?: string
  imageUrl?: string
  tipText?: string
}

export interface TutorialProgress {
  userId: string
  tutorialId: string
  currentStep: number
  completed: boolean
  startedAt: Date
  completedAt?: Date
  timeSpent: number // 초 단위
  rating?: number
  feedback?: string
}

export interface ARFilter {
  id: string
  name: string
  category: string
  previewUrl: string
  filterUrl: string
  parameters: Record<string, any>
}

export interface TutorialRecommendation {
  tutorialId: string
  userId: string
  score: number
  reason: string
  timestamp: Date
}

export interface UserSkillLevel {
  userId: string
  skillLevel: "beginner" | "intermediate" | "advanced"
  completedTutorials: number
  lastAssessment: Date
}

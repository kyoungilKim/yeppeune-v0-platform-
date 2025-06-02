import type { FaceLandmarks } from "./path-to-face-landmarks" // Assuming FaceLandmarks is declared in another file

export interface MakeupCoachSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  targetLook: string
  difficulty: "beginner" | "intermediate" | "advanced"
  currentStep: number
  totalSteps: number
  overallScore: number
  feedback: CoachFeedback[]
  improvements: string[]
  achievements: Achievement[]
  nextRecommendations: string[]
}

export interface CoachFeedback {
  id: string
  timestamp: Date
  step: string
  category: "technique" | "color" | "placement" | "blending" | "symmetry" | "overall"
  severity: "info" | "warning" | "error" | "success"
  message: string
  suggestion: string
  confidence: number
  audioEnabled: boolean
  visualGuide?: {
    type: "arrow" | "circle" | "highlight" | "overlay"
    position: { x: number; y: number }
    size: number
    color: string
    animation?: string
  }
}

export interface MakeupAnalysis {
  faceDetection: {
    isDetected: boolean
    landmarks: FaceLandmarks
    symmetry: number
    lighting: "poor" | "fair" | "good" | "excellent"
    angle: "front" | "slight_left" | "slight_right" | "too_angled"
  }

  currentMakeup: {
    foundation: {
      coverage: number
      evenness: number
      shade_match: number
      blending: number
      finish: "matte" | "natural" | "dewy"
    }

    eyebrows: {
      shape: number
      symmetry: number
      color_match: number
      fullness: number
      definition: number
    }

    eyeshadow: {
      color_harmony: number
      blending: number
      placement: number
      intensity: number
      technique: string
    }

    eyeliner: {
      precision: number
      symmetry: number
      thickness: number
      style: string
      smudging: number
    }

    mascara: {
      coverage: number
      separation: number
      length: number
      volume: number
      clumping: number
    }

    blush: {
      placement: number
      intensity: number
      blending: number
      color_harmony: number
      symmetry: number
    }

    lips: {
      precision: number
      color_intensity: number
      evenness: number
      shape_enhancement: number
      bleeding: number
    }

    overall: {
      harmony: number
      balance: number
      technique: number
      finish: number
      suitability: number
    }
  }
}

export interface CoachingStep {
  id: string
  name: string
  description: string
  duration: number
  difficulty: number
  keyPoints: string[]
  commonMistakes: string[]
  successCriteria: {
    metric: string
    threshold: number
    weight: number
  }[]
  visualGuides: {
    type: "video" | "image" | "animation"
    url: string
    description: string
  }[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
  category: "technique" | "consistency" | "improvement" | "creativity"
  points: number
}

export interface LearningPath {
  id: string
  title: string
  description: string
  level: "beginner" | "intermediate" | "advanced"
  estimatedDuration: number
  steps: CoachingStep[]
  prerequisites: string[]
  rewards: Achievement[]
}

export interface CoachSettings {
  voiceEnabled: boolean
  voiceLanguage: "ko" | "en"
  feedbackFrequency: "minimal" | "normal" | "detailed"
  encouragementLevel: "low" | "medium" | "high"
  criticalFeedback: boolean
  realTimeCorrection: boolean
  pauseOnMistakes: boolean
  showConfidenceScores: boolean
}

export interface SkillProgress {
  category: string
  currentLevel: number
  maxLevel: number
  experience: number
  nextLevelExp: number
  strengths: string[]
  weaknesses: string[]
  recentImprovement: number
  practiceTime: number
  sessionsCompleted: number
}

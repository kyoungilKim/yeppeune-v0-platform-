import type {
  MakeupCoachSession,
  CoachFeedback,
  MakeupAnalysis,
  CoachingStep,
  Achievement,
  LearningPath,
  CoachSettings,
  SkillProgress,
} from "@/types/makeup-coach"
import { MakeupAnalysisEngine } from "./makeup-analysis-engine"

export class MakeupCoachService {
  private static instance: MakeupCoachService
  private analysisEngine: MakeupAnalysisEngine
  private currentSession: MakeupCoachSession | null = null
  private feedbackHistory: CoachFeedback[] = []
  private settings: CoachSettings
  private speechSynthesis: SpeechSynthesis | null = null

  constructor() {
    this.analysisEngine = MakeupAnalysisEngine.getInstance()
    this.settings = this.getDefaultSettings()

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis
    }
  }

  static getInstance(): MakeupCoachService {
    if (!this.instance) {
      this.instance = new MakeupCoachService()
    }
    return this.instance
  }

  /**
   * 코칭 세션 시작
   */
  async startCoachingSession(
    userId: string,
    targetLook: string,
    difficulty: "beginner" | "intermediate" | "advanced",
  ): Promise<MakeupCoachSession> {
    const session: MakeupCoachSession = {
      id: `session_${Date.now()}`,
      userId,
      startTime: new Date(),
      targetLook,
      difficulty,
      currentStep: 0,
      totalSteps: this.getStepsForLook(targetLook).length,
      overallScore: 0,
      feedback: [],
      improvements: [],
      achievements: [],
      nextRecommendations: [],
    }

    this.currentSession = session
    this.feedbackHistory = []

    // 환영 메시지
    await this.provideFeedback({
      step: "시작",
      category: "overall",
      severity: "info",
      message: `${targetLook} 메이크업 코칭을 시작합니다!`,
      suggestion: "편안한 자세로 앉아서 조명을 확인해주세요.",
      confidence: 100,
    })

    return session
  }

  /**
   * 실시간 분석 및 피드백 제공
   */
  async analyzeAndProvideFeedback(imageData: ImageData): Promise<CoachFeedback[]> {
    if (!this.currentSession) {
      throw new Error("활성 코칭 세션이 없습니다")
    }

    try {
      // 1. 메이크업 분석
      const analysis = await this.analysisEngine.analyzeFrame(imageData)

      // 2. 피드백 생성
      const feedbacks = await this.generateFeedback(analysis)

      // 3. 피드백 저장
      this.feedbackHistory.push(...feedbacks)
      this.currentSession.feedback.push(...feedbacks)

      // 4. 음성 피드백 (설정에 따라)
      if (this.settings.voiceEnabled) {
        await this.provideSpeechFeedback(feedbacks)
      }

      return feedbacks
    } catch (error) {
      console.error("분석 및 피드백 제공 중 오류:", error)
      return []
    }
  }

  /**
   * 피드백 생성
   */
  private async generateFeedback(analysis: MakeupAnalysis): Promise<CoachFeedback[]> {
    const feedbacks: CoachFeedback[] = []
    const currentStep = this.getCurrentStep()

    // 1. 기본 환경 체크
    feedbacks.push(...this.checkEnvironment(analysis))

    // 2. 현재 단계별 피드백
    if (currentStep) {
      feedbacks.push(...this.checkStepProgress(analysis, currentStep))
    }

    // 3. 기술적 피드백
    feedbacks.push(...this.checkTechnique(analysis))

    // 4. 대칭성 피드백
    feedbacks.push(...this.checkSymmetry(analysis))

    // 5. 색상 조화 피드백
    feedbacks.push(...this.checkColorHarmony(analysis))

    // 6. 전체적인 피드백
    feedbacks.push(...this.checkOverall(analysis))

    return feedbacks.filter((f) => f.confidence > 70) // 신뢰도 70% 이상만 반환
  }

  /**
   * 환경 체크 (조명, 각도 등)
   */
  private checkEnvironment(analysis: MakeupAnalysis): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 조명 체크
    if (analysis.faceDetection.lighting === "poor") {
      feedbacks.push({
        id: `feedback_${Date.now()}_lighting`,
        timestamp: new Date(),
        step: "환경 설정",
        category: "overall",
        severity: "warning",
        message: "조명이 부족합니다",
        suggestion: "더 밝은 곳으로 이동하거나 조명을 추가해주세요. 자연광이 가장 좋습니다.",
        confidence: 95,
        audioEnabled: true,
        visualGuide: {
          type: "highlight",
          position: { x: 50, y: 20 },
          size: 100,
          color: "#FFA500",
          animation: "pulse",
        },
      })
    }

    // 얼굴 각도 체크
    if (analysis.faceDetection.angle === "too_angled") {
      feedbacks.push({
        id: `feedback_${Date.now()}_angle`,
        timestamp: new Date(),
        step: "자세 교정",
        category: "overall",
        severity: "warning",
        message: "얼굴이 너무 기울어져 있습니다",
        suggestion: "카메라를 정면으로 바라보고 턱을 살짝 들어주세요.",
        confidence: 90,
        audioEnabled: true,
        visualGuide: {
          type: "arrow",
          position: { x: 50, y: 50 },
          size: 50,
          color: "#FF6B6B",
          animation: "bounce",
        },
      })
    }

    // 얼굴 감지 체크
    if (!analysis.faceDetection.isDetected) {
      feedbacks.push({
        id: `feedback_${Date.now()}_detection`,
        timestamp: new Date(),
        step: "얼굴 감지",
        category: "overall",
        severity: "error",
        message: "얼굴을 감지할 수 없습니다",
        suggestion: "카메라에 얼굴이 잘 보이도록 위치를 조정해주세요.",
        confidence: 100,
        audioEnabled: true,
      })
    }

    return feedbacks
  }

  /**
   * 단계별 진행 상황 체크
   */
  private checkStepProgress(analysis: MakeupAnalysis, step: CoachingStep): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 단계별 성공 기준 체크
    for (const criteria of step.successCriteria) {
      const score = this.getScoreForMetric(analysis, criteria.metric)

      if (score < criteria.threshold) {
        const severity = score < criteria.threshold * 0.5 ? "error" : "warning"

        feedbacks.push({
          id: `feedback_${Date.now()}_${criteria.metric}`,
          timestamp: new Date(),
          step: step.name,
          category: this.getCategoryForMetric(criteria.metric),
          severity,
          message: this.getMessageForMetric(criteria.metric, score),
          suggestion: this.getSuggestionForMetric(criteria.metric, score),
          confidence: 85,
          audioEnabled: severity === "error",
        })
      } else if (score > criteria.threshold * 1.2) {
        // 우수한 성과에 대한 격려
        feedbacks.push({
          id: `feedback_${Date.now()}_${criteria.metric}_good`,
          timestamp: new Date(),
          step: step.name,
          category: this.getCategoryForMetric(criteria.metric),
          severity: "success",
          message: this.getSuccessMessageForMetric(criteria.metric),
          suggestion: "훌륭합니다! 이 상태를 유지해주세요.",
          confidence: 90,
          audioEnabled: this.settings.encouragementLevel !== "low",
        })
      }
    }

    return feedbacks
  }

  /**
   * 기술적 피드백 체크
   */
  private checkTechnique(analysis: MakeupAnalysis): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 블렌딩 체크
    if (analysis.currentMakeup.eyeshadow.blending < 70) {
      feedbacks.push({
        id: `feedback_${Date.now()}_blending`,
        timestamp: new Date(),
        step: "아이섀도우",
        category: "technique",
        severity: "warning",
        message: "아이섀도우 블렌딩이 부족합니다",
        suggestion: "브러시를 이용해 경계선을 더 부드럽게 블렌딩해주세요. 원을 그리듯 부드럽게 문질러주세요.",
        confidence: 80,
        audioEnabled: true,
        visualGuide: {
          type: "circle",
          position: { x: 30, y: 35 }, // 왼쪽 눈 위치
          size: 40,
          color: "#4ECDC4",
          animation: "rotate",
        },
      })
    }

    // 파운데이션 블렌딩 체크
    if (analysis.currentMakeup.foundation.blending < 75) {
      feedbacks.push({
        id: `feedback_${Date.now()}_foundation_blending`,
        timestamp: new Date(),
        step: "베이스 메이크업",
        category: "technique",
        severity: "warning",
        message: "파운데이션 블렌딩이 고르지 않습니다",
        suggestion: "스펀지나 브러시로 경계선을 더 자연스럽게 블렌딩해주세요.",
        confidence: 85,
        audioEnabled: true,
      })
    }

    return feedbacks
  }

  /**
   * 대칭성 체크
   */
  private checkSymmetry(analysis: MakeupAnalysis): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 아이브로우 대칭성
    if (analysis.currentMakeup.eyebrows.symmetry < 80) {
      feedbacks.push({
        id: `feedback_${Date.now()}_brow_symmetry`,
        timestamp: new Date(),
        step: "아이브로우",
        category: "symmetry",
        severity: "warning",
        message: "아이브로우가 비대칭입니다",
        suggestion: "거울을 보며 양쪽 눈썹의 모양과 높이를 맞춰주세요.",
        confidence: 88,
        audioEnabled: true,
        visualGuide: {
          type: "overlay",
          position: { x: 50, y: 30 },
          size: 200,
          color: "#FF6B6B",
        },
      })
    }

    // 아이라이너 대칭성
    if (analysis.currentMakeup.eyeliner.symmetry < 75) {
      feedbacks.push({
        id: `feedback_${Date.now()}_liner_symmetry`,
        timestamp: new Date(),
        step: "아이라이너",
        category: "symmetry",
        severity: "warning",
        message: "아이라이너가 비대칭입니다",
        suggestion: "양쪽 눈의 라인 두께와 각도를 맞춰주세요.",
        confidence: 82,
        audioEnabled: true,
      })
    }

    return feedbacks
  }

  /**
   * 색상 조화 체크
   */
  private checkColorHarmony(analysis: MakeupAnalysis): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 아이섀도우 색상 조화
    if (analysis.currentMakeup.eyeshadow.color_harmony < 70) {
      feedbacks.push({
        id: `feedback_${Date.now()}_color_harmony`,
        timestamp: new Date(),
        step: "아이섀도우",
        category: "color",
        severity: "info",
        message: "색상 조화를 개선할 수 있습니다",
        suggestion: "피부톤에 더 어울리는 색상을 선택하거나 색상 간 그라데이션을 부드럽게 해주세요.",
        confidence: 75,
        audioEnabled: false,
      })
    }

    // 블러셔 색상 조화
    if (analysis.currentMakeup.blush.color_harmony < 75) {
      feedbacks.push({
        id: `feedback_${Date.now()}_blush_harmony`,
        timestamp: new Date(),
        step: "블러셔",
        category: "color",
        severity: "info",
        message: "블러셔 색상이 전체적인 메이크업과 잘 어울리지 않습니다",
        suggestion: "립 색상과 조화를 이루는 블러셔 색상을 선택해보세요.",
        confidence: 78,
        audioEnabled: false,
      })
    }

    return feedbacks
  }

  /**
   * 전체적인 피드백 체크
   */
  private checkOverall(analysis: MakeupAnalysis): CoachFeedback[] {
    const feedbacks: CoachFeedback[] = []

    // 전체 점수 계산
    const overallScore = this.calculateOverallScore(analysis)

    if (overallScore >= 90) {
      feedbacks.push({
        id: `feedback_${Date.now()}_excellent`,
        timestamp: new Date(),
        step: "전체 평가",
        category: "overall",
        severity: "success",
        message: "훌륭한 메이크업입니다!",
        suggestion: "완벽한 마무리를 위해 세팅 스프레이를 사용해보세요.",
        confidence: 95,
        audioEnabled: true,
      })
    } else if (overallScore >= 80) {
      feedbacks.push({
        id: `feedback_${Date.now()}_good`,
        timestamp: new Date(),
        step: "전체 평가",
        category: "overall",
        severity: "success",
        message: "좋은 메이크업입니다!",
        suggestion: "몇 가지 세부사항만 조정하면 더욱 완벽해질 것 같아요.",
        confidence: 90,
        audioEnabled: true,
      })
    } else if (overallScore < 60) {
      feedbacks.push({
        id: `feedback_${Date.now()}_needs_improvement`,
        timestamp: new Date(),
        step: "전체 평가",
        category: "overall",
        severity: "warning",
        message: "개선이 필요한 부분들이 있습니다",
        suggestion: "천천히 단계별로 다시 시도해보세요. 연습이 완벽을 만듭니다!",
        confidence: 85,
        audioEnabled: true,
      })
    }

    return feedbacks
  }

  /**
   * 음성 피드백 제공
   */
  private async provideSpeechFeedback(feedbacks: CoachFeedback[]): Promise<void> {
    if (!this.speechSynthesis || feedbacks.length === 0) return

    // 중요도가 높은 피드백만 음성으로 제공
    const importantFeedbacks = feedbacks.filter(
      (f) => f.audioEnabled && (f.severity === "error" || f.severity === "warning" || f.severity === "success"),
    )

    for (const feedback of importantFeedbacks.slice(0, 2)) {
      // 최대 2개까지만
      const utterance = new SpeechSynthesisUtterance(feedback.message)
      utterance.lang = this.settings.voiceLanguage === "ko" ? "ko-KR" : "en-US"
      utterance.rate = 0.9
      utterance.pitch = 1.0

      this.speechSynthesis.speak(utterance)

      // 다음 음성 사이에 간격 두기
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  /**
   * 다음 단계로 진행
   */
  async proceedToNextStep(): Promise<boolean> {
    if (!this.currentSession) return false

    const steps = this.getStepsForLook(this.currentSession.targetLook)

    if (this.currentSession.currentStep < steps.length - 1) {
      this.currentSession.currentStep++

      await this.provideFeedback({
        step: steps[this.currentSession.currentStep].name,
        category: "overall",
        severity: "info",
        message: `${steps[this.currentSession.currentStep].name} 단계를 시작합니다`,
        suggestion: steps[this.currentSession.currentStep].description,
        confidence: 100,
      })

      return true
    }

    return false
  }

  /**
   * 세션 완료
   */
  async completeSession(): Promise<MakeupCoachSession> {
    if (!this.currentSession) {
      throw new Error("활성 세션이 없습니다")
    }

    this.currentSession.endTime = new Date()
    this.currentSession.overallScore = this.calculateSessionScore()
    this.currentSession.achievements = await this.calculateAchievements()
    this.currentSession.nextRecommendations = this.generateNextRecommendations()

    // 세션 데이터 저장 (실제 구현에서는 데이터베이스에 저장)
    await this.saveSession(this.currentSession)

    const completedSession = { ...this.currentSession }
    this.currentSession = null
    this.feedbackHistory = []

    return completedSession
  }

  /**
   * 설정 업데이트
   */
  updateSettings(newSettings: Partial<CoachSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  /**
   * 현재 설정 반환
   */
  getSettings(): CoachSettings {
    return { ...this.settings }
  }

  // 헬퍼 메서드들
  private getDefaultSettings(): CoachSettings {
    return {
      voiceEnabled: true,
      voiceLanguage: "ko",
      feedbackFrequency: "normal",
      encouragementLevel: "medium",
      criticalFeedback: true,
      realTimeCorrection: true,
      pauseOnMistakes: false,
      showConfidenceScores: false,
    }
  }

  private getCurrentStep(): CoachingStep | null {
    if (!this.currentSession) return null

    const steps = this.getStepsForLook(this.currentSession.targetLook)
    return steps[this.currentSession.currentStep] || null
  }

  private getStepsForLook(targetLook: string): CoachingStep[] {
    // 실제 구현에서는 데이터베이스에서 가져옴
    const basicSteps: CoachingStep[] = [
      {
        id: "step_1",
        name: "베이스 메이크업",
        description: "파운데이션과 컨실러로 깔끔한 베이스를 만들어주세요",
        duration: 300,
        difficulty: 1,
        keyPoints: ["고른 발색", "자연스러운 블렌딩", "적절한 커버리지"],
        commonMistakes: ["과도한 사용", "블렌딩 부족", "색상 불일치"],
        successCriteria: [
          { metric: "foundation_evenness", threshold: 80, weight: 0.4 },
          { metric: "foundation_blending", threshold: 75, weight: 0.3 },
          { metric: "foundation_coverage", threshold: 70, weight: 0.3 },
        ],
        visualGuides: [],
      },
      {
        id: "step_2",
        name: "아이브로우",
        description: "자연스럽고 균형잡힌 아이브로우를 그려주세요",
        duration: 240,
        difficulty: 2,
        keyPoints: ["자연스러운 모양", "좌우 대칭", "적절한 색상"],
        commonMistakes: ["과도한 그리기", "비대칭", "부자연스러운 색상"],
        successCriteria: [
          { metric: "eyebrow_symmetry", threshold: 80, weight: 0.4 },
          { metric: "eyebrow_shape", threshold: 75, weight: 0.3 },
          { metric: "eyebrow_color_match", threshold: 70, weight: 0.3 },
        ],
        visualGuides: [],
      },
      // ... 더 많은 단계들
    ]

    return basicSteps
  }

  private async provideFeedback(feedback: Omit<CoachFeedback, "id" | "timestamp" | "audioEnabled">): Promise<void> {
    const fullFeedback: CoachFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}`,
      timestamp: new Date(),
      audioEnabled: feedback.severity !== "info",
    }

    this.feedbackHistory.push(fullFeedback)

    if (this.currentSession) {
      this.currentSession.feedback.push(fullFeedback)
    }

    if (this.settings.voiceEnabled && fullFeedback.audioEnabled) {
      await this.provideSpeechFeedback([fullFeedback])
    }
  }

  private getScoreForMetric(analysis: MakeupAnalysis, metric: string): number {
    const parts = metric.split("_")
    const category = parts[0]
    const property = parts.slice(1).join("_")

    switch (category) {
      case "foundation":
        return (
          (analysis.currentMakeup.foundation[property as keyof typeof analysis.currentMakeup.foundation] as number) || 0
        )
      case "eyebrow":
        return (
          (analysis.currentMakeup.eyebrows[property as keyof typeof analysis.currentMakeup.eyebrows] as number) || 0
        )
      case "eyeshadow":
        return (
          (analysis.currentMakeup.eyeshadow[property as keyof typeof analysis.currentMakeup.eyeshadow] as number) || 0
        )
      case "eyeliner":
        return (
          (analysis.currentMakeup.eyeliner[property as keyof typeof analysis.currentMakeup.eyeliner] as number) || 0
        )
      case "mascara":
        return (analysis.currentMakeup.mascara[property as keyof typeof analysis.currentMakeup.mascara] as number) || 0
      case "blush":
        return (analysis.currentMakeup.blush[property as keyof typeof analysis.currentMakeup.blush] as number) || 0
      case "lips":
        return (analysis.currentMakeup.lips[property as keyof typeof analysis.currentMakeup.lips] as number) || 0
      case "overall":
        return (analysis.currentMakeup.overall[property as keyof typeof analysis.currentMakeup.overall] as number) || 0
      default:
        return 0
    }
  }

  private getCategoryForMetric(metric: string): CoachFeedback["category"] {
    if (metric.includes("symmetry")) return "symmetry"
    if (metric.includes("color")) return "color"
    if (metric.includes("blending") || metric.includes("technique")) return "technique"
    if (metric.includes("placement")) return "placement"
    return "overall"
  }

  private getMessageForMetric(metric: string, score: number): string {
    const messages: Record<string, string> = {
      foundation_evenness: `파운데이션이 고르지 않습니다 (${score}점)`,
      foundation_blending: `파운데이션 블렌딩이 부족합니다 (${score}점)`,
      eyebrow_symmetry: `아이브로우가 비대칭입니다 (${score}점)`,
      eyeshadow_blending: `아이섀도우 블렌딩이 부족합니다 (${score}점)`,
      // ... 더 많은 메시지들
    }
    return messages[metric] || `${metric}에서 개선이 필요합니다 (${score}점)`
  }

  private getSuggestionForMetric(metric: string, score: number): string {
    const suggestions: Record<string, string> = {
      foundation_evenness: "스펀지나 브러시로 더 꼼꼼히 발라주세요",
      foundation_blending: "경계선을 부드럽게 블렌딩해주세요",
      eyebrow_symmetry: "거울을 보며 양쪽 눈썹의 높이와 모양을 맞춰주세요",
      eyeshadow_blending: "브러시로 경계선을 원을 그리듯 부드럽게 블렌딩해주세요",
      // ... 더 많은 제안들
    }
    return suggestions[metric] || "천천히 다시 시도해보세요"
  }

  private getSuccessMessageForMetric(metric: string): string {
    const messages: Record<string, string> = {
      foundation_evenness: "파운데이션이 매우 고르게 발려있어요!",
      eyebrow_symmetry: "아이브로우가 완벽하게 대칭이에요!",
      eyeshadow_blending: "아이섀도우 블렌딩이 훌륭해요!",
      // ... 더 많은 성공 메시지들
    }
    return messages[metric] || "훌륭합니다!"
  }

  private calculateOverallScore(analysis: MakeupAnalysis): number {
    const scores = [
      analysis.currentMakeup.foundation.evenness,
      analysis.currentMakeup.eyebrows.symmetry,
      analysis.currentMakeup.eyeshadow.blending,
      analysis.currentMakeup.overall.harmony,
    ]

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  private calculateSessionScore(): number {
    if (!this.currentSession) return 0

    const feedbacks = this.currentSession.feedback
    const errorCount = feedbacks.filter((f) => f.severity === "error").length
    const warningCount = feedbacks.filter((f) => f.severity === "warning").length
    const successCount = feedbacks.filter((f) => f.severity === "success").length

    // 기본 점수에서 오류와 경고에 따라 차감, 성공에 따라 가산
    let score = 100
    score -= errorCount * 10
    score -= warningCount * 5
    score += successCount * 5

    return Math.max(0, Math.min(100, score))
  }

  private async calculateAchievements(): Promise<Achievement[]> {
    const achievements: Achievement[] = []

    if (!this.currentSession) return achievements

    const sessionScore = this.calculateSessionScore()
    const feedbacks = this.currentSession.feedback

    // 완벽한 세션 달성
    if (sessionScore >= 95) {
      achievements.push({
        id: "perfect_session",
        title: "완벽한 메이크업",
        description: "95점 이상의 완벽한 메이크업을 완성했습니다",
        icon: "🏆",
        unlockedAt: new Date(),
        category: "technique",
        points: 100,
      })
    }

    // 대칭성 마스터
    const symmetryFeedbacks = feedbacks.filter((f) => f.category === "symmetry" && f.severity === "success")
    if (symmetryFeedbacks.length >= 3) {
      achievements.push({
        id: "symmetry_master",
        title: "대칭성 마스터",
        description: "완벽한 대칭 메이크업을 완성했습니다",
        icon: "⚖️",
        unlockedAt: new Date(),
        category: "technique",
        points: 50,
      })
    }

    // 색상 조화 전문가
    const colorFeedbacks = feedbacks.filter((f) => f.category === "color" && f.severity === "success")
    if (colorFeedbacks.length >= 2) {
      achievements.push({
        id: "color_harmony_expert",
        title: "색상 조화 전문가",
        description: "뛰어난 색상 조화를 보여주었습니다",
        icon: "🎨",
        unlockedAt: new Date(),
        category: "creativity",
        points: 75,
      })
    }

    return achievements
  }

  private generateNextRecommendations(): string[] {
    const recommendations: string[] = []

    if (!this.currentSession) return recommendations

    const sessionScore = this.calculateSessionScore()
    const feedbacks = this.currentSession.feedback

    // 점수에 따른 추천
    if (sessionScore < 70) {
      recommendations.push("기초 메이크업 튜토리얼을 다시 연습해보세요")
      recommendations.push("블렌딩 기법에 집중한 연습을 추천합니다")
    } else if (sessionScore < 85) {
      recommendations.push("중급 메이크업 기법을 도전해보세요")
      recommendations.push("색상 조화에 대해 더 학습해보세요")
    } else {
      recommendations.push("고급 메이크업 스타일에 도전해보세요")
      recommendations.push("창의적인 아이메이크업을 시도해보세요")
    }

    // 약점 기반 추천
    const weaknesses = this.identifyWeaknesses(feedbacks)
    for (const weakness of weaknesses) {
      recommendations.push(`${weakness} 개선을 위한 전용 연습을 추천합니다`)
    }

    return recommendations.slice(0, 5) // 최대 5개까지
  }

  private identifyWeaknesses(feedbacks: CoachFeedback[]): string[] {
    const weaknesses: string[] = []
    const categoryCount: Record<string, number> = {}

    // 경고와 오류 피드백의 카테고리별 빈도 계산
    feedbacks
      .filter((f) => f.severity === "warning" || f.severity === "error")
      .forEach((f) => {
        categoryCount[f.category] = (categoryCount[f.category] || 0) + 1
      })

    // 빈도가 높은 카테고리를 약점으로 식별
    Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([category]) => {
        switch (category) {
          case "technique":
            weaknesses.push("메이크업 기법")
            break
          case "symmetry":
            weaknesses.push("대칭성")
            break
          case "color":
            weaknesses.push("색상 선택")
            break
          case "blending":
            weaknesses.push("블렌딩")
            break
          case "placement":
            weaknesses.push("제품 배치")
            break
        }
      })

    return weaknesses
  }

  private async saveSession(session: MakeupCoachSession): Promise<void> {
    // 실제 구현에서는 Firebase나 다른 데이터베이스에 저장
    try {
      const sessionData = {
        ...session,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // 로컬 스토리지에 임시 저장 (실제로는 서버에 저장)
      const existingSessions = JSON.parse(localStorage.getItem("makeup_coach_sessions") || "[]")
      existingSessions.push(sessionData)
      localStorage.setItem("makeup_coach_sessions", JSON.stringify(existingSessions))

      console.log("세션이 성공적으로 저장되었습니다:", session.id)
    } catch (error) {
      console.error("세션 저장 중 오류:", error)
    }
  }

  /**
   * 사용자의 스킬 진행상황 조회
   */
  async getUserSkillProgress(userId: string): Promise<SkillProgress[]> {
    // 실제 구현에서는 데이터베이스에서 조회
    const mockProgress: SkillProgress[] = [
      {
        category: "베이스 메이크업",
        currentLevel: 3,
        maxLevel: 5,
        experience: 750,
        nextLevelExp: 1000,
        strengths: ["파운데이션 발색", "컨실러 사용"],
        weaknesses: ["블렌딩", "색상 매칭"],
        recentImprovement: 15,
        practiceTime: 1200, // 분
        sessionsCompleted: 8,
      },
      {
        category: "아이 메이크업",
        currentLevel: 2,
        maxLevel: 5,
        experience: 450,
        nextLevelExp: 600,
        strengths: ["아이섀도우 배치"],
        weaknesses: ["아이라이너 대칭", "마스카라 적용"],
        recentImprovement: 25,
        practiceTime: 800,
        sessionsCompleted: 5,
      },
    ]

    return mockProgress
  }

  /**
   * 학습 경로 추천
   */
  async getRecommendedLearningPaths(userId: string): Promise<LearningPath[]> {
    const skillProgress = await this.getUserSkillProgress(userId)

    // 사용자의 현재 레벨에 맞는 학습 경로 추천
    const paths: LearningPath[] = [
      {
        id: "beginner_basics",
        title: "메이크업 기초 마스터",
        description: "메이크업의 기본기를 탄탄히 다지는 과정",
        level: "beginner",
        estimatedDuration: 480, // 8시간
        steps: [],
        prerequisites: [],
        rewards: [],
      },
      {
        id: "intermediate_techniques",
        title: "중급 메이크업 테크닉",
        description: "다양한 메이크업 기법을 익히는 과정",
        level: "intermediate",
        estimatedDuration: 720, // 12시간
        steps: [],
        prerequisites: ["beginner_basics"],
        rewards: [],
      },
    ]

    return paths
  }
}

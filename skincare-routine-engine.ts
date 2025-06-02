import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import type {
  SkincareRoutine,
  SkincareStep,
  SkincareProduct,
  LifestyleFactors,
  RoutineProgress,
  SkincareRecommendation,
  SkinAnalysisHistory,
} from "@/types/skincare-routine"
import type { FaceAnalysis } from "@/types/analysis"
import type { UserPreferences } from "@/types/preferences"
import { PreferencesService } from "./firebase-preferences"

export class SkincareRoutineEngine {
  /**
   * 피부 분석과 사용자 데이터를 바탕으로 맞춤형 스킨케어 루틴을 생성합니다.
   */
  static async generatePersonalizedRoutine(
    userId: string,
    lifestyleFactors?: LifestyleFactors,
  ): Promise<SkincareRoutine> {
    try {
      // 사용자 데이터 수집
      const faceAnalysis = await this.getLatestSkinAnalysis(userId)
      const userPreferences = await PreferencesService.getUserPreferences(userId)
      const skinHistory = await this.getSkinAnalysisHistory(userId, 5)

      if (!faceAnalysis) {
        throw new Error("피부 분석 데이터가 필요합니다.")
      }

      // 라이프스타일 팩터 기본값 설정
      const lifestyle = lifestyleFactors || (await this.inferLifestyleFromPreferences(userPreferences))

      // 스킨케어 루틴 생성
      const routine = await this.createCustomRoutine(faceAnalysis, userPreferences, lifestyle, skinHistory)

      // Firestore에 저장
      const docRef = await addDoc(collection(db, "skincareRoutines"), {
        ...routine,
        createdAt: Timestamp.fromDate(routine.createdAt),
        updatedAt: Timestamp.fromDate(routine.updatedAt),
      })

      return {
        ...routine,
        id: docRef.id,
      }
    } catch (error) {
      console.error("Error generating skincare routine:", error)
      throw error
    }
  }

  /**
   * 피부 분석 데이터를 기반으로 맞춤형 루틴을 생성합니다.
   */
  private static async createCustomRoutine(
    faceAnalysis: FaceAnalysis,
    userPreferences: UserPreferences | null,
    lifestyle: LifestyleFactors,
    skinHistory: SkinAnalysisHistory[],
  ): Promise<Omit<SkincareRoutine, "id">> {
    // 피부 타입과 주요 고민사항 분석
    const skinType = this.determineSkinType(faceAnalysis)
    const primaryConcerns = this.identifyPrimaryConcerns(faceAnalysis, skinHistory)
    const skinGoals = this.generateSkinGoals(primaryConcerns, skinType)

    // 아침 루틴 생성
    const morningSteps = await this.generateMorningRoutine(skinType, primaryConcerns, lifestyle)

    // 저녁 루틴 생성
    const eveningSteps = await this.generateEveningRoutine(skinType, primaryConcerns, lifestyle)

    // 주간/월간 트리트먼트 생성
    const weeklyTreatments = await this.generateWeeklyTreatments(skinType, primaryConcerns, lifestyle)
    const monthlyTreatments = await this.generateMonthlyTreatments(skinType, primaryConcerns, lifestyle)

    // 예상 결과 및 타임라인 생성
    const expectedResults = this.generateExpectedResults(primaryConcerns, skinType)
    const timeline = this.calculateTimeline(primaryConcerns, lifestyle)

    // 비용 계산
    const totalCost = this.calculateTotalCost(morningSteps, eveningSteps, weeklyTreatments, monthlyTreatments)

    // 난이도 결정
    const difficulty = this.determineDifficulty(morningSteps, eveningSteps, weeklyTreatments, lifestyle)

    const routine: Omit<SkincareRoutine, "id"> = {
      userId,
      name: `${skinType} 피부를 위한 맞춤 루틴`,
      description: `${primaryConcerns.join(", ")} 개선을 위한 개인화된 스킨케어 루틴입니다.`,
      skinType,
      primaryConcerns,
      lifestyle,
      morningSteps,
      eveningSteps,
      weeklyTreatments,
      monthlyTreatments,
      goals: skinGoals,
      expectedResults,
      timeline,
      totalCost,
      difficulty,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    return routine
  }

  /**
   * 피부 타입을 결정합니다.
   */
  private static determineSkinType(faceAnalysis: FaceAnalysis): string {
    const { hydration, oiliness, sensitivity } = faceAnalysis.skinAnalysis

    if (sensitivity > 60) {
      return "민감성"
    } else if (oiliness > 70) {
      return "지성"
    } else if (hydration < 40) {
      return "건성"
    } else if (oiliness > 50 && hydration < 60) {
      return "복합성"
    } else {
      return "중성"
    }
  }

  /**
   * 주요 피부 고민사항을 식별합니다.
   */
  private static identifyPrimaryConcerns(faceAnalysis: FaceAnalysis, skinHistory: SkinAnalysisHistory[]): string[] {
    const concerns: string[] = []
    const { skinAnalysis } = faceAnalysis

    // 현재 분석 기반
    if (skinAnalysis.acne > 40) concerns.push("여드름")
    if (skinAnalysis.wrinkles > 50) concerns.push("주름")
    if (skinAnalysis.spots > 50) concerns.push("색소침착")
    if (skinAnalysis.pores > 60) concerns.push("모공")
    if (skinAnalysis.hydration < 40) concerns.push("건조함")
    if (skinAnalysis.oiliness > 70) concerns.push("과도한 유분")
    if (skinAnalysis.redness > 50) concerns.push("홍조")
    if (skinAnalysis.sensitivity > 60) concerns.push("민감성")

    // 히스토리 기반 트렌드 분석
    if (skinHistory.length > 2) {
      const recentAnalyses = skinHistory.slice(0, 3)
      const avgHydration = recentAnalyses.reduce((sum, h) => sum + h.results.hydration, 0) / recentAnalyses.length
      const avgOiliness = recentAnalyses.reduce((sum, h) => sum + h.results.oiliness, 0) / recentAnalyses.length

      if (avgHydration < 45 && !concerns.includes("건조함")) {
        concerns.push("지속적 건조함")
      }
      if (avgOiliness > 65 && !concerns.includes("과도한 유분")) {
        concerns.push("지속적 유분 과다")
      }
    }

    return concerns.slice(0, 4) // 최대 4개까지
  }

  /**
   * 아침 스킨케어 루틴을 생성합니다.
   */
  private static async generateMorningRoutine(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep[]> {
    const steps: SkincareStep[] = []

    // 1. 클렌징
    const cleanser = await this.selectCleanser(skinType, concerns, "morning", lifestyle)
    steps.push(cleanser)

    // 2. 토너 (선택적)
    if (lifestyle.timeAvailable !== "minimal") {
      const toner = await this.selectToner(skinType, concerns, lifestyle)
      steps.push(toner)
    }

    // 3. 세럼/에센스
    const serum = await this.selectMorningSerum(skinType, concerns, lifestyle)
    if (serum) steps.push(serum)

    // 4. 모이스처라이저
    const moisturizer = await this.selectMoisturizer(skinType, concerns, "morning", lifestyle)
    steps.push(moisturizer)

    // 5. 자외선 차단제 (필수)
    const sunscreen = await this.selectSunscreen(skinType, concerns, lifestyle)
    steps.push(sunscreen)

    return steps
  }

  /**
   * 저녁 스킨케어 루틴을 생성합니다.
   */
  private static async generateEveningRoutine(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep[]> {
    const steps: SkincareStep[] = []

    // 1. 메이크업 리무버 (메이크업 착용 시)
    const makeupRemover = await this.selectMakeupRemover(skinType, lifestyle)
    if (makeupRemover) steps.push(makeupRemover)

    // 2. 클렌징
    const cleanser = await this.selectCleanser(skinType, concerns, "evening", lifestyle)
    steps.push(cleanser)

    // 3. 토너
    const toner = await this.selectToner(skinType, concerns, lifestyle)
    steps.push(toner)

    // 4. 트리트먼트 세럼
    const treatmentSerum = await this.selectEveningSerum(skinType, concerns, lifestyle)
    if (treatmentSerum) steps.push(treatmentSerum)

    // 5. 모이스처라이저
    const moisturizer = await this.selectMoisturizer(skinType, concerns, "evening", lifestyle)
    steps.push(moisturizer)

    // 6. 페이스 오일 (건성 피부 또는 겨울철)
    const faceOil = await this.selectFaceOil(skinType, concerns, lifestyle)
    if (faceOil) steps.push(faceOil)

    return steps
  }

  /**
   * 주간 트리트먼트를 생성합니다.
   */
  private static async generateWeeklyTreatments(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep[]> {
    const treatments: SkincareStep[] = []

    // 각질 제거
    if (concerns.includes("모공") || concerns.includes("색소침착")) {
      const exfoliant = await this.selectExfoliant(skinType, concerns, lifestyle)
      treatments.push(exfoliant)
    }

    // 마스크
    const mask = await this.selectWeeklyMask(skinType, concerns, lifestyle)
    if (mask) treatments.push(mask)

    return treatments
  }

  /**
   * 월간 트리트먼트를 생성합니다.
   */
  private static async generateMonthlyTreatments(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep[]> {
    const treatments: SkincareStep[] = []

    // 딥 클렌징 마스크
    const deepCleansingMask = await this.selectDeepCleansingMask(skinType, lifestyle)
    treatments.push(deepCleansingMask)

    // 집중 트리트먼트
    if (concerns.includes("주름") || concerns.includes("색소침착")) {
      const intensiveTreatment = await this.selectIntensiveTreatment(skinType, concerns, lifestyle)
      treatments.push(intensiveTreatment)
    }

    return treatments
  }

  // 제품 선택 메서드들 (실제로는 더 복잡한 로직과 데이터베이스 쿼리)
  private static async selectCleanser(
    skinType: string,
    concerns: string[],
    timing: string,
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const products: SkincareProduct[] = [
      {
        id: "cleanser1",
        name:
          skinType === "지성" ? "포어 클리어 폼 클렌저" : skinType === "건성" ? "젠틀 크림 클렌저" : "밸런싱 젤 클렌저",
        brand: "스킨케어랩",
        category: "cleanser",
        price: skinType === "민감성" ? 28000 : 22000,
        volume: "150ml",
        ingredients:
          skinType === "지성"
            ? ["살리실산", "티트리"]
            : skinType === "건성"
              ? ["세라마이드", "히알루론산"]
              : ["나이아신아마이드", "판테놀"],
        skinTypes: [skinType],
        concerns: concerns.slice(0, 2),
        rating: 4.3,
        reviews: 1250,
        imageUrl: "/placeholder.svg?height=200&width=200",
        description: `${skinType} 피부에 최적화된 ${timing === "morning" ? "순한" : "깊은 세정력의"} 클렌저`,
        howToUse:
          timing === "morning"
            ? "미지근한 물로 가볍게 거품을 내어 30초간 마사지 후 헹궈내세요."
            : "충분한 거품을 내어 1분간 마사지 후 깨끗이 헹궈내세요.",
      },
    ]

    return {
      id: "step_cleanser",
      order: 1,
      name: "클렌징",
      category: "cleanser",
      description: `${skinType} 피부를 위한 ${timing === "morning" ? "부드러운" : "깊은"} 클렌징`,
      instructions:
        timing === "morning"
          ? "미지근한 물로 얼굴을 적신 후, 클렌저를 거품내어 30초간 부드럽게 마사지하고 헹궈내세요."
          : "메이크업과 하루 동안 쌓인 노폐물을 깨끗하게 제거하기 위해 충분한 거품을 내어 1분간 마사지해주세요.",
      timing: timing === "morning" ? ["morning"] : ["evening"],
      frequency: "daily",
      duration: timing === "morning" ? 2 : 3,
      products,
      benefits: [
        `${skinType} 피부에 적합한 세정력`,
        "피부 장벽 보호",
        concerns.includes("여드름") ? "여드름 예방" : concerns.includes("민감성") ? "진정 효과" : "깨끗한 세정",
      ],
      warnings: skinType === "민감성" ? ["과도한 마사지 금지", "뜨거운 물 사용 금지"] : undefined,
    }
  }

  private static async selectToner(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const products: SkincareProduct[] = [
      {
        id: "toner1",
        name: skinType === "지성" ? "BHA 클리어링 토너" : skinType === "건성" ? "하이드라 부스팅 토너" : "밸런싱 토너",
        brand: "뷰티솔루션",
        category: "toner",
        price: 25000,
        volume: "200ml",
        ingredients:
          skinType === "지성"
            ? ["BHA", "위치하젤"]
            : skinType === "건성"
              ? ["히알루론산", "글리세린"]
              : ["나이아신아마이드", "아데노신"],
        skinTypes: [skinType],
        concerns: concerns.slice(0, 2),
        rating: 4.5,
        reviews: 890,
        imageUrl: "/placeholder.svg?height=200&width=200",
        description: `${skinType} 피부의 pH 밸런스를 맞춰주는 토너`,
        howToUse: "화장솜에 충분량을 적셔 얼굴 전체에 부드럽게 발라주거나, 손바닥에 덜어 가볍게 패팅해주세요.",
      },
    ]

    return {
      id: "step_toner",
      order: 2,
      name: "토너",
      category: "toner",
      description: "피부 pH 밸런스 조정 및 다음 단계 준비",
      instructions: "클렌징 후 화장솜이나 손으로 얼굴 전체에 부드럽게 발라 피부 결을 정돈해주세요.",
      timing: ["morning", "evening"],
      frequency: "daily",
      duration: 1,
      products,
      benefits: ["pH 밸런스 조정", "모공 수렴", concerns.includes("과도한 유분") ? "유분 조절" : "수분 공급 준비"],
    }
  }

  private static async selectMorningSerum(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep | null> {
    if (lifestyle.timeAvailable === "minimal") return null

    const products: SkincareProduct[] = [
      {
        id: "serum_morning1",
        name: concerns.includes("색소침착")
          ? "비타민 C 브라이트닝 세럼"
          : concerns.includes("건조함")
            ? "히알루론산 하이드라 세럼"
            : "나이아신아마이드 밸런싱 세럼",
        brand: "더마케어",
        category: "serum",
        price: 45000,
        volume: "30ml",
        ingredients: concerns.includes("색소침착")
          ? ["비타민 C", "아르부틴"]
          : concerns.includes("건조함")
            ? ["히알루론산", "세라마이드"]
            : ["나이아신아마이드", "아연"],
        skinTypes: [skinType],
        concerns: concerns.slice(0, 1),
        rating: 4.6,
        reviews: 1456,
        imageUrl: "/placeholder.svg?height=200&width=200",
        description: `${concerns[0]} 개선을 위한 고농축 세럼`,
        howToUse: "토너 후 2-3방울을 손바닥에 덜어 얼굴 전체에 부드럽게 발라주세요.",
      },
    ]

    return {
      id: "step_morning_serum",
      order: 3,
      name: "세럼",
      category: "serum",
      description: "아침 집중 케어를 위한 기능성 세럼",
      instructions: "토너가 완전히 흡수된 후 적당량을 취해 얼굴 전체에 골고루 발라주세요.",
      timing: ["morning"],
      frequency: "daily",
      duration: 2,
      products,
      benefits: [`${concerns[0]} 집중 개선`, "피부 톤 균일화", "하루 종일 지속되는 효과"],
    }
  }

  private static async selectMoisturizer(
    skinType: string,
    concerns: string[],
    timing: string,
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const products: SkincareProduct[] = [
      {
        id: "moisturizer1",
        name:
          skinType === "지성"
            ? timing === "morning"
              ? "라이트 젤 모이스처라이저"
              : "밸런싱 젤 크림"
            : skinType === "건성"
              ? timing === "morning"
                ? "리치 크림"
                : "인텐시브 나이트 크림"
              : "하이드라 밸런스 크림",
        brand: "모이스트랩",
        category: "moisturizer",
        price: skinType === "건성" && timing === "evening" ? 38000 : 28000,
        volume: "50ml",
        ingredients:
          skinType === "지성"
            ? ["나이아신아마이드", "히알루론산"]
            : skinType === "건성"
              ? ["세라마이드", "스쿠알란", "펩타이드"]
              : ["히알루론산", "글리세린", "판테놀"],
        skinTypes: [skinType],
        concerns: concerns.filter((c) => c.includes("건조") || c.includes("유분")),
        rating: 4.4,
        reviews: 2103,
        imageUrl: "/placeholder.svg?height=200&width=200",
        description: `${skinType} 피부를 위한 ${timing} 전용 모이스처라이저`,
        howToUse: "세럼이 흡수된 후 적당량을 얼굴 전체에 부드럽게 발라 마사지해주세요.",
      },
    ]

    return {
      id: `step_moisturizer_${timing}`,
      order: timing === "morning" ? 4 : 5,
      name: "보습",
      category: "moisturizer",
      description: `${timing === "morning" ? "하루 종일" : "밤새"} 피부 수분 유지`,
      instructions:
        timing === "morning"
          ? "세럼 흡수 후 적당량을 발라 메이크업 베이스로 준비해주세요."
          : "하루의 마지막 단계로 충분한 양을 발라 밤새 깊은 보습을 제공해주세요.",
      timing: [timing as "morning" | "evening"],
      frequency: "daily",
      duration: 2,
      products,
      benefits: [
        `${skinType} 피부 맞춤 보습`,
        "피부 장벽 강화",
        timing === "morning" ? "메이크업 베이스" : "야간 집중 수분 공급",
      ],
    }
  }

  private static async selectSunscreen(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const spf = lifestyle.activityLevel === "high" ? 50 : lifestyle.pollution === "high" ? 45 : 30

    const products: SkincareProduct[] = [
      {
        id: "sunscreen1",
        name: `${skinType === "지성" ? "오일프리" : skinType === "민감성" ? "마일드" : "에브리데이"} 선크림 SPF${spf}`,
        brand: "선프로텍트",
        category: "sunscreen",
        price: 32000,
        volume: "50ml",
        ingredients: skinType === "민감성" ? ["징크옥사이드", "티타늄다이옥사이드"] : ["옥토크릴렌", "아보벤존"],
        skinTypes: [skinType],
        concerns: concerns.includes("색소침착") ? ["색소침착", "자외선 차단"] : ["자외선 차단"],
        rating: 4.7,
        reviews: 3247,
        imageUrl: "/placeholder.svg?height=200&width=200",
        description: `${skinType} 피부를 위한 SPF${spf} 자외선 차단제`,
        howToUse: "외출 30분 전 충분한 양을 얼굴과 목에 골고루 발라주세요. 2-3시간마다 덧발라주세요.",
      },
    ]

    return {
      id: "step_sunscreen",
      order: 5,
      name: "자외선 차단",
      category: "sunscreen",
      description: "자외선으로부터 피부 보호",
      instructions: "모이스처라이저 흡수 후 충분한 양을 얼굴 전체에 고르게 발라주세요. 목과 귀도 잊지 마세요!",
      timing: ["morning"],
      frequency: "daily",
      duration: 2,
      products,
      benefits: [
        "UVA/UVB 차단",
        "광노화 방지",
        concerns.includes("색소침착") ? "기존 색소침착 악화 방지" : "건강한 피부 유지",
      ],
      warnings: ["외출 30분 전 발라야 효과적", "2-3시간마다 재발라야 함"],
    }
  }

  // 추가 제품 선택 메서드들...
  private static async selectMakeupRemover(
    skinType: string,
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep | null> {
    return {
      id: "step_makeup_remover",
      order: 1,
      name: "메이크업 리무버",
      category: "cleanser",
      description: "메이크업과 자외선 차단제 제거",
      instructions: "충분한 양을 화장솜에 덜어 메이크업을 부드럽게 제거해주세요.",
      timing: ["evening"],
      frequency: "daily",
      duration: 3,
      products: [
        {
          id: "makeup_remover1",
          name: skinType === "민감성" ? "마일드 클렌징 오일" : "완벽 메이크업 리무버",
          brand: "클린뷰티",
          category: "cleanser",
          price: 26000,
          volume: "200ml",
          ingredients: ["호호바오일", "올리브오일"],
          skinTypes: [skinType],
          concerns: ["메이크업 제거"],
          rating: 4.5,
          reviews: 1876,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: "순한 성분으로 메이크업을 완벽하게 제거",
          howToUse: "마른 손에 2-3펌프를 덜어 메이크업과 혼합한 후 물로 헹궈내세요.",
        },
      ],
      benefits: ["완벽한 메이크업 제거", "피부 자극 최소화"],
    }
  }

  private static async selectEveningSerum(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep | null> {
    if (concerns.length === 0) return null

    const mainConcern = concerns[0]
    let serumType = ""
    let ingredients: string[] = []

    if (mainConcern.includes("주름")) {
      serumType = "레티놀 안티에이징 세럼"
      ingredients = ["레티놀", "펩타이드", "히알루론산"]
    } else if (mainConcern.includes("색소침착")) {
      serumType = "알부틴 브라이트닝 세럼"
      ingredients = ["알부틴", "코직산", "비타민 C"]
    } else if (mainConcern.includes("여드름")) {
      serumType = "BHA 트리트먼트 세럼"
      ingredients = ["BHA", "나이아신아마이드", "티트리"]
    } else {
      serumType = "하이드라 리페어 세럼"
      ingredients = ["히알루론산", "세라마이드", "판테놀"]
    }

    return {
      id: "step_evening_serum",
      order: 4,
      name: "집중 트리트먼트 세럼",
      category: "serum",
      description: `${mainConcern} 집중 개선을 위한 야간 세럼`,
      instructions: "토너 후 2-3방울을 취해 해당 부위나 얼굴 전체에 부드럽게 발라주세요.",
      timing: ["evening"],
      frequency: mainConcern.includes("주름") ? "daily" : "daily",
      duration: 3,
      products: [
        {
          id: "evening_serum1",
          name: serumType,
          brand: "나이트케어",
          category: "serum",
          price: 58000,
          volume: "30ml",
          ingredients,
          skinTypes: [skinType],
          concerns: [mainConcern],
          rating: 4.8,
          reviews: 967,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: `${mainConcern} 개선을 위한 고농축 야간 세럼`,
          howToUse: "저녁에만 사용하며, 처음 사용 시 격일로 시작해주세요.",
        },
      ],
      benefits: [`${mainConcern} 집중 개선`, "야간 재생 촉진", "다음 날 아침 피부 개선 효과"],
      warnings: mainConcern.includes("주름") ? ["임신/수유 중 사용 금지", "자외선 차단제 필수"] : undefined,
    }
  }

  private static async selectFaceOil(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep | null> {
    if (skinType === "지성" && !concerns.includes("건조함")) return null

    return {
      id: "step_face_oil",
      order: 6,
      name: "페이스 오일",
      category: "treatment",
      description: "깊은 영양 공급과 피부 장벽 강화",
      instructions: "모든 단계가 끝난 후 1-2방울을 손바닥에 비비고 얼굴에 가볍게 프레스해주세요.",
      timing: ["evening"],
      frequency: concerns.includes("건조함") ? "daily" : "weekly",
      duration: 1,
      products: [
        {
          id: "face_oil1",
          name: skinType === "민감성" ? "카밀레 진정 오일" : "로즈힙 영양 오일",
          brand: "오일테라피",
          category: "treatment",
          price: 42000,
          volume: "30ml",
          ingredients: skinType === "민감성" ? ["카밀레", "호호바오일"] : ["로즈힙", "아르간오일"],
          skinTypes: [skinType],
          concerns: ["건조함", "영양 공급"],
          rating: 4.6,
          reviews: 543,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: "천연 오일로 깊은 영양 공급",
          howToUse: "소량을 손바닥에 비빈 후 얼굴에 가볍게 프레스하듯 발라주세요.",
        },
      ],
      benefits: ["깊은 영양 공급", "피부 장벽 강화", "야간 집중 보습"],
    }
  }

  private static async selectExfoliant(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const exfoliantType =
      skinType === "민감성" ? "젠틀 효소 필링" : concerns.includes("여드름") ? "BHA 필링 패드" : "AHA 글로우 토너"

    return {
      id: "step_exfoliant",
      order: 1,
      name: "각질 제거",
      category: "exfoliant",
      description: "죽은 피부 세포 제거와 피부 결 개선",
      instructions:
        skinType === "민감성"
          ? "일주일에 1-2회, 클렌징 후 적당량을 발라 5분 후 헹궈내세요."
          : "일주일에 2-3회, 저녁 토너 단계에서 사용해주세요.",
      timing: ["evening"],
      frequency: "weekly",
      duration: 5,
      products: [
        {
          id: "exfoliant1",
          name: exfoliantType,
          brand: "엑스폴리에이터",
          category: "exfoliant",
          price: 35000,
          volume: skinType === "민감성" ? "100ml" : "120ml",
          ingredients:
            skinType === "민감성"
              ? ["파파인", "브로멜라인"]
              : concerns.includes("여드름")
                ? ["BHA", "위치하젤"]
                : ["AHA", "글리콜산"],
          skinTypes: [skinType],
          concerns: ["각질", "모공", "피부결"],
          rating: 4.4,
          reviews: 789,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: `${skinType} 피부를 위한 순한 각질 제거제`,
          howToUse: "소량을 취해 부드럽게 마사지하거나 화장솜으로 발라주세요.",
        },
      ],
      benefits: ["각질 제거", "모공 관리", "피부 결 개선"],
      warnings: ["사용 후 자외선 차단제 필수", "처음 사용 시 패치 테스트 권장"],
    }
  }

  private static async selectWeeklyMask(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep | null> {
    const mainConcern = concerns[0]
    let maskType = ""

    if (mainConcern?.includes("건조")) {
      maskType = "하이드라 인텐시브 마스크"
    } else if (mainConcern?.includes("여드름")) {
      maskType = "클레이 퓨리파잉 마스크"
    } else if (mainConcern?.includes("색소침착")) {
      maskType = "비타민 C 브라이트닝 마스크"
    } else {
      maskType = "멀티 케어 시트 마스크"
    }

    return {
      id: "step_weekly_mask",
      order: 1,
      name: "주간 마스크",
      category: "mask",
      description: `${mainConcern} 집중 케어를 위한 주간 마스크`,
      instructions: "일주일에 1-2회, 클렌징과 토너 후 15-20분간 적용해주세요.",
      timing: ["evening"],
      frequency: "weekly",
      duration: 20,
      products: [
        {
          id: "weekly_mask1",
          name: maskType,
          brand: "마스크랩",
          category: "mask",
          price: 3500,
          volume: "1매",
          ingredients: mainConcern?.includes("건조")
            ? ["히알루론산", "콜라겐"]
            : mainConcern?.includes("여드름")
              ? ["카올린", "벤토나이트"]
              : ["비타민 C", "나이아신아마이드"],
          skinTypes: [skinType],
          concerns: [mainConcern || "종합 케어"],
          rating: 4.3,
          reviews: 1234,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: `${mainConcern} 집중 개선을 위한 주간 마스크`,
          howToUse: "얼굴에 밀착시킨 후 15-20분 뒤 제거하고 남은 에센스를 두드려 흡수시켜주세요.",
        },
      ],
      benefits: [`${mainConcern} 집중 케어`, "즉각적인 효과", "주간 스페셜 케어"],
    }
  }

  private static async selectDeepCleansingMask(skinType: string, lifestyle: LifestyleFactors): Promise<SkincareStep> {
    return {
      id: "step_deep_cleansing",
      order: 1,
      name: "딥 클렌징 마스크",
      category: "mask",
      description: "월간 딥 클렌징과 모공 관리",
      instructions: "한 달에 1-2회, 스팀 타월로 모공을 열어준 후 적용해주세요.",
      timing: ["evening"],
      frequency: "monthly",
      duration: 15,
      products: [
        {
          id: "deep_cleansing1",
          name: skinType === "민감성" ? "젠틀 클레이 마스크" : "딥 포어 클렌징 마스크",
          brand: "딥클린",
          category: "mask",
          price: 28000,
          volume: "100ml",
          ingredients: skinType === "민감성" ? ["화이트 클레이", "알로에"] : ["벤토나이트", "숯가루"],
          skinTypes: [skinType],
          concerns: ["모공", "블랙헤드", "각질"],
          rating: 4.5,
          reviews: 678,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: "월간 딥 클렌징을 위한 전문 마스크",
          howToUse: "얇게 펴 발라 10-15분 후 미지근한 물로 헹궈내세요.",
        },
      ],
      benefits: ["딥 클렌징", "모공 관리", "피부 리셋"],
    }
  }

  private static async selectIntensiveTreatment(
    skinType: string,
    concerns: string[],
    lifestyle: LifestyleFactors,
  ): Promise<SkincareStep> {
    const mainConcern = concerns[0]

    return {
      id: "step_intensive_treatment",
      order: 2,
      name: "집중 트리트먼트",
      category: "treatment",
      description: `${mainConcern} 집중 개선을 위한 월간 트리트먼트`,
      instructions: "한 달에 1회, 전문적인 집중 케어를 진행해주세요.",
      timing: ["evening"],
      frequency: "monthly",
      duration: 30,
      products: [
        {
          id: "intensive_treatment1",
          name: mainConcern.includes("주름") ? "펩타이드 리뉴얼 트리트먼트" : "멜라닌 블록 트리트먼트",
          brand: "인텐시브케어",
          category: "treatment",
          price: 75000,
          volume: "5회분",
          ingredients: mainConcern.includes("주름") ? ["펩타이드", "레티놀"] : ["하이드로퀴논", "코직산"],
          skinTypes: [skinType],
          concerns: [mainConcern],
          rating: 4.7,
          reviews: 234,
          imageUrl: "/placeholder.svg?height=200&width=200",
          description: `${mainConcern} 전문 집중 트리트먼트`,
          howToUse: "깨끗한 피부에 적용 후 30분간 방치하고 중성화 토너로 마무리해주세요.",
        },
      ],
      benefits: [`${mainConcern} 극적 개선`, "전문가 수준 케어", "장기적 효과"],
      warnings: ["패치 테스트 필수", "사용 후 일주일간 자외선 차단 강화"],
    }
  }

  // 헬퍼 메서드들
  private static generateSkinGoals(concerns: string[], skinType: string): string[] {
    const goals = []

    if (concerns.includes("건조함")) goals.push("피부 수분도 20% 향상")
    if (concerns.includes("과도한 유분")) goals.push("유분 균형 개선")
    if (concerns.includes("여드름")) goals.push("여드름 50% 감소")
    if (concerns.includes("주름")) goals.push("잔주름 개선")
    if (concerns.includes("색소침착")) goals.push("피부 톤 균일화")
    if (concerns.includes("모공")) goals.push("모공 크기 감소")

    goals.push("전반적인 피부 건강 개선")
    goals.push("피부 탄력 증진")

    return goals.slice(0, 4)
  }

  private static generateExpectedResults(concerns: string[], skinType: string): string[] {
    const results = []

    concerns.forEach((concern) => {
      if (concern.includes("건조")) results.push("2주 후: 피부 수분감 개선")
      if (concern.includes("여드름")) results.push("4주 후: 새로운 여드름 발생 감소")
      if (concern.includes("색소침착")) results.push("6-8주 후: 기미, 잡티 개선")
      if (concern.includes("주름")) results.push("8-12주 후: 잔주름 완화")
    })

    results.push("4주 후: 피부 결 개선")
    results.push("8주 후: 전반적인 피부 상태 향상")

    return results.slice(0, 4)
  }

  private static calculateTimeline(concerns: string[], lifestyle: LifestyleFactors): string {
    let weeks = 8 // 기본 8주

    if (concerns.includes("주름") || concerns.includes("색소침착")) weeks = 12
    if (concerns.includes("여드름")) weeks = 6
    if (lifestyle.stress === "high" || lifestyle.sleep === "poor") weeks += 2

    return `${weeks}주 프로그램`
  }

  private static calculateTotalCost(
    morningSteps: SkincareStep[],
    eveningSteps: SkincareStep[],
    weeklyTreatments: SkincareStep[],
    monthlyTreatments: SkincareStep[],
  ): number {
    const allSteps = [...morningSteps, ...eveningSteps, ...weeklyTreatments, ...monthlyTreatments]
    let totalCost = 0

    allSteps.forEach((step) => {
      if (step.products.length > 0) {
        totalCost += step.products[0].price
      }
    })

    return totalCost
  }

  private static determineDifficulty(
    morningSteps: SkincareStep[],
    eveningSteps: SkincareStep[],
    weeklyTreatments: SkincareStep[],
    lifestyle: LifestyleFactors,
  ): "beginner" | "intermediate" | "advanced" {
    const totalSteps = morningSteps.length + eveningSteps.length + weeklyTreatments.length
    const hasActiveTreatments = eveningSteps.some((step) =>
      step.products[0]?.ingredients.some((ing) => ing.includes("레티놀") || ing.includes("AHA") || ing.includes("BHA")),
    )

    if (totalSteps <= 6 && !hasActiveTreatments) return "beginner"
    if (totalSteps <= 10 && lifestyle.timeAvailable !== "minimal") return "intermediate"
    return "advanced"
  }

  private static async inferLifestyleFromPreferences(preferences: UserPreferences | null): Promise<LifestyleFactors> {
    if (!preferences) {
      return {
        activityLevel: "moderate",
        climate: "temperate",
        pollution: "moderate",
        stress: "moderate",
        sleep: "average",
        diet: "average",
        timeAvailable: "moderate",
        budget: "mid-range",
        skinSensitivity: "mild",
        currentProducts: [],
        allergies: [],
      }
    }

    return {
      activityLevel: preferences.lifestyle.activityLevel,
      climate: preferences.lifestyle.climate,
      pollution: "moderate", // 기본값
      stress: "moderate", // 기본값
      sleep: "average", // 기본값
      diet: "average", // 기본값
      timeAvailable: preferences.lifestyle.timeForRoutine,
      budget: preferences.brandPreferences.priceRange.skincare,
      skinSensitivity: preferences.skinCarePreferences.concerns.includes("민감성") ? "moderate" : "mild",
      currentProducts: [],
      allergies: preferences.skinCarePreferences.ingredients.avoided,
    }
  }

  private static async getLatestSkinAnalysis(userId: string): Promise<FaceAnalysis | null> {
    try {
      const q = query(
        collection(db, "faceAnalyses"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(1),
      )

      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      } as FaceAnalysis
    } catch (error) {
      console.error("Error getting latest skin analysis:", error)
      return null
    }
  }

  private static async getSkinAnalysisHistory(userId: string, limit_count: number): Promise<SkinAnalysisHistory[]> {
    try {
      const q = query(
        collection(db, "skinAnalysisHistory"),
        where("userId", "==", userId),
        orderBy("date", "desc"),
        limit(limit_count),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as SkinAnalysisHistory[]
    } catch (error) {
      console.error("Error getting skin analysis history:", error)
      return []
    }
  }

  /**
   * 사용자의 스킨케어 루틴을 가져옵니다.
   */
  static async getUserRoutines(userId: string): Promise<SkincareRoutine[]> {
    try {
      const q = query(collection(db, "skincareRoutines"), where("userId", "==", userId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as SkincareRoutine[]
    } catch (error) {
      console.error("Error getting user routines:", error)
      return []
    }
  }

  /**
   * 루틴 진행상황을 저장합니다.
   */
  static async saveRoutineProgress(progress: Omit<RoutineProgress, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "routineProgress"), {
        ...progress,
        date: Timestamp.fromDate(progress.date),
      })
      return docRef.id
    } catch (error) {
      console.error("Error saving routine progress:", error)
      throw error
    }
  }

  /**
   * 루틴 추천사항을 생성합니다.
   */
  static async generateRoutineRecommendations(userId: string, routineId: string): Promise<SkincareRecommendation[]> {
    try {
      // 진행상황 분석
      const progressData = await this.getRoutineProgress(userId, routineId, 7)
      const recommendations: Omit<SkincareRecommendation, "id">[] = []

      // 루틴 완주율 분석
      const completionRate = this.calculateCompletionRate(progressData)
      if (completionRate < 70) {
        recommendations.push({
          userId,
          type: "routine",
          title: "루틴 완주율 개선 필요",
          description: "현재 루틴 완주율이 낮습니다. 더 간단한 루틴으로 조정하는 것을 고려해보세요.",
          reason: `최근 7일 완주율: ${completionRate}%`,
          priority: "high",
          category: "routine-adherence",
          suggestion: {
            action: "simplify-routine",
            targetSteps: this.identifySkippedSteps(progressData),
          },
          implemented: false,
          createdAt: new Date(),
        })
      }

      // 피부 상태 변화 분석
      const skinTrend = this.analyzeSkinTrend(progressData)
      if (skinTrend.declining) {
        recommendations.push({
          userId,
          type: "adjustment",
          title: "루틴 조정 권장",
          description: `최근 ${skinTrend.concernArea} 상태가 악화되고 있습니다. 해당 부분 케어를 강화해보세요.`,
          reason: `${skinTrend.concernArea} 점수 하락 추세`,
          priority: "medium",
          category: "skin-improvement",
          suggestion: {
            action: "add-treatment",
            targetArea: skinTrend.concernArea,
          },
          implemented: false,
          createdAt: new Date(),
        })
      }

      // 계절별 추천
      const seasonalRecommendation = this.generateSeasonalRecommendation()
      if (seasonalRecommendation) {
        recommendations.push(seasonalRecommendation)
      }

      // Firestore에 저장
      for (const rec of recommendations) {
        await addDoc(collection(db, "skincareRecommendations"), {
          ...rec,
          createdAt: Timestamp.fromDate(rec.createdAt),
        })
      }

      return recommendations.map((rec, index) => ({
        id: `temp_${index}`,
        ...rec,
      }))
    } catch (error) {
      console.error("Error generating routine recommendations:", error)
      return []
    }
  }

  // 헬퍼 메서드들
  private static async getRoutineProgress(userId: string, routineId: string, days: number): Promise<RoutineProgress[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const q = query(
        collection(db, "routineProgress"),
        where("userId", "==", userId),
        where("routineId", "==", routineId),
        where("date", ">=", Timestamp.fromDate(startDate)),
        orderBy("date", "desc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as RoutineProgress[]
    } catch (error) {
      console.error("Error getting routine progress:", error)
      return []
    }
  }

  private static calculateCompletionRate(progressData: RoutineProgress[]): number {
    if (progressData.length === 0) return 0

    const totalSteps = progressData.reduce((sum, day) => sum + day.completedSteps.length + day.skippedSteps.length, 0)
    const completedSteps = progressData.reduce((sum, day) => sum + day.completedSteps.length, 0)

    return Math.round((completedSteps / totalSteps) * 100)
  }

  private static identifySkippedSteps(progressData: RoutineProgress[]): string[] {
    const skippedStepsCount: { [key: string]: number } = {}

    progressData.forEach((day) => {
      day.skippedSteps.forEach((step) => {
        skippedStepsCount[step] = (skippedStepsCount[step] || 0) + 1
      })
    })

    return Object.entries(skippedStepsCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([step]) => step)
  }

  private static analyzeSkinTrend(progressData: RoutineProgress[]): { declining: boolean; concernArea: string } {
    if (progressData.length < 3) return { declining: false, concernArea: "" }

    const recent = progressData.slice(0, 3)
    const areas = ["hydration", "oiliness", "irritation", "overall"] as const

    for (const area of areas) {
      const scores = recent.map((day) => day.skinCondition[area]).reverse()
      const isDeclining = scores[2] < scores[1] && scores[1] < scores[0]

      if (isDeclining) {
        return { declining: true, concernArea: area }
      }
    }

    return { declining: false, concernArea: "" }
  }

  private static generateSeasonalRecommendation(): Omit<SkincareRecommendation, "id"> | null {
    const month = new Date().getMonth()
    let recommendation = null

    if (month >= 11 || month <= 2) {
      // 겨울
      recommendation = {
        userId: "",
        type: "adjustment" as const,
        title: "겨울철 보습 강화",
        description: "건조한 겨울철에는 보습 단계를 강화하고 오일 제품을 추가하는 것이 좋습니다.",
        reason: "계절적 요인 (겨울철 건조)",
        priority: "medium" as const,
        category: "seasonal",
        suggestion: {
          action: "add-step",
          stepType: "face-oil",
          timing: "evening",
        },
        implemented: false,
        createdAt: new Date(),
      }
    } else if (month >= 6 && month <= 8) {
      // 여름
      recommendation = {
        userId: "",
        type: "adjustment" as const,
        title: "여름철 유분 조절",
        description: "습하고 더운 여름철에는 가벼운 텍스처의 제품으로 변경하고 자외선 차단을 강화하세요.",
        reason: "계절적 요인 (여름철 고온다습)",
        priority: "medium" as const,
        category: "seasonal",
        suggestion: {
          action: "lighten-texture",
          targetProducts: ["moisturizer", "sunscreen"],
          timing: "morning",
        },
        implemented: false,
        createdAt: new Date(),
      }
    }

    return recommendation
  }
}

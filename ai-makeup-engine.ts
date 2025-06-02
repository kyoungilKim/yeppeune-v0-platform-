import type {
  AIRecommendationInput,
  AIRecommendedMakeup,
  ColorHarmonyAnalysis,
  FaceShapeGuidelines,
} from "@/types/ai-makeup-recommendation"

export class AIMakeupEngine {
  /**
   * 메인 AI 추천 함수
   */
  static async generateRecommendation(input: AIRecommendationInput): Promise<AIRecommendedMakeup> {
    try {
      // 1. 색상 분석
      const colorAnalysis = this.analyzeColorHarmony(
        input.faceAnalysis.skinTone,
        input.faceAnalysis.skinUndertone,
        input.faceAnalysis.eyeColor,
      )

      // 2. 얼굴형 분석
      const faceShapeGuidelines = this.getFaceShapeGuidelines(input.faceAnalysis.faceShape)

      // 3. 피부 상태 분석
      const skinConditionFactors = this.analyzeSkinCondition(input.faceAnalysis.skinAnalysis)

      // 4. 컨텍스트 요소 고려
      const contextualAdjustments = this.getContextualAdjustments(input.contextualFactors)

      // 5. 사용자 선호도 반영
      const preferenceWeights = this.calculatePreferenceWeights(input.userPreferences)

      // 6. AI 추천 생성
      const recommendation = this.synthesizeRecommendation(
        input,
        colorAnalysis,
        faceShapeGuidelines,
        skinConditionFactors,
        contextualAdjustments,
        preferenceWeights,
      )

      return recommendation
    } catch (error) {
      console.error("AI 메이크업 추천 생성 중 오류:", error)
      throw error
    }
  }

  /**
   * 색상 조화 분석
   */
  private static analyzeColorHarmony(skinTone: string, undertone: string, eyeColor: string): ColorHarmonyAnalysis {
    const colorMappings = {
      fair: {
        cool: {
          primary: ["#FFB6C1", "#E6E6FA", "#F0F8FF", "#FFF0F5"],
          avoid: ["#FF8C00", "#DAA520", "#CD853F"],
        },
        warm: {
          primary: ["#FFEFD5", "#FFE4B5", "#F5DEB3", "#FFF8DC"],
          avoid: ["#4169E1", "#6A5ACD", "#483D8B"],
        },
        neutral: {
          primary: ["#F5F5DC", "#FAF0E6", "#FDF5E6", "#FFFAF0"],
          avoid: ["#FF4500", "#DC143C"],
        },
      },
      light: {
        cool: {
          primary: ["#DDA0DD", "#D8BFD8", "#E0E0E0", "#F5F5F5"],
          avoid: ["#B8860B", "#CD853F", "#D2691E"],
        },
        warm: {
          primary: ["#F4A460", "#DEB887", "#D2B48C", "#BC8F8F"],
          avoid: ["#4682B4", "#5F9EA0", "#708090"],
        },
        neutral: {
          primary: ["#C0C0C0", "#D3D3D3", "#DCDCDC", "#E5E5E5"],
          avoid: ["#FF6347", "#FF1493"],
        },
      },
      medium: {
        cool: {
          primary: ["#CD853F", "#D2691E", "#A0522D", "#8B4513"],
          avoid: ["#FFD700", "#FFA500", "#FF8C00"],
        },
        warm: {
          primary: ["#DEB887", "#F4A460", "#D2B48C", "#BC8F8F"],
          avoid: ["#6495ED", "#4169E1", "#0000CD"],
        },
        neutral: {
          primary: ["#A9A9A9", "#808080", "#696969", "#778899"],
          avoid: ["#FF69B4", "#FF1493"],
        },
      },
      olive: {
        cool: {
          primary: ["#6B8E23", "#808000", "#556B2F", "#8FBC8F"],
          avoid: ["#FF4500", "#FF6347", "#DC143C"],
        },
        warm: {
          primary: ["#9ACD32", "#ADFF2F", "#7CFC00", "#32CD32"],
          avoid: ["#8A2BE2", "#9400D3", "#4B0082"],
        },
        neutral: {
          primary: ["#2F4F4F", "#708090", "#778899", "#696969"],
          avoid: ["#FF69B4", "#FF1493"],
        },
      },
      tan: {
        cool: {
          primary: ["#8B4513", "#A0522D", "#CD853F", "#D2691E"],
          avoid: ["#FFD700", "#FFFF00", "#ADFF2F"],
        },
        warm: {
          primary: ["#D2691E", "#CD853F", "#F4A460", "#DEB887"],
          avoid: ["#0000FF", "#4169E1", "#6495ED"],
        },
        neutral: {
          primary: ["#696969", "#708090", "#778899", "#2F4F4F"],
          avoid: ["#FF1493", "#FF69B4"],
        },
      },
      deep: {
        cool: {
          primary: ["#800080", "#4B0082", "#8B008B", "#9932CC"],
          avoid: ["#FFFF00", "#FFD700", "#FFA500"],
        },
        warm: {
          primary: ["#B22222", "#DC143C", "#8B0000", "#A0522D"],
          avoid: ["#00BFFF", "#87CEEB", "#87CEFA"],
        },
        neutral: {
          primary: ["#2F4F4F", "#000000", "#36454F", "#1C1C1C"],
          avoid: ["#FF69B4", "#FF1493"],
        },
      },
    }

    const toneMapping = colorMappings[skinTone as keyof typeof colorMappings]
    const undertoneMapping = toneMapping?.[undertone as keyof typeof toneMapping]

    // 눈 색깔에 따른 보완 색상
    const eyeColorComplements = {
      brown: ["#4169E1", "#6495ED", "#87CEEB"],
      blue: ["#FF8C00", "#D2691E", "#CD853F"],
      green: ["#DC143C", "#B22222", "#8B0000"],
      hazel: ["#800080", "#9932CC", "#8B008B"],
      gray: ["#FF69B4", "#FF1493", "#C71585"],
    }

    return {
      primaryColors: undertoneMapping?.primary || [],
      complementaryColors: eyeColorComplements[eyeColor as keyof typeof eyeColorComplements] || [],
      analogousColors: undertoneMapping?.primary.slice(0, 3) || [],
      triadicColors: this.generateTriadicColors(undertoneMapping?.primary[0] || "#000000"),
      seasonalPalette: this.getSeasonalPalette(skinTone, undertone),
      recommendedColors: undertoneMapping?.primary || [],
      avoidColors: undertoneMapping?.avoid || [],
    }
  }

  /**
   * 얼굴형별 가이드라인
   */
  private static getFaceShapeGuidelines(faceShape: string): FaceShapeGuidelines {
    const guidelines = {
      oval: {
        enhanceFeatures: ["자연스러운 균형"],
        minimizeFeatures: [],
        eyebrowShape: "자연스러운 아치형",
        blushPlacement: "광대뼈 중앙",
        contourAreas: [],
        highlightAreas: ["이마 중앙", "코끝", "턱 끝"],
      },
      round: {
        enhanceFeatures: ["세로 라인 강조"],
        minimizeFeatures: ["둥근 볼살"],
        eyebrowShape: "높은 아치형",
        blushPlacement: "광대뼈 상단",
        contourAreas: ["관자놀이", "턱선"],
        highlightAreas: ["이마 중앙", "코 브릿지", "턱 중앙"],
      },
      square: {
        enhanceFeatures: ["부드러운 곡선"],
        minimizeFeatures: ["각진 턱선"],
        eyebrowShape: "부드러운 아치형",
        blushPlacement: "광대뼈 중앙에서 관자놀이로",
        contourAreas: ["턱 모서리", "이마 모서리"],
        highlightAreas: ["이마 중앙", "코끝", "턱 중앙"],
      },
      heart: {
        enhanceFeatures: ["턱선 강조"],
        minimizeFeatures: ["넓은 이마"],
        eyebrowShape: "둥근 아치형",
        blushPlacement: "광대뼈 하단",
        contourAreas: ["이마 양쪽", "관자놀이"],
        highlightAreas: ["턱 끝", "코끝"],
      },
      long: {
        enhanceFeatures: ["가로 라인 강조"],
        minimizeFeatures: ["긴 얼굴"],
        eyebrowShape: "직선형",
        blushPlacement: "광대뼈 전체",
        contourAreas: ["이마 상단", "턱 하단"],
        highlightAreas: ["광대뼈", "코 중앙"],
      },
      diamond: {
        enhanceFeatures: ["이마와 턱선"],
        minimizeFeatures: ["넓은 광대뼈"],
        eyebrowShape: "곡선형",
        blushPlacement: "광대뼈 하단",
        contourAreas: ["광대뼈 상단"],
        highlightAreas: ["이마 중앙", "턱 끝"],
      },
    }

    return guidelines[faceShape as keyof typeof guidelines] || guidelines.oval
  }

  /**
   * 피부 상태 분석
   */
  private static analyzeSkinCondition(skinAnalysis: any) {
    const factors = {
      needsHydration: skinAnalysis.hydration < 50,
      needsOilControl: skinAnalysis.oiliness > 70,
      needsCoverage: skinAnalysis.spots > 50 || skinAnalysis.redness > 50,
      needsAntiAging: skinAnalysis.wrinkles > 40,
      isSensitive: skinAnalysis.sensitivity > 60,
      hasLargesPores: skinAnalysis.pores > 60,
      hasUneven: skinAnalysis.evenness < 50,
    }

    return {
      ...factors,
      recommendedFinish: factors.needsOilControl ? "matte" : factors.needsHydration ? "dewy" : "natural",
      recommendedCoverage: factors.needsCoverage ? "full" : "medium",
      needsPrimer: factors.hasLargesPores || factors.needsOilControl,
      needsSetting: factors.needsOilControl || factors.isSensitive,
    }
  }

  /**
   * 컨텍스트 조정 요소
   */
  private static getContextualAdjustments(contextualFactors?: any) {
    if (!contextualFactors) return {}

    return {
      intensityAdjustment:
        contextualFactors.timeOfDay === "evening" ? 1.2 : contextualFactors.timeOfDay === "morning" ? 0.8 : 1.0,
      longevityFocus: contextualFactors.weather === "humid" || contextualFactors.weather === "rainy",
      warmthAdjustment: contextualFactors.lighting === "warm" ? 0.1 : contextualFactors.lighting === "cool" ? -0.1 : 0,
      seasonalColors: this.getSeasonalColorAdjustment(contextualFactors.season),
    }
  }

  /**
   * 선호도 가중치 계산
   */
  private static calculatePreferenceWeights(preferences?: any) {
    if (!preferences) return { intensity: 1.0, boldness: 0.5 }

    const intensityMap = { light: 0.6, medium: 1.0, full: 1.4 }
    const styleMap = {
      minimal: 0.4,
      natural: 0.6,
      trendy: 1.0,
      bold: 1.3,
      glamorous: 1.5,
      vintage: 0.8,
    }

    return {
      intensity: intensityMap[preferences.intensity as keyof typeof intensityMap] || 1.0,
      boldness: styleMap[preferences.style as keyof typeof styleMap] || 1.0,
      favoriteColors: preferences.favoriteColors || [],
      avoidColors: preferences.avoidColors || [],
    }
  }

  /**
   * 최종 추천 합성
   */
  private static synthesizeRecommendation(
    input: AIRecommendationInput,
    colorAnalysis: ColorHarmonyAnalysis,
    faceShapeGuidelines: FaceShapeGuidelines,
    skinFactors: any,
    contextualAdjustments: any,
    preferenceWeights: any,
  ): AIRecommendedMakeup {
    const baseIntensity = preferenceWeights.intensity * (contextualAdjustments.intensityAdjustment || 1.0)

    // 파운데이션 추천
    const foundation = {
      shade: this.recommendFoundationShade(input.faceAnalysis.skinTone, input.faceAnalysis.skinUndertone),
      coverage: skinFactors.recommendedCoverage,
      finish: skinFactors.recommendedFinish,
      reason: `${input.faceAnalysis.skinTone} 피부톤과 ${skinFactors.recommendedFinish} 피니시가 ${input.faceAnalysis.skinAnalysis.oiliness > 70 ? "지성" : "건성"} 피부에 적합합니다.`,
      confidence: 90,
    }

    // 아이섀도우 추천
    const eyeshadow = {
      palette: this.selectEyeshadowColors(colorAnalysis, input.faceAnalysis.eyeColor, preferenceWeights),
      placement: this.getEyeshadowPlacement(input.faceAnalysis.eyeShape),
      technique: this.selectEyeshadowTechnique(input.faceAnalysis.eyeShape, preferenceWeights.boldness),
      intensity: Math.round(baseIntensity * 70),
      reason: `${input.faceAnalysis.eyeShape} 눈 모양에 어울리는 ${input.faceAnalysis.eyeColor} 눈동자를 돋보이게 하는 색상 조합입니다.`,
      confidence: 85,
    }

    // 립스틱 추천
    const lipstick = {
      color: this.selectLipColor(colorAnalysis, input.faceAnalysis.lipShape, preferenceWeights),
      finish: this.selectLipFinish(input.userPreferences?.style, contextualAdjustments),
      intensity: Math.round(baseIntensity * 80),
      technique: this.getLipTechnique(input.faceAnalysis.lipShape),
      reason: `${input.faceAnalysis.lipShape} 입술 모양을 돋보이게 하며 전체적인 메이크업과 조화를 이룹니다.`,
      confidence: 88,
    }

    // 블러셔 추천
    const blush = {
      color: this.selectBlushColor(colorAnalysis, input.faceAnalysis.skinTone),
      placement: faceShapeGuidelines.blushPlacement,
      intensity: Math.round(baseIntensity * 60),
      technique: this.getBlushTechnique(input.faceAnalysis.faceShape),
      reason: `${input.faceAnalysis.faceShape} 얼굴형에 맞는 블러셔 위치로 자연스러운 혈색을 연출합니다.`,
      confidence: 82,
    }

    // 전체 추천 이유
    const reasoning = [
      `${input.faceAnalysis.faceShape} 얼굴형의 특징을 살린 메이크업`,
      `${input.faceAnalysis.skinTone} 피부톤에 조화로운 색상 선택`,
      `${input.faceAnalysis.eyeShape} 눈 모양을 돋보이게 하는 아이메이크업`,
      `피부 상태를 고려한 베이스 메이크업 추천`,
    ]

    if (input.userPreferences?.style) {
      reasoning.push(`${input.userPreferences.style} 스타일 선호도 반영`)
    }

    return {
      id: `ai_rec_${Date.now()}`,
      confidence: 87,
      overallScore: 92,
      reasoning,
      foundation,
      concealer: skinFactors.needsCoverage
        ? {
            shade: foundation.shade,
            areas: ["다크서클", "잡티"],
            technique: "점찍기 후 블렌딩",
            reason: "피부 톤 보정과 커버력 향상을 위해 필요합니다.",
            confidence: 80,
          }
        : undefined,
      eyebrows: {
        shape: faceShapeGuidelines.eyebrowShape,
        color: this.selectEyebrowColor(input.faceAnalysis.skinTone),
        intensity: Math.round(baseIntensity * 70),
        technique: "자연스러운 털 그리기",
        reason: `${input.faceAnalysis.faceShape} 얼굴형에 어울리는 눈썹 모양입니다.`,
        confidence: 85,
      },
      eyeshadow,
      eyeliner:
        preferenceWeights.boldness > 0.7
          ? {
              style: this.selectEyelinerStyle(input.faceAnalysis.eyeShape, preferenceWeights.boldness),
              color: "#000000",
              placement: "upper",
              reason: `${input.faceAnalysis.eyeShape} 눈 모양을 더욱 또렷하게 만들어줍니다.`,
              confidence: 78,
            }
          : undefined,
      mascara: {
        type: this.selectMascaraType(input.faceAnalysis.eyeShape),
        color: "#000000",
        technique: "지그재그 발라주기",
        reason: "속눈썹을 길고 풍성하게 연출하여 눈을 더욱 크게 보이게 합니다.",
        confidence: 90,
      },
      blush,
      highlighter:
        preferenceWeights.boldness > 0.6
          ? {
              color: this.selectHighlighterColor(colorAnalysis),
              placement: faceShapeGuidelines.highlightAreas,
              intensity: Math.round(baseIntensity * 50),
              finish: "pearl",
              reason: "얼굴의 입체감을 살리고 건강한 윤기를 연출합니다.",
              confidence: 75,
            }
          : undefined,
      contour:
        faceShapeGuidelines.contourAreas.length > 0 && preferenceWeights.boldness > 0.8
          ? {
              color: this.selectContourColor(input.faceAnalysis.skinTone),
              areas: faceShapeGuidelines.contourAreas,
              intensity: Math.round(baseIntensity * 40),
              technique: "cream",
              reason: `${input.faceAnalysis.faceShape} 얼굴형의 단점을 보완하고 입체감을 살립니다.`,
              confidence: 70,
            }
          : undefined,
      lipstick,
      settingProducts: {
        primer: skinFactors.needsPrimer,
        powder: skinFactors.needsOilControl,
        spray: contextualAdjustments.longevityFocus,
        reason: "메이크업 지속력과 완성도를 높이기 위해 필요합니다.",
      },
    }
  }

  // 헬퍼 메서드들
  private static recommendFoundationShade(skinTone: string, undertone: string): string {
    const shadeMap = {
      fair: { cool: "아이보리 13", warm: "베이지 13", neutral: "내추럴 13" },
      light: { cool: "베이지 21", warm: "베이지 23", neutral: "베이지 21" },
      medium: { cool: "베이지 25", warm: "베이지 27", neutral: "베이지 25" },
      olive: { cool: "올리브 23", warm: "올리브 25", neutral: "올리브 23" },
      tan: { cool: "앰버 27", warm: "앰버 29", neutral: "앰버 27" },
      deep: { cool: "앰버 31", warm: "앰버 33", neutral: "앰버 31" },
    }

    return shadeMap[skinTone as keyof typeof shadeMap]?.[undertone as keyof any] || "베이지 21"
  }

  private static selectEyeshadowColors(
    colorAnalysis: ColorHarmonyAnalysis,
    eyeColor: string,
    preferences: any,
  ): string[] {
    const baseColors = colorAnalysis.recommendedColors.slice(0, 3)
    const complementColors = colorAnalysis.complementaryColors.slice(0, 2)

    return [...baseColors, ...complementColors].slice(0, 4)
  }

  private static getEyeshadowPlacement(eyeShape: string) {
    const placements = {
      almond: { lid: "전체", crease: "자연스러운 그라데이션", highlight: "눈두덩이" },
      round: { lid: "중앙 집중", crease: "바깥쪽 강조", highlight: "눈두덩이 중앙" },
      monolid: { lid: "얇게 전체", crease: "없음", highlight: "눈두덩이 전체" },
      hooded: { lid: "눈을 뜬 상태로 보이는 부분", crease: "높게", highlight: "눈두덩이" },
      downturned: { lid: "바깥쪽 올려서", crease: "바깥쪽 위로", highlight: "눈두덩이" },
      upturned: { lid: "전체", crease: "자연스럽게", highlight: "눈두덩이" },
    }

    return placements[eyeShape as keyof typeof placements] || placements.almond
  }

  private static selectEyeshadowTechnique(eyeShape: string, boldness: number): string {
    if (boldness > 1.2) return "smoky"
    if (boldness > 0.8) return "cut-crease"
    if (boldness > 0.6) return "gradient"
    return "monochrome"
  }

  private static selectLipColor(colorAnalysis: ColorHarmonyAnalysis, lipShape: string, preferences: any): string {
    const colors = colorAnalysis.recommendedColors

    // 입술 모양에 따른 색상 조정
    if (lipShape === "thin") {
      return colors.find((c) => c.includes("FF") || c.includes("F")) || colors[0]
    } else if (lipShape === "full") {
      return colors.find((c) => !c.includes("FF")) || colors[1]
    }

    return colors[0] || "#FF6B6B"
  }

  private static selectLipFinish(style?: string, contextual?: any): "matte" | "cream" | "gloss" | "satin" | "stain" {
    if (style === "bold" || style === "glamorous") return "matte"
    if (style === "natural" || style === "minimal") return "stain"
    if (contextual?.timeOfDay === "evening") return "gloss"
    return "cream"
  }

  private static getLipTechnique(lipShape: string): string {
    const techniques = {
      thin: "오버라이닝으로 볼륨감 연출",
      full: "자연스러운 발색",
      wide: "중앙 집중 발색",
      heart: "하트 모양 강조",
      round: "전체적으로 균등하게",
    }

    return techniques[lipShape as keyof typeof techniques] || "자연스러운 발색"
  }

  private static selectBlushColor(colorAnalysis: ColorHarmonyAnalysis, skinTone: string): string {
    const blushMap = {
      fair: "#FFB6C1",
      light: "#F08080",
      medium: "#CD5C5C",
      olive: "#BC8F8F",
      tan: "#A0522D",
      deep: "#8B4513",
    }

    return blushMap[skinTone as keyof typeof blushMap] || "#F08080"
  }

  private static getBlushTechnique(faceShape: string): string {
    const techniques = {
      oval: "광대뼈를 따라 자연스럽게",
      round: "광대뼈 상단에서 관자놀이로",
      square: "광대뼈 중앙에 둥글게",
      heart: "광대뼈 하단에 가로로",
      long: "광대뼈 전체에 넓게",
      diamond: "광대뼈 하단에 부드럽게",
    }

    return techniques[faceShape as keyof typeof techniques] || "광대뼈를 따라 자연스럽게"
  }

  private static selectEyebrowColor(skinTone: string): string {
    const colorMap = {
      fair: "#8B4513",
      light: "#A0522D",
      medium: "#654321",
      olive: "#556B2F",
      tan: "#8B4513",
      deep: "#2F4F4F",
    }

    return colorMap[skinTone as keyof typeof colorMap] || "#8B4513"
  }

  private static selectEyelinerStyle(eyeShape: string, boldness: number): string {
    if (boldness > 1.2) return "thick"
    if (boldness > 0.8) return "winged"
    return "thin"
  }

  private static selectMascaraType(eyeShape: string): string {
    const typeMap = {
      almond: "lengthening",
      round: "volumizing",
      monolid: "lengthening",
      hooded: "waterproof",
      downturned: "lengthening",
      upturned: "volumizing",
    }

    return typeMap[eyeShape as keyof typeof typeMap] || "lengthening"
  }

  private static selectHighlighterColor(colorAnalysis: ColorHarmonyAnalysis): string {
    return colorAnalysis.recommendedColors.find((c) => c.includes("F")) || "#FFFACD"
  }

  private static selectContourColor(skinTone: string): string {
    const contourMap = {
      fair: "#D2B48C",
      light: "#DEB887",
      medium: "#CD853F",
      olive: "#8B7355",
      tan: "#A0522D",
      deep: "#8B4513",
    }

    return contourMap[skinTone as keyof typeof contourMap] || "#CD853F"
  }

  private static generateTriadicColors(baseColor: string): string[] {
    // 간단한 삼원색 생성 로직
    return [baseColor, "#FF6B6B", "#4ECDC4", "#45B7D1"]
  }

  private static getSeasonalPalette(skinTone: string, undertone: string): string[] {
    // 계절별 색상 팔레트 반환
    return ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
  }

  private static getSeasonalColorAdjustment(season?: string): string[] {
    const seasonalColors = {
      spring: ["#FFB6C1", "#98FB98", "#F0E68C", "#DDA0DD"],
      summer: ["#87CEEB", "#F0F8FF", "#E6E6FA", "#FFB6C1"],
      autumn: ["#CD853F", "#D2691E", "#B22222", "#8B4513"],
      winter: ["#000080", "#8B0000", "#2F4F4F", "#800080"],
    }

    return seasonalColors[season as keyof typeof seasonalColors] || []
  }
}

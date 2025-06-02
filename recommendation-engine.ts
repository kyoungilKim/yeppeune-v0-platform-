import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "./firebase"
import type { BeautyProduct, ProductRecommendation } from "@/types/product"
import type { UserProfile, BeautyAnalysis } from "@/types/beauty"
import type { UserPreferences } from "@/types/preferences"
import { BeautyService } from "./firebase-beauty"
import { PreferencesService } from "./firebase-preferences"

export interface RecommendationScore {
  productId: string
  score: number
  reasons: string[]
  priority: "high" | "medium" | "low"
}

export class RecommendationEngine {
  /**
   * 사용자에게 맞춤화된 제품 추천을 생성합니다.
   */
  static async generatePersonalizedRecommendations(userId: string): Promise<ProductRecommendation[]> {
    try {
      // 사용자 데이터 가져오기
      const userProfile = await BeautyService.getUserProfile(userId)
      const userPreferences = await PreferencesService.getUserPreferences(userId)
      const recentAnalyses = await BeautyService.getUserAnalysisHistory(userId, 3)

      if (!userProfile) {
        throw new Error("사용자 프로필을 찾을 수 없습니다.")
      }

      // 제품 데이터 가져오기
      const products = await this.getAllProducts(100)

      // 추천 점수 계산
      const scoredProducts = await this.scoreProducts(products, userProfile, userPreferences, recentAnalyses)

      // 상위 20개 제품 선택
      const topRecommendations = scoredProducts.sort((a, b) => b.score - a.score).slice(0, 20)

      // 추천 객체 생성
      const recommendations: ProductRecommendation[] = topRecommendations.map((rec) => ({
        id: `${userId}_${rec.productId}`,
        userId,
        productId: rec.productId,
        score: rec.score,
        reason: rec.reasons,
        category: products.find((p) => p.id === rec.productId)?.category || "unknown",
        priority: rec.priority,
        createdAt: new Date(),
        clicked: false,
        purchased: false,
      }))

      return recommendations
    } catch (error) {
      console.error("추천 생성 중 오류 발생:", error)
      return []
    }
  }

  /**
   * 모든 제품을 가져옵니다.
   */
  private static async getAllProducts(limitCount = 100): Promise<BeautyProduct[]> {
    try {
      const q = query(collection(db, "beautyProducts"), orderBy("rating", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BeautyProduct[]
    } catch (error) {
      console.error("제품 데이터 가져오기 오류:", error)
      return []
    }
  }

  /**
   * 사용자 데이터를 기반으로 각 제품의 추천 점수를 계산합니다.
   */
  private static async scoreProducts(
    products: BeautyProduct[],
    userProfile: UserProfile,
    userPreferences: UserPreferences | null,
    recentAnalyses: BeautyAnalysis[],
  ): Promise<RecommendationScore[]> {
    const scoredProducts: RecommendationScore[] = []

    // 최근 분석 결과
    const latestAnalysis = recentAnalyses.length > 0 ? recentAnalyses[0] : null

    for (const product of products) {
      let score = 0.5 // 기본 점수
      const reasons: string[] = []

      // 1. 피부 타입 매칭
      if (userProfile.skinType && product.suitableFor.skinTypes.includes(userProfile.skinType as any)) {
        score += 0.15
        reasons.push(`${this.getSkinTypeLabel(userProfile.skinType)} 피부 타입에 적합`)
      }

      // 2. 피부 고민 매칭
      const matchedConcerns = userProfile.skinConcerns.filter((concern) =>
        product.suitableFor.skinConcerns.some((sc) => sc.toLowerCase().includes(concern.toLowerCase())),
      )

      if (matchedConcerns.length > 0) {
        score += 0.1 * Math.min(matchedConcerns.length, 3)
        reasons.push(`${matchedConcerns.join(", ")} 관련 피부 고민 해결에 도움`)
      }

      // 3. 최근 분석 결과 기반 추천
      if (latestAnalysis) {
        // 수분도가 낮은 경우 보습 제품 추천
        if (
          latestAnalysis.analysisData.hydration < 50 &&
          (product.tags.includes("hydrating") || product.tags.includes("moisturizing"))
        ) {
          score += 0.2
          reasons.push("낮은 수분도 개선에 효과적")
        }

        // 유분이 많은 경우 유분 조절 제품 추천
        if (
          latestAnalysis.analysisData.oiliness > 70 &&
          (product.tags.includes("oil-control") || product.tags.includes("mattifying"))
        ) {
          score += 0.2
          reasons.push("과도한 유분 조절에 효과적")
        }

        // 민감성 피부인 경우 진정 제품 추천
        if (
          latestAnalysis.analysisData.sensitivity > 60 &&
          (product.tags.includes("soothing") || product.tags.includes("calming"))
        ) {
          score += 0.2
          reasons.push("민감한 피부 진정에 효과적")
        }
      }

      // 4. 사용자 선호도 반영
      if (userPreferences) {
        // 선호 브랜드 매칭
        if (
          userPreferences.brandPreferences.preferred.some((brand) =>
            product.brand.toLowerCase().includes(brand.toLowerCase()),
          )
        ) {
          score += 0.15
          reasons.push("선호하는 브랜드")
        }

        // 기피 브랜드 제외
        if (
          userPreferences.brandPreferences.avoided.some((brand) =>
            product.brand.toLowerCase().includes(brand.toLowerCase()),
          )
        ) {
          score -= 0.3
          reasons.push("기피하는 브랜드")
        }

        // 가격대 선호도 매칭
        const priceRange = this.getPriceRangeForCategory(product.category, userPreferences)
        if (this.isProductInPriceRange(product.price, priceRange)) {
          score += 0.1
          reasons.push("선호하는 가격대")
        }

        // 스킨케어 선호도 매칭 (스킨케어 제품인 경우)
        if (product.category === "skincare" && userPreferences.skinCarePreferences) {
          // 선호 성분 매칭
          const preferredIngredients = userPreferences.skinCarePreferences.ingredients.preferred
          const matchedIngredients = preferredIngredients.filter((ing) =>
            product.ingredients.some((i) => i.toLowerCase().includes(ing.toLowerCase())),
          )

          if (matchedIngredients.length > 0) {
            score += 0.05 * Math.min(matchedIngredients.length, 3)
            reasons.push("선호하는 성분 포함")
          }

          // 기피 성분 제외
          const avoidedIngredients = userPreferences.skinCarePreferences.ingredients.avoided
          const hasAvoidedIngredients = avoidedIngredients.some((ing) =>
            product.ingredients.some((i) => i.toLowerCase().includes(ing.toLowerCase())),
          )

          if (hasAvoidedIngredients) {
            score -= 0.3
            reasons.push("기피하는 성분 포함")
          }

          // 텍스처 선호도 매칭
          if (product.tags.some((tag) => userPreferences.skinCarePreferences.texturePreferences.includes(tag as any))) {
            score += 0.1
            reasons.push("선호하는 텍스처")
          }
        }
      }

      // 5. 제품 평점 반영
      score += (product.rating - 3) * 0.05 // 3점 기준으로 가감

      // 6. 베스트셀러/신제품 가산점
      if (product.bestSeller) {
        score += 0.05
        reasons.push("베스트셀러 제품")
      }

      if (product.isNew) {
        score += 0.05
        reasons.push("새로 출시된 제품")
      }

      // 최종 점수 정규화 (0.1 ~ 1.0 범위로)
      score = Math.max(0.1, Math.min(1.0, score))

      // 우선순위 결정
      let priority: "high" | "medium" | "low" = "low"
      if (score >= 0.8) {
        priority = "high"
      } else if (score >= 0.6) {
        priority = "medium"
      }

      // 최종 결과에 추가
      scoredProducts.push({
        productId: product.id,
        score,
        reasons: reasons.filter((r, i, self) => self.indexOf(r) === i), // 중복 제거
        priority,
      })
    }

    return scoredProducts
  }

  /**
   * 피부 타입 코드를 한글 레이블로 변환합니다.
   */
  private static getSkinTypeLabel(skinType: string): string {
    switch (skinType) {
      case "dry":
        return "건성"
      case "oily":
        return "지성"
      case "combination":
        return "복합성"
      case "sensitive":
        return "민감성"
      case "normal":
        return "중성"
      default:
        return skinType
    }
  }

  /**
   * 카테고리에 따른 가격대 선호도를 가져옵니다.
   */
  private static getPriceRangeForCategory(category: string, preferences: UserPreferences): string {
    if (category === "skincare") {
      return preferences.brandPreferences.priceRange.skincare
    } else if (category === "makeup") {
      return preferences.brandPreferences.priceRange.makeup
    } else if (category === "haircare") {
      return preferences.brandPreferences.priceRange.haircare
    } else {
      return preferences.brandPreferences.priceRange.fashion
    }
  }

  /**
   * 제품 가격이 선호하는 가격대에 속하는지 확인합니다.
   */
  private static isProductInPriceRange(price: number, priceRange: string): boolean {
    switch (priceRange) {
      case "budget":
        return price <= 30000
      case "mid-range":
        return price > 30000 && price <= 100000
      case "high-end":
        return price > 100000 && price <= 300000
      case "luxury":
        return price > 300000
      default:
        return true
    }
  }

  /**
   * 사용자의 피부 상태에 따른 맞춤 추천 카테고리를 생성합니다.
   */
  static async generateRecommendationCategories(userId: string): Promise<
    {
      title: string
      description: string
      tags: string[]
      priority: "high" | "medium" | "low"
    }[]
  > {
    try {
      const userProfile = await BeautyService.getUserProfile(userId)
      const recentAnalyses = await BeautyService.getUserAnalysisHistory(userId, 1)
      const latestAnalysis = recentAnalyses.length > 0 ? recentAnalyses[0] : null

      const categories = []

      // 피부 타입 기반 카테고리
      if (userProfile?.skinType) {
        const skinTypeCategory = {
          title: `${this.getSkinTypeLabel(userProfile.skinType)} 피부를 위한 제품`,
          description: `${this.getSkinTypeLabel(userProfile.skinType)} 피부 타입에 최적화된 제품들을 모았습니다.`,
          tags: [userProfile.skinType],
          priority: "high" as const,
        }
        categories.push(skinTypeCategory)
      }

      // 최근 분석 결과 기반 카테고리
      if (latestAnalysis) {
        // 수분도가 낮은 경우
        if (latestAnalysis.analysisData.hydration < 50) {
          categories.push({
            title: "수분 충전이 필요해요",
            description: "피부 수분도를 높여주는 보습 제품들을 추천합니다.",
            tags: ["hydrating", "moisturizing"],
            priority: "high" as const,
          })
        }

        // 유분이 많은 경우
        if (latestAnalysis.analysisData.oiliness > 70) {
          categories.push({
            title: "유분 조절이 필요해요",
            description: "과도한 피지를 조절하고 매트한 피부로 가꿔주는 제품들입니다.",
            tags: ["oil-control", "mattifying"],
            priority: "high" as const,
          })
        }

        // 민감성 피부인 경우
        if (latestAnalysis.analysisData.sensitivity > 60) {
          categories.push({
            title: "진정 케어가 필요해요",
            description: "민감해진 피부를 진정시키고 보호해주는 제품들입니다.",
            tags: ["soothing", "calming"],
            priority: "high" as const,
          })
        }

        // 주름이 있는 경우
        if (latestAnalysis.analysisData.wrinkles > 50) {
          categories.push({
            title: "탄력 케어가 필요해요",
            description: "피부 탄력을 높이고 주름을 개선하는 제품들입니다.",
            tags: ["anti-aging", "firming"],
            priority: "medium" as const,
          })
        }

        // 색소침착이 있는 경우
        if (latestAnalysis.analysisData.spots > 50) {
          categories.push({
            title: "브라이트닝 케어가 필요해요",
            description: "피부 톤을 균일하게 하고 색소침착을 개선하는 제품들입니다.",
            tags: ["brightening", "whitening"],
            priority: "medium" as const,
          })
        }
      }

      // 피부 고민 기반 카테고리
      if (userProfile?.skinConcerns && userProfile.skinConcerns.length > 0) {
        userProfile.skinConcerns.forEach((concern) => {
          categories.push({
            title: `${concern} 개선을 위한 제품`,
            description: `${concern} 문제를 효과적으로 개선하는 제품들을 모았습니다.`,
            tags: [concern],
            priority: "medium" as const,
          })
        })
      }

      // 기본 카테고리 추가
      categories.push({
        title: "베스트셀러 제품",
        description: "많은 사용자들이 선택한 인기 제품들입니다.",
        tags: ["best-seller"],
        priority: "low" as const,
      })

      categories.push({
        title: "새로 출시된 제품",
        description: "최근에 출시된 신제품들을 만나보세요.",
        tags: ["new-arrival"],
        priority: "low" as const,
      })

      return categories
    } catch (error) {
      console.error("추천 카테고리 생성 중 오류 발생:", error)
      return []
    }
  }
}

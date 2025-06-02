import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  type DocumentSnapshot,
  increment,
} from "firebase/firestore"
import { db } from "./firebase"
import type { BeautyProduct, ProductReview, ProductRecommendation, ShoppingCart } from "@/types/product"
import type { BeautyAnalysis, UserProfile } from "@/types/beauty"

export class ProductService {
  // 제품 관리
  static async getProducts(
    limitCount = 20,
    lastDoc?: DocumentSnapshot,
    filters?: {
      category?: string
      skinType?: string
      concerns?: string[]
      priceRange?: { min: number; max: number }
      brands?: string[]
      sortBy?: "price_asc" | "price_desc" | "rating" | "newest"
    },
  ): Promise<{ products: BeautyProduct[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(collection(db, "beautyProducts"), orderBy("createdAt", "desc"), limit(limitCount))

      // 필터 적용
      if (filters) {
        if (filters.category) {
          q = query(q, where("category", "==", filters.category))
        }

        if (filters.skinType) {
          q = query(q, where("suitableFor.skinTypes", "array-contains", filters.skinType))
        }

        // 정렬 적용
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case "price_asc":
              q = query(collection(db, "beautyProducts"), orderBy("price", "asc"), limit(limitCount))
              break
            case "price_desc":
              q = query(collection(db, "beautyProducts"), orderBy("price", "desc"), limit(limitCount))
              break
            case "rating":
              q = query(collection(db, "beautyProducts"), orderBy("rating", "desc"), limit(limitCount))
              break
            case "newest":
              q = query(collection(db, "beautyProducts"), orderBy("createdAt", "desc"), limit(limitCount))
              break
          }
        }
      }

      // 페이지네이션
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BeautyProduct[]

      // 추가 필터링 (Firestore에서 직접 지원하지 않는 복잡한 필터)
      let filteredProducts = products
      if (filters) {
        if (filters.concerns && filters.concerns.length > 0) {
          filteredProducts = filteredProducts.filter((product) =>
            filters.concerns!.some((concern) => product.suitableFor.skinConcerns.includes(concern)),
          )
        }

        if (filters.priceRange) {
          filteredProducts = filteredProducts.filter(
            (product) => product.price >= filters.priceRange!.min && product.price <= filters.priceRange!.max,
          )
        }

        if (filters.brands && filters.brands.length > 0) {
          filteredProducts = filteredProducts.filter((product) => filters.brands!.includes(product.brand))
        }
      }

      return {
        products: filteredProducts,
        lastDoc: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null,
      }
    } catch (error) {
      console.error("Error getting products:", error)
      return { products: [], lastDoc: null }
    }
  }

  static async getProductById(productId: string): Promise<BeautyProduct | null> {
    try {
      const docRef = doc(db, "beautyProducts", productId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate(),
        } as BeautyProduct
      }

      return null
    } catch (error) {
      console.error("Error getting product:", error)
      return null
    }
  }

  static async searchProducts(searchTerm: string, limitCount = 20): Promise<BeautyProduct[]> {
    try {
      // Firestore는 전체 텍스트 검색을 직접 지원하지 않으므로 클라이언트 측에서 필터링
      // 실제 프로덕션에서는 Algolia 같은 검색 서비스 사용 권장
      const q = query(collection(db, "beautyProducts"), limit(100))
      const querySnapshot = await getDocs(q)

      const searchTermLower = searchTerm.toLowerCase()
      const products = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        }))
        .filter(
          (product: any) =>
            product.name.toLowerCase().includes(searchTermLower) ||
            product.brand.toLowerCase().includes(searchTermLower) ||
            product.description.toLowerCase().includes(searchTermLower) ||
            product.tags.some((tag: string) => tag.toLowerCase().includes(searchTermLower)),
        )
        .slice(0, limitCount) as BeautyProduct[]

      return products
    } catch (error) {
      console.error("Error searching products:", error)
      return []
    }
  }

  // 리뷰 관리
  static async getProductReviews(productId: string, limitCount = 10): Promise<ProductReview[]> {
    try {
      const q = query(
        collection(db, "productReviews"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as ProductReview[]
    } catch (error) {
      console.error("Error getting product reviews:", error)
      return []
    }
  }

  static async addProductReview(review: Omit<ProductReview, "id" | "createdAt">) {
    try {
      // 리뷰 추가
      const docRef = await addDoc(collection(db, "productReviews"), {
        ...review,
        createdAt: Timestamp.now(),
      })

      // 제품 평점 업데이트
      const productRef = doc(db, "beautyProducts", review.productId)
      await updateDoc(productRef, {
        reviewCount: increment(1),
      })

      // 평균 평점 업데이트 (실제로는 더 복잡한 로직이 필요할 수 있음)
      const reviews = await this.getProductReviews(review.productId, 100)
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await updateDoc(productRef, {
        rating: Math.round(avgRating * 10) / 10,
      })

      return docRef.id
    } catch (error) {
      console.error("Error adding product review:", error)
      throw error
    }
  }

  // 제품 추천 시스템
  static async generateProductRecommendations(userId: string): Promise<ProductRecommendation[]> {
    try {
      // 사용자 프로필 및 분석 데이터 가져오기
      const userProfile = await this.getUserProfile(userId)
      const recentAnalyses = await this.getUserAnalysisHistory(userId, 3)

      if (!userProfile) return []

      // 모든 제품 가져오기 (실제로는 더 효율적인 방법 필요)
      const { products } = await this.getProducts(100)

      const recommendations: ProductRecommendation[] = []

      // 피부 타입 기반 추천
      if (userProfile.skinType) {
        const skinTypeProducts = products.filter((product) =>
          product.suitableFor.skinTypes.includes(userProfile.skinType as any),
        )

        for (const product of skinTypeProducts.slice(0, 5)) {
          recommendations.push({
            id: `${userId}_${product.id}`,
            userId,
            productId: product.id,
            score: 0.8,
            reason: ["피부 타입 맞춤 제품"],
            category: product.category,
            priority: "high",
            createdAt: new Date(),
            clicked: false,
            purchased: false,
          })
        }
      }

      // 피부 관심사 기반 추천
      if (userProfile.skinConcerns && userProfile.skinConcerns.length > 0) {
        const concernProducts = products.filter((product) =>
          userProfile.skinConcerns.some((concern) => product.suitableFor.skinConcerns.includes(concern)),
        )

        for (const product of concernProducts.slice(0, 5)) {
          if (!recommendations.some((r) => r.productId === product.id)) {
            recommendations.push({
              id: `${userId}_${product.id}`,
              userId,
              productId: product.id,
              score: 0.9,
              reason: ["피부 관심사 맞춤 제품"],
              category: product.category,
              priority: "high",
              createdAt: new Date(),
              clicked: false,
              purchased: false,
            })
          }
        }
      }

      // 최근 분석 결과 기반 추천
      if (recentAnalyses.length > 0) {
        const latestAnalysis = recentAnalyses[0]

        // 수분도가 낮은 경우
        if (latestAnalysis.analysisData.hydration < 50) {
          const hydrationProducts = products.filter(
            (product) =>
              product.category === "skincare" &&
              (product.subCategory === "moisturizer" || product.tags.includes("hydrating")),
          )

          for (const product of hydrationProducts.slice(0, 3)) {
            if (!recommendations.some((r) => r.productId === product.id)) {
              recommendations.push({
                id: `${userId}_${product.id}`,
                userId,
                productId: product.id,
                score: 0.95,
                reason: ["낮은 수분도 개선을 위한 제품"],
                category: product.category,
                priority: "high",
                createdAt: new Date(),
                clicked: false,
                purchased: false,
              })
            }
          }
        }

        // 유분이 많은 경우
        if (latestAnalysis.analysisData.oiliness > 70) {
          const oilControlProducts = products.filter(
            (product) =>
              product.category === "skincare" &&
              (product.tags.includes("oil-control") || product.tags.includes("mattifying")),
          )

          for (const product of oilControlProducts.slice(0, 3)) {
            if (!recommendations.some((r) => r.productId === product.id)) {
              recommendations.push({
                id: `${userId}_${product.id}`,
                userId,
                productId: product.id,
                score: 0.9,
                reason: ["유분 조절을 위한 제품"],
                category: product.category,
                priority: "medium",
                createdAt: new Date(),
                clicked: false,
                purchased: false,
              })
            }
          }
        }
      }

      // 인기 제품 추천 (추천이 부족한 경우)
      if (recommendations.length < 10) {
        const popularProducts = products
          .filter((product) => product.rating >= 4.5)
          .sort((a, b) => b.reviewCount - a.reviewCount)

        for (const product of popularProducts.slice(0, 10 - recommendations.length)) {
          if (!recommendations.some((r) => r.productId === product.id)) {
            recommendations.push({
              id: `${userId}_${product.id}`,
              userId,
              productId: product.id,
              score: 0.7,
              reason: ["높은 평점의 인기 제품"],
              category: product.category,
              priority: "medium",
              createdAt: new Date(),
              clicked: false,
              purchased: false,
            })
          }
        }
      }

      // 추천 저장 (실제로는 기존 추천 업데이트 로직 필요)
      for (const rec of recommendations) {
        await this.saveProductRecommendation(rec)
      }

      return recommendations
    } catch (error) {
      console.error("Error generating product recommendations:", error)
      return []
    }
  }

  static async saveProductRecommendation(recommendation: ProductRecommendation) {
    try {
      // 기존 추천이 있는지 확인
      const q = query(
        collection(db, "productRecommendations"),
        where("userId", "==", recommendation.userId),
        where("productId", "==", recommendation.productId),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // 새 추천 추가
        await addDoc(collection(db, "productRecommendations"), {
          ...recommendation,
          createdAt: Timestamp.fromDate(recommendation.createdAt),
        })
      } else {
        // 기존 추천 업데이트
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          score: recommendation.score,
          reason: recommendation.reason,
          priority: recommendation.priority,
          updatedAt: Timestamp.now(),
        })
      }
    } catch (error) {
      console.error("Error saving product recommendation:", error)
    }
  }

  static async getUserRecommendations(userId: string): Promise<ProductRecommendation[]> {
    try {
      const q = query(
        collection(db, "productRecommendations"),
        where("userId", "==", userId),
        orderBy("score", "desc"),
        limit(20),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as ProductRecommendation[]
    } catch (error) {
      console.error("Error getting user recommendations:", error)
      return []
    }
  }

  // 장바구니 관리
  static async getCart(userId: string): Promise<ShoppingCart | null> {
    try {
      const q = query(collection(db, "shoppingCarts"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // 장바구니가 없으면 새로 생성
        const newCart = {
          userId,
          items: [],
          subtotal: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const docRef = await addDoc(collection(db, "shoppingCarts"), {
          ...newCart,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        return {
          id: docRef.id,
          ...newCart,
        }
      }

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as ShoppingCart
    } catch (error) {
      console.error("Error getting cart:", error)
      return null
    }
  }

  static async addToCart(userId: string, product: BeautyProduct, quantity: number) {
    try {
      const cart = await this.getCart(userId)
      if (!cart) return

      const existingItemIndex = cart.items.findIndex((item) => item.productId === product.id)

      if (existingItemIndex >= 0) {
        // 기존 아이템 수량 업데이트
        cart.items[existingItemIndex].quantity += quantity
      } else {
        // 새 아이템 추가
        cart.items.push({
          productId: product.id,
          quantity,
          price: product.price,
          name: product.name,
          brand: product.brand,
          image: product.images[0] || "",
        })
      }

      // 소계 계산
      cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // 장바구니 업데이트
      const cartRef = doc(db, "shoppingCarts", cart.id)
      await updateDoc(cartRef, {
        items: cart.items,
        subtotal: cart.subtotal,
        updatedAt: Timestamp.now(),
      })

      return cart
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    }
  }

  // 헬퍼 메소드
  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, "userProfiles"), where("id", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastAnalysisDate: doc.data().lastAnalysisDate?.toDate(),
      } as UserProfile
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  private static async getUserAnalysisHistory(userId: string, limitCount = 3): Promise<BeautyAnalysis[]> {
    try {
      const q = query(
        collection(db, "beautyAnalyses"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as BeautyAnalysis[]
    } catch (error) {
      console.error("Error getting analysis history:", error)
      return []
    }
  }

  // 샘플 데이터 생성 (개발용)
  static async generateSampleProducts() {
    try {
      const sampleProducts: Omit<BeautyProduct, "id">[] = [
        {
          name: "수분 충전 세럼",
          brand: "수분공장",
          category: "skincare",
          subCategory: "serum",
          price: 28000,
          currency: "KRW",
          size: "50ml",
          description:
            "하이알루론산과 세라마이드가 풍부하게 함유된 수분 충전 세럼입니다. 건조한 피부에 즉각적인 수분을 공급하고 피부 장벽을 강화합니다.",
          shortDescription: "즉각적인 수분 공급과 피부 장벽 강화",
          ingredients: ["하이알루론산", "세라마이드", "판테놀", "글리세린", "알로에베라"],
          benefits: ["즉각적인 수분 공급", "피부 장벽 강화", "건조함 완화", "피부 진정"],
          howToUse: "세안 후 토너 다음 단계에서 2-3방울을 얼굴 전체에 부드럽게 펴 바릅니다.",
          suitableFor: {
            skinTypes: ["dry", "normal", "combination", "sensitive"],
            skinConcerns: ["건조함", "탈수", "민감성"],
            ageRanges: ["20대", "30대", "40대", "50대 이상"],
          },
          rating: 4.8,
          reviewCount: 245,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["수분", "하이알루론산", "세라마이드", "진정", "민감성 피부"],
          featured: true,
          isNew: false,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90일 전
          updatedAt: new Date(),
        },
        {
          name: "비타민 C 브라이트닝 에센스",
          brand: "글로우랩",
          category: "skincare",
          subCategory: "essence",
          price: 45000,
          currency: "KRW",
          size: "30ml",
          description:
            "순수 비타민 C 20%가 함유된 고농축 브라이트닝 에센스입니다. 멜라닌 생성을 억제하고 기존 색소침착을 개선하여 맑고 균일한 피부톤으로 가꿔줍니다.",
          shortDescription: "고농축 비타민 C로 빛나는 피부톤",
          ingredients: ["아스코르빅애시드 20%", "페룰릭애시드", "비타민E", "판테놀", "나이아신아마이드"],
          benefits: ["피부톤 개선", "색소침착 완화", "항산화 효과", "콜라겐 생성 촉진"],
          howToUse:
            "저녁 세안 후 토너 다음 단계에서 3-4방울을 얼굴에 골고루 바릅니다. 자외선 차단제와 함께 사용하세요.",
          suitableFor: {
            skinTypes: ["normal", "combination", "oily"],
            skinConcerns: ["색소침착", "칙칙함", "잡티", "안색 불균일"],
            ageRanges: ["20대", "30대", "40대"],
          },
          rating: 4.6,
          reviewCount: 189,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["비타민C", "브라이트닝", "안티에이징", "색소침착", "안티옥시던트"],
          featured: true,
          isNew: true,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45일 전
          updatedAt: new Date(),
        },
        {
          name: "살리실산 포어 클렌징 토너",
          brand: "클린스킨",
          category: "skincare",
          subCategory: "toner",
          price: 22000,
          currency: "KRW",
          size: "200ml",
          description:
            "살리실산 2%가 함유된 모공 케어 토너입니다. 과도한 피지를 조절하고 모공 속 노폐물을 효과적으로 제거하여 맑고 깨끗한 피부로 가꿔줍니다.",
          shortDescription: "모공 속 노폐물 제거와 피지 조절",
          ingredients: ["살리실산 2%", "위치하젤", "티트리오일", "알란토인", "판테놀"],
          benefits: ["모공 관리", "피지 조절", "각질 제거", "피부결 개선"],
          howToUse: "세안 후 화장솜에 적당량을 묻혀 얼굴을 부드럽게 닦아냅니다. 눈가는 피해주세요.",
          suitableFor: {
            skinTypes: ["oily", "combination"],
            skinConcerns: ["모공", "과다 피지", "여드름", "블랙헤드"],
            ageRanges: ["10대", "20대", "30대"],
          },
          rating: 4.5,
          reviewCount: 312,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["살리실산", "모공", "피지 조절", "각질", "여드름"],
          featured: false,
          isNew: false,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120일 전
          updatedAt: new Date(),
        },
        {
          name: "콜라겐 탄력 크림",
          brand: "에이지리스",
          category: "skincare",
          subCategory: "cream",
          price: 58000,
          currency: "KRW",
          size: "50ml",
          description:
            "마린 콜라겐과 펩타이드 복합체가 풍부하게 함유된 안티에이징 크림입니다. 피부 탄력을 개선하고 주름을 완화하여 젊고 탄탄한 피부로 가꿔줍니다.",
          shortDescription: "탄력 강화와 주름 개선을 위한 안티에이징 크림",
          ingredients: ["마린 콜라겐", "펩타이드 복합체", "세라마이드", "스쿠알란", "히알루론산"],
          benefits: ["탄력 강화", "주름 개선", "피부 장벽 강화", "수분 공급"],
          howToUse: "아침, 저녁 세안 후 마지막 단계에서 적당량을 얼굴과 목에 골고루 바릅니다.",
          suitableFor: {
            skinTypes: ["normal", "dry", "combination"],
            skinConcerns: ["탄력 저하", "주름", "건조함", "노화"],
            ageRanges: ["30대", "40대", "50대 이상"],
          },
          rating: 4.7,
          reviewCount: 178,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["콜라겐", "안티에이징", "탄력", "주름", "펩타이드"],
          featured: true,
          isNew: false,
          bestSeller: false,
          inStock: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60일 전
          updatedAt: new Date(),
        },
        {
          name: "시카 진정 앰플",
          brand: "더마힐",
          category: "skincare",
          subCategory: "ampoule",
          price: 32000,
          currency: "KRW",
          size: "20ml",
          description:
            "센텔라아시아티카 추출물이 고농축으로 함유된 진정 앰플입니다. 민감해진 피부를 빠르게 진정시키고 손상된 피부 장벽을 회복시켜줍니다.",
          shortDescription: "민감한 피부를 위한 집중 진정 케어",
          ingredients: ["센텔라아시아티카 추출물", "마데카소사이드", "판테놀", "알란토인", "세라마이드"],
          benefits: ["즉각적인 진정 효과", "피부 장벽 강화", "민감성 완화", "붉은기 개선"],
          howToUse:
            "세안 후 토너 다음 단계에서 2-3방울을 얼굴에 골고루 바릅니다. 민감한 부위에는 한 번 더 덧발라줍니다.",
          suitableFor: {
            skinTypes: ["sensitive", "normal", "combination", "dry"],
            skinConcerns: ["민감성", "붉은기", "자극", "손상된 피부 장벽"],
            ageRanges: ["전 연령대"],
          },
          rating: 4.9,
          reviewCount: 423,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["시카", "진정", "민감성", "센텔라", "피부 장벽"],
          featured: true,
          isNew: false,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 전
          updatedAt: new Date(),
        },
        {
          name: "클레이 딥 클렌징 마스크",
          brand: "클린스킨",
          category: "skincare",
          subCategory: "mask",
          price: 18000,
          currency: "KRW",
          size: "100ml",
          description:
            "프랑스산 그린 클레이와 차콜이 함유된 딥 클렌징 마스크입니다. 모공 속 노폐물과 과도한 피지를 효과적으로 제거하여 맑고 깨끗한 피부로 가꿔줍니다.",
          shortDescription: "모공 속 노폐물 제거를 위한 딥 클렌징",
          ingredients: ["프랑스산 그린 클레이", "차콜 파우더", "살리실산", "티트리오일", "알로에베라"],
          benefits: ["딥 클렌징", "피지 조절", "모공 관리", "피부결 개선"],
          howToUse:
            "세안 후 얼굴에 고르게 발라 10-15분간 건조시킨 후 미온수로 깨끗이 씻어냅니다. 주 1-2회 사용을 권장합니다.",
          suitableFor: {
            skinTypes: ["oily", "combination"],
            skinConcerns: ["모공", "과다 피지", "블랙헤드", "피부결"],
            ageRanges: ["10대", "20대", "30대"],
          },
          rating: 4.4,
          reviewCount: 156,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["클레이", "마스크", "딥클렌징", "모공", "피지"],
          featured: false,
          isNew: false,
          bestSeller: false,
          inStock: true,
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), // 150일 전
          updatedAt: new Date(),
        },
        {
          name: "UV 프로텍션 선크림 SPF50+ PA++++",
          brand: "선가드",
          category: "skincare",
          subCategory: "sunscreen",
          price: 25000,
          currency: "KRW",
          size: "50ml",
          description:
            "가볍고 산뜻한 텍스처의 고기능성 자외선 차단제입니다. SPF50+ PA++++의 강력한 자외선 차단 효과와 함께 항산화 성분이 피부를 보호합니다.",
          shortDescription: "가볍고 산뜻한 고기능성 자외선 차단제",
          ingredients: ["에칠헥실메톡시신나메이트", "티타늄디옥사이드", "징크옥사이드", "비타민E", "녹차추출물"],
          benefits: ["UVA/UVB 차단", "백탁현상 최소화", "항산화 효과", "피부 보호"],
          howToUse: "기초 케어 마지막 단계에서 적당량을 얼굴과 목에 골고루 바릅니다. 외출 시 2-3시간마다 덧발라줍니다.",
          suitableFor: {
            skinTypes: ["all", "normal", "combination", "dry", "oily", "sensitive"],
            skinConcerns: ["자외선", "노화 방지", "색소침착"],
            ageRanges: ["전 연령대"],
          },
          rating: 4.7,
          reviewCount: 289,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["선크림", "자외선차단", "SPF50", "데일리", "무기자차"],
          featured: true,
          isNew: false,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80일 전
          updatedAt: new Date(),
        },
        {
          name: "글로우 쿠션 파운데이션 SPF50+ PA+++",
          brand: "글로우랩",
          category: "makeup",
          subCategory: "foundation",
          price: 38000,
          currency: "KRW",
          size: "15g",
          description:
            "가볍고 촉촉한 텍스처로 자연스러운 윤기와 커버력을 선사하는 쿠션 파운데이션입니다. 피부 톤을 균일하게 보정하고 자외선으로부터 피부를 보호합니다.",
          shortDescription: "자연스러운 윤기와 커버력의 쿠션 파운데이션",
          ingredients: ["정제수", "사이클로펜타실록산", "티타늄디옥사이드", "나이아신아마이드", "히알루론산"],
          benefits: ["자연스러운 커버", "촉촉한 윤기", "자외선 차단", "피부 보습"],
          howToUse:
            "퍼프에 적당량을 묻혀 얼굴 중앙부터 바깥쪽으로 두드리듯 발라줍니다. 커버가 필요한 부위는 한 번 더 덧발라줍니다.",
          suitableFor: {
            skinTypes: ["normal", "dry", "combination"],
            skinConcerns: ["톤 보정", "건조함", "칙칙함"],
            ageRanges: ["20대", "30대", "40대"],
          },
          rating: 4.6,
          reviewCount: 215,
          images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
          tags: ["쿠션", "파운데이션", "커버", "윤광", "자외선차단"],
          featured: true,
          isNew: true,
          bestSeller: true,
          inStock: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20일 전
          updatedAt: new Date(),
        },
      ]

      for (const product of sampleProducts) {
        await addDoc(collection(db, "beautyProducts"), {
          ...product,
          createdAt: Timestamp.fromDate(product.createdAt),
          updatedAt: Timestamp.fromDate(product.updatedAt),
        })
      }

      console.log(`${sampleProducts.length} sample products created`)
    } catch (error) {
      console.error("Error generating sample products:", error)
    }
  }
}

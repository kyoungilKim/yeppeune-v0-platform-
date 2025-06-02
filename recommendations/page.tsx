"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProductService } from "@/lib/firebase-product"
import { BeautyService } from "@/lib/firebase-beauty"
import { RecommendationEngine } from "@/lib/recommendation-engine"
import type { BeautyProduct, ProductRecommendation } from "@/types/product"
import type { UserProfile, BeautyAnalysis } from "@/types/beauty"
import { Heart, ShoppingCart, Star, Target, Lightbulb, BarChart3, RefreshCw, Filter, ChevronRight } from "lucide-react"

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [products, setProducts] = useState<BeautyProduct[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [recentAnalysis, setRecentAnalysis] = useState<BeautyAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [recommendationCategories, setRecommendationCategories] = useState<
    {
      title: string
      description: string
      tags: string[]
      priority: "high" | "medium" | "low"
    }[]
  >([])

  // 임시 사용자 ID
  const userId = "user123"

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)

      // 사용자 프로필 로드
      const profile = await BeautyService.getUserProfile(userId)
      setUserProfile(profile)

      // 최근 분석 결과 로드
      const analyses = await BeautyService.getUserAnalysisHistory(userId, 1)
      if (analyses.length > 0) {
        setRecentAnalysis(analyses[0])
      }

      // 추천 카테고리 생성
      const categories = await RecommendationEngine.generateRecommendationCategories(userId)
      setRecommendationCategories(categories)

      // 기존 추천 로드
      const recs = await ProductService.getUserRecommendations(userId)
      setRecommendations(recs)

      // 추천 제품 정보 로드
      const productPromises = recs.map((rec) => ProductService.getProductById(rec.productId))
      const productResults = await Promise.all(productPromises)
      const validProducts = productResults.filter((p) => p !== null) as BeautyProduct[]
      setProducts(validProducts)

      // 추천이 없거나 적으면 새로 생성
      if (recs.length < 5) {
        await generateNewRecommendations()
      }
    } catch (error) {
      console.error("Error loading recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewRecommendations = async () => {
    try {
      setGenerating(true)

      // 새 추천 생성 (개선된 추천 엔진 사용)
      const newRecs = await RecommendationEngine.generatePersonalizedRecommendations(userId)
      setRecommendations(newRecs)

      // 추천 제품 정보 로드
      const productPromises = newRecs.map((rec) => ProductService.getProductById(rec.productId))
      const productResults = await Promise.all(productPromises)
      const validProducts = productResults.filter((p) => p !== null) as BeautyProduct[]
      setProducts(validProducts)
    } catch (error) {
      console.error("Error generating recommendations:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToCart = async (product: BeautyProduct) => {
    try {
      await ProductService.addToCart(userId, product, 1)
      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`)
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const getFilteredRecommendations = () => {
    if (activeCategory === "all") {
      return recommendations
    } else if (activeCategory === "high") {
      return recommendations.filter((rec) => rec.priority === "high")
    } else if (activeCategory === "medium") {
      return recommendations.filter((rec) => rec.priority === "medium")
    } else if (activeCategory === "low") {
      return recommendations.filter((rec) => rec.priority === "low")
    } else {
      // 특정 카테고리 필터링
      const category = recommendationCategories.find((cat) => cat.title === activeCategory)
      if (!category) return recommendations

      return recommendations.filter((rec) => {
        const product = getProductById(rec.productId)
        if (!product) return false

        // 제품 태그와 카테고리 태그 매칭
        return category.tags.some(
          (tag) =>
            product.tags.includes(tag) ||
            product.category === tag ||
            product.suitableFor.skinTypes.includes(tag as any) ||
            product.suitableFor.skinConcerns.some((concern) => concern.includes(tag)),
        )
      })
    }
  }

  const getProductById = (productId: string) => {
    return products.find((p) => p.id === productId)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">맞춤 추천을 준비하는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredRecommendations = getFilteredRecommendations()

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">맞춤 제품 추천</h1>
        <p className="text-gray-600">당신의 피부 분석 결과와 선호도를 바탕으로 선별된 제품들입니다</p>
      </div>

      {/* 사용자 프로필 요약 */}
      {userProfile && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {userProfile.name}님의 뷰티 프로필
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600 mb-1">{userProfile.averageSkinScore || 0}/100</div>
                <p className="text-sm text-gray-600">평균 피부 점수</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">
                  {userProfile.skinType === "dry"
                    ? "건성"
                    : userProfile.skinType === "oily"
                      ? "지성"
                      : userProfile.skinType === "combination"
                        ? "복합성"
                        : userProfile.skinType === "sensitive"
                          ? "민감성"
                          : "중성"}
                </div>
                <p className="text-sm text-gray-600">피부 타입</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{userProfile.totalAnalyses}</div>
                <p className="text-sm text-gray-600">총 분석 횟수</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{userProfile.skinConcerns.length}</div>
                <p className="text-sm text-gray-600">관심 피부 고민</p>
              </div>
            </div>

            {recentAnalysis && (
              <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <h4 className="font-semibold mb-3">최근 분석 결과 기반 추천</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">수분도</p>
                    <Progress value={recentAnalysis.analysisData.hydration} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">{recentAnalysis.analysisData.hydration}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">유분도</p>
                    <Progress value={recentAnalysis.analysisData.oiliness} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">{recentAnalysis.analysisData.oiliness}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">탄력도</p>
                    <Progress value={recentAnalysis.analysisData.elasticity} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">{recentAnalysis.analysisData.elasticity}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 추천 카테고리 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">추천 카테고리</h2>
          <Button onClick={generateNewRecommendations} disabled={generating} variant="outline" size="sm">
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />새 추천 생성
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${activeCategory === "all" ? "border-pink-500 bg-pink-50" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center justify-between">
                <span>모든 추천 제품</span>
                <ChevronRight className="h-4 w-4" />
              </CardTitle>
              <CardDescription>총 {recommendations.length}개의 제품</CardDescription>
            </CardHeader>
          </Card>

          {recommendationCategories.map((category, index) => (
            <Card
              key={index}
              className={`cursor-pointer hover:shadow-md transition-shadow ${activeCategory === category.title ? "border-pink-500 bg-pink-50" : ""}`}
              onClick={() => setActiveCategory(category.title)}
            >
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{category.title}</CardTitle>
                  <Badge
                    variant={
                      category.priority === "high"
                        ? "destructive"
                        : category.priority === "medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {category.priority === "high" ? "높음" : category.priority === "medium" ? "보통" : "낮음"}
                  </Badge>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* 추천 제품 목록 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {activeCategory === "all"
              ? "모든 추천 제품"
              : activeCategory === "high"
                ? "높은 우선순위 추천"
                : activeCategory === "medium"
                  ? "중간 우선순위 추천"
                  : activeCategory === "low"
                    ? "낮은 우선순위 추천"
                    : activeCategory}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveCategory("high")}>
              <Filter className="h-4 w-4 mr-2" />
              높은 우선순위
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveCategory("medium")}>
              <Filter className="h-4 w-4 mr-2" />
              중간 우선순위
            </Button>
          </div>
        </div>

        {filteredRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((rec) => {
              const product = getProductById(rec.productId)
              if (!product) return null

              return (
                <Card key={rec.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        rec.priority === "high"
                          ? "bg-red-500"
                          : rec.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                      }`}
                    >
                      {rec.priority === "high" ? "높음" : rec.priority === "medium" ? "보통" : "낮음"}
                    </Badge>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs font-semibold">{Math.round(rec.score * 100)}% 매칭</span>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="text-sm text-gray-500">{product.brand}</div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">추천 이유:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.reason.map((reason, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-pink-500 mt-1">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">{product.price.toLocaleString()}원</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">해당 카테고리의 추천 제품이 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택하거나 새로운 추천을 생성해보세요</p>
            <Button onClick={generateNewRecommendations} disabled={generating}>
              {generating ? "생성 중..." : "새 추천 생성하기"}
            </Button>
          </div>
        )}
      </div>

      {/* 추천 통계 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {recommendations.filter((r) => r.priority === "high").length}
              </div>
              <p className="text-sm text-gray-600">높은 우선순위 추천</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {Math.round((recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length) * 100) || 0}
                %
              </div>
              <p className="text-sm text-gray-600">평균 매칭 점수</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Array.from(new Set(recommendations.map((r) => r.category))).length}
              </div>
              <p className="text-sm text-gray-600">추천 카테고리 수</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

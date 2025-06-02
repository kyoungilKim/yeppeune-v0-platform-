"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AgeTrendService } from "@/lib/firebase-age-trends"
import type { AgeGroupRecommendation } from "@/types/age-trends"
import { Sparkles, Palette, Scissors, Shirt, ShoppingBag } from "lucide-react"

export default function AgeGuidePage() {
  const [recommendations, setRecommendations] = useState<AgeGroupRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("30s")

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        const data = await AgeTrendService.getAgeGroupRecommendations()
        setRecommendations(data)
      } catch (error) {
        console.error("Error loading recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  const currentRecommendation = recommendations.find((rec) => rec.ageGroup === selectedAgeGroup)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">연령대별 가이드를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">연령대별 뷰티 가이드</h1>
        <p className="text-gray-600">각 연령대에 맞는 뷰티 스타일과 트렌드를 확인하세요</p>
      </div>

      <Tabs defaultValue={selectedAgeGroup} onValueChange={setSelectedAgeGroup} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="20s">20대</TabsTrigger>
          <TabsTrigger value="30s">30대</TabsTrigger>
          <TabsTrigger value="40s">40대</TabsTrigger>
          <TabsTrigger value="50s">50대</TabsTrigger>
          <TabsTrigger value="60s">60대</TabsTrigger>
        </TabsList>

        {currentRecommendation ? (
          <TabsContent value={selectedAgeGroup} className="space-y-6">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-2">{currentRecommendation.title}</h2>
              <p className="text-gray-700">{currentRecommendation.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 스킨케어 가이드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500" />
                    스킨케어 가이드
                  </CardTitle>
                  <CardDescription>
                    {selectedAgeGroup} 피부 특성에 맞는 스킨케어 제품과 루틴을 추천합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">추천 카테고리</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.skincare.recommendedCategories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="bg-pink-100 text-pink-800">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">핵심 성분</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.skincare.keyIngredients.map((ingredient, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">케어 팁</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.skincare.routineTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-pink-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 메이크업 가이드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-500" />
                    메이크업 가이드
                  </CardTitle>
                  <CardDescription>{selectedAgeGroup}에게 어울리는 메이크업 스타일과 컬러를 추천합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">추천 컬러</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.makeup.colorRecommendations.map((color, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">추천 제품</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.makeup.recommendedProducts.map((product, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">메이크업 팁</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.makeup.applicationTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 헤어케어 가이드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-green-500" />
                    헤어케어 가이드
                  </CardTitle>
                  <CardDescription>{selectedAgeGroup}에게 어울리는 헤어스타일과 케어 방법을 추천합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">추천 스타일</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.hairCare.recommendedStyles.map((style, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">케어 루틴</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.hairCare.careRoutine.map((routine, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {routine}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">컬러 조언</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.hairCare.colorAdvice.map((advice, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {advice}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 패션 가이드 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Shirt className="h-5 w-5 text-blue-500" />
                    패션 가이드
                  </CardTitle>
                  <CardDescription>
                    {selectedAgeGroup}에게 어울리는 패션 스타일과 필수 아이템을 추천합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">필수 아이템</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.fashion.essentialItems.map((item, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">컬러 팔레트</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.fashion.colorPalette.map((color, index) => (
                        <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">스타일 가이드</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.fashion.styleGuide.map((guide, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <h5 className="font-medium text-xs text-gray-500 mb-1">캐주얼</h5>
                      <div className="space-y-1">
                        {currentRecommendation.fashion.occasionSpecific.casual.slice(0, 2).map((item, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-xs text-gray-500 mb-1">워크웨어</h5>
                      <div className="space-y-1">
                        {currentRecommendation.fashion.occasionSpecific.workwear.slice(0, 2).map((item, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-xs text-gray-500 mb-1">포멀</h5>
                      <div className="space-y-1">
                        {currentRecommendation.fashion.occasionSpecific.formal.slice(0, 2).map((item, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 신발 가이드 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-red-500" />
                  신발 가이드
                </CardTitle>
                <CardDescription>{selectedAgeGroup}에게 어울리는 신발 스타일과 착용 팁을 추천합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">추천 스타일</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentRecommendation.footwear.recommendedTypes.map((type, index) => (
                        <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">컴포트 팁</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {currentRecommendation.footwear.comfortTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">계절별 추천</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(currentRecommendation.footwear.seasonalRecommendations).map(([season, items]) => (
                      <div key={season}>
                        <h5 className="font-medium text-xs text-gray-500 mb-1 capitalize">
                          {season === "spring"
                            ? "봄"
                            : season === "summer"
                              ? "여름"
                              : season === "fall"
                                ? "가을"
                                : "겨울"}
                        </h5>
                        <div className="space-y-1">
                          {items.slice(0, 3).map((item, index) => (
                            <p key={index} className="text-xs text-gray-600">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">해당 연령대의 가이드를 찾을 수 없습니다.</p>
          </div>
        )}
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import AIRecommendationDisplay from "@/components/ai-recommendation-display"
import { AIMakeupEngine } from "@/lib/ai-makeup-engine"
import type { AIRecommendationInput, AIRecommendedMakeup } from "@/types/ai-makeup-recommendation"
import { Brain, Sparkles, Settings, Calendar, Loader2, RefreshCw } from "lucide-react"

export default function AIRecommendationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<AIRecommendedMakeup | null>(null)
  const [input, setInput] = useState<AIRecommendationInput>({
    faceAnalysis: {
      faceShape: "oval",
      skinTone: "medium",
      skinUndertone: "neutral",
      eyeShape: "almond",
      eyeColor: "brown",
      lipShape: "full",
      facialFeatures: {
        symmetry: 85,
        proportions: 80,
        harmony: 88,
      },
      skinAnalysis: {
        wrinkles: 20,
        spots: 30,
        pores: 40,
        redness: 25,
        evenness: 75,
        hydration: 60,
        oiliness: 50,
      },
    },
    userPreferences: {
      style: "natural",
      occasion: "daily",
      intensity: "medium",
      favoriteColors: ["#FF6B6B", "#4ECDC4"],
      avoidColors: ["#000000"],
    },
    contextualFactors: {
      timeOfDay: "morning",
      season: "spring",
      lighting: "natural",
      weather: "sunny",
    },
  })

  // AI 추천 생성
  const generateRecommendation = async () => {
    setIsLoading(true)
    try {
      const result = await AIMakeupEngine.generateRecommendation(input)
      setRecommendation(result)
    } catch (error) {
      console.error("AI 추천 생성 실패:", error)
      alert("추천 생성 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 추천 생성
  useEffect(() => {
    generateRecommendation()
  }, [])

  // AR 적용
  const handleApplyToAR = (rec: AIRecommendedMakeup) => {
    // AR 페이지로 이동하면서 추천 데이터 전달
    window.location.href = `/ar-makeup/3d?recommendation=${encodeURIComponent(JSON.stringify(rec))}`
  }

  // 추천 저장
  const handleSaveRecommendation = (rec: AIRecommendedMakeup) => {
    // 로컬 스토리지에 저장
    const saved = JSON.parse(localStorage.getItem("savedRecommendations") || "[]")
    saved.push({ ...rec, savedAt: new Date().toISOString() })
    localStorage.setItem("savedRecommendations", JSON.stringify(saved))
    alert("추천이 저장되었습니다!")
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-pink-500" />
          AI 메이크업 추천
        </h1>
        <p className="text-gray-600">얼굴 분석과 개인 선호도를 바탕으로 AI가 최적의 메이크업을 추천해드립니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 설정 패널 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                얼굴 분석 정보
              </CardTitle>
              <CardDescription>현재 얼굴 분석 결과를 확인하고 수정할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">얼굴형</label>
                  <Select
                    value={input.faceAnalysis.faceShape}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: { ...prev.faceAnalysis, faceShape: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oval">타원형</SelectItem>
                      <SelectItem value="round">둥근형</SelectItem>
                      <SelectItem value="square">사각형</SelectItem>
                      <SelectItem value="heart">하트형</SelectItem>
                      <SelectItem value="long">긴형</SelectItem>
                      <SelectItem value="diamond">다이아몬드형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">피부톤</label>
                  <Select
                    value={input.faceAnalysis.skinTone}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: { ...prev.faceAnalysis, skinTone: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fair">매우 밝음</SelectItem>
                      <SelectItem value="light">밝음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="olive">올리브</SelectItem>
                      <SelectItem value="tan">어두움</SelectItem>
                      <SelectItem value="deep">매우 어두움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">언더톤</label>
                  <Select
                    value={input.faceAnalysis.skinUndertone}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: { ...prev.faceAnalysis, skinUndertone: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cool">쿨톤</SelectItem>
                      <SelectItem value="warm">웜톤</SelectItem>
                      <SelectItem value="neutral">중성톤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">눈 모양</label>
                  <Select
                    value={input.faceAnalysis.eyeShape}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: { ...prev.faceAnalysis, eyeShape: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="almond">아몬드형</SelectItem>
                      <SelectItem value="round">둥근형</SelectItem>
                      <SelectItem value="monolid">무쌍</SelectItem>
                      <SelectItem value="hooded">후드형</SelectItem>
                      <SelectItem value="downturned">처진형</SelectItem>
                      <SelectItem value="upturned">올라간형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 피부 상태 슬라이더 */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">수분도</span>
                    <span className="text-sm text-gray-500">{input.faceAnalysis.skinAnalysis.hydration}%</span>
                  </div>
                  <Slider
                    value={[input.faceAnalysis.skinAnalysis.hydration]}
                    onValueChange={([value]) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: {
                          ...prev.faceAnalysis,
                          skinAnalysis: { ...prev.faceAnalysis.skinAnalysis, hydration: value },
                        },
                      }))
                    }
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">유분도</span>
                    <span className="text-sm text-gray-500">{input.faceAnalysis.skinAnalysis.oiliness}%</span>
                  </div>
                  <Slider
                    value={[input.faceAnalysis.skinAnalysis.oiliness]}
                    onValueChange={([value]) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: {
                          ...prev.faceAnalysis,
                          skinAnalysis: { ...prev.faceAnalysis.skinAnalysis, oiliness: value },
                        },
                      }))
                    }
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">민감도</span>
                    <span className="text-sm text-gray-500">{input.faceAnalysis.skinAnalysis.redness}%</span>
                  </div>
                  <Slider
                    value={[input.faceAnalysis.skinAnalysis.redness]}
                    onValueChange={([value]) =>
                      setInput((prev) => ({
                        ...prev,
                        faceAnalysis: {
                          ...prev.faceAnalysis,
                          skinAnalysis: { ...prev.faceAnalysis.skinAnalysis, redness: value },
                        },
                      }))
                    }
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 선호도 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                메이크업 선호도
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">스타일</label>
                <Select
                  value={input.userPreferences?.style}
                  onValueChange={(value) =>
                    setInput((prev) => ({
                      ...prev,
                      userPreferences: { ...prev.userPreferences!, style: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">내추럴</SelectItem>
                    <SelectItem value="glamorous">글래머러스</SelectItem>
                    <SelectItem value="bold">볼드</SelectItem>
                    <SelectItem value="minimal">미니멀</SelectItem>
                    <SelectItem value="vintage">빈티지</SelectItem>
                    <SelectItem value="trendy">트렌디</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">상황</label>
                <Select
                  value={input.userPreferences?.occasion}
                  onValueChange={(value) =>
                    setInput((prev) => ({
                      ...prev,
                      userPreferences: { ...prev.userPreferences!, occasion: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">데일리</SelectItem>
                    <SelectItem value="work">직장</SelectItem>
                    <SelectItem value="party">파티</SelectItem>
                    <SelectItem value="date">데이트</SelectItem>
                    <SelectItem value="wedding">결혼식</SelectItem>
                    <SelectItem value="special">특별한 날</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">강도</label>
                <Select
                  value={input.userPreferences?.intensity}
                  onValueChange={(value) =>
                    setInput((prev) => ({
                      ...prev,
                      userPreferences: { ...prev.userPreferences!, intensity: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">라이트</SelectItem>
                    <SelectItem value="medium">미디엄</SelectItem>
                    <SelectItem value="full">풀</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 상황 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                상황 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">시간대</label>
                  <Select
                    value={input.contextualFactors?.timeOfDay}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        contextualFactors: { ...prev.contextualFactors!, timeOfDay: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">아침</SelectItem>
                      <SelectItem value="afternoon">오후</SelectItem>
                      <SelectItem value="evening">저녁</SelectItem>
                      <SelectItem value="night">밤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">계절</label>
                  <Select
                    value={input.contextualFactors?.season}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        contextualFactors: { ...prev.contextualFactors!, season: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">봄</SelectItem>
                      <SelectItem value="summer">여름</SelectItem>
                      <SelectItem value="autumn">가을</SelectItem>
                      <SelectItem value="winter">겨울</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">조명</label>
                  <Select
                    value={input.contextualFactors?.lighting}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        contextualFactors: { ...prev.contextualFactors!, lighting: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">자연광</SelectItem>
                      <SelectItem value="indoor">실내조명</SelectItem>
                      <SelectItem value="fluorescent">형광등</SelectItem>
                      <SelectItem value="warm">따뜻한 조명</SelectItem>
                      <SelectItem value="cool">차가운 조명</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">날씨</label>
                  <Select
                    value={input.contextualFactors?.weather}
                    onValueChange={(value) =>
                      setInput((prev) => ({
                        ...prev,
                        contextualFactors: { ...prev.contextualFactors!, weather: value as any },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">맑음</SelectItem>
                      <SelectItem value="cloudy">흐림</SelectItem>
                      <SelectItem value="rainy">비</SelectItem>
                      <SelectItem value="humid">습함</SelectItem>
                      <SelectItem value="dry">건조함</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추천 생성 버튼 */}
          <Button onClick={generateRecommendation} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                새로운 추천 생성
              </>
            )}
          </Button>
        </div>

        {/* 추천 결과 */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI가 분석 중입니다</h3>
                  <p className="text-gray-600">
                    얼굴 분석 결과와 선호도를 바탕으로
                    <br />
                    최적의 메이크업을 추천하고 있습니다...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : recommendation ? (
            <AIRecommendationDisplay
              recommendation={recommendation}
              onApplyToAR={handleApplyToAR}
              onSaveRecommendation={handleSaveRecommendation}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI 추천을 시작하세요</h3>
                  <p className="text-gray-600">왼쪽 설정을 조정한 후 "새로운 추천 생성" 버튼을 클릭하세요</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AIRecommendedMakeup } from "@/types/ai-makeup-recommendation"
import { Sparkles, Eye, Smile, Sun, Moon, Info, Play, ShoppingCart, Heart, Share2 } from "lucide-react"

interface AIRecommendationDisplayProps {
  recommendation: AIRecommendedMakeup
  onApplyToAR?: (recommendation: AIRecommendedMakeup) => void
  onSaveRecommendation?: (recommendation: AIRecommendedMakeup) => void
}

export default function AIRecommendationDisplay({
  recommendation,
  onApplyToAR,
  onSaveRecommendation,
}: AIRecommendationDisplayProps) {
  const [selectedStep, setSelectedStep] = useState<string>("foundation")

  const makeupSteps = [
    { id: "foundation", name: "베이스", icon: Sparkles, data: recommendation.foundation },
    { id: "concealer", name: "컨실러", icon: Sparkles, data: recommendation.concealer },
    { id: "eyebrows", name: "아이브로우", icon: Eye, data: recommendation.eyebrows },
    { id: "eyeshadow", name: "아이섀도우", icon: Eye, data: recommendation.eyeshadow },
    { id: "eyeliner", name: "아이라이너", icon: Eye, data: recommendation.eyeliner },
    { id: "mascara", name: "마스카라", icon: Eye, data: recommendation.mascara },
    { id: "blush", name: "블러셔", icon: Smile, data: recommendation.blush },
    { id: "highlighter", name: "하이라이터", icon: Sun, data: recommendation.highlighter },
    { id: "contour", name: "컨투어", icon: Moon, data: recommendation.contour },
    { id: "lipstick", name: "립스틱", icon: Smile, data: recommendation.lipstick },
  ].filter((step) => step.data) // 데이터가 있는 단계만 표시

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600"
    if (confidence >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return "bg-green-500"
    if (confidence >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* 전체 추천 요약 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                AI 맞춤 메이크업 추천
              </CardTitle>
              <CardDescription>얼굴 분석 결과를 바탕으로 생성된 개인 맞춤형 메이크업입니다</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-600">{recommendation.overallScore}점</div>
              <div className="text-sm text-gray-500">전체 점수</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 신뢰도 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI 신뢰도</span>
                <Badge className={getConfidenceBadge(recommendation.confidence)}>{recommendation.confidence}%</Badge>
              </div>
              <Progress value={recommendation.confidence} className="h-2" />
            </div>

            {/* 추천 이유 */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                추천 이유
              </h4>
              <ul className="space-y-1">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => onApplyToAR?.(recommendation)} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                AR로 체험하기
              </Button>
              <Button variant="outline" onClick={() => onSaveRecommendation?.(recommendation)}>
                <Heart className="h-4 w-4 mr-2" />
                저장
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                공유
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 단계별 상세 추천 */}
      <Card>
        <CardHeader>
          <CardTitle>단계별 메이크업 가이드</CardTitle>
          <CardDescription>각 단계별 상세한 추천 사항과 적용 방법을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStep} onValueChange={setSelectedStep}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-6">
              {makeupSteps.map((step) => {
                const IconComponent = step.icon
                return (
                  <TabsTrigger key={step.id} value={step.id} className="flex flex-col gap-1 p-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs">{step.name}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {makeupSteps.map((step) => (
              <TabsContent key={step.id} value={step.id}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <step.icon className="h-5 w-5" />
                      {step.name}
                    </h3>
                    <Badge className={getConfidenceBadge(step.data.confidence)}>신뢰도 {step.data.confidence}%</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 제품 정보 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">추천 제품</h4>

                      {step.id === "foundation" && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">쉐이드:</span>
                            <span className="text-sm font-medium">{step.data.shade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">커버리지:</span>
                            <span className="text-sm font-medium">{step.data.coverage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">피니시:</span>
                            <span className="text-sm font-medium">{step.data.finish}</span>
                          </div>
                        </div>
                      )}

                      {step.id === "eyeshadow" && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">색상 팔레트:</span>
                            <div className="flex gap-2 mt-1">
                              {step.data.palette.map((color: string, index: number) => (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded-full border-2 border-gray-200"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">테크닉:</span>
                            <span className="text-sm font-medium">{step.data.technique}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">강도:</span>
                            <span className="text-sm font-medium">{step.data.intensity}%</span>
                          </div>
                        </div>
                      )}

                      {step.id === "lipstick" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">색상:</span>
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-200"
                              style={{ backgroundColor: step.data.color }}
                            />
                            <span className="text-sm font-medium">{step.data.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">피니시:</span>
                            <span className="text-sm font-medium">{step.data.finish}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">강도:</span>
                            <span className="text-sm font-medium">{step.data.intensity}%</span>
                          </div>
                        </div>
                      )}

                      {step.id === "blush" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">색상:</span>
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-200"
                              style={{ backgroundColor: step.data.color }}
                            />
                            <span className="text-sm font-medium">{step.data.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">위치:</span>
                            <span className="text-sm font-medium">{step.data.placement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">강도:</span>
                            <span className="text-sm font-medium">{step.data.intensity}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 적용 방법 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">적용 방법</h4>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>
                          <strong>테크닉:</strong> {step.data.technique}
                        </p>
                        <p>
                          <strong>추천 이유:</strong> {step.data.reason}
                        </p>
                      </div>

                      {step.id === "eyeshadow" && step.data.placement && (
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>아이리드:</strong> {step.data.placement.lid}
                          </p>
                          <p>
                            <strong>크리즈:</strong> {step.data.placement.crease}
                          </p>
                          <p>
                            <strong>하이라이트:</strong> {step.data.placement.highlight}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* 제품 구매 링크 */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">이 제품이 마음에 드시나요?</span>
                    <Button variant="outline" size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      제품 보러가기
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 세팅 제품 추천 */}
      {recommendation.settingProducts && (
        <Card>
          <CardHeader>
            <CardTitle>세팅 제품 추천</CardTitle>
            <CardDescription>메이크업 지속력을 높이기 위한 추가 제품들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendation.settingProducts.primer && (
                <div className="text-center p-4 border rounded-lg">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                  <h4 className="font-medium">프라이머</h4>
                  <p className="text-sm text-gray-600">메이크업 베이스</p>
                </div>
              )}
              {recommendation.settingProducts.powder && (
                <div className="text-center p-4 border rounded-lg">
                  <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h4 className="font-medium">세팅 파우더</h4>
                  <p className="text-sm text-gray-600">유분 조절</p>
                </div>
              )}
              {recommendation.settingProducts.spray && (
                <div className="text-center p-4 border rounded-lg">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">세팅 스프레이</h4>
                  <p className="text-sm text-gray-600">지속력 향상</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-4">{recommendation.settingProducts.reason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

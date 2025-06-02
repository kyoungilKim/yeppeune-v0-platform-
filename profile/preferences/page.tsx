"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PreferencesService } from "@/lib/firebase-preferences"
import type { UserPreferences } from "@/types/preferences"
import { Palette, ShoppingBag, Heart, Bell, Shield, Save } from "lucide-react"

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const userId = "user123" // 실제로는 인증 시스템에서 가져와야 함

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      let userPreferences = await PreferencesService.getUserPreferences(userId)

      if (!userPreferences) {
        // 기본 선호도 생성
        const defaultPreferences: Omit<UserPreferences, "id" | "createdAt" | "updatedAt"> = {
          userId,
          beautyStyle: {
            makeupStyle: ["natural"],
            skincare: ["hydrating"],
            hairStyle: ["classic"],
            fashionStyle: ["casual"],
          },
          brandPreferences: {
            preferred: [],
            avoided: [],
            priceRange: {
              skincare: "mid-range",
              makeup: "mid-range",
              haircare: "mid-range",
              fashion: "mid-range",
            },
          },
          colorPreferences: {
            favoriteColors: [],
            avoidedColors: [],
            neutralPreference: "neutral",
            boldnessLevel: 5,
          },
          skinCarePreferences: {
            routine: "moderate",
            concerns: [],
            ingredients: {
              preferred: [],
              avoided: [],
            },
            texturePreferences: ["cream"],
          },
          lifestyle: {
            activityLevel: "moderate",
            climate: "temperate",
            workEnvironment: "office",
            timeForRoutine: "moderate",
          },
          notifications: {
            analysisReminders: true,
            productRecommendations: true,
            trendUpdates: false,
            communityActivity: true,
          },
          privacy: {
            shareAnalysisResults: false,
            allowDataForResearch: false,
            publicProfile: false,
          },
        }

        await PreferencesService.createUserPreferences(defaultPreferences)
        userPreferences = await PreferencesService.getUserPreferences(userId)
      }

      setPreferences(userPreferences)
    } catch (error) {
      console.error("Error loading preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences || !hasChanges) return

    try {
      setSaving(true)
      await PreferencesService.updateUserPreferences(userId, preferences)
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    if (!preferences) return
    setPreferences({ ...preferences, ...updates })
    setHasChanges(true)
  }

  const updateNestedPreferences = (path: string[], value: any) => {
    if (!preferences) return

    const newPreferences = { ...preferences }
    let current: any = newPreferences

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }

    current[path[path.length - 1]] = value
    setPreferences(newPreferences)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">선호도를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">선호도를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">뷰티 선호도 설정</h1>
          <p className="text-gray-600">개인화된 추천을 위한 선호도를 설정하세요</p>
        </div>

        {hasChanges && (
          <Button onClick={handleSavePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "저장 중..." : "변경사항 저장"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="style" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="style">스타일</TabsTrigger>
          <TabsTrigger value="brands">브랜드</TabsTrigger>
          <TabsTrigger value="colors">컬러</TabsTrigger>
          <TabsTrigger value="skincare">스킨케어</TabsTrigger>
          <TabsTrigger value="lifestyle">라이프스타일</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                뷰티 스타일 선호도
              </CardTitle>
              <CardDescription>선호하는 뷰티 스타일을 선택하세요 (복수 선택 가능)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">메이크업 스타일</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {["natural", "glamorous", "bold", "minimal", "vintage", "trendy"].map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={`makeup-${style}`}
                        checked={preferences.beautyStyle.makeupStyle.includes(style as any)}
                        onCheckedChange={(checked) => {
                          const current = preferences.beautyStyle.makeupStyle
                          const updated = checked ? [...current, style as any] : current.filter((s) => s !== style)
                          updateNestedPreferences(["beautyStyle", "makeupStyle"], updated)
                        }}
                      />
                      <Label htmlFor={`makeup-${style}`} className="text-sm">
                        {style === "natural"
                          ? "내추럴"
                          : style === "glamorous"
                            ? "글래머러스"
                            : style === "bold"
                              ? "볼드"
                              : style === "minimal"
                                ? "미니멀"
                                : style === "vintage"
                                  ? "빈티지"
                                  : style === "trendy"
                                    ? "트렌디"
                                    : style}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">스킨케어 관심사</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {["anti-aging", "hydrating", "brightening", "acne-care", "sensitive", "oil-control"].map(
                    (concern) => (
                      <div key={concern} className="flex items-center space-x-2">
                        <Checkbox
                          id={`skincare-${concern}`}
                          checked={preferences.beautyStyle.skincare.includes(concern as any)}
                          onCheckedChange={(checked) => {
                            const current = preferences.beautyStyle.skincare
                            const updated = checked
                              ? [...current, concern as any]
                              : current.filter((s) => s !== concern)
                            updateNestedPreferences(["beautyStyle", "skincare"], updated)
                          }}
                        />
                        <Label htmlFor={`skincare-${concern}`} className="text-sm">
                          {concern === "anti-aging"
                            ? "안티에이징"
                            : concern === "hydrating"
                              ? "수분공급"
                              : concern === "brightening"
                                ? "미백"
                                : concern === "acne-care"
                                  ? "여드름케어"
                                  : concern === "sensitive"
                                    ? "민감성"
                                    : concern === "oil-control"
                                      ? "유분조절"
                                      : concern}
                        </Label>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">헤어 스타일</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {["classic", "trendy", "edgy", "romantic", "casual", "professional"].map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hair-${style}`}
                        checked={preferences.beautyStyle.hairStyle.includes(style as any)}
                        onCheckedChange={(checked) => {
                          const current = preferences.beautyStyle.hairStyle
                          const updated = checked ? [...current, style as any] : current.filter((s) => s !== style)
                          updateNestedPreferences(["beautyStyle", "hairStyle"], updated)
                        }}
                      />
                      <Label htmlFor={`hair-${style}`} className="text-sm">
                        {style === "classic"
                          ? "클래식"
                          : style === "trendy"
                            ? "트렌디"
                            : style === "edgy"
                              ? "엣지"
                              : style === "romantic"
                                ? "로맨틱"
                                : style === "casual"
                                  ? "캐주얼"
                                  : style === "professional"
                                    ? "프로페셔널"
                                    : style}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                브랜드 및 가격 선호도
              </CardTitle>
              <CardDescription>선호하는 브랜드와 가격대를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="preferred-brands">선호 브랜드 (쉼표로 구분)</Label>
                <Input
                  id="preferred-brands"
                  value={preferences.brandPreferences.preferred.join(", ")}
                  onChange={(e) => {
                    const brands = e.target.value
                      .split(",")
                      .map((b) => b.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["brandPreferences", "preferred"], brands)
                  }}
                  placeholder="예: 설화수, 헤라, 이니스프리"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="avoided-brands">피하고 싶은 브랜드 (쉼표로 구분)</Label>
                <Input
                  id="avoided-brands"
                  value={preferences.brandPreferences.avoided.join(", ")}
                  onChange={(e) => {
                    const brands = e.target.value
                      .split(",")
                      .map((b) => b.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["brandPreferences", "avoided"], brands)
                  }}
                  placeholder="알레르기나 선호하지 않는 브랜드"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(preferences.brandPreferences.priceRange).map(([category, range]) => (
                  <div key={category}>
                    <Label className="text-sm font-medium">
                      {category === "skincare"
                        ? "스킨케어"
                        : category === "makeup"
                          ? "메이크업"
                          : category === "haircare"
                            ? "헤어케어"
                            : category === "fashion"
                              ? "패션"
                              : category}{" "}
                      가격대
                    </Label>
                    <Select
                      value={range}
                      onValueChange={(value) => {
                        updateNestedPreferences(["brandPreferences", "priceRange", category], value)
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">저가 (1-3만원)</SelectItem>
                        <SelectItem value="mid-range">중가 (3-10만원)</SelectItem>
                        <SelectItem value="high-end">고가 (10-30만원)</SelectItem>
                        <SelectItem value="luxury">럭셔리 (30만원+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                컬러 선호도
              </CardTitle>
              <CardDescription>선호하는 색상과 스타일을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="favorite-colors">좋아하는 색상 (쉼표로 구분)</Label>
                <Input
                  id="favorite-colors"
                  value={preferences.colorPreferences.favoriteColors.join(", ")}
                  onChange={(e) => {
                    const colors = e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["colorPreferences", "favoriteColors"], colors)
                  }}
                  placeholder="예: 핑크, 코랄, 베이지, 브라운"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="avoided-colors">피하고 싶은 색상 (쉼표로 구분)</Label>
                <Input
                  id="avoided-colors"
                  value={preferences.colorPreferences.avoidedColors.join(", ")}
                  onChange={(e) => {
                    const colors = e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["colorPreferences", "avoidedColors"], colors)
                  }}
                  placeholder="예: 오렌지, 형광색"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>뉴트럴 톤 선호도</Label>
                <Select
                  value={preferences.colorPreferences.neutralPreference}
                  onValueChange={(value) => {
                    updateNestedPreferences(["colorPreferences", "neutralPreference"], value)
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">웜톤</SelectItem>
                    <SelectItem value="cool">쿨톤</SelectItem>
                    <SelectItem value="neutral">뉴트럴</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>색상 강도 선호도: {preferences.colorPreferences.boldnessLevel}/10</Label>
                <div className="mt-3">
                  <Slider
                    value={[preferences.colorPreferences.boldnessLevel]}
                    onValueChange={([value]) => {
                      updateNestedPreferences(["colorPreferences", "boldnessLevel"], value)
                    }}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>은은함</span>
                    <span>강렬함</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skincare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>스킨케어 선호도</CardTitle>
              <CardDescription>스킨케어 루틴과 성분 선호도를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>루틴 복잡도</Label>
                <Select
                  value={preferences.skinCarePreferences.routine}
                  onValueChange={(value) => {
                    updateNestedPreferences(["skinCarePreferences", "routine"], value)
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">간단함 (3-4단계)</SelectItem>
                    <SelectItem value="moderate">보통 (5-7단계)</SelectItem>
                    <SelectItem value="extensive">복잡함 (8단계+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="skin-concerns">피부 고민 (쉼표로 구분)</Label>
                <Input
                  id="skin-concerns"
                  value={preferences.skinCarePreferences.concerns.join(", ")}
                  onChange={(e) => {
                    const concerns = e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["skinCarePreferences", "concerns"], concerns)
                  }}
                  placeholder="예: 여드름, 주름, 색소침착, 모공"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="preferred-ingredients">선호 성분 (쉼표로 구분)</Label>
                <Input
                  id="preferred-ingredients"
                  value={preferences.skinCarePreferences.ingredients.preferred.join(", ")}
                  onChange={(e) => {
                    const ingredients = e.target.value
                      .split(",")
                      .map((i) => i.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["skinCarePreferences", "ingredients", "preferred"], ingredients)
                  }}
                  placeholder="예: 히알루론산, 나이아신아마이드, 비타민C"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="avoided-ingredients">피해야 할 성분 (쉼표로 구분)</Label>
                <Input
                  id="avoided-ingredients"
                  value={preferences.skinCarePreferences.ingredients.avoided.join(", ")}
                  onChange={(e) => {
                    const ingredients = e.target.value
                      .split(",")
                      .map((i) => i.trim())
                      .filter(Boolean)
                    updateNestedPreferences(["skinCarePreferences", "ingredients", "avoided"], ingredients)
                  }}
                  placeholder="예: 알코올, 향료, 파라벤"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-base font-medium">선호 텍스처</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {["gel", "cream", "oil", "serum", "foam", "balm"].map((texture) => (
                    <div key={texture} className="flex items-center space-x-2">
                      <Checkbox
                        id={`texture-${texture}`}
                        checked={preferences.skinCarePreferences.texturePreferences.includes(texture as any)}
                        onCheckedChange={(checked) => {
                          const current = preferences.skinCarePreferences.texturePreferences
                          const updated = checked ? [...current, texture as any] : current.filter((t) => t !== texture)
                          updateNestedPreferences(["skinCarePreferences", "texturePreferences"], updated)
                        }}
                      />
                      <Label htmlFor={`texture-${texture}`} className="text-sm">
                        {texture === "gel"
                          ? "젤"
                          : texture === "cream"
                            ? "크림"
                            : texture === "oil"
                              ? "오일"
                              : texture === "serum"
                                ? "세럼"
                                : texture === "foam"
                                  ? "폼"
                                  : texture === "balm"
                                    ? "밤"
                                    : texture}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>라이프스타일</CardTitle>
              <CardDescription>생활 패턴에 맞는 추천을 위한 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>활동량</Label>
                  <Select
                    value={preferences.lifestyle.activityLevel}
                    onValueChange={(value) => {
                      updateNestedPreferences(["lifestyle", "activityLevel"], value)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음 (주로 실내)</SelectItem>
                      <SelectItem value="moderate">보통 (실내외 혼합)</SelectItem>
                      <SelectItem value="high">높음 (주로 야외)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>거주 환경</Label>
                  <Select
                    value={preferences.lifestyle.climate}
                    onValueChange={(value) => {
                      updateNestedPreferences(["lifestyle", "climate"], value)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="humid">습함</SelectItem>
                      <SelectItem value="dry">건조함</SelectItem>
                      <SelectItem value="temperate">온화함</SelectItem>
                      <SelectItem value="tropical">열대</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>근무 환경</Label>
                  <Select
                    value={preferences.lifestyle.workEnvironment}
                    onValueChange={(value) => {
                      updateNestedPreferences(["lifestyle", "workEnvironment"], value)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">사무실</SelectItem>
                      <SelectItem value="outdoor">야외</SelectItem>
                      <SelectItem value="home">재택</SelectItem>
                      <SelectItem value="mixed">혼합</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>뷰티 루틴 시간</Label>
                  <Select
                    value={preferences.lifestyle.timeForRoutine}
                    onValueChange={(value) => {
                      updateNestedPreferences(["lifestyle", "timeForRoutine"], value)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">최소 (5-10분)</SelectItem>
                      <SelectItem value="moderate">보통 (10-20분)</SelectItem>
                      <SelectItem value="extensive">충분 (20분+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
              <CardDescription>받고 싶은 알림을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analysis-reminders">분석 리마인더</Label>
                  <p className="text-sm text-gray-500">정기적인 피부 분석을 위한 알림</p>
                </div>
                <Switch
                  id="analysis-reminders"
                  checked={preferences.notifications.analysisReminders}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["notifications", "analysisReminders"], checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="product-recommendations">제품 추천</Label>
                  <p className="text-sm text-gray-500">새로운 제품 추천 알림</p>
                </div>
                <Switch
                  id="product-recommendations"
                  checked={preferences.notifications.productRecommendations}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["notifications", "productRecommendations"], checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trend-updates">트렌드 업데이트</Label>
                  <p className="text-sm text-gray-500">최신 뷰티 트렌드 정보</p>
                </div>
                <Switch
                  id="trend-updates"
                  checked={preferences.notifications.trendUpdates}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["notifications", "trendUpdates"], checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="community-activity">커뮤니티 활동</Label>
                  <p className="text-sm text-gray-500">댓글, 좋아요 등 커뮤니티 알림</p>
                </div>
                <Switch
                  id="community-activity"
                  checked={preferences.notifications.communityActivity}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["notifications", "communityActivity"], checked)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                개인정보 설정
              </CardTitle>
              <CardDescription>개인정보 공개 범위를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="share-analysis">분석 결과 공유</Label>
                  <p className="text-sm text-gray-500">커뮤니티에서 분석 결과 공유 허용</p>
                </div>
                <Switch
                  id="share-analysis"
                  checked={preferences.privacy.shareAnalysisResults}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["privacy", "shareAnalysisResults"], checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="research-data">연구 목적 데이터 사용</Label>
                  <p className="text-sm text-gray-500">익명화된 데이터를 연구 목적으로 사용 허용</p>
                </div>
                <Switch
                  id="research-data"
                  checked={preferences.privacy.allowDataForResearch}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["privacy", "allowDataForResearch"], checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-profile">공개 프로필</Label>
                  <p className="text-sm text-gray-500">다른 사용자가 프로필을 볼 수 있도록 허용</p>
                </div>
                <Switch
                  id="public-profile"
                  checked={preferences.privacy.publicProfile}
                  onCheckedChange={(checked) => {
                    updateNestedPreferences(["privacy", "publicProfile"], checked)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSavePreferences} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "저장 중..." : "변경사항 저장"}
          </Button>
        </div>
      )}
    </div>
  )
}

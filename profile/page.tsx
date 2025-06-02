"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BeautyService } from "@/lib/firebase-beauty"
import type { UserProfile, BeautyAnalysis, BeautyRecommendation } from "@/types/beauty"
import { User, TrendingUp, Calendar, Target, Lightbulb, Star, Settings } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<BeautyAnalysis[]>([])
  const [recommendations, setRecommendations] = useState<BeautyRecommendation[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  // 임시 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const userId = "user123"

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // 프로필 로드
      let userProfile = await BeautyService.getUserProfile(userId)

      // 프로필이 없으면 기본 프로필 생성
      if (!userProfile) {
        await BeautyService.createUserProfile({
          id: userId,
          email: "user@example.com",
          name: "사용자",
          skinConcerns: [],
          beautyGoals: [],
          preferredProducts: [],
          allergies: [],
          totalAnalyses: 0,
          averageSkinScore: 0,
        })
        userProfile = await BeautyService.getUserProfile(userId)
      }

      setProfile(userProfile)

      // 분석 히스토리 로드
      const history = await BeautyService.getUserAnalysisHistory(userId)
      setAnalysisHistory(history)

      // 추천사항 로드
      const recs = await BeautyService.getUserRecommendations(userId)
      setRecommendations(recs)

      // 새로운 추천사항 생성 (기존 추천이 적을 때)
      if (recs.length < 3) {
        await BeautyService.generatePersonalizedRecommendations(userId)
        const newRecs = await BeautyService.getUserRecommendations(userId)
        setRecommendations(newRecs)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!profile) return

    try {
      await BeautyService.updateUserProfile(userId, updates)
      setProfile({ ...profile, ...updates })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const generateNewRecommendations = async () => {
    try {
      await BeautyService.generatePersonalizedRecommendations(userId)
      const newRecs = await BeautyService.getUserRecommendations(userId)
      setRecommendations(newRecs)
    } catch (error) {
      console.error("Error generating recommendations:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">프로필을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">프로필을 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">마이 뷰티 프로필</h1>
        <p className="text-gray-600">개인화된 뷰티 분석과 추천을 확인하세요</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="history">분석 히스토리</TabsTrigger>
          <TabsTrigger value="recommendations">추천</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 프로필 요약 */}
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">프로필 정보</CardTitle>
                <User className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.name}</div>
                <p className="text-xs text-muted-foreground">
                  {profile.age ? `${profile.age}세` : "나이 미설정"} • {profile.skinType || "피부타입 미설정"}
                </p>
              </CardContent>
            </Card>

            {/* 평균 피부 점수 */}
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 피부 점수</CardTitle>
                <Star className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.averageSkinScore}/100</div>
                <Progress value={profile.averageSkinScore} className="mt-2" />
              </CardContent>
            </Card>

            {/* 총 분석 횟수 */}
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 분석 횟수</CardTitle>
                <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  마지막 분석:{" "}
                  {profile.lastAnalysisDate ? new Date(profile.lastAnalysisDate).toLocaleDateString() : "없음"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 피부 관심사 및 목표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>피부 관심사</CardTitle>
                <CardDescription>현재 관심 있는 피부 문제들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skinConcerns.length > 0 ? (
                    profile.skinConcerns.map((concern, index) => (
                      <Badge key={index} variant="secondary">
                        {concern}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">설정된 관심사가 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>뷰티 목표</CardTitle>
                <CardDescription>달성하고 싶은 뷰티 목표들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.beautyGoals.length > 0 ? (
                    profile.beautyGoals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        {goal}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">설정된 목표가 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 추가 기능 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/profile/history")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  분석 히스토리
                </CardTitle>
                <CardDescription>과거 분석 결과 및 변화 추이 확인</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{profile.totalAnalyses}개의 분석 기록이 있습니다</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/profile/preferences")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  선호도 설정
                </CardTitle>
                <CardDescription>개인화된 추천을 위한 선호도 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">뷰티 스타일과 브랜드 선호도를 설정하세요</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">분석 히스토리</h2>
            <Button variant="outline" onClick={loadUserData}>
              <Calendar className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          <div className="grid gap-4">
            {analysisHistory.length > 0 ? (
              analysisHistory.map((analysis) => (
                <Card key={analysis.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">피부 점수: {analysis.skinScore}/100</CardTitle>
                        <CardDescription>{new Date(analysis.timestamp).toLocaleString()}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          analysis.skinScore >= 80 ? "default" : analysis.skinScore >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {analysis.skinType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">수분도</p>
                        <p className="font-semibold">{analysis.analysisData.hydration}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">유분도</p>
                        <p className="font-semibold">{analysis.analysisData.oiliness}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">탄력도</p>
                        <p className="font-semibold">{analysis.analysisData.elasticity}%</p>
                      </div>
                    </div>

                    {analysis.concerns.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">주요 관심사:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.concerns.map((concern, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">아직 분석 기록이 없습니다.</p>
                  <Button className="mt-4" onClick={() => (window.location.href = "/beauty")}>
                    첫 번째 분석 시작하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">개인화 추천</h2>
            <Button onClick={generateNewRecommendations}>
              <Lightbulb className="h-4 w-4 mr-2" />새 추천 생성
            </Button>
          </div>

          <div className="grid gap-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <CardDescription>{rec.category}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"
                        }
                      >
                        {rec.priority === "high" ? "높음" : rec.priority === "medium" ? "보통" : "낮음"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{rec.description}</p>
                    <div className="text-sm text-gray-500">
                      <p className="font-medium">추천 근거:</p>
                      <ul className="list-disc list-inside">
                        {rec.basedOn.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">추천사항이 없습니다.</p>
                  <Button className="mt-4" onClick={generateNewRecommendations}>
                    추천 생성하기
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 설정</CardTitle>
              <CardDescription>개인 정보와 뷰티 선호도를 관리하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <ProfileEditForm profile={profile} onSave={handleProfileUpdate} onCancel={() => setIsEditing(false)} />
              ) : (
                <ProfileDisplayForm profile={profile} onEdit={() => setIsEditing(true)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileDisplayForm({
  profile,
  onEdit,
}: {
  profile: UserProfile
  onEdit: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>이름</Label>
          <p className="text-sm text-gray-700">{profile.name}</p>
        </div>
        <div>
          <Label>나이</Label>
          <p className="text-sm text-gray-700">{profile.age || "미설정"}</p>
        </div>
        <div>
          <Label>피부 타입</Label>
          <p className="text-sm text-gray-700">{profile.skinType || "미설정"}</p>
        </div>
        <div>
          <Label>이메일</Label>
          <p className="text-sm text-gray-700">{profile.email}</p>
        </div>
      </div>

      <Button onClick={onEdit}>
        <Target className="h-4 w-4 mr-2" />
        프로필 수정
      </Button>
    </div>
  )
}

function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: UserProfile
  onSave: (updates: Partial<UserProfile>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age || "",
    skinType: profile.skinType || "",
    skinConcerns: profile.skinConcerns.join(", "),
    beautyGoals: profile.beautyGoals.join(", "),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      age: formData.age ? Number(formData.age) : undefined,
      skinType: formData.skinType as any,
      skinConcerns: formData.skinConcerns
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      beautyGoals: formData.beautyGoals
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">이름</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="age">나이</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="skinType">피부 타입</Label>
          <Select value={formData.skinType} onValueChange={(value) => setFormData({ ...formData, skinType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="피부 타입 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dry">건성</SelectItem>
              <SelectItem value="oily">지성</SelectItem>
              <SelectItem value="combination">복합성</SelectItem>
              <SelectItem value="sensitive">민감성</SelectItem>
              <SelectItem value="normal">정상</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="skinConcerns">피부 관심사 (쉼표로 구분)</Label>
        <Input
          id="skinConcerns"
          value={formData.skinConcerns}
          onChange={(e) => setFormData({ ...formData, skinConcerns: e.target.value })}
          placeholder="예: 여드름, 주름, 색소침착"
        />
      </div>

      <div>
        <Label htmlFor="beautyGoals">뷰티 목표 (쉼표로 구분)</Label>
        <Input
          id="beautyGoals"
          value={formData.beautyGoals}
          onChange={(e) => setFormData({ ...formData, beautyGoals: e.target.value })}
          placeholder="예: 수분 개선, 탄력 증진, 미백"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">저장</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  )
}

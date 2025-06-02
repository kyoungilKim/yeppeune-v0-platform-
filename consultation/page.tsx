"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnalysisService } from "@/lib/firebase-analysis"
import type { BeautyConsultation, FaceAnalysis } from "@/types/analysis"
import {
  Sparkles,
  Brush,
  Droplets,
  Scissors,
  ShoppingBag,
  ArrowLeft,
  Share2,
  Download,
  Heart,
  ShoppingCart,
} from "lucide-react"

// Add these missing imports at the top of the file
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ConsultationPage() {
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("analysisId")
  const [consultation, setConsultation] = useState<BeautyConsultation | null>(null)
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  // 임시 사용자 ID
  const userId = "user123"

  useEffect(() => {
    loadConsultation()
  }, [analysisId])

  const loadConsultation = async () => {
    try {
      setLoading(true)

      // 분석 ID가 있으면 해당 분석 결과 가져오기
      if (analysisId) {
        const docRef = doc(db, "faceAnalyses", analysisId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const analysis = {
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: docSnap.data().timestamp.toDate(),
          } as FaceAnalysis
          setFaceAnalysis(analysis)
        }
      }

      // 컨설팅 생성 또는 가져오기
      let consultationData: BeautyConsultation | null = null
      if (analysisId) {
        // 기존 컨설팅 확인
        const q = query(
          collection(db, "beautyConsultations"),
          where("userId", "==", userId),
          where("faceAnalysisId", "==", analysisId),
          limit(1),
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          // 기존 컨설팅 가져오기
          const doc = querySnapshot.docs[0]
          consultationData = {
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          } as BeautyConsultation
        } else {
          // 새 컨설팅 생성
          consultationData = await AnalysisService.generateBeautyConsultation(userId, analysisId)
        }
      } else {
        // 최신 컨설팅 가져오기
        consultationData = await AnalysisService.getLatestBeautyConsultation(userId)

        // 없으면 새로 생성
        if (!consultationData) {
          consultationData = await AnalysisService.generateBeautyConsultation(userId)
        }

        // 관련 얼굴 분석 가져오기
        if (consultationData.faceAnalysisId) {
          const docRef = doc(db, "faceAnalyses", consultationData.faceAnalysisId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const analysis = {
              id: docSnap.id,
              ...docSnap.data(),
              timestamp: docSnap.data().timestamp.toDate(),
            } as FaceAnalysis
            setFaceAnalysis(analysis)
          }
        }
      }

      setConsultation(consultationData)
    } catch (error) {
      console.error("Error loading consultation:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">맞춤 뷰티 컨설팅을 준비하는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">컨설팅 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">먼저 얼굴 분석을 진행해주세요.</p>
          <Button onClick={() => (window.location.href = "/ai-analysis")}>얼굴 분석하기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">맞춤 뷰티 컨설팅</h1>
            <p className="text-gray-600">
              {new Date(consultation.timestamp).toLocaleDateString()} 기준 AI가 분석한 맞춤형 뷰티 솔루션입니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              공유하기
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              저장하기
            </Button>
          </div>
        </div>
      </div>

      {faceAnalysis && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              분석 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="aspect-square max-h-60 rounded-lg overflow-hidden">
                <img
                  src={faceAnalysis.imageUrl || "/placeholder.svg"}
                  alt="Face analysis"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-1">{faceAnalysis.faceShape}</div>
                    <p className="text-sm text-gray-600">얼굴형</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-1">{faceAnalysis.skinTone}</div>
                    <p className="text-sm text-gray-600">피부톤</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-1">{faceAnalysis.skinUndertone}</div>
                    <p className="text-sm text-gray-600">언더톤</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-1">{faceAnalysis.colorAnalysis.season}</div>
                    <p className="text-sm text-gray-600">계절 타입</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">주요 특징</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {faceAnalysis.skinAnalysis.hydration < 50 ? "건조한 피부" : "충분한 수분"}
                    </Badge>
                    <Badge variant="outline">
                      {faceAnalysis.skinAnalysis.oiliness > 60 ? "지성 피부" : "정상 유분"}
                    </Badge>
                    <Badge variant="outline">
                      {faceAnalysis.skinAnalysis.sensitivity > 60 ? "민감한 피부" : "정상 민감도"}
                    </Badge>
                    <Badge variant="outline">
                      {faceAnalysis.skinAnalysis.wrinkles > 50 ? "주름 관리 필요" : "적은 주름"}
                    </Badge>
                    <Badge variant="outline">
                      {faceAnalysis.skinAnalysis.spots > 50 ? "색소침착 관리 필요" : "고른 피부톤"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="makeup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="makeup">메이크업</TabsTrigger>
          <TabsTrigger value="skincare">스킨케어</TabsTrigger>
          <TabsTrigger value="hair">헤어스타일</TabsTrigger>
          <TabsTrigger value="fashion">패션</TabsTrigger>
        </TabsList>

        <TabsContent value="makeup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brush className="h-5 w-5" />
                맞춤 메이크업 추천
              </CardTitle>
              <CardDescription>
                {faceAnalysis
                  ? `${faceAnalysis.faceShape} 얼굴형과 ${faceAnalysis.skinTone} 피부톤에 어울리는 메이크업 제품입니다.`
                  : "당신의 얼굴 특징에 어울리는 메이크업 제품입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 파운데이션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">파운데이션</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={consultation.makeupRecommendations.foundation.imageUrl || "/placeholder.svg"}
                        alt="Foundation"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-lg">
                        {consultation.makeupRecommendations.foundation.brand}{" "}
                        {consultation.makeupRecommendations.foundation.productName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        쉐이드: {consultation.makeupRecommendations.foundation.shade}
                      </p>
                      <div className="flex gap-2 mb-3">
                        <Badge>{consultation.makeupRecommendations.foundation.coverage} 커버력</Badge>
                        <Badge>{consultation.makeupRecommendations.foundation.finish} 마무리감</Badge>
                      </div>
                      <p className="text-gray-700 mb-4">{consultation.makeupRecommendations.foundation.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">
                          {consultation.makeupRecommendations.foundation.price.toLocaleString()}원
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            장바구니
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 아이섀도우 */}
                {consultation.makeupRecommendations.eyeshadow && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">아이섀도우</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={consultation.makeupRecommendations.eyeshadow.imageUrl || "/placeholder.svg"}
                          alt="Eyeshadow"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">
                          {consultation.makeupRecommendations.eyeshadow.brand}{" "}
                          {consultation.makeupRecommendations.eyeshadow.palette}
                        </h4>
                        <div className="flex gap-2 my-3">
                          {consultation.makeupRecommendations.eyeshadow.colors.map((color, index) => (
                            <Badge key={index} variant="outline">
                              {color}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-gray-700 mb-4">{consultation.makeupRecommendations.eyeshadow.reason}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            {consultation.makeupRecommendations.eyeshadow.price.toLocaleString()}원
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              장바구니
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 립스틱 */}
                {consultation.makeupRecommendations.lipstick && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">립스틱</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={consultation.makeupRecommendations.lipstick.imageUrl || "/placeholder.svg"}
                          alt="Lipstick"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">
                          {consultation.makeupRecommendations.lipstick.brand}{" "}
                          {consultation.makeupRecommendations.lipstick.productName}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          쉐이드: {consultation.makeupRecommendations.lipstick.shade}
                        </p>
                        <div className="flex gap-2 mb-3">
                          <Badge>{consultation.makeupRecommendations.lipstick.finish} 피니시</Badge>
                        </div>
                        <p className="text-gray-700 mb-4">{consultation.makeupRecommendations.lipstick.reason}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            {consultation.makeupRecommendations.lipstick.price.toLocaleString()}원
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              장바구니
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skincare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                맞춤 스킨케어 추천
              </CardTitle>
              <CardDescription>
                {faceAnalysis
                  ? `${
                      faceAnalysis.skinAnalysis.hydration < 50
                        ? "건조한 피부"
                        : faceAnalysis.skinAnalysis.oiliness > 60
                          ? "지성 피부"
                          : "일반 피부"
                    }를 위한 맞춤 스킨케어 루틴입니다.`
                  : "당신의 피부 상태에 맞는 스킨케어 루틴입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 클렌저 */}
                {consultation.skincareRecommendations.cleanser && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">클렌저</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={consultation.skincareRecommendations.cleanser.imageUrl || "/placeholder.svg"}
                          alt="Cleanser"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">
                          {consultation.skincareRecommendations.cleanser.brand}{" "}
                          {consultation.skincareRecommendations.cleanser.productName}
                        </h4>
                        <div className="flex gap-2 my-3">
                          {consultation.skincareRecommendations.cleanser.skinConcerns.map((concern, index) => (
                            <Badge key={index} variant="outline">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          주요 성분: {consultation.skincareRecommendations.cleanser.keyIngredients.join(", ")}
                        </p>
                        <p className="text-gray-700 mb-4">{consultation.skincareRecommendations.cleanser.reason}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            {consultation.skincareRecommendations.cleanser.price.toLocaleString()}원
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              장바구니
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 세럼 */}
                {consultation.skincareRecommendations.serum && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">세럼</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={consultation.skincareRecommendations.serum.imageUrl || "/placeholder.svg"}
                          alt="Serum"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">
                          {consultation.skincareRecommendations.serum.brand}{" "}
                          {consultation.skincareRecommendations.serum.productName}
                        </h4>
                        <div className="flex gap-2 my-3">
                          {consultation.skincareRecommendations.serum.skinConcerns.map((concern, index) => (
                            <Badge key={index} variant="outline">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          주요 성분: {consultation.skincareRecommendations.serum.keyIngredients.join(", ")}
                        </p>
                        <p className="text-gray-700 mb-4">{consultation.skincareRecommendations.serum.reason}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            {consultation.skincareRecommendations.serum.price.toLocaleString()}원
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              장바구니
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 선크림 */}
                {consultation.skincareRecommendations.sunscreen && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">선크림</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={consultation.skincareRecommendations.sunscreen.imageUrl || "/placeholder.svg"}
                          alt="Sunscreen"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">
                          {consultation.skincareRecommendations.sunscreen.brand}{" "}
                          {consultation.skincareRecommendations.sunscreen.productName}
                        </h4>
                        <div className="flex gap-2 my-3">
                          <Badge>SPF {consultation.skincareRecommendations.sunscreen.spf}</Badge>
                          <Badge>{consultation.skincareRecommendations.sunscreen.finish} 피니시</Badge>
                        </div>
                        <p className="text-gray-700 mb-4">{consultation.skincareRecommendations.sunscreen.reason}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">
                            {consultation.skincareRecommendations.sunscreen.price.toLocaleString()}원
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              장바구니
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hair" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                맞춤 헤어스타일 추천
              </CardTitle>
              <CardDescription>
                {faceAnalysis
                  ? `${faceAnalysis.faceShape} 얼굴형에 어울리는 헤어스타일과 컬러입니다.`
                  : "당신의 얼굴형에 어울리는 헤어스타일과 컬러입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 헤어스타일 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">추천 헤어스타일</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {consultation.hairRecommendations.hairstyles.map((style, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-gray-100">
                          <img
                            src={style.imageUrl || "/placeholder.svg"}
                            alt={style.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-lg mb-2">{style.name}</h4>
                          <p className="text-gray-700 mb-3">{style.description}</p>
                          <p className="text-sm text-gray-600">{style.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 헤어 컬러 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">추천 헤어 컬러</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="aspect-square max-h-60 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={consultation.hairRecommendations.hairColor.imageUrl || "/placeholder.svg"}
                        alt="Hair color"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-lg mb-2">{consultation.hairRecommendations.hairColor.name}</h4>
                      <p className="text-gray-700 mb-4">{consultation.hairRecommendations.hairColor.description}</p>
                      <p className="text-sm text-gray-600">{consultation.hairRecommendations.hairColor.reason}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 헤어케어 제품 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">추천 헤어케어 제품</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {consultation.hairRecommendations.haircare.map((product, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square max-h-48 bg-gray-100">
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-lg">
                            {product.brand} {product.productName}
                          </h4>
                          <div className="flex gap-2 my-3">
                            {product.hairConcerns.map((concern, idx) => (
                              <Badge key={idx} variant="outline">
                                {concern}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-gray-700 mb-4">{product.reason}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">{product.price.toLocaleString()}원</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button size="sm">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                장바구니
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fashion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                맞춤 패션 스타일 추천
              </CardTitle>
              <CardDescription>
                {faceAnalysis
                  ? `${faceAnalysis.colorAnalysis.season} 계절 타입에 어울리는 패션 스타일입니다.`
                  : "당신의 체형과 컬러에 어울리는 패션 스타일입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 추천 룩 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">추천 룩</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {consultation.fashionRecommendations.outfits.map((outfit, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-gray-100">
                          <img
                            src={outfit.imageUrl || "/placeholder.svg"}
                            alt={outfit.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-lg mb-2">{outfit.name}</h4>
                          <p className="text-gray-700 mb-3">{outfit.description}</p>
                          <p className="text-sm text-gray-600 mb-4">{outfit.reason}</p>

                          <h5 className="font-medium mb-2">구성 아이템</h5>
                          <div className="space-y-3">
                            {outfit.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0">
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.productName}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {item.brand} {item.productName}
                                  </p>
                                  <p className="text-xs text-gray-500">{item.price.toLocaleString()}원</p>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 추천 액세서리 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">추천 액세서리</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {consultation.fashionRecommendations.accessories.map((accessory, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square max-h-48 bg-gray-100">
                          <img
                            src={accessory.imageUrl || "/placeholder.svg"}
                            alt={accessory.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium">
                            {accessory.brand} {accessory.productName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{accessory.type}</p>
                          <p className="text-gray-700 mb-3">{accessory.reason}</p>
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{accessory.price.toLocaleString()}원</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button size="sm">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 피해야 할 스타일 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">피해야 할 스타일</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="list-disc pl-5 space-y-2">
                      {consultation.fashionRecommendations.avoidStyles.map((style, index) => (
                        <li key={index} className="text-gray-700">
                          {style}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

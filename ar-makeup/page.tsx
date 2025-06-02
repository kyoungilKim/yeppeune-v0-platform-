"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ARMakeupService } from "@/lib/ar-makeup-service"
import type { MakeupFilter, FaceLandmarks } from "@/types/ar-makeup"
import { Camera, Download, RotateCcw, Palette, Eye, Smile, Sparkles, ShoppingCart, Heart } from "lucide-react"

export default function ARMakeupPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<MakeupFilter[]>([])
  const [availableFilters] = useState<MakeupFilter[]>(ARMakeupService.getDefaultFilters())
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("lipstick")
  const [isCapturing, setIsCapturing] = useState(false)

  // 임시 사용자 ID
  const userId = "user123"

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.")
    }
  }

  // 웹캠 중지
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  // 얼굴 감지 및 메이크업 적용
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.videoWidth === 0) return

    // 캔버스 크기 설정
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 이미지 데이터 가져오기
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 얼굴 랜드마크 감지
    const landmarks = await ARMakeupService.detectFaceLandmarks(imageData)

    if (landmarks) {
      setFaceLandmarks(landmarks)

      // 적용된 필터들을 순서대로 적용
      appliedFilters.forEach((filter) => {
        ARMakeupService.applyMakeupFilter(canvas, filter, landmarks)
      })
    }
  }, [isStreaming, appliedFilters])

  // 프레임 처리 루프
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(processFrame, 100) // 10fps
    return () => clearInterval(interval)
  }, [isStreaming, processFrame])

  // 필터 적용/제거
  const toggleFilter = (filter: MakeupFilter) => {
    setAppliedFilters((prev) => {
      const existing = prev.find((f) => f.id === filter.id)
      if (existing) {
        return prev.filter((f) => f.id !== filter.id)
      } else {
        return [...prev.filter((f) => f.category !== filter.category), filter]
      }
    })
  }

  // 필터 강도 조절
  const adjustFilterIntensity = (filterId: string, intensity: number) => {
    setAppliedFilters((prev) => prev.map((filter) => (filter.id === filterId ? { ...filter, intensity } : filter)))
  }

  // 모든 필터 제거
  const clearAllFilters = () => {
    setAppliedFilters([])
  }

  // 사진 캡처
  const capturePhoto = async () => {
    if (!canvasRef.current) return

    try {
      setIsCapturing(true)

      const canvas = canvasRef.current
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            // 이미지 업로드
            const imageUrl = await ARMakeupService.uploadCapturedImage(userId, blob)

            // AR 세션 저장
            await ARMakeupService.saveARSession({
              userId,
              timestamp: new Date(),
              appliedFilters,
              capturedImage: imageUrl,
            })

            // 다운로드 링크 생성
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `ar-makeup-${Date.now()}.jpg`
            a.click()
            URL.revokeObjectURL(url)

            alert("사진이 저장되었습니다!")
          }
        },
        "image/jpeg",
        0.9,
      )
    } catch (error) {
      console.error("Error capturing photo:", error)
      alert("사진 저장 중 오류가 발생했습니다.")
    } finally {
      setIsCapturing(false)
    }
  }

  const filtersByCategory = availableFilters.reduce(
    (acc, filter) => {
      if (!acc[filter.category]) acc[filter.category] = []
      acc[filter.category].push(filter)
      return acc
    },
    {} as Record<string, MakeupFilter[]>,
  )

  const categoryIcons = {
    foundation: Sparkles,
    lipstick: Smile,
    eyeshadow: Eye,
    blush: Heart,
    eyeliner: Eye,
    eyebrow: Eye,
  }

  const categoryNames = {
    foundation: "파운데이션",
    lipstick: "립스틱",
    eyeshadow: "아이섀도우",
    blush: "블러셔",
    eyeliner: "아이라이너",
    eyebrow: "아이브로우",
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AR 메이크업 체험</h1>
        <p className="text-gray-600">실시간으로 다양한 메이크업을 체험해보세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 카메라 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                실시간 AR 메이크업
              </CardTitle>
              <CardDescription>카메라를 시작하고 원하는 메이크업을 선택해보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                {isStreaming ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto rounded-lg"
                      style={{ transform: "scaleX(-1)" }} // 거울 효과
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ transform: "scaleX(-1)" }}
                    />

                    {/* 얼굴 감지 표시 */}
                    {faceLandmarks && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500 text-white">얼굴 감지됨</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">카메라를 시작하여 AR 메이크업을 체험해보세요</p>
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        카메라 시작
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 컨트롤 버튼 */}
              {isStreaming && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={capturePhoto} disabled={isCapturing}>
                    <Download className="h-4 w-4 mr-2" />
                    {isCapturing ? "저장 중..." : "사진 저장"}
                  </Button>
                  <Button variant="outline" onClick={clearAllFilters}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    카메라 중지
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 적용된 필터 조절 */}
          {appliedFilters.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>적용된 메이크업 조절</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appliedFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: filter.color }} />
                          <span className="text-sm font-medium">{filter.name}</span>
                          <Badge variant="outline">{filter.intensity}%</Badge>
                        </div>
                        <Slider
                          value={[filter.intensity]}
                          onValueChange={([value]) => adjustFilterIntensity(filter.id, value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toggleFilter(filter)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 메이크업 선택 영역 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                메이크업 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="lipstick">립</TabsTrigger>
                  <TabsTrigger value="eyeshadow">아이</TabsTrigger>
                  <TabsTrigger value="blush">볼</TabsTrigger>
                </TabsList>

                {Object.entries(filtersByCategory).map(([category, filters]) => (
                  <TabsContent key={category} value={category} className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      {React.createElement(categoryIcons[category as keyof typeof categoryIcons], {
                        className: "h-4 w-4",
                      })}
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filters.map((filter) => {
                        const isApplied = appliedFilters.some((f) => f.id === filter.id)
                        return (
                          <div
                            key={filter.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              isApplied ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => toggleFilter(filter)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: filter.color }} />
                              <span className="text-sm font-medium">{filter.name}</span>
                            </div>
                            {isApplied && (
                              <Badge size="sm" className="bg-pink-500 text-white">
                                적용됨
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* 추가 탭들 */}
              <div className="mt-6 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setSelectedCategory("foundation")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  파운데이션
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSelectedCategory("eyeliner")}>
                  <Eye className="h-4 w-4 mr-2" />
                  아이라이너
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSelectedCategory("eyebrow")}>
                  <Eye className="h-4 w-4 mr-2" />
                  아이브로우
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 제품 구매 추천 */}
          {appliedFilters.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>사용된 제품 구매하기</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appliedFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: filter.color }} />
                        <span className="text-sm">{filter.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Heart className="h-3 w-3" />
                        </Button>
                        <Button size="sm">
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  전체 상품 장바구니 담기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Makeup3DRenderer from "@/components/3d-makeup-renderer"
import type { Advanced3DMakeup } from "@/types/face-3d"
import { Camera, Download, RotateCcw, Settings, Palette, Eye, Smile, Sparkles, Sun, Moon, Zap } from "lucide-react"

export default function Advanced3DMakeupPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [appliedMakeup, setAppliedMakeup] = useState<Advanced3DMakeup[]>([])
  const [faceTracking, setFaceTracking] = useState<any>(null)

  // 3D 렌더링 설정
  const [renderSettings, setRenderSettings] = useState({
    lighting: "studio",
    shadows: true,
    subsurfaceScattering: true,
    antiAliasing: true,
    quality: "high",
  })

  // 기본 3D 메이크업 필터들
  const advanced3DMakeup: Advanced3DMakeup[] = [
    {
      id: "foundation-3d-1",
      name: "글로우 파운데이션",
      category: "foundation",
      texture: {
        diffuseMap: "/placeholder.svg?height=512&width=512",
        normalMap: "/placeholder.svg?height=512&width=512",
        roughnessMap: "/placeholder.svg?height=512&width=512",
      },
      material: {
        color: "#F5DEB3",
        opacity: 0.7,
        roughness: 0.3,
        metallic: 0.1,
        emissive: "#FFF8DC",
        shininess: 0.8,
      },
      application: {
        targetRegions: ["face", "forehead", "leftCheek", "rightCheek"],
        blendMode: "soft-light",
        featherRadius: 15,
        intensity: 70,
      },
      lighting: {
        receiveShadows: true,
        castShadows: false,
        subsurfaceScattering: 0.5,
      },
    },
    {
      id: "lipstick-3d-1",
      name: "매트 레드 립스틱",
      category: "lipstick",
      texture: {
        diffuseMap: "/placeholder.svg?height=256&width=256",
        roughnessMap: "/placeholder.svg?height=256&width=256",
      },
      material: {
        color: "#DC143C",
        opacity: 0.9,
        roughness: 0.8,
        metallic: 0.0,
        emissive: "#000000",
        shininess: 0.1,
      },
      application: {
        targetRegions: ["lips"],
        blendMode: "normal",
        featherRadius: 2,
        intensity: 90,
      },
      lighting: {
        receiveShadows: true,
        castShadows: false,
        subsurfaceScattering: 0.3,
      },
    },
    {
      id: "eyeshadow-3d-1",
      name: "시머 골드 아이섀도우",
      category: "eyeshadow",
      texture: {
        diffuseMap: "/placeholder.svg?height=256&width=256",
        metallicMap: "/placeholder.svg?height=256&width=256",
      },
      material: {
        color: "#FFD700",
        opacity: 0.6,
        roughness: 0.2,
        metallic: 0.7,
        emissive: "#FFF8DC",
        shininess: 0.9,
      },
      application: {
        targetRegions: ["leftEye", "rightEye"],
        blendMode: "overlay",
        featherRadius: 8,
        intensity: 60,
      },
      lighting: {
        receiveShadows: true,
        castShadows: false,
        subsurfaceScattering: 0.1,
      },
    },
    {
      id: "highlighter-3d-1",
      name: "하이라이터",
      category: "highlighter",
      texture: {
        diffuseMap: "/placeholder.svg?height=256&width=256",
        metallicMap: "/placeholder.svg?height=256&width=256",
      },
      material: {
        color: "#FFFACD",
        opacity: 0.4,
        roughness: 0.1,
        metallic: 0.8,
        emissive: "#FFFACD",
        shininess: 1.0,
      },
      application: {
        targetRegions: ["nose", "forehead", "leftCheek", "rightCheek"],
        blendMode: "color-dodge",
        featherRadius: 10,
        intensity: 40,
      },
      lighting: {
        receiveShadows: false,
        castShadows: false,
        subsurfaceScattering: 0.0,
      },
    },
    {
      id: "contour-3d-1",
      name: "컨투어",
      category: "contour",
      texture: {
        diffuseMap: "/placeholder.svg?height=256&width=256",
      },
      material: {
        color: "#8B4513",
        opacity: 0.5,
        roughness: 0.6,
        metallic: 0.0,
        emissive: "#000000",
        shininess: 0.2,
      },
      application: {
        targetRegions: ["leftCheek", "rightCheek", "chin", "forehead"],
        blendMode: "multiply",
        featherRadius: 12,
        intensity: 50,
      },
      lighting: {
        receiveShadows: true,
        castShadows: true,
        subsurfaceScattering: 0.4,
      },
    },
  ]

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
          frameRate: 30,
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

  // 메이크업 적용/제거
  const toggleMakeup = (makeup: Advanced3DMakeup) => {
    setAppliedMakeup((prev) => {
      const existing = prev.find((m) => m.id === makeup.id)
      if (existing) {
        return prev.filter((m) => m.id !== makeup.id)
      } else {
        return [...prev.filter((m) => m.category !== makeup.category), makeup]
      }
    })
  }

  // 메이크업 강도 조절
  const adjustMakeupIntensity = (makeupId: string, intensity: number) => {
    setAppliedMakeup((prev) =>
      prev.map((makeup) =>
        makeup.id === makeupId
          ? {
              ...makeup,
              application: { ...makeup.application, intensity },
              material: { ...makeup.material, opacity: intensity / 100 },
            }
          : makeup,
      ),
    )
  }

  // 모든 메이크업 제거
  const clearAllMakeup = () => {
    setAppliedMakeup([])
  }

  const categoryIcons = {
    foundation: Sparkles,
    lipstick: Smile,
    eyeshadow: Eye,
    blush: Smile,
    eyeliner: Eye,
    eyebrow: Eye,
    highlighter: Sun,
    contour: Moon,
  }

  const categoryNames = {
    foundation: "파운데이션",
    lipstick: "립스틱",
    eyeshadow: "아이섀도우",
    blush: "블러셔",
    eyeliner: "아이라이너",
    eyebrow: "아이브로우",
    highlighter: "하이라이터",
    contour: "컨투어",
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">고급 3D AR 메이크업</h1>
        <p className="text-gray-600">실시간 3D 얼굴 추적과 고품질 메이크업 렌더링을 체험해보세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D 렌더링 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                3D 실시간 렌더링
              </CardTitle>
              <CardDescription>고급 3D 얼굴 추적과 실시간 메이크업 렌더링</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
                {isStreaming ? (
                  <>
                    {/* 숨겨진 비디오 엘리먼트 */}
                    <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                    {/* 3D 렌더러 */}
                    <Makeup3DRenderer
                      videoElement={videoRef.current}
                      appliedMakeup={appliedMakeup}
                      onFaceTracking={setFaceTracking}
                    />
                  </>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center text-white">
                      <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-4">3D AR 메이크업을 시작하세요</p>
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
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    3D 모델 저장
                  </Button>
                  <Button variant="outline" onClick={clearAllMakeup}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    카메라 중지
                  </Button>
                </div>
              )}

              {/* 추적 정보 */}
              {faceTracking && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">추적 상태:</span>{" "}
                      <Badge className={faceTracking.isTracking ? "bg-green-500" : "bg-red-500"}>
                        {faceTracking.isTracking ? "추적 중" : "추적 안됨"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">신뢰도:</span> {(faceTracking.confidence * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">처리 시간:</span> {faceTracking.processingTime.toFixed(1)}ms
                    </div>
                    <div>
                      <span className="font-medium">얼굴 수:</span> {faceTracking.faceCount}개
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 렌더링 설정 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                3D 렌더링 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">조명 환경</label>
                  <Select
                    value={renderSettings.lighting}
                    onValueChange={(value) => setRenderSettings((prev) => ({ ...prev, lighting: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">스튜디오</SelectItem>
                      <SelectItem value="sunset">석양</SelectItem>
                      <SelectItem value="dawn">새벽</SelectItem>
                      <SelectItem value="night">밤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">렌더링 품질</label>
                  <Select
                    value={renderSettings.quality}
                    onValueChange={(value) => setRenderSettings((prev) => ({ ...prev, quality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="ultra">최고</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">그림자</label>
                  <Switch
                    checked={renderSettings.shadows}
                    onCheckedChange={(checked) => setRenderSettings((prev) => ({ ...prev, shadows: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">피부 투과</label>
                  <Switch
                    checked={renderSettings.subsurfaceScattering}
                    onCheckedChange={(checked) =>
                      setRenderSettings((prev) => ({ ...prev, subsurfaceScattering: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메이크업 선택 영역 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                3D 메이크업 컬렉션
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advanced3DMakeup.map((makeup) => {
                  const isApplied = appliedMakeup.some((m) => m.id === makeup.id)
                  const IconComponent = categoryIcons[makeup.category]

                  return (
                    <div
                      key={makeup.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isApplied ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleMakeup(makeup)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{makeup.name}</div>
                          <div className="text-sm text-gray-500">{categoryNames[makeup.category]}</div>
                        </div>
                        {isApplied && <Badge className="ml-auto bg-pink-500 text-white">적용됨</Badge>}
                      </div>

                      {/* 재질 정보 */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>거칠기:</span>
                          <span>{(makeup.material.roughness * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>메탈릭:</span>
                          <span>{(makeup.material.metallic * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>광택:</span>
                          <span>{(makeup.material.shininess * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 적용된 메이크업 조절 */}
          {appliedMakeup.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>메이크업 세부 조절</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appliedMakeup.map((makeup) => (
                    <div key={makeup.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{makeup.name}</span>
                        <Badge variant="outline">{makeup.application.intensity}%</Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-600">강도</label>
                        <Slider
                          value={[makeup.application.intensity]}
                          onValueChange={([value]) => adjustMakeupIntensity(makeup.id, value)}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BeautyFilterEngine } from "@/lib/beauty-filter-engine"
import type { BeautyAdjustment, FilterPreset } from "@/types/beauty-filters"
import {
  Camera,
  Share2,
  RotateCcw,
  Settings,
  Heart,
  Sparkles,
  Palette,
  Instagram,
  Video,
  ImageIcon,
} from "lucide-react"

export default function BeautyFilterCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [filterEngine, setFilterEngine] = useState<BeautyFilterEngine | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null)
  const [presets] = useState<FilterPreset[]>(BeautyFilterEngine.getDefaultPresets())
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // 뷰티 조정 상태
  const [beautyAdjustments, setBeautyAdjustments] = useState<BeautyAdjustment>({
    smoothing: 0,
    whitening: 0,
    eyeEnlarge: 0,
    faceSlim: 0,
    noseThin: 0,
    lipEnhance: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    vignette: 0,
    blur: 0,
  })

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)

        // MediaRecorder 설정
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        })

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data])
          }
        }
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

  // 필터 엔진 초기화
  useEffect(() => {
    if (canvasRef.current && isStreaming) {
      const engine = new BeautyFilterEngine(canvasRef.current)
      setFilterEngine(engine)
    }
  }, [isStreaming])

  // 실시간 필터 적용
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !filterEngine || !isStreaming) return

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

    // 뷰티 조정 적용
    const processedImageData = filterEngine.applyBeautyAdjustments(imageData, beautyAdjustments)
    ctx.putImageData(processedImageData, 0, 0)

    // 선택된 프리셋의 이펙트 적용
    if (selectedPreset) {
      selectedPreset.effects.forEach((effect) => {
        filterEngine.applyParticleEffect(effect)
      })

      // 비네팅 적용
      if (selectedPreset.adjustments.vignette) {
        filterEngine.applyVignette(selectedPreset.adjustments.vignette)
      }
    }
  }, [isStreaming, filterEngine, beautyAdjustments, selectedPreset])

  // 프레임 처리 루프
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(processFrame, 33) // 30fps
    return () => clearInterval(interval)
  }, [isStreaming, processFrame])

  // 프리셋 적용
  const applyPreset = (preset: FilterPreset) => {
    setSelectedPreset(preset)
    setBeautyAdjustments((prev) => ({
      ...prev,
      ...preset.adjustments,
    }))
  }

  // 조정값 변경
  const updateAdjustment = (key: keyof BeautyAdjustment, value: number) => {
    setBeautyAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // 모든 필터 초기화
  const resetFilters = () => {
    setSelectedPreset(null)
    setBeautyAdjustments({
      smoothing: 0,
      whitening: 0,
      eyeEnlarge: 0,
      faceSlim: 0,
      noseThin: 0,
      lipEnhance: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      vignette: 0,
      blur: 0,
    })
  }

  // 사진 캡처
  const capturePhoto = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `beauty-filter-${Date.now()}.jpg`
          a.click()
          URL.revokeObjectURL(url)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  // 비디오 녹화 시작/중지
  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return

    if (isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
      setRecordedChunks([])
      mediaRecorderRef.current.start()
      setIsRecording(true)
    }
  }

  // 녹화된 비디오 다운로드
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `beauty-filter-video-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setRecordedChunks([])
    }
  }, [recordedChunks, isRecording])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">뷰티 필터 카메라</h1>
        <p className="text-gray-600">Instagram/TikTok 스타일의 실시간 뷰티 필터를 체험해보세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카메라 영역 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  실시간 뷰티 필터
                </div>
                {selectedPreset && <Badge className="bg-pink-500 text-white">{selectedPreset.name}</Badge>}
              </CardTitle>
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
                      className="w-full h-auto rounded-lg opacity-0"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ transform: "scaleX(-1)" }}
                    />

                    {/* 녹화 표시 */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-medium">REC</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">카메라를 시작하여 뷰티 필터를 체험해보세요</p>
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
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={capturePhoto}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    사진
                  </Button>
                  <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
                    <Video className="h-4 w-4 mr-2" />
                    {isRecording ? "중지" : "동영상"}
                  </Button>
                  <Button variant="outline" onClick={resetFilters}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    공유
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    카메라 중지
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 세부 조정 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                세부 조정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="beauty">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="beauty">뷰티</TabsTrigger>
                  <TabsTrigger value="color">색상</TabsTrigger>
                  <TabsTrigger value="effect">이펙트</TabsTrigger>
                </TabsList>

                <TabsContent value="beauty" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">피부 보정</label>
                      <Slider
                        value={[beautyAdjustments.smoothing]}
                        onValueChange={([value]) => updateAdjustment("smoothing", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">화이트닝</label>
                      <Slider
                        value={[beautyAdjustments.whitening]}
                        onValueChange={([value]) => updateAdjustment("whitening", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">눈 확대</label>
                      <Slider
                        value={[beautyAdjustments.eyeEnlarge]}
                        onValueChange={([value]) => updateAdjustment("eyeEnlarge", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">얼굴 슬림</label>
                      <Slider
                        value={[beautyAdjustments.faceSlim]}
                        onValueChange={([value]) => updateAdjustment("faceSlim", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="color" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">밝기</label>
                      <Slider
                        value={[beautyAdjustments.brightness]}
                        onValueChange={([value]) => updateAdjustment("brightness", value)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">대비</label>
                      <Slider
                        value={[beautyAdjustments.contrast]}
                        onValueChange={([value]) => updateAdjustment("contrast", value)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">채도</label>
                      <Slider
                        value={[beautyAdjustments.saturation]}
                        onValueChange={([value]) => updateAdjustment("saturation", value)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">색온도</label>
                      <Slider
                        value={[beautyAdjustments.warmth]}
                        onValueChange={([value]) => updateAdjustment("warmth", value)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="effect" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">비네팅</label>
                      <Slider
                        value={[beautyAdjustments.vignette]}
                        onValueChange={([value]) => updateAdjustment("vignette", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">배경 블러</label>
                      <Slider
                        value={[beautyAdjustments.blur]}
                        onValueChange={([value]) => updateAdjustment("blur", value)}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 필터 선택 영역 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                필터 프리셋
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPreset?.id === preset.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={preset.thumbnail || "/placeholder.svg"}
                        alt={preset.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{preset.name}</h3>
                        <p className="text-xs text-gray-500">{preset.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3" />
                        <span>{preset.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1">
                        {preset.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {preset.effects.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {preset.effects.map((effect) => (
                          <Badge key={effect.id} size="sm" className="bg-purple-100 text-purple-700">
                            {effect.type === "particles" && <Sparkles className="h-3 w-3" />}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 소셜 공유 */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-sm mb-3">소셜 공유</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="text-pink-600">
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </Button>
                  <Button size="sm" variant="outline" className="text-black">
                    TikTok
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

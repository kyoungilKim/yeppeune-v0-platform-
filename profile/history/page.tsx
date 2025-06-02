"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BeautyService } from "@/lib/firebase-beauty"
import type { BeautyAnalysis } from "@/types/beauty"
import { Calendar, ChevronLeft, BarChart3, Trash2, ArrowUpDown, ArrowDownUp, CalendarIcon, Layers } from "lucide-react"

export default function HistoryPage() {
  const [analysisHistory, setAnalysisHistory] = useState<BeautyAnalysis[]>([])
  const [filteredHistory, setFilteredHistory] = useState<BeautyAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest")
  const [timeFilter, setTimeFilter] = useState<"all" | "30days" | "90days" | "year">("all")
  const [selectedAnalysis, setSelectedAnalysis] = useState<BeautyAnalysis | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareAnalysis, setCompareAnalysis] = useState<BeautyAnalysis | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null)

  // 임시 사용자 ID
  const userId = "user123"

  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  useEffect(() => {
    filterAndSortHistory()
  }, [analysisHistory, sortOrder, timeFilter])

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true)
      const history = await BeautyService.getUserAnalysisHistory(userId)
      setAnalysisHistory(history)
    } catch (error) {
      console.error("Error loading analysis history:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortHistory = () => {
    let filtered = [...analysisHistory]
    
    // 시간 필터 적용
    if (timeFilter !== "all") {
      const now = new Date()
      const cutoffDate = new Date()
      
      if (timeFilter === "30days") {
        cutoffDate.setDate(now.getDate() - 30)
      } else if (timeFilter === "90days") {
        cutoffDate.setDate(now.getDate() - 90)
      } else if (timeFilter === "year") {
        cutoffDate.setFullYear(now.getFullYear() - 1)
      }
      
      filtered = filtered.filter(analysis => new Date(analysis.timestamp) >= cutoffDate)
    }
    
    // 정렬 적용
    if (sortOrder === "newest") {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } else if (sortOrder === "highest") {
      filtered.sort((a, b) => b.skinScore - a.skinScore)
    } else if (sortOrder === "lowest") {
      filtered.sort((a, b) => a.skinScore - b.skinScore)
    }
    
    setFilteredHistory(filtered)
  }

  const handleDeleteAnalysis = async () => {
    if (!analysisToDelete) return
    
    try {
      await BeautyService.deleteAnalysis(analysisToDelete)
      setAnalysisHistory(analysisHistory.filter(analysis => analysis.id !== analysisToDelete))
      setDeleteDialogOpen(false)
      setAnalysisToDelete(null)
      
      // 삭제된 분석이 선택된 분석이면 선택 해제
      if (selectedAnalysis?.id === analysisToDelete) {
        setSelectedAnalysis(null)
      }
      
      // 삭제된 분석이 비교 분석이면 비교 해제
      if (compareAnalysis?.id === analysisToDelete) {
        setCompareAnalysis(null)
        setCompareMode(false)
      }
    } catch (error) {
      console.error("Error deleting analysis:", error)
    }
  }

  const confirmDelete = (analysisId: string) => {
    setAnalysisToDelete(analysisId)
    setDeleteDialogOpen(true)
  }

  const handleCompare = (analysis: BeautyAnalysis) => {
    if (compareMode) {
      setCompareAnalysis(analysis)
    } else {
      setCompareMode(true)
      setCompareAnalysis(analysis)
    }
  }

  const cancelCompare = () => {
    setCompareMode(false)
    setCompareAnalysis(null)
  }

  const getChangePercentage = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getChangeDirection = (current: number, previous: number): "increase" | "decrease" | "same" => {
    if (current > previous) return "increase"
    if (current < previous) return "decrease"
    return "same"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">분석 히스토리를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Button variant="ghost" onClick={() => window.history.back()} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            뒤로가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">분석 히스토리</h1>
        </div>
        <p className="text-gray-600">과거 분석 결과를 확인하고 피부 상태의 변화를 추적하세요</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(value: "all" | "30days" | "90days" | "year") => setTimeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              <SelectItem value="30days">최근 30일</SelectItem>
              <SelectItem value="90days">최근 90일</SelectItem>
              <SelectItem value="year">최근 1년</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value: "newest" | "oldest" | "highest" | "lowest") => setSortOrder(value)}>
            <SelectTrigger className="w-[180px]">
              {sortOrder.includes("est") ? (
                <Calendar className="h-4 w-4 mr-2" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              <SelectValue placeholder="정렬 방식" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  최신순
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  오래된순
                </div>
              </SelectItem>
              <SelectItem value="highest">
                <div className="flex items-center">
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  점수 높은순
                </div>
              </SelectItem>
              <SelectItem value="lowest">
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  점수 낮은순
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {compareMode && (
            <Button variant="outline" onClick={cancelCompare}>
              비교 모드 취소
            </Button>
          )}
          <Button onClick={() => window.location.href = "/ai-analysis"}>
            새 분석 시작
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">목록 보기</TabsTrigger>
          <TabsTrigger value="trends">트렌드 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredHistory.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className={`${selectedAnalysis?.id === analysis.id ? 'border-pink-500 shadow-md' : ''} ${compareAnalysis?.id === analysis.id ? 'border-blue-500 shadow-md' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">피부 점수: {analysis.skinScore}/100</CardTitle>
                        <CardDescription>{new Date(analysis.timestamp).toLocaleString()}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            analysis.skinScore >= 80 ? "default" : analysis.skinScore >= 60 ? "secondary" : "destructive"
                          }
                        >
                          {analysis.skinType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">수분도</p>
                        <Progress value={analysis.analysisData.hydration} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">{analysis.analysisData.hydration}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">유분도</p>
                        <Progress value={analysis.analysisData.oiliness} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">{analysis.analysisData.oiliness}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">탄력도</p>
                        <Progress value={analysis.analysisData.elasticity} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">{analysis.analysisData.elasticity}%</p>
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
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                      >
                        {selectedAnalysis?.id === analysis.id ? '접기' : '상세 보기'}
                      </Button>
                      {!compareMode ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCompare(analysis)}
                        >
                          <Layers className="h-4 w-4 mr-1" />
                          비교하기
                        </Button>
                      ) : compareAnalysis?.id !== analysis.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCompare(analysis)}
                        >
                          <Layers className="h-4 w-4 mr-1" />
                          이것과 비교
                        </Button>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => confirmDelete(analysis.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>

                  {selectedAnalysis?.id === analysis.id && (
                    <CardContent className="border-t pt-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">상세 분석 결과</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">민감도</p>
                            <Progress value={analysis.analysisData.sensitivity} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">{analysis.analysisData.sensitivity}%</p>
                          </div>
                          <div className="text-center">
                            \

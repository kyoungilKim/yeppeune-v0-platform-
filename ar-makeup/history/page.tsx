"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ARMakeupService } from "@/lib/ar-makeup-service"
import type { ARMakeupSession } from "@/types/ar-makeup"
import { Calendar, Download, Share2, Trash2, Eye } from "lucide-react"

export default function ARMakeupHistoryPage() {
  const [sessions, setSessions] = useState<ARMakeupSession[]>([])
  const [loading, setLoading] = useState(true)

  // 임시 사용자 ID
  const userId = "user123"

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const userSessions = await ARMakeupService.getUserARSessions(userId)
      setSessions(userSessions)
    } catch (error) {
      console.error("Error loading sessions:", error)
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
            <p className="text-gray-600">AR 메이크업 기록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AR 메이크업 히스토리</h1>
        <p className="text-gray-600">지금까지 체험한 AR 메이크업 기록을 확인해보세요</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">아직 AR 메이크업 기록이 없습니다</h3>
            <p className="text-gray-600 mb-6">AR 메이크업을 체험하고 사진을 저장해보세요!</p>
            <Button onClick={() => (window.location.href = "/ar-makeup")}>AR 메이크업 체험하기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100">
                {session.capturedImage ? (
                  <img
                    src={session.capturedImage || "/placeholder.svg"}
                    alt="AR Makeup"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{new Date(session.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <h3 className="font-medium">적용된 메이크업</h3>
                  <div className="flex flex-wrap gap-1">
                    {session.appliedFilters.map((filter) => (
                      <Badge key={filter.id} variant="outline" className="text-xs">
                        {filter.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Share2 className="h-3 w-3 mr-1" />
                    공유
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

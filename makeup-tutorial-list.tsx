"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MakeupTutorialService } from "@/lib/makeup-tutorial-service"
import type { MakeupTutorial } from "@/types/makeup-tutorial"
import { Clock, Star, User, Eye } from "lucide-react"
import Link from "next/link"

interface MakeupTutorialListProps {
  userId: string
}

export default function MakeupTutorialList({ userId }: MakeupTutorialListProps) {
  const [tutorials, setTutorials] = useState<MakeupTutorial[]>([])
  const [recommendedTutorials, setRecommendedTutorials] = useState<MakeupTutorial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // 튜토리얼 데이터 로드
  useEffect(() => {
    const loadTutorials = async () => {
      setIsLoading(true)
      try {
        // 모든 튜토리얼 로드
        const allTutorials = await MakeupTutorialService.getTutorials()
        setTutorials(allTutorials)

        // 추천 튜토리얼 로드
        const recommended = await MakeupTutorialService.getRecommendedTutorials(userId)
        setRecommendedTutorials(recommended)
      } catch (error) {
        console.error("Error loading tutorials:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTutorials()
  }, [userId])

  // 카테고리별 필터링
  const filteredTutorials = tutorials.filter((tutorial) => {
    if (activeCategory === "all") return true
    return tutorial.category === activeCategory
  })

  // 난이도별 필터링
  const getTutorialsByDifficulty = (difficulty: string) => {
    return filteredTutorials.filter((tutorial) => {
      if (difficulty === "all") return true
      return tutorial.difficulty === difficulty
    })
  }

  // 튜토리얼 카드 렌더링
  const renderTutorialCard = (tutorial: MakeupTutorial) => (
    <Card key={tutorial.id} className="overflow-hidden h-full flex flex-col">
      <div className="relative">
        <img
          src={tutorial.thumbnail || "/placeholder.svg?height=300&width=400"}
          alt={tutorial.title}
          className="w-full h-48 object-cover"
        />
        <Badge
          className="absolute top-2 right-2"
          variant={
            tutorial.difficulty === "beginner"
              ? "outline"
              : tutorial.difficulty === "intermediate"
                ? "secondary"
                : "destructive"
          }
        >
          {tutorial.difficulty === "beginner" ? "초급" : tutorial.difficulty === "intermediate" ? "중급" : "고급"}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg line-clamp-1">{tutorial.title}</h3>
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{tutorial.authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{tutorial.rating}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2 flex-grow">
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{tutorial.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {tutorial.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tutorial.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tutorial.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{tutorial.duration}분</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{tutorial.viewCount.toLocaleString()}</span>
            </div>
          </div>

          <Link href={`/makeup-tutorials/${tutorial.id}`}>
            <Button size="sm">시작하기</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto p-4">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6" />
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-gray-200 animate-pulse rounded w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* 추천 튜토리얼 */}
          {recommendedTutorials.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">맞춤 추천 튜토리얼</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTutorials.slice(0, 3).map(renderTutorialCard)}
              </div>
            </div>
          )}

          {/* 카테고리 필터 */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
              >
                전체
              </Button>
              <Button
                variant={activeCategory === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("daily")}
              >
                데일리
              </Button>
              <Button
                variant={activeCategory === "office" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("office")}
              >
                오피스
              </Button>
              <Button
                variant={activeCategory === "party" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("party")}
              >
                파티
              </Button>
              <Button
                variant={activeCategory === "wedding" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("wedding")}
              >
                웨딩
              </Button>
              <Button
                variant={activeCategory === "seasonal" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("seasonal")}
              >
                시즌별
              </Button>
              <Button
                variant={activeCategory === "trend" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("trend")}
              >
                트렌드
              </Button>
            </div>
          </div>

          {/* 난이도별 탭 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="beginner">초급</TabsTrigger>
              <TabsTrigger value="intermediate">중급</TabsTrigger>
              <TabsTrigger value="advanced">고급</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.length > 0 ? (
                  filteredTutorials.map(renderTutorialCard)
                ) : (
                  <p className="col-span-full text-center py-8 text-gray-500">해당 카테고리의 튜토리얼이 없습니다.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="beginner">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getTutorialsByDifficulty("beginner").length > 0 ? (
                  getTutorialsByDifficulty("beginner").map(renderTutorialCard)
                ) : (
                  <p className="col-span-full text-center py-8 text-gray-500">초급 난이도의 튜토리얼이 없습니다.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="intermediate">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getTutorialsByDifficulty("intermediate").length > 0 ? (
                  getTutorialsByDifficulty("intermediate").map(renderTutorialCard)
                ) : (
                  <p className="col-span-full text-center py-8 text-gray-500">중급 난이도의 튜토리얼이 없습니다.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getTutorialsByDifficulty("advanced").length > 0 ? (
                  getTutorialsByDifficulty("advanced").map(renderTutorialCard)
                ) : (
                  <p className="col-span-full text-center py-8 text-gray-500">고급 난이도의 튜토리얼이 없습니다.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

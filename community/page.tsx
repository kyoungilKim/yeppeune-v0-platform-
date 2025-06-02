"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SocialService } from "@/lib/firebase-social"
import type { BeautyPost, Comment, BeautyChallenge } from "@/types/social"
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Search,
  Filter,
  Trophy,
  Users,
  Calendar,
  Star,
  Camera,
  Lightbulb,
  HelpCircle,
  ShoppingBag,
} from "lucide-react"

export default function CommunityPage() {
  const [posts, setPosts] = useState<BeautyPost[]>([])
  const [challenges, setChallenges] = useState<BeautyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreatePost, setShowCreatePost] = useState(false)

  // 임시 사용자 정보
  const currentUser = {
    id: "user123",
    name: "김예쁘",
    avatar: "/placeholder.svg?height=40&width=40",
  }

  useEffect(() => {
    loadCommunityData()
  }, [selectedFilter])

  const loadCommunityData = async () => {
    try {
      setLoading(true)

      // 게시물 로드
      const filterType = selectedFilter === "all" ? undefined : selectedFilter
      const postsData = await SocialService.getPosts(20, filterType)
      setPosts(postsData)

      // 챌린지 로드
      const challengesData = await SocialService.getChallenges()
      setChallenges(challengesData)
    } catch (error) {
      console.error("Error loading community data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await SocialService.unlikePost(postId, currentUser.id)
      } else {
        await SocialService.likePost(postId, currentUser.id)
      }

      // 로컬 상태 업데이트
      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked ? post.likedBy.filter((id) => id !== currentUser.id) : [...post.likedBy, currentUser.id],
            }
          }
          return post
        }),
      )
    } catch (error) {
      console.error("Error handling like:", error)
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">커뮤니티를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">뷰티 커뮤니티</h1>
        <p className="text-gray-600">뷰티 팁을 공유하고 다른 사용자들과 소통해보세요</p>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">피드</TabsTrigger>
          <TabsTrigger value="challenges">챌린지</TabsTrigger>
          <TabsTrigger value="experts">전문가</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="게시물 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="analysis">분석 결과</SelectItem>
                <SelectItem value="tip">뷰티 팁</SelectItem>
                <SelectItem value="review">제품 리뷰</SelectItem>
                <SelectItem value="question">질문</SelectItem>
              </SelectContent>
            </Select>
            <CreatePostDialog currentUser={currentUser} onPostCreated={loadCommunityData} />
          </div>

          {/* 게시물 목록 */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLikePost} />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">게시물이 없습니다</h3>
                  <p className="text-gray-600 mb-4">첫 번째 게시물을 작성해보세요!</p>
                  <CreatePostDialog currentUser={currentUser} onPostCreated={loadCommunityData} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">뷰티 챌린지</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              챌린지 만들기
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="experts" className="space-y-6">
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">전문가 상담</h3>
            <p className="text-gray-600 mb-4">뷰티 전문가와 1:1 상담을 받아보세요</p>
            <Button>전문가 찾기</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PostCard({
  post,
  currentUser,
  onLike,
}: {
  post: BeautyPost
  currentUser: { id: string; name: string; avatar: string }
  onLike: (postId: string, isLiked: boolean) => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")

  const isLiked = post.likedBy.includes(currentUser.id)

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "analysis":
        return <Camera className="h-4 w-4" />
      case "tip":
        return <Lightbulb className="h-4 w-4" />
      case "review":
        return <ShoppingBag className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "analysis":
        return "분석 결과"
      case "tip":
        return "뷰티 팁"
      case "review":
        return "제품 리뷰"
      case "question":
        return "질문"
      default:
        return "일반"
    }
  }

  const loadComments = async () => {
    if (!showComments) {
      const commentsData = await SocialService.getComments(post.id)
      setComments(commentsData)
    }
    setShowComments(!showComments)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      await SocialService.addComment({
        postId: post.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newComment,
        likes: 0,
        likedBy: [],
      })

      setNewComment("")
      loadComments()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.userAvatar || "/placeholder.svg"} />
              <AvatarFallback>{post.userName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.userName}</p>
              <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getPostTypeIcon(post.type)}
            {getPostTypeLabel(post.type)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          <p className="text-gray-700">{post.content}</p>
        </div>

        {/* 분석 데이터 표시 */}
        {post.analysisData && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">피부 분석 결과</span>
              <Badge variant="secondary">{post.analysisData.skinType}</Badge>
            </div>
            <div className="text-2xl font-bold text-pink-600">{post.analysisData.skinScore}/100</div>
          </div>
        )}

        {/* 이미지 */}
        {post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.images.slice(0, 4).map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`Post image ${index + 1}`}
                className="rounded-lg object-cover h-32 w-full"
              />
            ))}
          </div>
        )}

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id, isLiked)}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {post.likes}
            </Button>
            <Button variant="ghost" size="sm" onClick={loadComments}>
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comments}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              {post.shares}
            </Button>
          </div>
        </div>

        {/* 댓글 섹션 */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Input
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button size="sm" onClick={handleAddComment}>
                  게시
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-sm">{comment.userName}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        {comment.likes}
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChallengeCard({ challenge }: { challenge: BeautyChallenge }) {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate
  const daysLeft = Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className={isActive ? "border-pink-200 bg-pink-50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "진행중" : "예정"}</Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            {challenge.participants}명 참여
          </div>
        </div>
        <CardTitle className="text-lg">{challenge.title}</CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <img
          src={challenge.imageUrl || "/placeholder.svg"}
          alt={challenge.title}
          className="w-full h-32 object-cover rounded-lg"
        />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {isActive ? `${daysLeft}일 남음` : "곧 시작"}
          </div>
          <div className="flex items-center text-pink-600">
            <Trophy className="h-4 w-4 mr-1" />
            {challenge.rewards.length}개 리워드
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {challenge.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        <Button className="w-full" disabled={!isActive}>
          {isActive ? "참여하기" : "알림 설정"}
        </Button>
      </CardContent>
    </Card>
  )
}

function CreatePostDialog({
  currentUser,
  onPostCreated,
}: {
  currentUser: { id: string; name: string; avatar: string }
  onPostCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [postData, setPostData] = useState({
    type: "tip" as const,
    title: "",
    content: "",
    tags: "",
    isPublic: true,
  })

  const handleSubmit = async () => {
    if (!postData.title.trim() || !postData.content.trim()) return

    try {
      await SocialService.createPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        type: postData.type,
        title: postData.title,
        content: postData.content,
        images: [],
        tags: postData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        likes: 0,
        comments: 0,
        shares: 0,
        isPublic: postData.isPublic,
        likedBy: [],
      })

      setPostData({
        type: "tip",
        title: "",
        content: "",
        tags: "",
        isPublic: true,
      })
      setOpen(false)
      onPostCreated()
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          게시물 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>새 게시물 작성</DialogTitle>
          <DialogDescription>뷰티 팁이나 경험을 다른 사용자들과 공유해보세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">게시물 유형</label>
            <Select value={postData.type} onValueChange={(value: any) => setPostData({ ...postData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tip">뷰티 팁</SelectItem>
                <SelectItem value="review">제품 리뷰</SelectItem>
                <SelectItem value="question">질문</SelectItem>
                <SelectItem value="analysis">분석 결과</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">제목</label>
            <Input
              placeholder="게시물 제목을 입력하세요"
              value={postData.title}
              onChange={(e) => setPostData({ ...postData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">내용</label>
            <Textarea
              placeholder="내용을 입력하세요"
              value={postData.content}
              onChange={(e) => setPostData({ ...postData, content: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
            <Input
              placeholder="예: 스킨케어, 메이크업, 건성피부"
              value={postData.tags}
              onChange={(e) => setPostData({ ...postData, tags: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>게시하기</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

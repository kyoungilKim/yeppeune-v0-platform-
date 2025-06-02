export interface BeautyPost {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: "analysis" | "tip" | "review" | "question"
  title: string
  content: string
  images: string[]
  tags: string[]
  analysisData?: {
    skinScore: number
    skinType: string
    beforeAfter?: {
      before: string
      after: string
    }
  }
  likes: number
  comments: number
  shares: number
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  likedBy: string[]
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  likes: number
  likedBy: string[]
  createdAt: Date
  parentId?: string // 대댓글용
  replies?: Comment[]
}

export interface BeautyChallenge {
  id: string
  title: string
  description: string
  imageUrl: string
  startDate: Date
  endDate: Date
  participants: number
  rewards: string[]
  tags: string[]
  rules: string[]
  createdBy: string
  isActive: boolean
}

export interface UserFollow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export interface BeautyExpert {
  id: string
  name: string
  title: string
  specialties: string[]
  experience: number
  rating: number
  avatar: string
  bio: string
  verified: boolean
  consultationPrice: number
  availableSlots: string[]
}

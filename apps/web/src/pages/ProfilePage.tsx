import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, UserCheck, Settings, BookOpen, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import StoryCard from '@/components/discovery/StoryCard'
import StoryCardSkeleton from '@/components/discovery/StoryCardSkeleton'
import { usersApi } from '@/lib/api'
import { formatNumber, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { User, StoryListItem } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: me } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)

  const targetUsername = username ?? me?.username
  const isOwnProfile = !username || username === me?.username

  useEffect(() => {
    if (!targetUsername) return
    const load = async () => {
      setLoading(true)
      try {
        const [profRes, storRes] = await Promise.all([
          usersApi.profile(targetUsername),
          usersApi.stories(targetUsername)
        ])
        setProfile(profRes.data)
        setStories(storRes.data.items ?? [])
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [targetUsername])

  const handleFollow = async () => {
    if (!targetUsername) return
    setFollowing(!following)
    try { await usersApi.follow(targetUsername) } catch { setFollowing(following) }
  }

  if (loading || !profile) {
    return (
      <div className="px-4 pt-8 pb-24">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full shimmer" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-5 w-40 shimmer rounded" />
            <div className="h-4 w-24 shimmer rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StoryCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Profile header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 text-2xl">
            <AvatarImage src={profile.avatar} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-cloudy-500 mb-2">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-cloudy-200">
          <div className="text-center">
            <p className="font-bold text-lg font-serif">{formatNumber(profile.storiesCount)}</p>
            <p className="text-xs text-cloudy-400">Stories</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg font-serif">{formatNumber(profile.followersCount)}</p>
            <p className="text-xs text-cloudy-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg font-serif">{formatNumber(profile.followingCount)}</p>
            <p className="text-xs text-cloudy-400">Following</p>
          </div>
          <div className="text-xs text-cloudy-400 ml-auto self-end pb-1">
            Joined {formatDate(profile.joinedAt)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            <Button variant="outline" className="flex-1 gap-2">
              <Settings className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <Button
              className={`flex-1 gap-2 ${following ? '' : ''}`}
              variant={following ? 'outline' : 'default'}
              onClick={handleFollow}
            >
              {following
                ? <><UserCheck className="h-4 w-4" /> Following</>
                : <><UserPlus className="h-4 w-4" /> Follow</>
              }
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Stories grid */}
      <div className="px-4 mt-4">
        <h2 className="font-serif text-base font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-crail" />
          Stories by {profile.displayName}
        </h2>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-serif text-cloudy-400">No published stories yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stories.map((story, i) => (
              <StoryCard key={story._id} story={story} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

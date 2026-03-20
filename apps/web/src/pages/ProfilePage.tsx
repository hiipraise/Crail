import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UserPlus, UserCheck, Settings, BookOpen, Camera, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import StoryCard from '@/components/discovery/StoryCard'
import StoryCardSkeleton from '@/components/discovery/StoryCardSkeleton'
import { usersApi } from '@/lib/api'
import { formatNumber, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { User, StoryListItem } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user: me, updateUser } = useAuthStore()
  const { addToast } = useUIStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' })

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
        setProfileForm({
          displayName: profRes.data.displayName,
          bio: profRes.data.bio ?? ''
        })
        setStories(storRes.data.items ?? [])
      } catch {
        /* silent */
      } finally {
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

  const handleProfileSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append('displayName', profileForm.displayName.trim())
      form.append('bio', profileForm.bio.trim())
      await usersApi.updateProfile(form)

      const updates = {
        displayName: profileForm.displayName.trim() || profile.displayName,
        bio: profileForm.bio.trim()
      }

      setProfile((prev) => prev ? { ...prev, ...updates } : prev)
      updateUser(updates)
      setIsEditing(false)
      addToast({ title: 'Profile updated', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to update profile', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      await usersApi.updateProfile(form)

      const nextAvatar = URL.createObjectURL(file)
      setProfile((prev) => prev ? { ...prev, avatar: nextAvatar } : prev)
      updateUser({ avatar: nextAvatar })
      addToast({ title: 'Profile photo updated', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to update profile photo', variant: 'error' })
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
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
      <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 text-2xl">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    size="icon"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3 max-w-xl">
                  <div>
                    <Input
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Display name"
                    />
                  </div>
                  <div>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell readers about yourself…"
                      rows={4}
                      maxLength={300}
                    />
                    <p className="mt-1 text-xs text-cloudy-400">{profileForm.bio.length}/300</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleProfileSave} disabled={saving} className="gap-2">
                      <Check className="h-4 w-4" />
                      {saving ? 'Saving…' : 'Save profile'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProfileForm({ displayName: profile.displayName, bio: profile.bio ?? '' })
                        setIsEditing(false)
                      }}
                      disabled={saving}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-serif text-xl font-bold">{profile.displayName}</h1>
                  <p className="text-sm text-cloudy-500 mb-2">@{profile.username}</p>
                  {profile.bio ? (
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 max-w-2xl">
                      {profile.bio}
                    </p>
                  ) : isOwnProfile ? (
                    <p className="text-sm text-cloudy-400">Add a bio so readers can learn more about you.</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="xl:w-72 w-full">
            <div className="rounded-2xl border border-cloudy-200 bg-white p-4">
              <div className="grid grid-cols-4 xl:grid-cols-3 gap-4">
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
                <div className="text-center xl:col-span-3">
                  <p className="text-xs text-cloudy-400">Joined {formatDate(profile.joinedAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsEditing((prev) => !prev)}>
                      <Settings className="h-4 w-4" /> {isEditing ? 'Close Editor' : 'Edit Profile'}
                    </Button>
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('/settings')}>
                      Settings
                    </Button>
                  </>
                ) : (
                  <Button
                    className="flex-1 gap-2"
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
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-4 mt-4 max-w-5xl mx-auto w-full">
        <h2 className="font-serif text-base font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-crail" />
          Stories by {profile.displayName}
        </h2>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-serif text-cloudy-400">No published stories yet</p>
            {isOwnProfile && (
              <Link to="/write" className="inline-flex mt-4">
                <Button>Start your first story</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {stories.map((story, i) => (
              <StoryCard key={story._id} story={story} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

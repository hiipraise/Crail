import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Bell, Shield, Palette, BookOpen,
  LogOut, Trash2, ChevronRight, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { usersApi } from '@/lib/api'

type Section = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'reading' | 'account'

const sections = [
  { id: 'profile' as Section, icon: User, label: 'Profile' },
  { id: 'notifications' as Section, icon: Bell, label: 'Notifications' },
  { id: 'privacy' as Section, icon: Shield, label: 'Privacy' },
  { id: 'appearance' as Section, icon: Palette, label: 'Appearance' },
  { id: 'reading' as Section, icon: BookOpen, label: 'Reading' },
  { id: 'account' as Section, icon: Trash2, label: 'Account' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuthStore()
  const { addToast } = useUIStore()
  const [active, setActive] = useState<Section>('profile')
  const [saving, setSaving] = useState(false)

  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName ?? '',
    bio: user?.bio ?? '',
  })

  const [notifSettings, setNotifSettings] = useState({
    newFollower: true,
    newComment: true,
    newChapter: true,
    newsletter: false,
  })

  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    showReadingActivity: true,
    allowMessages: true,
  })

  const [readingPrefs, setReadingPrefs] = useState({
    defaultFontFamily: 'serif',
    defaultFontSize: 16,
    autoBookmark: true,
    hapticFeedback: true,
  })

  const saveProfile = async () => {
    setSaving(true)
    try {
      const form = new FormData()
      form.append('displayName', profileForm.displayName)
      form.append('bio', profileForm.bio)
      await usersApi.updateProfile(form)
      updateUser({ displayName: profileForm.displayName, bio: profileForm.bio })
      addToast({ title: 'Profile saved', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to save', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-0 md:gap-6 px-0 md:px-4">
        {/* Sidebar */}
        <aside className="md:w-52 shrink-0">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide">
            {sections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors md:rounded-lg ${
                  active === id
                    ? 'text-crail bg-crail-50 border-b-2 md:border-b-0 border-crail'
                    : 'text-cloudy-500 border-b-2 md:border-b-0 border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <Separator className="md:hidden" />

        {/* Content */}
        <div className="flex-1 px-4 md:px-0 pt-4 md:pt-0">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile */}
            {active === 'profile' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Profile</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 text-xl">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button size="sm" variant="outline">Change photo</Button>
                    <p className="text-xs text-cloudy-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-1.5 block">Display name</Label>
                  <Input
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <Label className="text-sm mb-1.5 block">Username</Label>
                  <Input value={user?.username ?? ''} disabled className="opacity-60" />
                  <p className="text-xs text-cloudy-400 mt-1">Username cannot be changed.</p>
                </div>

                <div>
                  <Label className="text-sm mb-1.5 block">Bio</Label>
                  <Textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell readers about yourself…"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-xs text-cloudy-400 mt-1">{profileForm.bio.length}/300</p>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="gap-2">
                  {saving ? 'Saving…' : <><Check className="h-4 w-4" /> Save changes</>}
                </Button>
              </div>
            )}

            {/* Notifications */}
            {active === 'notifications' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Notifications</h2>
                {[
                  { key: 'newFollower', label: 'New follower', desc: 'When someone follows you' },
                  { key: 'newComment', label: 'Comments', desc: 'When someone comments on your story' },
                  { key: 'newChapter', label: 'New chapters', desc: 'From authors you follow' },
                  { key: 'newsletter', label: 'Crail newsletter', desc: 'Weekly digest of top stories' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-cloudy-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-cloudy-400">{desc}</p>
                    </div>
                    <Switch
                      checked={notifSettings[key as keyof typeof notifSettings]}
                      onCheckedChange={(v) => setNotifSettings({ ...notifSettings, [key]: v })}
                    />
                  </div>
                ))}
                <Button className="gap-2"><Check className="h-4 w-4" /> Save preferences</Button>
              </div>
            )}

            {/* Privacy */}
            {active === 'privacy' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Privacy</h2>
                {[
                  { key: 'showEmail', label: 'Show email on profile', desc: 'Others can see your email address' },
                  { key: 'showReadingActivity', label: 'Reading activity', desc: 'Show what you\'re currently reading' },
                  { key: 'allowMessages', label: 'Allow messages', desc: 'Let other users message you' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-cloudy-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-cloudy-400">{desc}</p>
                    </div>
                    <Switch
                      checked={privacySettings[key as keyof typeof privacySettings]}
                      onCheckedChange={(v) => setPrivacySettings({ ...privacySettings, [key]: v })}
                    />
                  </div>
                ))}
                <Button className="gap-2"><Check className="h-4 w-4" /> Save preferences</Button>
              </div>
            )}

            {/* Appearance */}
            {active === 'appearance' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Appearance</h2>
                <div>
                  <Label className="text-sm mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Light', 'Dark', 'System'].map((t) => (
                      <button
                        key={t}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                          t === 'Light'
                            ? 'border-crail bg-crail-50 text-crail'
                            : 'border-cloudy-200 text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-cloudy-400 mt-2">Dark mode coming soon.</p>
                </div>
              </div>
            )}

            {/* Reading preferences */}
            {active === 'reading' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Reading Preferences</h2>

                <div>
                  <Label className="text-sm mb-3 block">Default font</Label>
                  <div className="flex gap-2">
                    {['serif', 'sans'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setReadingPrefs({ ...readingPrefs, defaultFontFamily: f })}
                        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                          readingPrefs.defaultFontFamily === f
                            ? 'border-crail bg-crail-50 text-crail'
                            : 'border-cloudy-200'
                        } ${f === 'serif' ? 'font-serif' : 'font-sans'}`}
                      >
                        {f === 'serif' ? 'Serif' : 'Sans-serif'}
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  { key: 'autoBookmark', label: 'Auto-bookmark on exit', desc: 'Save page position when leaving a chapter' },
                  { key: 'hapticFeedback', label: 'Haptic feedback', desc: 'Vibrate on page flip (mobile)' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-cloudy-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-cloudy-400">{desc}</p>
                    </div>
                    <Switch
                      checked={readingPrefs[key as keyof typeof readingPrefs] as boolean}
                      onCheckedChange={(v) => setReadingPrefs({ ...readingPrefs, [key]: v })}
                    />
                  </div>
                ))}

                <Button className="gap-2"><Check className="h-4 w-4" /> Save preferences</Button>
              </div>
            )}

            {/* Account */}
            {active === 'account' && (
              <div className="space-y-5 max-w-lg">
                <h2 className="font-serif text-lg font-semibold">Account</h2>

                <div className="p-4 bg-white border border-cloudy-200 rounded-xl space-y-3">
                  <p className="text-sm font-medium">Signed in as</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{user?.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.displayName}</p>
                      <p className="text-xs text-cloudy-400">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>

                <Separator />

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
                  <p className="text-xs text-red-600">
                    Deleting your account permanently removes all your stories, chapters, and data.
                    This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete account
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

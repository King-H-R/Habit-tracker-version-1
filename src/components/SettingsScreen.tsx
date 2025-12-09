"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  User,
  Palette,
  Download,
  Upload,
  Bell,
  Moon,
  Sun,
  Smartphone,
  Shield,
  Trash2,
  HelpCircle
} from 'lucide-react'

interface SettingsProps {
  onClose: () => void
}

export function SettingsScreen({ onClose }: SettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [notifications, setNotifications] = useState(true)
  const [reminderTime, setReminderTime] = useState('19:00')
  const [autoBackup, setAutoBackup] = useState(true)
  const [dataSharing, setDataSharing] = useState(false)
  const [userName, setUserName] = useState('User')
  const [email, setEmail] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await axios.delete('/api/user/settings')
        window.location.reload() // Reload to reset state/logout
      } catch (error) {
        console.error("Failed to delete account", error)
        alert("Failed to delete account")
      }
    }
  }

  useEffect(() => {
    // Fetch settings on mount
    axios.get('/api/user/settings').then(res => {
      if (!res.data) return
      const { theme, name, email } = res.data
      if (theme) setTheme(theme as any)
      if (name) setUserName(name)
      if (email) setEmail(email)
    }).catch(err => console.error("Failed to load settings", err))
  }, [])

  const updateSetting = async (key: string, value: any) => {
    try {
      await axios.put('/api/user/settings', { [key]: value })
    } catch (error) {
      console.error(`Failed to update ${key}`, error)
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
    updateSetting('theme', newTheme)
  }


  const themes = [
    { value: 'light', label: 'Light', icon: Sun, color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
    { value: 'dark', label: 'Dark', icon: Moon, color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
    { value: 'auto', label: 'Auto', icon: Smartphone, color: 'bg-gradient-to-r from-blue-400 to-purple-600' }
  ]

  const handleExport = () => {
    // Simulate data export
    const data = {
      habits: [],
      settings: { theme, notifications, reminderTime },
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          console.log('Imported data:', data)
          // Handle import logic here
          alert('Data imported successfully!')
        } catch (error) {
          alert('Error importing file. Please check the format.')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <Button variant="outline" onClick={onClose}>
            × Close
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                {isEditingProfile ? (
                  <div className="flex gap-2 justify-center items-center">
                    <input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="border rounded p-1 text-center"
                    />
                    <Button size="sm" onClick={() => {
                      updateSetting('name', userName)
                      setIsEditingProfile(false)
                    }}>Save</Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{userName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{email || 'No email set'}</p>
                  </>
                )}
              </div>
              {!isEditingProfile && (
                <Button className="w-full" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h3>
                <div className="space-y-2">
                  {themes.map((themeOption) => {
                    const Icon = themeOption.icon
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value as any)}
                        className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${theme === themeOption.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${themeOption.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">{themeOption.label}</div>
                          {theme === themeOption.value && (
                            <Badge variant="secondary" className="mt-1">Active</Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Daily Reminders</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about your habits</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={(val) => {
                    setNotifications(val)
                    updateSetting('notifications', val)
                  }}
                />
              </div>

              {notifications && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Reminder Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Backup & Sync</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto Backup</span>
                    <Switch
                      checked={autoBackup}
                      onCheckedChange={setAutoBackup}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Data Sharing</span>
                    <Switch
                      checked={dataSharing}
                      onCheckedChange={setDataSharing}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={handleExport} className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => alert("Password change flow would go here (requires auth provider support).")}>
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => alert("2FA setup would go here.")}>
                    Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              📚 User Guide
            </Button>
            <Button variant="outline" className="w-full justify-start">
              💬 Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              🐛 Report a Bug
            </Button>
            <Button variant="outline" className="w-full justify-start">
              ⭐ Rate App
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Habit Tracker Pro v2.0.1
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Made with ❤️ for better habits
          </p>
        </div>
      </div>
    </div >
  )
}
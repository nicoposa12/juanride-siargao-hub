'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2 } from 'lucide-react'

interface SystemSettings {
  // Booking Policies
  partial_payment_percentage: number
  cancellation_window_hours: number
  refund_percentage: number
  late_return_fee_per_hour: number
  
  // Payment Gateway
  gcash_enabled: boolean
  credit_card_enabled: boolean
  bank_transfer_enabled: boolean
  payment_api_key: string
  
  // Terms & Conditions
  terms_of_service: string
  privacy_policy: string
  
  // System Features
  gps_tracking_enabled: boolean
  maintenance_alerts_enabled: boolean
  email_notifications_enabled: boolean
  sms_notifications_enabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    partial_payment_percentage: 30,
    cancellation_window_hours: 24,
    refund_percentage: 80,
    late_return_fee_per_hour: 100,
    gcash_enabled: true,
    credit_card_enabled: true,
    bank_transfer_enabled: true,
    payment_api_key: '',
    terms_of_service: '',
    privacy_policy: '',
    gps_tracking_enabled: true,
    maintenance_alerts_enabled: true,
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadSettings()
    }
  }, [user, profile, authLoading, router])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSettings({
          partial_payment_percentage: data.partial_payment_percentage || 30,
          cancellation_window_hours: data.cancellation_window_hours || 24,
          refund_percentage: data.refund_percentage || 80,
          late_return_fee_per_hour: data.late_return_fee_per_hour || 100,
          gcash_enabled: data.gcash_enabled ?? true,
          credit_card_enabled: data.credit_card_enabled ?? true,
          bank_transfer_enabled: data.bank_transfer_enabled ?? true,
          payment_api_key: data.payment_api_key || '',
          terms_of_service: data.terms_of_service || '',
          privacy_policy: data.privacy_policy || '',
          gps_tracking_enabled: data.gps_tracking_enabled ?? true,
          maintenance_alerts_enabled: data.maintenance_alerts_enabled ?? true,
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          sms_notifications_enabled: data.sms_notifications_enabled ?? false,
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('id')
        .single()

      let error

      if (existingSettings) {
        // Update existing settings
        const result = await supabase
          .from('system_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id)
        error = result.error
      } else {
        // Insert new settings
        const result = await supabase
          .from('system_settings')
          .insert([settings])
        error = result.error
      }

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system policies and preferences</p>
      </div>

      {/* Booking Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Policies</CardTitle>
          <CardDescription>Configure rental booking rules and policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="partialPayment">Partial Payment Percentage (%)</Label>
            <Input
              id="partialPayment"
              type="number"
              min="0"
              max="100"
              value={settings.partial_payment_percentage}
              onChange={(e) => setSettings({ ...settings, partial_payment_percentage: parseInt(e.target.value) || 0 })}
            />
            <p className="text-sm text-muted-foreground">
              Percentage of total amount required as advance payment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
            <Input
              id="cancellationWindow"
              type="number"
              min="0"
              value={settings.cancellation_window_hours}
              onChange={(e) => setSettings({ ...settings, cancellation_window_hours: parseInt(e.target.value) || 0 })}
            />
            <p className="text-sm text-muted-foreground">
              Hours before rental start when cancellation is allowed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundPercentage">Refund Percentage (%)</Label>
            <Input
              id="refundPercentage"
              type="number"
              min="0"
              max="100"
              value={settings.refund_percentage}
              onChange={(e) => setSettings({ ...settings, refund_percentage: parseInt(e.target.value) || 0 })}
            />
            <p className="text-sm text-muted-foreground">
              Percentage of payment to refund on valid cancellation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lateReturnFee">Late Return Fee (per hour)</Label>
            <Input
              id="lateReturnFee"
              type="number"
              min="0"
              value={settings.late_return_fee_per_hour}
              onChange={(e) => setSettings({ ...settings, late_return_fee_per_hour: parseInt(e.target.value) || 0 })}
            />
            <p className="text-sm text-muted-foreground">
              Additional fee charged per hour for late vehicle returns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Settings</CardTitle>
          <CardDescription>Configure payment processing options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gcash">GCash Integration</Label>
              <p className="text-sm text-muted-foreground">Enable GCash as payment method</p>
            </div>
            <Switch
              id="gcash"
              checked={settings.gcash_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, gcash_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="creditCard">Credit Card Payments</Label>
              <p className="text-sm text-muted-foreground">Accept credit card payments</p>
            </div>
            <Switch
              id="creditCard"
              checked={settings.credit_card_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, credit_card_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bankTransfer">Bank Transfer</Label>
              <p className="text-sm text-muted-foreground">Allow bank transfer payments</p>
            </div>
            <Switch
              id="bankTransfer"
              checked={settings.bank_transfer_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, bank_transfer_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="apiKey">Payment Gateway API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.payment_api_key}
              onChange={(e) => setSettings({ ...settings, payment_api_key: e.target.value })}
              placeholder="••••••••••••"
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
          <CardDescription>Update legal terms and conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="termsOfService">Terms of Service</Label>
            <Textarea
              id="termsOfService"
              rows={6}
              value={settings.terms_of_service}
              onChange={(e) => setSettings({ ...settings, terms_of_service: e.target.value })}
              placeholder="By using JuanRide, you agree to comply with all rental policies..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyPolicy">Privacy Policy</Label>
            <Textarea
              id="privacyPolicy"
              rows={6}
              value={settings.privacy_policy}
              onChange={(e) => setSettings({ ...settings, privacy_policy: e.target.value })}
              placeholder="JuanRide respects your privacy and is committed to protecting your personal data..."
            />
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>System Features</CardTitle>
          <CardDescription>Enable or disable system features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gpsTracking">GPS Tracking</Label>
              <p className="text-sm text-muted-foreground">Enable real-time vehicle GPS tracking</p>
            </div>
            <Switch
              id="gpsTracking"
              checked={settings.gps_tracking_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, gps_tracking_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceAlerts">Maintenance Alerts</Label>
              <p className="text-sm text-muted-foreground">Automatic notifications for vehicle maintenance</p>
            </div>
            <Switch
              id="maintenanceAlerts"
              checked={settings.maintenance_alerts_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenance_alerts_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send email alerts to users</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.email_notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, email_notifications_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Send SMS alerts to users</p>
            </div>
            <Switch
              id="smsNotifications"
              checked={settings.sms_notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, sms_notifications_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          size="lg"
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

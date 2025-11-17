'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone } from 'lucide-react'
import Image from 'next/image'

export type PaymentMethodType = 'gcash' | 'paymaya' | 'grab_pay' | 'billease' | 'qrph' | 'card'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null
  onSelectMethod: (method: PaymentMethodType) => void
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onSelectMethod 
}: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'qrph' as PaymentMethodType,
      name: 'QR PH',
      description: 'Scan QR code with any banking app',
      icon: (
        <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-2h2v2h-2v-2zm0 4h2v2h-2v-2zm2-2h2v2h-2v-2z"/>
        </svg>
      ),
      popular: true,
    },
    {
      id: 'gcash' as PaymentMethodType,
      name: 'GCash',
      description: 'Pay securely with GCash e-wallet',
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      popular: true,
    },
    {
      id: 'paymaya' as PaymentMethodType,
      name: 'Maya (PayMaya)',
      description: 'Pay with your Maya account',
      icon: <Smartphone className="h-6 w-6 text-green-600" />,
      popular: true,
    },
    {
      id: 'grab_pay' as PaymentMethodType,
      name: 'GrabPay',
      description: 'Pay with GrabPay wallet',
      icon: <Smartphone className="h-6 w-6 text-green-700" />,
      popular: false,
    },
    {
      id: 'billease' as PaymentMethodType,
      name: 'BillEase',
      description: 'Buy now, pay later with BillEase',
      icon: <Smartphone className="h-6 w-6 text-purple-600" />,
      popular: false,
    },
    // Temporarily hidden - Card payment
    // {
    //   id: 'card' as PaymentMethodType,
    //   name: 'Credit/Debit Card',
    //   description: 'Visa, Mastercard, JCB, AMEX',
    //   icon: <CreditCard className="h-6 w-6 text-purple-600" />,
    //   popular: false,
    // },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you&apos;d like to pay for your rental
        </p>
      </div>

      <RadioGroup
        value={selectedMethod || ''}
        onValueChange={(value) => onSelectMethod(value as PaymentMethodType)}
      >
        <div className="grid gap-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-primary ring-2 ring-primary ring-opacity-50'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelectMethod(method.id)}
            >
              <CardContent className="flex items-center p-4">
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="mr-4"
                />
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-shrink-0">{method.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={method.id}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {method.name}
                      </Label>
                      {method.popular && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg
            className="h-5 w-5 text-blue-600 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Secure Payment</p>
            <p>
              All payments are processed securely through PayMongo. Your payment
              information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Navigation from '@/components/shared/Navigation'
import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-20 container mx-auto px-4 py-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need help? Browse our frequently asked questions or reach out to our support team.
          </p>
        </div>

        {/* FAQ Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full rounded-lg border bg-white">
            <AccordionItem value="q1">
              <AccordionTrigger>How do I book a vehicle?</AccordionTrigger>
              <AccordionContent>
                Browse available vehicles, choose your dates, and click the &quot;Book Now&quot; button. You’ll receive a confirmation once the owner approves.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
              <AccordionContent>
                We accept all major credit/debit cards and GCash. Payments are processed securely via our payment partner.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Can I cancel my booking?</AccordionTrigger>
              <AccordionContent>
                Yes. Go to <span className="font-medium">Dashboard → My Rentals</span>, open the booking, and click &quot;Cancel Booking&quot;. Cancellation fees may apply depending on the owner’s policy.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>How do I leave a review?</AccordionTrigger>
              <AccordionContent>
                After completing your trip, go to <span className="font-medium">Dashboard → My Rentals</span> and click &quot;Write Review&quot; next to the completed booking.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>What if I encounter issues during my trip?</AccordionTrigger>
              <AccordionContent>
                Contact the vehicle owner through the in-app messaging. If the issue remains unresolved, reach out to our support team using the form below.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Contact Support Card */}
        <section>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">Still need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our support team is available 9 AM–6 PM (GMT+8), Monday to Saturday. We typically respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/messages?support=true" className="w-full sm:w-auto" passHref>
                  <Button className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    In-App Message
                  </Button>
                </Link>
                <a href="mailto:support@juanride.com" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full gap-2">
                    Email Us
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                By contacting us you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and
                <Link href="/privacy" className="underline ml-1">Privacy Policy</Link>.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

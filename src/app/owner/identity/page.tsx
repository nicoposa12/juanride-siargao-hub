"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navigation from "@/components/shared/Navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getAllIdentityDocumentsForOwner,
  reviewIdentityDocument,
} from "@/lib/supabase/queries/bookings"
import type { Database } from "@/types/database.types"
import { getIdDocumentSignedUrl } from "@/lib/supabase/storage"
import { ID_DOCUMENT_TYPE_LABELS, ID_DOCUMENT_STATUS_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils/format"
import { Eye, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

type IdDocumentStatus = Database['public']['Tables']['id_documents']['Row']['status']

const STATUS_TABS: { value: IdDocumentStatus; label: string }[] = [
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
]

interface IdentityDocumentForReview {
  id_document: Database['public']['Tables']['id_documents']['Row']
  renter: {
    id: string
    full_name: string | null
    email: string | null
    phone_number: string | null
    profile_image_url: string | null
  } | null
}

export default function OwnerIdentityPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [docs, setDocs] = useState<IdentityDocumentForReview[]>([])
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]["value"]>("pending_review")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<IdentityDocumentForReview | null>(null)
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || profile?.role !== "owner") {
      router.push(
        "/unauthorized?reason=" +
          encodeURIComponent("Owner access required") +
          "&path=/owner/identity"
      )
      return
    }
    loadDocuments(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, profile])

  useEffect(() => {
    if (!user || profile?.role !== "owner") return
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadDocuments = async (initial = false) => {
    if (!user) return
    if (!initial) setLoading(true)

    try {
      const data = await getAllIdentityDocumentsForOwner([filter])
      setDocs(data)
    } catch (error) {
      console.error("Error loading identity documents", error)
      toast({
        title: "Unable to load identity documents",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (doc: IdentityDocumentForReview, action: "approve" | "reject") => {
    setSelectedDoc(doc)
    setDecision(action)
    setNotes(doc.id_document.owner_notes || "")
    setRejectionReason(doc.id_document.rejection_reason || "")
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedDoc(null)
    setDecision(null)
    setNotes("")
    setRejectionReason("")
    setProcessing(false)
  }

  const handleDecision = async () => {
    if (!selectedDoc || !decision || !user) return
    setProcessing(true)

    try {
      const result = await reviewIdentityDocument(
        selectedDoc.id_document.id,
        decision === "approve" ? "approved" : "rejected",
        user.id,
        {
          rejectionReason: decision === "reject" ? rejectionReason || "Rejected by vehicle owner" : undefined,
          ownerNotes: notes || undefined,
        }
      )

      if (!result.success) {
        throw result.error ?? new Error("Review failed")
      }

      toast({
        title: decision === "approve" ? "ID approved" : "ID rejected",
        description:
          decision === "approve"
            ? "The renter will be notified that their ID has been approved."
            : "The renter will be notified of the rejection.",
      })

      closeDialog()
      loadDocuments()
    } catch (error: any) {
      console.error("Review action failed", error)
      toast({
        title: "Unable to complete review",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleViewDocument = async (doc: IdentityDocumentForReview) => {
    try {
      const signedUrl = await getIdDocumentSignedUrl(doc.id_document.file_path)
      if (!signedUrl) throw new Error("No download URL available")
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error: any) {
      console.error("Unable to open ID document", error)
      toast({
        title: "Unable to open document",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const displayedDocs = useMemo(() => docs, [docs])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Identity Verifications</h1>
          <p className="text-muted-foreground mt-2">
            Review renter IDs required for car and motorcycle bookings before confirming reservations.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(val) => setFilter(val as typeof filter)} className="space-y-6">
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.value === "pending_review" && displayedDocs.length > 0 && filter === "pending_review" && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1 text-xs text-primary">
                    {displayedDocs.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, idx) => (
                  <Card key={idx} className="p-6">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-24 w-full" />
                  </Card>
                ))}
              </div>
            ) : displayedDocs.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents in this state</h3>
                <p className="text-muted-foreground">
                  {filter === "pending_review"
                    ? "You have no IDs waiting for review. Bookings will appear here once renters upload their documents."
                    : "No documents match this status. Try another tab."}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {displayedDocs.map((doc) => (
                  <Card key={doc.id_document.id} className="border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">
                            {ID_DOCUMENT_TYPE_LABELS[doc.id_document.document_type] || doc.id_document.document_type}
                          </CardTitle>
                          <CardDescription>
                            Submitted {formatDate(doc.id_document.submitted_at)} by {doc.renter?.full_name || "Renter"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            doc.id_document.status === "approved"
                              ? "default"
                              : doc.id_document.status === "pending_review"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {ID_DOCUMENT_STATUS_LABELS[doc.id_document.status] || doc.id_document.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                          <Image
                            src={doc.renter?.profile_image_url || "/placeholder.svg"}
                            alt={doc.renter?.full_name || "Renter avatar"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{doc.renter?.full_name || "Unknown renter"}</p>
                          <p className="text-sm text-muted-foreground">{doc.renter?.email || "No email"}</p>
                          <p className="text-xs text-muted-foreground">{doc.renter?.phone_number || "No phone"}</p>
                        </div>
                      </div>

                      {doc.id_document.rejection_reason && (
                        <Alert variant="destructive" className="text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Previously rejected: {doc.id_document.rejection_reason}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" /> View Document
                        </Button>
                        {doc.id_document.status === "pending_review" && (
                          <>
                            <Button size="sm" onClick={() => openDialog(doc, "approve")}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => openDialog(doc, "reject")}>
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{decision === "approve" ? "Approve ID Document" : "Reject ID Document"}</DialogTitle>
            <DialogDescription>
              {decision === "approve"
                ? "Approving this document will allow the renter to proceed with the booking."
                : "Please provide a reason so the renter knows what to fix."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            {selectedDoc && (
              <div className="space-y-4">
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Renter</p>
                  <p className="font-semibold">{selectedDoc.renter?.full_name || "Unknown renter"}</p>
                  <p className="text-sm">{selectedDoc.renter?.email || "No email"}</p>
                  <p className="text-sm">{selectedDoc.renter?.phone_number || "No phone"}</p>
                </div>

                <div className="rounded border p-3 space-y-2">
                  <p className="text-sm text-muted-foreground">Notes for Owner (optional)</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes (visible to you and admins only)."
                  />
                </div>

                {decision === "reject" && (
                  <div className="rounded border p-3 space-y-2">
                    <p className="text-sm text-muted-foreground">Rejection Reason *</p>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain what information is missing or incorrect."
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant={decision === "reject" ? "destructive" : "default"}
              onClick={handleDecision}
              disabled={processing || (decision === "reject" && !rejectionReason.trim())}
            >
              {processing ? "Processing..." : decision === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

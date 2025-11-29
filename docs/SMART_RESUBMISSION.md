# Smart Document Resubmission - Only Rejected Documents

## Overview
Enhanced the resubmission page to intelligently show **only the rejected documents** that need to be resubmitted, rather than requiring users to upload all documents again.

## Implementation Date
November 28, 2025

## Problem Solved

### Before
- ❌ Users had to resubmit ALL documents (Business Permit, DTI/SEC, BIR)
- ❌ Even if only 1 document was rejected, all 3 were required
- ❌ Wastes user time uploading approved documents again
- ❌ Admin has to review approved documents again

### After
- ✅ Only rejected documents are shown
- ✅ Each rejected document shows its specific rejection reason
- ✅ Users save time - only upload what's needed
- ✅ Admin only reviews new submissions

---

## How It Works

### 1. Fetching Rejected Documents

When user lands on `/resubmit` page:

```typescript
// Fetch only rejected documents from database
if (profile.role === 'owner') {
  const { data: rejectedBizDocs } = await supabase
    .from('business_documents')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'rejected')  // Only rejected docs
    .order('submitted_at', { ascending: false })
  
  setRejectedDocuments(rejectedBizDocs)
}
```

### 2. Dynamic Form Rendering

**Owner with Multiple Rejections:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Only resubmit rejected documents:   │
│ • Business Permit: Image unclear       │
│ • BIR Certificate: Document expired    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Business Permit *                       │
│ Rejection Reason: Image unclear         │
│ [Choose File] ✅                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ BIR Certificate of Registration *      │
│ Rejection Reason: Document expired     │
│ [Choose File] ✅                        │
└─────────────────────────────────────────┘
```

**Owner with Single Rejection:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Only resubmit rejected documents:   │
│ • DTI Registration: Missing signature  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ DTI Registration *                      │
│ Rejection Reason: Missing signature    │
│ [Choose File] ✅                        │
└─────────────────────────────────────────┘
```

### 3. Validation

Only checks for files that correspond to rejected documents:

```typescript
// Validate that all rejected documents have files
const missingDocs = rejectedDocuments.filter(doc => !documentFiles[doc.document_type])
if (missingDocs.length > 0) {
  toast({
    title: 'Missing Documents',
    description: `Please upload: ${missingDocs.map(d => getDocumentLabel(d.document_type)).join(', ')}`
  })
  return
}
```

### 4. Partial Upload

Only uploads the rejected documents:

```typescript
// Upload only the rejected documents
const uploadPromises = rejectedDocuments.map(doc => {
  const file = documentFiles[doc.document_type]
  if (file) {
    return uploadBusinessDocument(userId, file, doc.document_type)
  }
})

await Promise.all(uploadPromises)
```

---

## Features

### Yellow Alert Box
Shows summary of all rejected documents with their reasons:
- Document name in bold
- Specific rejection reason
- Yellow background for warning

### Individual Document Cards
Each rejected document gets its own card with:
- Red/pink background to highlight rejection
- Document label as heading
- Rejection reason displayed prominently
- File upload input
- Green checkmark when file selected

### Renter Support
Renters also see their specific document rejection:
```
┌─────────────────────────────────────────┐
│ ⚠️ Rejected Document:                   │
│ Driver's License                        │
│ Reason: Photo is blurry                 │
└─────────────────────────────────────────┘
```

---

## UI Components

### 1. Summary Alert (Owners)
```tsx
<Alert className="bg-yellow-50 border-yellow-200">
  <AlertCircle className="h-4 w-4 text-yellow-600" />
  <AlertDescription className="text-yellow-800">
    <strong>Only resubmit rejected documents:</strong>
    <ul className="mt-2 space-y-1 text-sm">
      {rejectedDocuments.map(doc => (
        <li key={doc.id}>
          • <strong>{getDocumentLabel(doc.document_type)}</strong>: {doc.rejection_reason}
        </li>
      ))}
    </ul>
  </AlertDescription>
</Alert>
```

### 2. Document Upload Card
```tsx
<div key={doc.id} className="space-y-2 p-4 border rounded-lg bg-red-50">
  <Label htmlFor={doc.document_type} className="text-base font-semibold">
    {getDocumentLabel(doc.document_type)} *
  </Label>
  <p className="text-xs text-red-600 mb-2">
    <strong>Rejection Reason:</strong> {doc.rejection_reason}
  </p>
  <div className="flex items-center gap-4">
    <Input
      id={doc.document_type}
      type="file"
      accept="image/*,.pdf"
      onChange={(e) => handleFileChange(doc.document_type, e.target.files?.[0] || null)}
    />
    {documentFiles[doc.document_type] && (
      <FileText className="h-5 w-5 text-green-600" />
    )}
  </div>
</div>
```

---

## Example Scenarios

### Scenario 1: Only BIR Rejected
**Admin rejects**: BIR Certificate (reason: "Document expired")

**User sees**:
- ⚠️ Alert: Only resubmit rejected documents: BIR Certificate
- 1 upload field for BIR Certificate with rejection reason
- No fields for Business Permit or DTI/SEC (already approved)

**User uploads**: New BIR Certificate only

### Scenario 2: Multiple Rejections
**Admin rejects**: 
- Business Permit (reason: "Image unclear")
- DTI Registration (reason: "Missing signature")

**User sees**:
- ⚠️ Alert: List of 2 rejected documents
- 2 upload fields with individual rejection reasons
- No field for BIR Certificate (already approved)

**User uploads**: New Business Permit and DTI Registration

### Scenario 3: Renter Rejection
**Admin rejects**: Driver's License (reason: "Photo is blurry")

**User sees**:
- ⚠️ Alert: Rejected Document + reason
- Document type dropdown pre-filled with "Driver's License"
- 1 upload field

**User uploads**: New Driver's License photo

---

## Code Changes

### State Management
```typescript
// Before: Individual file states
const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null)
const [dtiSecFile, setDtiSecFile] = useState<File | null>(null)
const [birFile, setBirFile] = useState<File | null>(null)

// After: Dynamic state based on rejected docs
const [rejectedDocuments, setRejectedDocuments] = useState<Array<{
  id: string
  document_type: string
  rejection_reason: string
}>>([])
const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({})
```

### Helper Functions
```typescript
// Get human-readable document labels
const getDocumentLabel = (docType: string) => {
  const labels: Record<string, string> = {
    business_permit: 'Business Permit',
    dti_registration: 'DTI Registration',
    sec_registration: 'SEC Registration',
    bir_registration: 'BIR Certificate of Registration',
    // ... more labels
  }
  return labels[docType] || docType
}

// Handle file changes dynamically
const handleFileChange = (docType: string, file: File | null) => {
  setDocumentFiles(prev => ({ ...prev, [docType]: file }))
}
```

---

## Benefits

### For Users
✅ **Faster resubmission** - Only upload what's needed  
✅ **Clear guidance** - See exactly what was rejected and why  
✅ **Less confusion** - No wondering which docs need fixing  
✅ **Time saved** - Don't re-upload approved documents  

### For Admins
✅ **Fewer reviews** - Only see new submissions  
✅ **Better tracking** - Know exactly what changed  
✅ **Less storage** - No duplicate approved documents  
✅ **Clearer history** - Track rejection/resubmission cycles  

### For System
✅ **Reduced bandwidth** - Fewer file uploads  
✅ **Less storage** - No duplicate files  
✅ **Better performance** - Faster uploads  
✅ **Cleaner database** - Only necessary records  

---

## Database Impact

### Before Resubmission
```sql
-- Owner has 3 documents
business_documents:
  id: 1, owner_id: abc, type: business_permit, status: approved
  id: 2, owner_id: abc, type: dti_registration, status: rejected
  id: 3, owner_id: abc, type: bir_registration, status: approved
```

### After Smart Resubmission
```sql
-- Only rejected document gets new record
business_documents:
  id: 1, owner_id: abc, type: business_permit, status: approved  -- unchanged
  id: 2, owner_id: abc, type: dti_registration, status: rejected -- old
  id: 3, owner_id: abc, type: bir_registration, status: approved  -- unchanged
  id: 4, owner_id: abc, type: dti_registration, status: pending_review  -- NEW
```

---

## Edge Cases Handled

### No Rejected Documents
If user somehow accesses page with no rejected docs:
```
┌─────────────────────────────────────────┐
│ ℹ️ No rejected documents found.        │
│ Your account may be under review.      │
└─────────────────────────────────────────┘
```

### Missing Rejection Reason
If admin forgot to provide reason:
```
Rejection Reason: No reason provided
```

### Renter with Multiple Rejected IDs
Shows most recent rejected document and allows type change

---

## Testing Checklist

- [ ] Owner with 1 rejected document sees only that document
- [ ] Owner with 2 rejected documents sees both with reasons
- [ ] Owner with all 3 rejected documents sees all 3
- [ ] Renter sees their rejected ID document
- [ ] Rejection reasons display correctly
- [ ] File upload works for each rejected document
- [ ] Validation prevents submission without all required files
- [ ] Only rejected documents are uploaded to storage
- [ ] Database updates correctly
- [ ] Admin sees new documents in verification page
- [ ] Yellow alert shows correct document list
- [ ] Red cards highlight rejection severity

---

## Future Enhancements

1. **Document History**: Show previous submissions with timestamps
2. **Side-by-side Comparison**: Let admin compare old vs new document
3. **Partial Approval**: Allow approving some docs while rejecting others
4. **Rejection Templates**: Pre-written rejection reasons for common issues
5. **Upload Progress**: Show percentage for large files
6. **Document Preview**: Show thumbnail before submission
7. **Drag & Drop**: Allow dragging files instead of clicking

---

## Related Files

- `/src/app/(auth)/resubmit/page.tsx` - Main resubmission page
- `/src/app/admin/verifications/page.tsx` - Admin verification page
- `/docs/ACCOUNT_RESUBMISSION_FLOW.md` - Overall resubmission flow
- `/docs/DOCUMENT_REJECTION_NOTIFICATION.md` - Email notifications

---

## Summary

This smart resubmission feature significantly improves the user experience by:
- **Saving time** - Only upload rejected documents
- **Reducing confusion** - Clear guidance on what's needed
- **Improving efficiency** - Less data transfer and storage
- **Better UX** - Specific rejection reasons per document

Users can now fix only what's broken instead of redoing everything! 🎯

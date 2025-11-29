# Pending Resubmission Status - Admin Tracking

## Overview
Implemented a dedicated "Pending Resubmission" status to help admins easily identify and prioritize documents that users have resubmitted after rejection. This creates a clear distinction between new submissions and resubmitted documents.

## Implementation Date
November 28, 2025

## Problem Solved

### Before
- ❌ Resubmitted documents showed as "Pending Review" (same as new submissions)
- ❌ Admins couldn't differentiate between new users and resubmissions
- ❌ No way to prioritize resubmissions over new submissions
- ❌ Hard to track rejection → resubmission cycles

### After
- ✅ Resubmitted documents have dedicated "Pending Resubmission" status
- ✅ Distinct orange-colored badge and stats card
- ✅ Separate filter to view only resubmitted documents
- ✅ Easy to prioritize and track resubmission cycles

---

## Visual Design

### Status Badge
**Pending Resubmission Badge:**
- **Icon**: 🔄 RefreshCw (circular arrows)
- **Color**: Orange (#f97316)
- **Background**: Light orange (#fff7ed)
- **Border**: Orange border
- **Text**: "Pending Resubmission"

**Comparison with Other Badges:**
```
Pending Review:      ⏰ Gray badge
Pending Resubmission: 🔄 Orange badge  ← NEW
Approved:            ✅ Green badge
Rejected:            ❌ Red badge
```

### Stats Card
**Design:**
```
┌────────────────────────────────────┐
│ Pending Resubmission          🔄   │
│                                    │
│ 3                                  │
└────────────────────────────────────┘
```
- Orange border (`border-orange-200`)
- Light orange background (`bg-orange-50/50`)
- Orange text (`text-orange-700`)
- Positioned between "Pending Review" and "Approved"

### Filter Dropdown
**Order:**
1. All Statuses
2. Pending Review
3. **Pending Resubmission** ← NEW
4. Approved
5. Rejected

---

## How It Works

### 1. User Resubmits Documents

When a user with rejected account resubmits documents via `/resubmit` page:

```typescript
// Resubmit page sets status to 'pending_resubmission'
await supabase
  .from('business_documents')
  .insert({
    owner_id: userId,
    document_type: documentType,
    file_url: publicUrl,
    file_path: fileName,
    status: 'pending_resubmission',  // ← Special status for resubmissions
    submitted_at: new Date().toISOString(),
  })
```

### 2. Admin Sees Resubmission

In Admin Verifications page:
- **Stats Card** shows count of documents with `pending_resubmission` status
- **Filter** allows viewing only resubmitted documents
- **Badge** displays orange "Pending Resubmission" label
- **Documents** are clearly marked as resubmissions

### 3. Admin Reviews and Takes Action

Admin can:
- **Approve**: Status changes to `approved`
- **Reject**: Status changes to `rejected` (user can resubmit again)

---

## Database Schema

### Document Status Values

```sql
-- Possible status values:
'pending_review'        -- New submission (first time)
'pending_resubmission'  -- Resubmitted after rejection (NEW)
'approved'              -- Admin approved
'rejected'              -- Admin rejected
```

### Tracking Resubmissions

```sql
-- Example: Owner resubmits BIR certificate
business_documents:
  id: 1, type: bir_registration, status: rejected, submitted_at: 2025-11-20
  id: 2, type: bir_registration, status: pending_resubmission, submitted_at: 2025-11-28 ← NEW
```

---

## Admin UI Implementation

### Stats Cards Layout

**Renter ID Documents:**
```
┌──────────────┬──────────────────────┬──────────────┬──────────────┐
│ Pending      │ Pending             │ Approved     │ Rejected     │
│ Review       │ Resubmission 🔄     │              │              │
│              │ (Orange)            │              │              │
│ 4            │ 2                   │ 15           │ 1            │
└──────────────┴──────────────────────┴──────────────┴──────────────┘
```

**Owner Business Documents:**
```
┌──────────────┬──────────────────────┬──────────────┬──────────────┐
│ Pending      │ Pending             │ Approved     │ Rejected     │
│ Review       │ Resubmission 🔄     │              │              │
│              │ (Orange)            │              │              │
│ 3            │ 1                   │ 20           │ 2            │
└──────────────┴──────────────────────┴──────────────┴──────────────┘
```

### Filter Dropdown UI

**Before:**
```
┌──────────────────────┐
│ Filter by status  ▼  │
├──────────────────────┤
│ All Statuses         │
│ Pending Review       │
│ Approved             │
│ Rejected             │
└──────────────────────┘
```

**After:**
```
┌──────────────────────────┐
│ Filter by status      ▼  │
├──────────────────────────┤
│ All Statuses             │
│ Pending Review           │
│ Pending Resubmission 🔄  │ ← NEW
│ Approved                 │
│ Rejected                 │
└──────────────────────────┘
```

### Document Table View

**When "Pending Resubmission" filter is selected:**
```
┌────────────────┬──────────────────┬────────────────────────┬─────────────────┬─────────┐
│ Owner          │ Business Name    │ Documents Status       │ Submitted       │ Actions │
├────────────────┼──────────────────┼────────────────────────┼─────────────────┼─────────┤
│ John Doe       │ ABC Corp         │ 🔄 Pending             │ Nov 28, 2025    │ View All│
│ john@email.com │                  │    Resubmission        │                 │         │
│                │                  │ (Orange Badge)         │                 │         │
├────────────────┼──────────────────┼────────────────────────┼─────────────────┼─────────┤
│ Jane Smith     │ XYZ Inc          │ 🔄 Pending             │ Nov 28, 2025    │ View All│
│ jane@email.com │                  │    Resubmission        │                 │         │
└────────────────┴──────────────────┴────────────────────────┴─────────────────┴─────────┘
```

---

## Code Changes

### 1. Resubmit Page (`/src/app/(auth)/resubmit/page.tsx`)

**Changed:** Document upload functions

```typescript
// For Renters
const uploadIdDocument = async (userId: string, file: File, documentType: string) => {
  // ... upload logic ...
  
  const { error: insertError } = await supabase
    .from('id_documents')
    .insert({
      renter_id: userId,
      document_type: documentType,
      file_url: publicUrl,
      file_path: fileName,
      status: 'pending_resubmission',  // Changed from 'pending_review'
      submitted_at: new Date().toISOString(),
    })
}

// For Owners
const uploadBusinessDocument = async (userId: string, file: File, documentType: string) => {
  // ... upload logic ...
  
  const { error: insertError } = await supabase
    .from('business_documents')
    .insert({
      owner_id: userId,
      document_type: documentType,
      file_url: publicUrl,
      file_path: fileName,
      status: 'pending_resubmission',  // Changed from 'pending_review'
      submitted_at: new Date().toISOString(),
    })
}
```

### 2. Admin Verifications Page (`/src/app/admin/verifications/page.tsx`)

**Added:** RefreshCw icon import
```typescript
import {
  // ... existing imports
  RefreshCw,  // ← NEW
} from 'lucide-react'
```

**Updated:** Status badge function
```typescript
const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    pending_review: { variant: 'secondary', icon: Clock, label: 'Pending Review' },
    pending_resubmission: { variant: 'outline', icon: RefreshCw, label: 'Pending Resubmission' },  // ← NEW
    approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
    rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
  }
  
  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 w-fit ${
        status === 'pending_resubmission' ? 'border-orange-500 text-orange-700 bg-orange-50' : ''
      }`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
```

**Added:** Pending Resubmission stats card (Renters)
```typescript
<Card className="border-orange-200 bg-orange-50/50">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-orange-700">Pending Resubmission</CardTitle>
    <RefreshCw className="h-4 w-4 text-orange-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-700">
      {documents.filter((d) => d.status === 'pending_resubmission').length}
    </div>
  </CardContent>
</Card>
```

**Added:** Pending Resubmission stats card (Owners)
```typescript
<Card className="border-orange-200 bg-orange-50/50">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-orange-700">Pending Resubmission</CardTitle>
    <RefreshCw className="h-4 w-4 text-orange-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-700">
      {businessDocuments.filter((d) => d.status === 'pending_resubmission').length}
    </div>
  </CardContent>
</Card>
```

**Added:** Filter option for both tabs
```typescript
<SelectContent>
  <SelectItem value="all">All Statuses</SelectItem>
  <SelectItem value="pending_review">Pending Review</SelectItem>
  <SelectItem value="pending_resubmission">Pending Resubmission</SelectItem>  {/* ← NEW */}
  <SelectItem value="approved">Approved</SelectItem>
  <SelectItem value="rejected">Rejected</SelectItem>
</SelectContent>
```

---

## Use Cases

### Use Case 1: Admin Prioritizes Resubmissions

**Scenario:** Admin wants to review resubmitted documents first

**Steps:**
1. Navigate to Admin Verifications
2. Click on "Pending Resubmission" stats card (shows count: 3)
3. Select "Pending Resubmission" from filter dropdown
4. Review only resubmitted documents
5. Approve or reject as needed

**Result:** Admin can focus on users who are waiting for re-review

### Use Case 2: Track Rejection Cycles

**Scenario:** Monitor how many times a document has been rejected/resubmitted

**Steps:**
1. View document with "Pending Resubmission" badge
2. Check submission date (most recent)
3. Look at previous rejected documents from same owner
4. Track improvement in document quality

**Result:** Better understanding of user compliance and document quality trends

### Use Case 3: Filter for Quick Review

**Scenario:** Admin has limited time, wants to review resubmissions only

**Steps:**
1. Go to Owner Business Docs tab
2. Click filter dropdown
3. Select "Pending Resubmission"
4. Only resubmitted documents shown

**Result:** Focused review session on resubmissions

---

## Benefits

### For Admins
✅ **Clear Visibility** - Instantly see resubmitted vs new documents  
✅ **Better Prioritization** - Focus on users waiting for re-review  
✅ **Tracking** - Monitor rejection/resubmission cycles  
✅ **Efficiency** - Dedicated filter for resubmissions  
✅ **Context** - Know document history at a glance  

### For Users
✅ **Faster Re-reviews** - Admins can prioritize resubmissions  
✅ **Better Experience** - Less wait time after fixing documents  
✅ **Clear Status** - Users know their resubmission is tracked differently  

### For System
✅ **Better Analytics** - Track resubmission rates  
✅ **Quality Metrics** - Monitor improvement after rejection  
✅ **Workflow Optimization** - Identify bottlenecks in approval process  

---

## Statistics & Metrics

### Trackable Metrics

1. **Resubmission Rate**: `rejected_docs / total_resubmissions`
2. **Average Resubmission Time**: Time between rejection and resubmission
3. **Approval Rate After Resubmission**: `approved_after_resubmit / total_resubmissions`
4. **Multiple Rejection Rate**: Documents rejected more than once

### Sample Queries

```sql
-- Count pending resubmissions
SELECT COUNT(*) FROM business_documents 
WHERE status = 'pending_resubmission';

-- Get average time to resubmit
SELECT AVG(EXTRACT(EPOCH FROM (new.submitted_at - old.submitted_at)) / 86400) as avg_days
FROM business_documents old
JOIN business_documents new ON old.owner_id = new.owner_id 
  AND old.document_type = new.document_type
WHERE old.status = 'rejected' 
  AND new.status = 'pending_resubmission';

-- Track rejection cycles by owner
SELECT owner_id, document_type, COUNT(*) as rejection_count
FROM business_documents
WHERE status IN ('rejected', 'pending_resubmission')
GROUP BY owner_id, document_type
HAVING COUNT(*) > 1;
```

---

## Testing Checklist

- [ ] Resubmitted documents show "Pending Resubmission" badge
- [ ] Orange stats card displays correct count
- [ ] Filter dropdown includes "Pending Resubmission" option
- [ ] Filtering by "Pending Resubmission" shows only resubmitted docs
- [ ] Badge uses RefreshCw icon with orange styling
- [ ] Stats card has orange border and background
- [ ] Layout adjusts to 4 columns for stats cards
- [ ] Works for both Renter IDs and Owner Business Docs
- [ ] Status persists after page refresh
- [ ] Admin can approve/reject resubmitted documents
- [ ] After approval, status changes to "approved"
- [ ] After rejection, user can resubmit again

---

## Future Enhancements

1. **Resubmission Counter**: Show how many times a document was resubmitted
2. **Auto-Priority**: Automatically sort resubmissions to top of list
3. **Comparison View**: Show old rejected doc vs new resubmission side-by-side
4. **Notification Badge**: Red dot on "Pending Resubmission" card when new resubmissions arrive
5. **Time Tracking**: Show "Resubmitted 2 days ago" timestamp
6. **Bulk Actions**: Approve/reject multiple resubmissions at once
7. **Analytics Dashboard**: Charts showing resubmission trends over time

---

## Related Documentation

- [Account Resubmission Flow](./ACCOUNT_RESUBMISSION_FLOW.md) - Overall resubmission process
- [Smart Resubmission](./SMART_RESUBMISSION.md) - Partial document resubmission
- [Document Rejection Notification](./DOCUMENT_REJECTION_NOTIFICATION.md) - Email notifications

---

## Summary

The "Pending Resubmission" status provides admins with a powerful tool to:
- **Distinguish** resubmissions from new submissions
- **Prioritize** users waiting for re-review
- **Track** document improvement cycles
- **Improve** overall approval workflow efficiency

This feature creates a more transparent and efficient document verification process for both admins and users! 🎯

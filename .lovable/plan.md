

## Auto-update `last_contact_date` when suggesting a property

### Problem
When you suggest/send a property link to a buyer, the buyer's `last_contact_date` doesn't update. This means the "freshness" badge on cards (amber after 14 days, red after 30) stays stale even though you just interacted with that client.

### Solution
Update `last_contact_date` on the `clienti` record automatically whenever a property is toggled as "suggested" (i.e., sent to the buyer). This is a single-line addition.

### Changes

**1. `src/hooks/useProperties.ts` — `toggleSuggestedMutation`**

After the `client_property_matches` update succeeds (line ~162), also update the parent `clienti` row:

```ts
// After updating the match row, update client's last_contact_date
if (suggested) {
  await supabase
    .from('clienti')
    .update({ last_contact_date: new Date().toISOString() })
    .eq('id', clienteId);
}
```

This reuses the exact same pattern already in `useClienteActivities.ts` (line 85-88) for call/email/visit activities.

### What this achieves
- The freshness badge on the Kanban card resets when you suggest a property
- The "Data Contatto" column in the spreadsheet view updates automatically
- The `ClienteReminder` widget in the detail panel reflects the latest interaction
- No database migration needed — the `last_contact_date` column already exists


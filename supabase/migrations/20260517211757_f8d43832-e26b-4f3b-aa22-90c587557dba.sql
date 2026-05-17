
-- 1. Notifications: restrict inserts to same-sede recipients or self
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for same sede"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_same_sede(auth.uid(), user_id)
);

-- 2. Attachments table: validate entity ownership on insert
DROP POLICY IF EXISTS "Coordinators can insert attachments" ON public.attachments;

CREATE POLICY "Users can insert attachments for authorized entities"
ON public.attachments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by
  AND (
    (entity_type = 'cliente' AND EXISTS (
      SELECT 1 FROM public.clienti c
      WHERE c.id = entity_id
        AND (
          c.assigned_to = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
              AND p.role = ANY (ARRAY['coordinatore','admin'])
              AND (p.sede = c.sede OR c.sede = ANY (COALESCE(p.sedi, '{}'::text[])))
          )
        )
    ))
    OR (entity_type = 'notizia' AND EXISTS (
      SELECT 1 FROM public.notizie n
      WHERE n.id = entity_id
        AND (
          n.user_id = auth.uid()
          OR public.is_coordinator_or_admin(auth.uid())
        )
    ))
  )
);

-- 3. Storage: restrict attachments bucket SELECT/DELETE via ownership
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;

CREATE POLICY "Authorized users can view attachment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.attachments a
    WHERE a.file_path = storage.objects.name
      AND (
        a.uploaded_by = auth.uid()
        OR public.is_coordinator_or_admin(auth.uid())
        OR (a.entity_type = 'cliente' AND EXISTS (
          SELECT 1 FROM public.clienti c
          WHERE c.id = a.entity_id AND c.assigned_to = auth.uid()
        ))
        OR (a.entity_type = 'notizia' AND EXISTS (
          SELECT 1 FROM public.notizie n
          WHERE n.id = a.entity_id AND n.user_id = auth.uid()
        ))
      )
  )
);

CREATE POLICY "Authorized users can delete attachment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.attachments a
    WHERE a.file_path = storage.objects.name
      AND (
        a.uploaded_by = auth.uid()
        OR public.is_coordinator_or_admin(auth.uid())
      )
  )
);

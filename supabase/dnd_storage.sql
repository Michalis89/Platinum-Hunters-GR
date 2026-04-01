-- DnD Module Storage bucket and policies
-- Prompt 03: campaign assets bucket

-- Create private bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('campaign-assets', 'campaign-assets', false)
on conflict (id) do nothing;

-- Storage policies on storage.objects for bucket campaign-assets
-- Path convention: campaign-assets/{campaignId}/{assetId}.{ext}

drop policy if exists "dm_upload" on storage.objects;
create policy "dm_upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'campaign-assets'
    and public.is_campaign_dm((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "members_read" on storage.objects;
create policy "members_read"
  on storage.objects
  for select
  using (
    bucket_id = 'campaign-assets'
    and (
      public.is_campaign_dm((storage.foldername(name))[1]::uuid)
      or (
        public.is_campaign_member((storage.foldername(name))[1]::uuid)
        and exists (
          select 1
          from public.campaign_assets a
          where a.campaign_id = (storage.foldername(name))[1]::uuid
            and a.path = name
            and a.published = true
        )
      )
    )
  );

drop policy if exists "dm_delete" on storage.objects;
create policy "dm_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'campaign-assets'
    and public.is_campaign_dm((storage.foldername(name))[1]::uuid)
  );

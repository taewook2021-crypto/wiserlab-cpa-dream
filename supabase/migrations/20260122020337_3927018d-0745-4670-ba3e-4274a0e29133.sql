-- Add cutoff columns to statistics_settings table
ALTER TABLE public.statistics_settings
ADD COLUMN safe_cutoff INTEGER NOT NULL DEFAULT 23,
ADD COLUMN competitive_cutoff INTEGER NOT NULL DEFAULT 14;
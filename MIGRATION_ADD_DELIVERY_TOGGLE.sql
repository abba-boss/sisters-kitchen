-- Migration: Add Delivery Toggle to Vendors
-- Date: 2026-10-16
-- Purpose: Allow vendors to enable/disable delivery service

-- Add offersDelivery column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS offersDelivery BOOLEAN DEFAULT true 
COMMENT 'Whether vendor offers delivery service (true) or pickup only (false)';

-- Update existing vendors to have delivery enabled by default
UPDATE vendors 
SET offersDelivery = true 
WHERE offersDelivery IS NULL;

-- Verify the change
SELECT id, businessName, offersDelivery 
FROM vendors 
LIMIT 5;

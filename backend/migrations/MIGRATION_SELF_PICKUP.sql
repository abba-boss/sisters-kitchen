-- Self-Pickup System Database Migration
-- Run this file to add the required fields for self-pickup functionality

USE sisters_kitchen;

-- Add pickup location fields to vendors table
ALTER TABLE vendors 
ADD COLUMN pickupLatitude DECIMAL(10,7) NULL,
ADD COLUMN pickupLongitude DECIMAL(10,7) NULL,
ADD COLUMN pickupInstructions TEXT NULL;

-- Add fulfillment type and pickup fields to orders table
ALTER TABLE orders
ADD COLUMN fulfillmentType ENUM('delivery', 'pickup') DEFAULT 'delivery' NOT NULL,
ADD COLUMN pickupToken VARCHAR(255) NULL UNIQUE,
ADD COLUMN pickupVerifiedAt TIMESTAMP NULL,
ADD COLUMN pickupVerifiedBy VARCHAR(255) NULL;

-- Confirm migration
SELECT 'Self-Pickup migration completed successfully!' as status;

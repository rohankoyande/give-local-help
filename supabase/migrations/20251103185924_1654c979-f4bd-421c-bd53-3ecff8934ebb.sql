-- Add URL validation for NGO websites
-- Only allow http:// and https:// URLs
CREATE OR REPLACE FUNCTION validate_ngo_website()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL values
  IF NEW.website IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if URL starts with http:// or https://
  IF NEW.website !~ '^https?://' THEN
    RAISE EXCEPTION 'Website URL must start with http:// or https://';
  END IF;
  
  -- Check URL length (reasonable limit)
  IF LENGTH(NEW.website) > 500 THEN
    RAISE EXCEPTION 'Website URL must be less than 500 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for URL validation
DROP TRIGGER IF EXISTS validate_ngo_website_trigger ON ngos;
CREATE TRIGGER validate_ngo_website_trigger
  BEFORE INSERT OR UPDATE OF website ON ngos
  FOR EACH ROW
  EXECUTE FUNCTION validate_ngo_website();

-- Add validation for donation amounts
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_amount_check;

ALTER TABLE donations
ADD CONSTRAINT donations_amount_check
CHECK (amount > 0 AND amount <= 100000000);

-- Add length constraints to text fields
ALTER TABLE ngos
DROP CONSTRAINT IF EXISTS ngos_name_length,
DROP CONSTRAINT IF EXISTS ngos_description_length,
DROP CONSTRAINT IF EXISTS ngos_location_length,
DROP CONSTRAINT IF EXISTS ngos_contact_email_length,
DROP CONSTRAINT IF EXISTS ngos_contact_phone_length;

ALTER TABLE ngos
ADD CONSTRAINT ngos_name_length CHECK (LENGTH(name) <= 200),
ADD CONSTRAINT ngos_description_length CHECK (LENGTH(description) <= 2000),
ADD CONSTRAINT ngos_location_length CHECK (LENGTH(location) <= 200),
ADD CONSTRAINT ngos_contact_email_length CHECK (LENGTH(contact_email) <= 255),
ADD CONSTRAINT ngos_contact_phone_length CHECK (LENGTH(contact_phone) <= 20);

ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_name_length,
DROP CONSTRAINT IF EXISTS categories_description_length;

ALTER TABLE categories
ADD CONSTRAINT categories_name_length CHECK (LENGTH(name) <= 100),
ADD CONSTRAINT categories_description_length CHECK (LENGTH(description) <= 1000);

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_full_name_length;

ALTER TABLE profiles
ADD CONSTRAINT profiles_full_name_length CHECK (LENGTH(full_name) <= 100);

ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_message_length;

ALTER TABLE donations
ADD CONSTRAINT donations_message_length CHECK (LENGTH(message) <= 1000);
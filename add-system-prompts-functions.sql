-- Function to increment version number for a specific prompt
CREATE OR REPLACE FUNCTION increment_version(prompt_id uuid)
RETURNS integer AS $$
DECLARE
  current_version integer;
BEGIN
  -- Get current version
  SELECT version INTO current_version FROM system_prompts WHERE id = prompt_id;
  
  -- Update to new version
  UPDATE system_prompts 
  SET version = current_version + 1 
  WHERE id = prompt_id;
  
  -- Return new version
  RETURN current_version + 1;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to system_prompts table
DROP TRIGGER IF EXISTS update_system_prompts_updated_at ON system_prompts;
CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

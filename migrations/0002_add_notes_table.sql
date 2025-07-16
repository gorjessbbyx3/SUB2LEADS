
-- Create notes table
CREATE TABLE IF NOT EXISTS "public"."notes" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "user_id" varchar REFERENCES "public"."users"("id"),
  "is_public" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Enable RLS on notes table
ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;

-- Policy for public notes to be readable by everyone
CREATE POLICY "public_notes_select" 
ON "public"."notes" 
FOR SELECT 
USING ("is_public" = true);

-- Policy for users to read their own notes
CREATE POLICY "own_notes_select" 
ON "public"."notes" 
FOR SELECT 
USING ("user_id" = current_setting('app.current_user_id', true));

-- Policy for users to insert their own notes
CREATE POLICY "own_notes_insert" 
ON "public"."notes" 
FOR INSERT 
WITH CHECK ("user_id" = current_setting('app.current_user_id', true));

-- Policy for users to update their own notes
CREATE POLICY "own_notes_update" 
ON "public"."notes" 
FOR UPDATE 
USING ("user_id" = current_setting('app.current_user_id', true));

-- Policy for users to delete their own notes
CREATE POLICY "own_notes_delete" 
ON "public"."notes" 
FOR DELETE 
USING ("user_id" = current_setting('app.current_user_id', true));

-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR SUPAY
-- Run in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  balance DECIMAL(12,2) DEFAULT 0.00,
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  referral_count INT DEFAULT 0,
  referral_earnings DECIMAL(12,2) DEFAULT 0.00,
  daily_ad_watch_count INT DEFAULT 0,
  last_ad_watch_at TIMESTAMPTZ,
  daily_bonus_streak INT DEFAULT 0,
  last_bonus_claimed_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad watches log
CREATE TABLE ad_watches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_amount DECIMAL(10,2) NOT NULL,
  watch_duration INT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (admin managed)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  reward_amount DECIMAL(10,2) NOT NULL,
  task_url TEXT,
  task_type TEXT DEFAULT 'link',
  required_time INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  total_completions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User task completions
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, completed, rejected
  reward_credited BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Withdrawal requests
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, processing, completed, rejected
  paystack_transfer_code TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral bonuses log
CREATE TABLE referral_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges definition
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT, -- ad_watch_count, referral_count, task_completed, total_earned
  requirement_value INT,
  reward_amount DECIMAL(10,2) DEFAULT 0
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Daily bonus claims
CREATE TABLE daily_bonus_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(10,2) NOT NULL,
  streak_day INT DEFAULT 1,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity logs
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_ad_watches_user_id ON ad_watches(user_id);
CREATE INDEX idx_ad_watches_created_at ON ad_watches(created_at);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ad watches policies
CREATE POLICY "Users can view own ad watches" ON ad_watches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ad watches" ON ad_watches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Anyone can view active tasks" ON tasks
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access on tasks" ON tasks
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default admin (replace with your email after creating user)
-- INSERT INTO profiles (id, username, is_admin) 
-- VALUES ('YOUR_USER_UUID', 'admin', true) ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Insert sample badges
INSERT INTO badges (name, description, requirement_type, requirement_value, reward_amount) VALUES
('First Watch', 'Watch your first ad', 'ad_watch_count', 1, 10),
('Ad Enthusiast', 'Watch 50 ads', 'ad_watch_count', 50, 100),
('Referral Rookie', 'Get your first referral', 'referral_count', 1, 50),
('Super Referrer', 'Get 10 referrals', 'referral_count', 10, 500),
('Task Master', 'Complete 20 tasks', 'task_completed', 20, 200),
('Earning Pro', 'Earn ₦10,000 total', 'total_earned', 10000, 1000);




-- ============================================
-- SUPAY DASHBOARD TABLES & FUNCTIONS
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. USER SPY BREAKDOWN TABLE
-- Stores aggregated earnings per user
CREATE TABLE IF NOT EXISTS user_spy_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_spy numeric DEFAULT 0,
  referral_spy numeric DEFAULT 0,
  staking_rewards_spy numeric DEFAULT 0,
  total_spy numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_spy_breakdown ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own breakdown
CREATE POLICY "Users can view own breakdown"
  ON user_spy_breakdown FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Users can update their own breakdown
CREATE POLICY "Users can update own breakdown"
  ON user_spy_breakdown FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. AD WATCHES TABLE
-- Tracks when users watch ads
CREATE TABLE IF NOT EXISTS ad_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id text,
  reward_spy numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad watches"
  ON ad_watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad watches"
  ON ad_watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. TRANSACTIONS TABLE
-- All earning/spending transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_spy numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('ad_watch', 'task_complete', 'daily_bonus', 'referral', 'withdrawal', 'deposit', 'staking_reward')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. GET WEEKLY EARNINGS RPC FUNCTION
-- Returns array of 7 daily earnings for the current week
CREATE OR REPLACE FUNCTION get_weekly_earnings(user_id uuid)
RETURNS numeric[] AS $$
DECLARE
  result numeric[] := ARRAY[0, 0, 0, 0, 0, 0, 0];
  day_idx integer;
  day_start timestamptz;
  day_end timestamptz;
  day_earnings numeric;
  week_start timestamptz;
BEGIN
  -- Get start of current week (Monday)
  week_start := date_trunc('week', now());

  FOR i IN 0..6 LOOP
    day_start := week_start + (i || ' days')::interval;
    day_end := day_start + '1 day'::interval;

    -- Sum earnings from ad_watches for that day
    SELECT COALESCE(SUM(reward_spy), 0)
    INTO day_earnings
    FROM ad_watches
    WHERE ad_watches.user_id = get_weekly_earnings.user_id
      AND created_at >= day_start
      AND created_at < day_end;

    result[i+1] := day_earnings;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INSERT SAMPLE DATA (optional - for testing)
-- Uncomment below to add test data for a user
/*
-- Replace with your actual user UUID
-- INSERT INTO user_spy_breakdown (user_id, earned_spy, referral_spy, staking_rewards_spy, total_spy)
-- VALUES ('your-user-uuid', 5000, 1200, 300, 6500);

-- INSERT INTO transactions (user_id, amount_spy, type, description)
-- VALUES 
--   ('your-user-uuid', 22, 'ad_watch', 'Watched ad #123'),
--   ('your-user-uuid', 18, 'task_complete', 'Completed survey task'),
--   ('your-user-uuid', 25, 'daily_bonus', 'Day 7 daily bonus'),
--   ('your-user-uuid', 10, 'referral', 'Referral: john_doe joined'),
--   ('your-user-uuid', 8, 'task_complete', 'Completed social share');
*/

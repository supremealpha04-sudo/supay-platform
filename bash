# Supay — Full-Stack Reward Platform
# Project Setup Instructions

# 1. Create new Next.js project
npx create-next-app@14 supay --typescript --tailwind --app --no-src-dir
cd supay

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr jsonwebtoken bcryptjs react-hot-toast react-icons recharts date-fns framer-motion
npm install -D @types/jsonwebtoken @types/bcryptjs

# 3. Set up environment variables (.env.local)
# Add the following variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 4. Run Supabase migrations (execute SQL in Supabase SQL editor)
# See SQL schema below

# 5. Start development server
npm run dev

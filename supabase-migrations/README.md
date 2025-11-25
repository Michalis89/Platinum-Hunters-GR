# Supabase Database Migrations

## 📋 Overview

Αυτά τα migration scripts δημιουργούν ολόκληρη τη database structure για το Platinum Hunters GR.

## 🗂️ Migration Files

Τα migrations πρέπει να τρέξουν **με τη σειρά**:

1. **01-create-tables.sql** - Δημιουργεί όλα τα tables
2. **02-create-indexes.sql** - Δημιουργεί indexes για performance
3. **03-create-triggers.sql** - Δημιουργεί triggers για auto-updates
4. **04-create-views.sql** - Δημιουργεί views για common queries
5. **05-create-rls-policies.sql** - Ενεργοποιεί Row Level Security
6. **06-seed-data.sql** - Προσθέτει initial data (platforms, genres)

## 🚀 Πώς να τα τρέξεις

### Option 1: Supabase Dashboard (Recommended)

1. Πήγαινε στο [Supabase Dashboard](https://app.supabase.com)
2. Δημιούργησε νέο project ή άνοιξε το υπάρχον
3. Πήγαινε στο **SQL Editor** (αριστερό μενού)
4. Για κάθε migration file:
   - Κάνε click "New Query"
   - Αντέγραψε-Επικόλλησε το περιεχόμενο του file
   - Πάτησε "Run" (ή Ctrl+Enter)
   - Περίμενε το ✅ success message

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (αν δεν το έχεις)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push

# Or run individual files
psql postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres < 01-create-tables.sql
```

## 📊 Database Schema Overview

### Core Tables
- **users** - User accounts & profiles
- **games** - Game information
- **guides** - Trophy guides
- **guide_steps** - Guide steps (normalized)
- **trophies** - Individual trophies

### Reference Tables
- **platforms** - PS4, PS5, etc
- **genres** - Game genres
- **developers** - Game developers
- **publishers** - Game publishers

### User Features
- **user_backlog** - User's game backlog
- **user_completed_games** - Completed games with reviews
- **comments** - Comments system
- **user_guide_likes** - Guide likes

### Admin
- **admin_logs** - Audit trail

## 🔐 Row Level Security (RLS)

Όλα τα tables έχουν RLS enabled. Τα policies:

- **Public data**: Games, guides, platforms, etc (viewable by all)
- **User data**: Backlog, completed games (only owner can view/edit)
- **Admin data**: Admin logs (only admins)

## 🎯 Views Available

- `full_game_data` - Games με όλα τα related data
- `user_stats` - User statistics
- `guides_with_game` - Guides με game info
- `user_backlog_with_game` - Backlog με game info
- `user_completed_with_game` - Completed με game info
- `popular_games` - Popular games ranking
- `trending_platinums` - Recent platinum trophies

## 📈 Performance Optimizations

- **30+ indexes** σε critical fields
- **Triggers** για auto-update cached stats
- **Generated columns** για computed values
- **Full-text search** στα games με `search_vector`

## ⚠️ Important Notes

### Authentication

Τα users **ΔΕΝ** δημιουργούνται απευθείας στο `users` table. Πρέπει:

1. Να χρησιμοποιήσεις **Supabase Auth** για signup/login
2. Μετά το signup, να δημιουργήσεις entry στο `users` table:

```sql
-- Trigger to auto-create user profile (add this if needed)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Admin Users

Για να κάνεις ένα user admin:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## 🔄 Rollback

Αν θέλεις να ξεκινήσεις από την αρχή:

```sql
-- ⚠️ ΠΡΟΣΟΧΗ: Αυτό διαγράφει ΟΛΑ τα data!

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Μετά τρέξε όλα τα migrations ξανά
```

## 📝 Testing

Μετά τα migrations, δοκίμασε:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check views
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 🐛 Troubleshooting

### "relation already exists"
- Το table υπάρχει ήδη. Κάνε drop ή skip το migration.

### "permission denied"
- Έλεγξε ότι έχεις admin rights στο Supabase project.

### "function does not exist"
- Ίσως δεν τρέχουν τα migrations με τη σειρά. Τρέξε πρώτα τα προηγούμενα.

### RLS blocks queries
- Αν κάνεις queries μέσω SQL Editor, χρησιμοποίησε το postgres role:
```sql
SET ROLE postgres;
-- your query here
```

## 📞 Support

Αν έχεις πρόβλημα, check:
1. Supabase project logs
2. Console για SQL errors
3. RLS policies (μήπως μπλοκάρουν το query)

---

**Happy coding!** 🎮✨

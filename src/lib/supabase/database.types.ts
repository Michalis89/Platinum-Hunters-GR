export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string | null
          id: number
          payload: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          payload?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          payload?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: number
          target_id: number | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
          target_id?: number | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
          target_id?: number | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comment_likes: {
        Row: {
          comment_id: number
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          comment_id: number
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          comment_id?: number
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "article_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: number
          content: string
          created_at: string | null
          id: number
          is_approved: boolean | null
          is_edited: boolean | null
          likes: number | null
          parent_id: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id: number
          content: string
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_edited?: boolean | null
          likes?: number | null
          parent_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: number
          content?: string
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_edited?: boolean | null
          likes?: number | null
          parent_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "article_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: number
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          article_id: number
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          article_id?: number
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: number
          id: number
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          article_id: number
          id?: number
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          article_id?: number
          id?: number
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "article_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category: string
          content_html: string | null
          content_rich: Json | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: number
          is_featured: boolean | null
          likes: number | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          topic: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content_html?: string | null
          content_rich?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_featured?: boolean | null
          likes?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          topic?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content_html?: string | null
          content_rich?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_featured?: boolean | null
          likes?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          commentable_id: number
          commentable_type: string
          content: string
          created_at: string | null
          id: number
          is_approved: boolean | null
          is_deleted: boolean | null
          parent_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commentable_id: number
          commentable_type: string
          content: string
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_deleted?: boolean | null
          parent_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commentable_id?: number
          commentable_type?: string
          content?: string
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_deleted?: boolean | null
          parent_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      game_genres: {
        Row: {
          game_id: number
          genre_id: number
        }
        Insert: {
          game_id: number
          genre_id: number
        }
        Update: {
          game_id?: number
          genre_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_genres_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_genres_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      game_platforms: {
        Row: {
          game_id: number
          platform_id: number
        }
        Insert: {
          game_id: number
          platform_id: number
        }
        Update: {
          game_id?: number
          platform_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_platforms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_platforms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_platforms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_platforms_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          average_difficulty: number | null
          average_hours: number | null
          background_image: string | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          developer_id: number | null
          esrb_rating: string | null
          id: number
          metacritic_score: number | null
          psn_trophy_id: string | null
          publisher_id: number | null
          rating: number | null
          rawg_id: number | null
          release_date: string | null
          release_year: number | null
          search_vector: unknown
          slug: string
          title: string
          total_guides: number | null
          total_reviews: number | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          updated_at: string | null
        }
        Insert: {
          average_difficulty?: number | null
          average_hours?: number | null
          background_image?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          developer_id?: number | null
          esrb_rating?: string | null
          id?: number
          metacritic_score?: number | null
          psn_trophy_id?: string | null
          publisher_id?: number | null
          rating?: number | null
          rawg_id?: number | null
          release_date?: string | null
          release_year?: number | null
          search_vector?: unknown
          slug: string
          title: string
          total_guides?: number | null
          total_reviews?: number | null
          trophy_bronze?: number | null
          trophy_gold?: number | null
          trophy_platinum?: number | null
          trophy_silver?: number | null
          trophy_total?: number | null
          updated_at?: string | null
        }
        Update: {
          average_difficulty?: number | null
          average_hours?: number | null
          background_image?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          developer_id?: number | null
          esrb_rating?: string | null
          id?: number
          metacritic_score?: number | null
          psn_trophy_id?: string | null
          publisher_id?: number | null
          rating?: number | null
          rawg_id?: number | null
          release_date?: string | null
          release_year?: number | null
          search_vector?: unknown
          slug?: string
          title?: string
          total_guides?: number | null
          total_reviews?: number | null
          trophy_bronze?: number | null
          trophy_gold?: number | null
          trophy_platinum?: number | null
          trophy_silver?: number | null
          trophy_total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_backlog_with_game"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_completed_with_game"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "user_backlog_with_game"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "user_completed_with_game"
            referencedColumns: ["publisher_id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      guide_step_trophies: {
        Row: {
          step_id: number
          trophy_id: number
        }
        Insert: {
          step_id: number
          trophy_id: number
        }
        Update: {
          step_id?: number
          trophy_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_step_trophies_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "guide_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_step_trophies_trophy_id_fkey"
            columns: ["trophy_id"]
            isOneToOne: false
            referencedRelation: "trophies"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_steps: {
        Row: {
          content_html: string | null
          content_rich: Json | null
          created_at: string | null
          description: string
          guide_id: number
          id: number
          step_number: number
          title: string
        }
        Insert: {
          content_html?: string | null
          content_rich?: Json | null
          created_at?: string | null
          description: string
          guide_id: number
          id?: number
          step_number: number
          title: string
        }
        Update: {
          content_html?: string | null
          content_rich?: Json | null
          created_at?: string | null
          description?: string
          guide_id?: number
          id?: number
          step_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_steps_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_steps_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          author_id: string | null
          content_html: string | null
          content_rich: Json | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          difficulty_rating: number | null
          estimated_hours: number | null
          estimated_playthroughs: number | null
          game_id: number
          id: number
          is_verified: boolean | null
          likes: number | null
          published_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          content_html?: string | null
          content_rich?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          difficulty_rating?: number | null
          estimated_hours?: number | null
          estimated_playthroughs?: number | null
          game_id: number
          id?: number
          is_verified?: boolean | null
          likes?: number | null
          published_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          content_html?: string | null
          content_rich?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          difficulty_rating?: number | null
          estimated_hours?: number | null
          estimated_playthroughs?: number | null
          game_id?: number
          id?: number
          is_verified?: boolean | null
          likes?: number | null
          published_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          banner_image: string | null
          category: string
          chapters: number | null
          cover_image_large: string | null
          cover_image_medium: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          end_date: string | null
          episodes: number | null
          first_air_date: string | null
          format: string | null
          genres: string[] | null
          google_books_id: string | null
          id: number
          imdb_id: string | null
          last_air_date: string | null
          mal_id: number | null
          number_of_episodes: number | null
          number_of_seasons: number | null
          original_title: string | null
          page_count: number | null
          popularity: number | null
          rating: number | null
          release_date: string | null
          runtime: number | null
          season: string | null
          season_year: number | null
          source: string | null
          start_date: string | null
          status: string | null
          studios: Json | null
          tags: Json | null
          title: string | null
          title_english: string | null
          title_native: string | null
          title_romaji: string | null
          tmdb_id: number | null
          updated_at: string | null
          volumes: number | null
          vote_count: number | null
        }
        Insert: {
          banner_image?: string | null
          category: string
          chapters?: number | null
          cover_image_large?: string | null
          cover_image_medium?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          episodes?: number | null
          first_air_date?: string | null
          format?: string | null
          genres?: string[] | null
          google_books_id?: string | null
          id?: number
          imdb_id?: string | null
          last_air_date?: string | null
          mal_id?: number | null
          number_of_episodes?: number | null
          number_of_seasons?: number | null
          original_title?: string | null
          page_count?: number | null
          popularity?: number | null
          rating?: number | null
          release_date?: string | null
          runtime?: number | null
          season?: string | null
          season_year?: number | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          studios?: Json | null
          tags?: Json | null
          title?: string | null
          title_english?: string | null
          title_native?: string | null
          title_romaji?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
          volumes?: number | null
          vote_count?: number | null
        }
        Update: {
          banner_image?: string | null
          category?: string
          chapters?: number | null
          cover_image_large?: string | null
          cover_image_medium?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          episodes?: number | null
          first_air_date?: string | null
          format?: string | null
          genres?: string[] | null
          google_books_id?: string | null
          id?: number
          imdb_id?: string | null
          last_air_date?: string | null
          mal_id?: number | null
          number_of_episodes?: number | null
          number_of_seasons?: number | null
          original_title?: string | null
          page_count?: number | null
          popularity?: number | null
          rating?: number | null
          release_date?: string | null
          runtime?: number | null
          season?: string | null
          season_year?: number | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          studios?: Json | null
          tags?: Json | null
          title?: string | null
          title_english?: string | null
          title_native?: string | null
          title_romaji?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
          volumes?: number | null
          vote_count?: number | null
        }
        Relationships: []
      }
      platforms: {
        Row: {
          created_at: string | null
          icon_name: string | null
          id: number
          name: string
          short_name: string
        }
        Insert: {
          created_at?: string | null
          icon_name?: string | null
          id?: number
          name: string
          short_name: string
        }
        Update: {
          created_at?: string | null
          icon_name?: string | null
          id?: number
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      publishers: {
        Row: {
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      trophies: {
        Row: {
          created_at: string | null
          description: string | null
          game_id: number
          icon_url: string | null
          id: number
          is_hidden: boolean | null
          name: string
          psn_trophy_id: string | null
          rarity_percentage: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          game_id: number
          icon_url?: string | null
          id?: number
          is_hidden?: boolean | null
          name: string
          psn_trophy_id?: string | null
          rarity_percentage?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          game_id?: number
          icon_url?: string | null
          id?: number
          is_hidden?: boolean | null
          name?: string
          psn_trophy_id?: string | null
          rarity_percentage?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trophies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trophies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trophies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_backlog: {
        Row: {
          added_at: string | null
          game_id: number
          id: number
          notes: string | null
          personal_difficulty: number | null
          personal_rating: number | null
          priority: number | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          game_id: number
          id?: number
          notes?: string | null
          personal_difficulty?: number | null
          personal_rating?: number | null
          priority?: number | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          game_id?: number
          id?: number
          notes?: string | null
          personal_difficulty?: number | null
          personal_rating?: number | null
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_completed_games: {
        Row: {
          actual_hours: number | null
          actual_playthroughs: number | null
          completed_at: string | null
          created_at: string | null
          difficulty_rating: number | null
          game_id: number
          got_platinum: boolean | null
          id: number
          platinum_date: string | null
          rating: number | null
          review_text: string | null
          updated_at: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          actual_hours?: number | null
          actual_playthroughs?: number | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          game_id: number
          got_platinum?: boolean | null
          id?: number
          platinum_date?: string | null
          rating?: number | null
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          actual_hours?: number | null
          actual_playthroughs?: number | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          game_id?: number
          got_platinum?: boolean | null
          id?: number
          platinum_date?: string | null
          rating?: number | null
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_games: {
        Row: {
          actual_hours_casual: number | null
          actual_hours_platinum: number | null
          added_at: string | null
          completed_at: string | null
          dropped_at: string | null
          game_id: number
          id: number
          is_favorite: boolean | null
          notes: string | null
          personal_difficulty: number | null
          personal_rating: number | null
          platinumed_at: string | null
          priority: number | null
          started_at: string | null
          status: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          actual_hours_casual?: number | null
          actual_hours_platinum?: number | null
          added_at?: string | null
          completed_at?: string | null
          dropped_at?: string | null
          game_id: number
          id?: number
          is_favorite?: boolean | null
          notes?: string | null
          personal_difficulty?: number | null
          personal_rating?: number | null
          platinumed_at?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          actual_hours_casual?: number | null
          actual_hours_platinum?: number | null
          added_at?: string | null
          completed_at?: string | null
          dropped_at?: string | null
          game_id?: number
          id?: number
          is_favorite?: boolean | null
          notes?: string | null
          personal_difficulty?: number | null
          personal_rating?: number | null
          platinumed_at?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_guide_likes: {
        Row: {
          created_at: string | null
          guide_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guide_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          guide_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_guide_likes_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_guide_likes_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_guide_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_guide_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_guide_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_media_entries: {
        Row: {
          created_at: string | null
          id: number
          is_favorite: boolean | null
          media_id: number
          notes: string | null
          priority: number | null
          progress: number | null
          score: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_favorite?: boolean | null
          media_id: number
          notes?: string | null
          priority?: number | null
          progress?: number | null
          score?: number | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_favorite?: boolean | null
          media_id?: number
          notes?: string | null
          priority?: number | null
          progress?: number | null
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_media_entries_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_media_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_media_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_media_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string | null
          id: number
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          status: string
          type: string
        }
        Update: {
          created_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      general_questions: {
        Row: {
          category: string
          created_at: string | null
          email: string
          feedback_rating: number | null
          id: number
          info_details: string | null
          info_type: string | null
          question: string | null
          service_description: string | null
          service_name: string | null
          submission_id: number
        }
        Insert: {
          category: string
          created_at?: string | null
          email: string
          feedback_rating?: number | null
          info_details?: string | null
          info_type?: string | null
          question?: string | null
          service_description?: string | null
          service_name?: string | null
          submission_id: number
        }
        Update: {
          category?: string
          created_at?: string | null
          email?: string
          feedback_rating?: number | null
          info_details?: string | null
          info_type?: string | null
          question?: string | null
          service_description?: string | null
          service_name?: string | null
          submission_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "general_questions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
          referencedRelation: "submissions"
          referencedColumns: ["id"]
        },
      ]
    }
      trophy_guides: {
        Row: {
          additional_comments: string | null
          game_name: string
          id: number
          submission_id: number
        }
        Insert: {
          additional_comments?: string | null
          game_name: string
          submission_id: number
        }
        Update: {
          additional_comments?: string | null
          game_name?: string
          submission_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trophy_guides_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          categories: string[]
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string
          email_verified: boolean | null
          favorite_anime_genres: string[] | null
          favorite_book_genres: string[] | null
          favorite_genres: string[] | null
          favorite_languages: string[] | null
          favorite_movie_genres: string[] | null
          favorite_platform: string | null
          full_name: string | null
          gaming_since: number | null
          id: string
          language_preference: string | null
          last_login: string | null
          nintendo_id: string | null
          notification_settings: Json | null
          pet_types: string[] | null
          privacy_settings: Json | null
          psn_id: string | null
          role: string | null
          social_links: Json | null
          steam_id: string | null
          timezone: string | null
          total_games_completed: number | null
          total_hours_played: number | null
          total_platinums: number | null
          updated_at: string | null
          username: string
          vape_device: string | null
          vape_flavor: string | null
          xbox_gamertag: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          categories?: string[]
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          favorite_anime_genres?: string[] | null
          favorite_book_genres?: string[] | null
          favorite_genres?: string[] | null
          favorite_languages?: string[] | null
          favorite_movie_genres?: string[] | null
          favorite_platform?: string | null
          full_name?: string | null
          gaming_since?: number | null
          id?: string
          language_preference?: string | null
          last_login?: string | null
          nintendo_id?: string | null
          notification_settings?: Json | null
          pet_types?: string[] | null
          privacy_settings?: Json | null
          psn_id?: string | null
          role?: string | null
          social_links?: Json | null
          steam_id?: string | null
          timezone?: string | null
          total_games_completed?: number | null
          total_hours_played?: number | null
          total_platinums?: number | null
          updated_at?: string | null
          username: string
          vape_device?: string | null
          vape_flavor?: string | null
          xbox_gamertag?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          categories?: string[]
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          favorite_anime_genres?: string[] | null
          favorite_book_genres?: string[] | null
          favorite_genres?: string[] | null
          favorite_languages?: string[] | null
          favorite_movie_genres?: string[] | null
          favorite_platform?: string | null
          full_name?: string | null
          gaming_since?: number | null
          id?: string
          language_preference?: string | null
          last_login?: string | null
          nintendo_id?: string | null
          notification_settings?: Json | null
          pet_types?: string[] | null
          privacy_settings?: Json | null
          psn_id?: string | null
          role?: string | null
          social_links?: Json | null
          steam_id?: string | null
          timezone?: string | null
          total_games_completed?: number | null
          total_hours_played?: number | null
          total_platinums?: number | null
          updated_at?: string | null
          username?: string
          vape_device?: string | null
          vape_flavor?: string | null
          xbox_gamertag?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      full_game_data: {
        Row: {
          average_difficulty: number | null
          average_hours: number | null
          background_image: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          developer: string | null
          developer_id: number | null
          developer_slug: string | null
          esrb_rating: string | null
          genres: string[] | null
          id: number | null
          metacritic_score: number | null
          platforms: string[] | null
          psn_trophy_id: string | null
          publisher: string | null
          publisher_id: number | null
          publisher_slug: string | null
          rating: number | null
          rawg_id: number | null
          release_date: string | null
          release_year: number | null
          slug: string | null
          title: string | null
          total_guides: number | null
          total_reviews: number | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      guides_with_game: {
        Row: {
          author_avatar: string | null
          author_display_name: string | null
          author_id: string | null
          author_username: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          difficulty_rating: number | null
          estimated_hours: number | null
          estimated_playthroughs: number | null
          game_cover_image: string | null
          game_id: number | null
          game_slug: string | null
          game_title: string | null
          id: number | null
          is_verified: boolean | null
          likes: number | null
          published_at: string | null
          status: string | null
          title: string | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          updated_at: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_games: {
        Row: {
          average_difficulty: number | null
          average_hours: number | null
          background_image: string | null
          completed_count: number | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          developer_id: number | null
          id: number | null
          in_backlog_count: number | null
          metacritic_score: number | null
          popularity_score: number | null
          psn_trophy_id: string | null
          publisher_id: number | null
          rating: number | null
          rawg_id: number | null
          release_date: string | null
          release_year: number | null
          search_vector: unknown
          slug: string | null
          title: string | null
          total_guides: number | null
          total_reviews: number | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          updated_at: string | null
          user_average_rating: number | null
        }
        Insert: {
          average_difficulty?: number | null
          average_hours?: number | null
          background_image?: string | null
          completed_count?: never
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          developer_id?: number | null
          id?: number | null
          in_backlog_count?: never
          metacritic_score?: number | null
          popularity_score?: never
          psn_trophy_id?: string | null
          publisher_id?: number | null
          rating?: number | null
          rawg_id?: number | null
          release_date?: string | null
          release_year?: number | null
          search_vector?: unknown
          slug?: string | null
          title?: string | null
          total_guides?: number | null
          total_reviews?: number | null
          trophy_bronze?: number | null
          trophy_gold?: number | null
          trophy_platinum?: number | null
          trophy_silver?: number | null
          trophy_total?: number | null
          updated_at?: string | null
          user_average_rating?: never
        }
        Update: {
          average_difficulty?: number | null
          average_hours?: number | null
          background_image?: string | null
          completed_count?: never
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          developer_id?: number | null
          id?: number | null
          in_backlog_count?: never
          metacritic_score?: number | null
          popularity_score?: never
          psn_trophy_id?: string | null
          publisher_id?: number | null
          rating?: number | null
          rawg_id?: number | null
          release_date?: string | null
          release_year?: number | null
          search_vector?: unknown
          slug?: string | null
          title?: string | null
          total_guides?: number | null
          total_reviews?: number | null
          trophy_bronze?: number | null
          trophy_gold?: number | null
          trophy_platinum?: number | null
          trophy_silver?: number | null
          trophy_total?: number | null
          updated_at?: string | null
          user_average_rating?: never
        }
        Relationships: [
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_backlog_with_game"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "user_completed_with_game"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "user_backlog_with_game"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "games_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "user_completed_with_game"
            referencedColumns: ["publisher_id"]
          },
        ]
      }
      trending_platinums: {
        Row: {
          actual_hours: number | null
          avatar_url: string | null
          difficulty_rating: number | null
          display_name: string | null
          game_cover_image: string | null
          game_id: number | null
          game_slug: string | null
          game_title: string | null
          id: number | null
          platinum_date: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_backlog_with_game: {
        Row: {
          added_at: string | null
          average_difficulty: number | null
          average_hours: number | null
          background_image: string | null
          backlog_id: number | null
          cover_image: string | null
          description: string | null
          developer: string | null
          developer_id: number | null
          developer_slug: string | null
          game_id: number | null
          game_rating: number | null
          genres: string[] | null
          metacritic_score: number | null
          notes: string | null
          personal_difficulty: number | null
          personal_rating: number | null
          platforms: string[] | null
          priority: number | null
          psn_trophy_id: string | null
          publisher: string | null
          publisher_id: number | null
          publisher_slug: string | null
          rawg_id: number | null
          release_date: string | null
          release_year: number | null
          slug: string | null
          title: string | null
          total_guides: number | null
          total_reviews: number | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_backlog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_completed_with_game: {
        Row: {
          actual_hours: number | null
          actual_playthroughs: number | null
          average_difficulty: number | null
          average_hours: number | null
          background_image: string | null
          completed_at: string | null
          completion_id: number | null
          cover_image: string | null
          description: string | null
          developer: string | null
          developer_id: number | null
          developer_slug: string | null
          difficulty_rating: number | null
          game_id: number | null
          game_rating: number | null
          genres: string[] | null
          got_platinum: boolean | null
          metacritic_score: number | null
          platforms: string[] | null
          platinum_date: string | null
          psn_trophy_id: string | null
          publisher: string | null
          publisher_id: number | null
          publisher_slug: string | null
          rating: number | null
          rawg_id: number | null
          release_date: string | null
          release_year: number | null
          review_text: string | null
          slug: string | null
          title: string | null
          total_guides: number | null
          total_reviews: number | null
          trophy_bronze: number | null
          trophy_gold: number | null
          trophy_platinum: number | null
          trophy_silver: number | null
          trophy_total: number | null
          user_id: string | null
          would_recommend: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "full_game_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "popular_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "guides_with_game"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          backlog_count: number | null
          comments_count: number | null
          created_at: string | null
          display_name: string | null
          guides_written: number | null
          id: string | null
          role: string | null
          total_games_completed: number | null
          total_hours_played: number | null
          total_platinums: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: never
          backlog_count?: never
          comments_count?: never
          created_at?: string | null
          display_name?: string | null
          guides_written?: never
          id?: string | null
          role?: string | null
          total_games_completed?: number | null
          total_hours_played?: number | null
          total_platinums?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: never
          backlog_count?: never
          comments_count?: never
          created_at?: string | null
          display_name?: string | null
          guides_written?: never
          id?: string | null
          role?: string | null
          total_games_completed?: number | null
          total_hours_played?: number | null
          total_platinums?: number | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fuzzy_search: {
        Args: { search_title: string }
        Returns: {
          average_difficulty: number
          average_hours: number
          background_image: string
          cover_image: string
          created_at: string
          created_by: string
          description: string
          developer_id: number
          id: number
          metacritic_score: number
          psn_trophy_id: string
          publisher_id: number
          rating: number
          rawg_id: number
          release_date: string
          release_year: number
          search_vector: unknown
          similarity: number
          slug: string
          title: string
          total_guides: number
          total_reviews: number
          trophy_bronze: number
          trophy_gold: number
          trophy_platinum: number
          trophy_silver: number
          trophy_total: number
          updated_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_moderator: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_user_last_login: { Args: { user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

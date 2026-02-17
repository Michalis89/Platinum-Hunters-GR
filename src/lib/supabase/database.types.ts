export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string | null;
          id: number;
          payload: Json | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          payload?: Json | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          payload?: Json | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      application_logs: {
        Row: {
          created_at: string;
          details: Json | null;
          duration_ms: number | null;
          id: number;
          level: string;
          message: string;
          method: string | null;
          path: string | null;
          source: string;
          status: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          details?: Json | null;
          duration_ms?: number | null;
          id?: never;
          level: string;
          message: string;
          method?: string | null;
          path?: string | null;
          source: string;
          status?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          details?: Json | null;
          duration_ms?: number | null;
          id?: never;
          level?: string;
          message?: string;
          method?: string | null;
          path?: string | null;
          source?: string;
          status?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'application_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_comment_likes: {
        Row: {
          comment_id: number;
          created_at: string | null;
          id: number;
          user_id: string;
        };
        Insert: {
          comment_id: number;
          created_at?: string | null;
          id?: number;
          user_id: string;
        };
        Update: {
          comment_id?: number;
          created_at?: string | null;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_comment_likes_comment_id_fkey';
            columns: ['comment_id'];
            isOneToOne: false;
            referencedRelation: 'article_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_comment_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_comments: {
        Row: {
          article_id: number;
          content: string;
          created_at: string | null;
          id: number;
          is_approved: boolean | null;
          is_edited: boolean | null;
          likes: number | null;
          parent_id: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          article_id: number;
          content: string;
          created_at?: string | null;
          id?: number;
          is_approved?: boolean | null;
          is_edited?: boolean | null;
          likes?: number | null;
          parent_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          article_id?: number;
          content?: string;
          created_at?: string | null;
          id?: number;
          is_approved?: boolean | null;
          is_edited?: boolean | null;
          likes?: number | null;
          parent_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_comments_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'article_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_likes: {
        Row: {
          article_id: number;
          created_at: string | null;
          id: number;
          user_id: string;
        };
        Insert: {
          article_id: number;
          created_at?: string | null;
          id?: number;
          user_id: string;
        };
        Update: {
          article_id?: number;
          created_at?: string | null;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_likes_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_views: {
        Row: {
          article_id: number;
          id: number;
          ip_hash: string | null;
          referrer: string | null;
          user_agent: string | null;
          user_id: string | null;
          viewed_at: string | null;
        };
        Insert: {
          article_id: number;
          id?: number;
          ip_hash?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Update: {
          article_id?: number;
          id?: number;
          ip_hash?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_views_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      articles: {
        Row: {
          author_id: string | null;
          category: string;
          content_html: string | null;
          content_rich: Json | null;
          cover_image: string | null;
          created_at: string | null;
          description: string | null;
          id: number;
          is_featured: boolean | null;
          likes: number | null;
          meta_description: string | null;
          meta_title: string | null;
          published_at: string | null;
          reading_time_minutes: number | null;
          slug: string;
          status: string | null;
          tags: string[] | null;
          title: string;
          topic: string | null;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          author_id?: string | null;
          category: string;
          content_html?: string | null;
          content_rich?: Json | null;
          cover_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_featured?: boolean | null;
          likes?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          slug: string;
          status?: string | null;
          tags?: string[] | null;
          title: string;
          topic?: string | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          author_id?: string | null;
          category?: string;
          content_html?: string | null;
          content_rich?: Json | null;
          cover_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_featured?: boolean | null;
          likes?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          slug?: string;
          status?: string | null;
          tags?: string[] | null;
          title?: string;
          topic?: string | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      media_items: {
        Row: {
          aggregated_rating: number | null;
          aggregated_rating_count: number | null;
          banner_image: string | null;
          category: string;
          chapters: number | null;
          cover_image_id: string | null;
          cover_image_large: string | null;
          cover_image_medium: string | null;
          cover_url_big: string | null;
          cover_url_thumb: string | null;
          created_at: string | null;
          description: string | null;
          developer: string | null;
          duration: number | null;
          end_date: string | null;
          episodes: number | null;
          esrb_rating: string | null;
          first_air_date: string | null;
          first_release_date: string | null;
          format: string | null;
          genres: string[] | null;
          google_books_id: string | null;
          id: number;
          igdb_artwork_image_ids: string[] | null;
          igdb_category: number | null;
          igdb_game_modes: string[] | null;
          igdb_id: number | null;
          igdb_player_perspectives: string[] | null;
          igdb_screenshot_image_ids: string[] | null;
          igdb_slug: string | null;
          igdb_themes: string[] | null;
          igdb_updated_at: string | null;
          imdb_id: string | null;
          last_air_date: string | null;
          mal_id: number | null;
          metacritic: number | null;
          number_of_episodes: number | null;
          number_of_seasons: number | null;
          official_website: string | null;
          original_title: string | null;
          page_count: number | null;
          platforms: string[] | null;
          popularity: number | null;
          publisher: string | null;
          rating: number | null;
          rating_count: number | null;
          rawg_id: number | null;
          release_date: string | null;
          runtime: number | null;
          season: string | null;
          season_year: number | null;
          source: string | null;
          start_date: string | null;
          status: string | null;
          steam_app_id: number | null;
          storyline: string | null;
          studios: Json | null;
          summary: string | null;
          tags: Json | null;
          title: string | null;
          title_english: string | null;
          title_native: string | null;
          title_romaji: string | null;
          tmdb_id: number | null;
          updated_at: string | null;
          volumes: number | null;
          vote_count: number | null;
          websites: Json | null;
        };
        Insert: {
          aggregated_rating?: number | null;
          aggregated_rating_count?: number | null;
          banner_image?: string | null;
          category: string;
          chapters?: number | null;
          cover_image_id?: string | null;
          cover_image_large?: string | null;
          cover_image_medium?: string | null;
          cover_url_big?: string | null;
          cover_url_thumb?: string | null;
          created_at?: string | null;
          description?: string | null;
          developer?: string | null;
          duration?: number | null;
          end_date?: string | null;
          episodes?: number | null;
          esrb_rating?: string | null;
          first_air_date?: string | null;
          first_release_date?: string | null;
          format?: string | null;
          genres?: string[] | null;
          google_books_id?: string | null;
          id?: number;
          igdb_artwork_image_ids?: string[] | null;
          igdb_category?: number | null;
          igdb_game_modes?: string[] | null;
          igdb_id?: number | null;
          igdb_player_perspectives?: string[] | null;
          igdb_screenshot_image_ids?: string[] | null;
          igdb_slug?: string | null;
          igdb_themes?: string[] | null;
          igdb_updated_at?: string | null;
          imdb_id?: string | null;
          last_air_date?: string | null;
          mal_id?: number | null;
          metacritic?: number | null;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          official_website?: string | null;
          original_title?: string | null;
          page_count?: number | null;
          platforms?: string[] | null;
          popularity?: number | null;
          publisher?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          rawg_id?: number | null;
          release_date?: string | null;
          runtime?: number | null;
          season?: string | null;
          season_year?: number | null;
          source?: string | null;
          start_date?: string | null;
          status?: string | null;
          steam_app_id?: number | null;
          storyline?: string | null;
          studios?: Json | null;
          summary?: string | null;
          tags?: Json | null;
          title?: string | null;
          title_english?: string | null;
          title_native?: string | null;
          title_romaji?: string | null;
          tmdb_id?: number | null;
          updated_at?: string | null;
          volumes?: number | null;
          vote_count?: number | null;
          websites?: Json | null;
        };
        Update: {
          aggregated_rating?: number | null;
          aggregated_rating_count?: number | null;
          banner_image?: string | null;
          category?: string;
          chapters?: number | null;
          cover_image_id?: string | null;
          cover_image_large?: string | null;
          cover_image_medium?: string | null;
          cover_url_big?: string | null;
          cover_url_thumb?: string | null;
          created_at?: string | null;
          description?: string | null;
          developer?: string | null;
          duration?: number | null;
          end_date?: string | null;
          episodes?: number | null;
          esrb_rating?: string | null;
          first_air_date?: string | null;
          first_release_date?: string | null;
          format?: string | null;
          genres?: string[] | null;
          google_books_id?: string | null;
          id?: number;
          igdb_artwork_image_ids?: string[] | null;
          igdb_category?: number | null;
          igdb_game_modes?: string[] | null;
          igdb_id?: number | null;
          igdb_player_perspectives?: string[] | null;
          igdb_screenshot_image_ids?: string[] | null;
          igdb_slug?: string | null;
          igdb_themes?: string[] | null;
          igdb_updated_at?: string | null;
          imdb_id?: string | null;
          last_air_date?: string | null;
          mal_id?: number | null;
          metacritic?: number | null;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          official_website?: string | null;
          original_title?: string | null;
          page_count?: number | null;
          platforms?: string[] | null;
          popularity?: number | null;
          publisher?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          rawg_id?: number | null;
          release_date?: string | null;
          runtime?: number | null;
          season?: string | null;
          season_year?: number | null;
          source?: string | null;
          start_date?: string | null;
          status?: string | null;
          steam_app_id?: number | null;
          storyline?: string | null;
          studios?: Json | null;
          summary?: string | null;
          tags?: Json | null;
          title?: string | null;
          title_english?: string | null;
          title_native?: string | null;
          title_romaji?: string | null;
          tmdb_id?: number | null;
          updated_at?: string | null;
          volumes?: number | null;
          vote_count?: number | null;
          websites?: Json | null;
        };
        Relationships: [];
      };
      steam_sync_jobs: {
        Row: {
          batch_size: number;
          completed_steps: number;
          created_at: string;
          error: string | null;
          expires_at: string;
          finished_at: string | null;
          id: string;
          message: string;
          percent: number;
          processed_count: number;
          result: Json | null;
          status: string;
          steam_games: Json | null;
          total_steps: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          batch_size?: number;
          completed_steps?: number;
          created_at?: string;
          error?: string | null;
          expires_at?: string;
          finished_at?: string | null;
          id: string;
          message?: string;
          percent?: number;
          processed_count?: number;
          result?: Json | null;
          status?: string;
          steam_games?: Json | null;
          total_steps?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          batch_size?: number;
          completed_steps?: number;
          created_at?: string;
          error?: string | null;
          expires_at?: string;
          finished_at?: string | null;
          id?: string;
          message?: string;
          percent?: number;
          processed_count?: number;
          result?: Json | null;
          status?: string;
          steam_games?: Json | null;
          total_steps?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      support_attachments: {
        Row: {
          created_at: string | null;
          file_name: string | null;
          id: string;
          message_id: string | null;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          ticket_id: string;
          uploader_user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name?: string | null;
          id?: string;
          message_id?: string | null;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          ticket_id: string;
          uploader_user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string | null;
          id?: string;
          message_id?: string | null;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
          ticket_id?: string;
          uploader_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'support_attachments_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'support_messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_attachments_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_attachments_uploader_user_id_fkey';
            columns: ['uploader_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      support_messages: {
        Row: {
          author_role: string;
          author_user_id: string | null;
          created_at: string | null;
          id: string;
          is_internal: boolean;
          message: string;
          ticket_id: string;
        };
        Insert: {
          author_role?: string;
          author_user_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean;
          message: string;
          ticket_id: string;
        };
        Update: {
          author_role?: string;
          author_user_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean;
          message?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_messages_author_user_id_fkey';
            columns: ['author_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_messages_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
        ];
      };
      support_ticket_events: {
        Row: {
          actor_user_id: string | null;
          created_at: string | null;
          id: string;
          payload: Json | null;
          ticket_id: string;
          type: string;
        };
        Insert: {
          actor_user_id?: string | null;
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          ticket_id: string;
          type: string;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          ticket_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_ticket_events_actor_user_id_fkey';
            columns: ['actor_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_ticket_events_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_to: string | null;
          category: string;
          created_at: string | null;
          description: string;
          email: string | null;
          environment: Json | null;
          id: string;
          labels: string[] | null;
          meta: Json | null;
          name: string | null;
          severity: string | null;
          status: string;
          subject: string;
          updated_at: string | null;
          user_archived: boolean;
          user_deleted: boolean;
          user_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          category: string;
          created_at?: string | null;
          description: string;
          email?: string | null;
          environment?: Json | null;
          id?: string;
          labels?: string[] | null;
          meta?: Json | null;
          name?: string | null;
          severity?: string | null;
          status?: string;
          subject: string;
          updated_at?: string | null;
          user_archived?: boolean;
          user_deleted?: boolean;
          user_id: string;
        };
        Update: {
          assigned_to?: string | null;
          category?: string;
          created_at?: string | null;
          description?: string;
          email?: string | null;
          environment?: Json | null;
          id?: string;
          labels?: string[] | null;
          meta?: Json | null;
          name?: string | null;
          severity?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string | null;
          user_archived?: boolean;
          user_deleted?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_tickets_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_category_profiles: {
        Row: {
          created_at: string | null;
          profiles: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          profiles?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          profiles?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_category_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_integrations: {
        Row: {
          access_token: string;
          created_at: string;
          expires_at: string | null;
          id: number;
          provider: string;
          refresh_token: string | null;
          scopes: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          expires_at?: string | null;
          id?: number;
          provider: string;
          refresh_token?: string | null;
          scopes?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: number;
          provider?: string;
          refresh_token?: string | null;
          scopes?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_integrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_media_entries: {
        Row: {
          created_at: string | null;
          id: number;
          import_source: string | null;
          is_favorite: boolean | null;
          media_id: number;
          notes: string | null;
          pinned_rank: number | null;
          priority: number | null;
          progress: number | null;
          score: number | null;
          selected_platform: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          import_source?: string | null;
          is_favorite?: boolean | null;
          media_id: number;
          notes?: string | null;
          pinned_rank?: number | null;
          priority?: number | null;
          progress?: number | null;
          score?: number | null;
          selected_platform?: string | null;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          import_source?: string | null;
          is_favorite?: boolean | null;
          media_id?: number;
          notes?: string | null;
          pinned_rank?: number | null;
          priority?: number | null;
          progress?: number | null;
          score?: number | null;
          selected_platform?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_media_entries_media_id_fkey';
            columns: ['media_id'];
            isOneToOne: false;
            referencedRelation: 'media_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_media_entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_genre_affinity: {
        Row: {
          id: number;
          user_id: string;
          category: string;
          genre: string;
          score: number;
          item_count: number;
          strong_signal_count: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          category: string;
          genre: string;
          score?: number;
          item_count?: number;
          strong_signal_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          category?: string;
          genre?: string;
          score?: number;
          item_count?: number;
          strong_signal_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_genre_affinity_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          articles_enabled: boolean;
          community_activity_enabled: boolean;
          community_suggestions_enabled: boolean;
          created_at: string | null;
          reviews_enabled: boolean;
          social_enabled: boolean;
          theme: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          articles_enabled?: boolean;
          community_activity_enabled?: boolean;
          community_suggestions_enabled?: boolean;
          created_at?: string | null;
          reviews_enabled?: boolean;
          social_enabled?: boolean;
          theme?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          articles_enabled?: boolean;
          community_activity_enabled?: boolean;
          community_suggestions_enabled?: boolean;
          created_at?: string | null;
          reviews_enabled?: boolean;
          social_enabled?: boolean;
          theme?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          account_status: string | null;
          avatar_url: string | null;
          bio: string | null;
          categories: string[];
          country: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          display_name: string | null;
          email: string;
          email_verified: boolean | null;
          favorite_anime_genres: string[] | null;
          favorite_book_genres: string[] | null;
          favorite_genres: string[] | null;
          favorite_languages: string[] | null;
          favorite_movie_genres: string[] | null;
          favorite_platform: string | null;
          full_name: string | null;
          gaming_since: number | null;
          id: string;
          language_preference: string | null;
          last_login: string | null;
          location_city: string | null;
          nintendo_id: string | null;
          notification_settings: Json | null;
          pet_types: string[] | null;
          privacy_settings: Json | null;
          psn_id: string | null;
          roles: string[];
          social_links: Json | null;
          steam_id: string | null;
          timezone: string | null;
          total_games_completed: number | null;
          total_hours_played: number | null;
          total_platinums: number | null;
          updated_at: string | null;
          username: string;
          vape_device: string | null;
          vape_flavor: string | null;
          xbox_gamertag: string | null;
        };
        Insert: {
          account_status?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          categories?: string[];
          country?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          display_name?: string | null;
          email: string;
          email_verified?: boolean | null;
          favorite_anime_genres?: string[] | null;
          favorite_book_genres?: string[] | null;
          favorite_genres?: string[] | null;
          favorite_languages?: string[] | null;
          favorite_movie_genres?: string[] | null;
          favorite_platform?: string | null;
          full_name?: string | null;
          gaming_since?: number | null;
          id?: string;
          language_preference?: string | null;
          last_login?: string | null;
          location_city?: string | null;
          nintendo_id?: string | null;
          notification_settings?: Json | null;
          pet_types?: string[] | null;
          privacy_settings?: Json | null;
          psn_id?: string | null;
          roles?: string[];
          social_links?: Json | null;
          steam_id?: string | null;
          timezone?: string | null;
          total_games_completed?: number | null;
          total_hours_played?: number | null;
          total_platinums?: number | null;
          updated_at?: string | null;
          username: string;
          vape_device?: string | null;
          vape_flavor?: string | null;
          xbox_gamertag?: string | null;
        };
        Update: {
          account_status?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          categories?: string[];
          country?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          display_name?: string | null;
          email?: string;
          email_verified?: boolean | null;
          favorite_anime_genres?: string[] | null;
          favorite_book_genres?: string[] | null;
          favorite_genres?: string[] | null;
          favorite_languages?: string[] | null;
          favorite_movie_genres?: string[] | null;
          favorite_platform?: string | null;
          full_name?: string | null;
          gaming_since?: number | null;
          id?: string;
          language_preference?: string | null;
          last_login?: string | null;
          location_city?: string | null;
          nintendo_id?: string | null;
          notification_settings?: Json | null;
          pet_types?: string[] | null;
          privacy_settings?: Json | null;
          psn_id?: string | null;
          roles?: string[];
          social_links?: Json | null;
          steam_id?: string | null;
          timezone?: string | null;
          total_games_completed?: number | null;
          total_hours_played?: number | null;
          total_platinums?: number | null;
          updated_at?: string | null;
          username?: string;
          vape_device?: string | null;
          vape_flavor?: string | null;
          xbox_gamertag?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      category_dashboard_history: {
        Args: { p_category: string; p_since: string; p_user_id: string };
        Returns: {
          completed: number;
          day: string;
          dropped: number;
        }[];
      };
      cleanup_expired_steam_sync_jobs: { Args: never; Returns: undefined };
      has_any_role: { Args: { required_roles: string[] }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      is_admin_or_moderator: { Args: never; Returns: boolean };
      reorder_pins: {
        Args: { p_category: string; p_order: Json; p_user_id: string };
        Returns: undefined;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      update_user_last_login: { Args: { user_id: string }; Returns: undefined };
      user_set_support_ticket_flags: {
        Args: { p_archived?: boolean; p_deleted?: boolean; p_ticket_id: string };
        Returns: {
          assigned_to: string | null;
          category: string;
          created_at: string | null;
          description: string;
          email: string | null;
          environment: Json | null;
          id: string;
          labels: string[] | null;
          meta: Json | null;
          name: string | null;
          severity: string | null;
          status: string;
          subject: string;
          updated_at: string | null;
          user_archived: boolean;
          user_deleted: boolean;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'support_tickets';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

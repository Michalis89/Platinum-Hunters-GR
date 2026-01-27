'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ListChecks, Plus, Search, SortAsc, SortDesc } from 'lucide-react';
import {
  fetchBacklog,
  selectBacklogItems,
  selectBacklogLoading,
  selectBacklogError,
  selectBacklogStats,
  selectStatusCounts,
  clearBacklogError,
  updateBacklogItem,
} from '@/store/slices/backlogSlice';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import AlertMessage from '@/app/components/ui/AlertMessage';
import EmptyState from '@/app/components/ui/EmptyState';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Skeleton from '@/app/components/ui/Skeleton';
import { SearchBar } from '@/app/components/ui/SearchBar';
import BacklogStats from '@/app/components/backlog/BacklogStats';
import BacklogItem from '@/app/components/backlog/BacklogItem';
import BacklogListRow from '@/app/components/backlog/BacklogListRow';
import { UserBacklogWithGame } from '@/types/interfaces';
import AddToBacklogModal from '@/app/components/backlog/AddToBacklogModal';
import { setUser } from '@/store/slices/authSlice';
import CategoryLibrary, { isMediaCategory } from '@/app/components/backlog/CategoryLibrary';
import { PageHeader } from '@/app/components/layout';

type SortOption = 'priority' | 'added' | 'title' | 'hours' | 'difficulty';
type StatusTab = 'all' | 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';
type BacklogViewMode = 'grid' | 'list' | 'compact' | 'timeline';

function BacklogFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function BacklogPageClient() {
  return (
    <Suspense fallback={<BacklogFallback />}>
      <BacklogPageContent />
    </Suspense>
  );
}

function BacklogPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const mediaCategory = isMediaCategory(categoryParam) ? categoryParam : null;

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const backlogItems = useSelector(selectBacklogItems);
  const isLoading = useSelector(selectBacklogLoading);
  const error = useSelector(selectBacklogError);
  const stats = useSelector(selectBacklogStats);
  const statusCounts = useSelector(selectStatusCounts);
  const isAuthLoading = useSelector(
    (state: { auth: { isLoading: boolean } }) => state.auth.isLoading,
  );
  const hasCheckedSession = useRef(false);

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<BacklogViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    const stored = window.localStorage.getItem('backlogViewMode');
    return stored === 'list' || stored === 'compact' || stored === 'timeline'
      ? (stored as BacklogViewMode)
      : 'grid';
  });

  // Check authentication - wait for auth to initialize before redirecting
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Check if user has access to this category
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const hasAccessToCategory = !categoryParam || userCategories.length === 0 || userCategories.includes(categoryParam);

  // Refresh session once on mount to keep auth state in sync across reloads
  useEffect(() => {
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;
  }, [dispatch]);

  // Fetch backlog on mount
  useEffect(() => {
    if (isAuthenticated) {
      if (!mediaCategory) {
        dispatch(fetchBacklog({}));
      }
    }
  }, [isAuthenticated, dispatch, mediaCategory]);

  // If unauthorized error occurs, force logout so UI/state realigns
  useEffect(() => {
    if (!error) return;
    if (error === 'UNAUTHORIZED') {
      dispatch(setUser(null));
      router.push('/pages/auth/login');
    }
  }, [error, dispatch, router]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearBacklogError());
    };
  }, [dispatch]);

  // Persist view mode (Grid/List)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('backlogViewMode', viewMode);
  }, [viewMode]);

  // Filter and sort items
  const filteredAndSortedItems = backlogItems
    .filter(item => {
      // Filter by status tab
      if (activeTab !== 'all' && item.status !== activeTab) {
        return false;
      }
      // Filter by search
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return item.game.title.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          comparison = (b.priority || 0) - (a.priority || 0);
          break;
        case 'added':
          comparison = new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
          break;
        case 'title':
          comparison = a.game.title.localeCompare(b.game.title);
          break;
        case 'hours':
          comparison = (b.game.average_hours || 0) - (a.game.average_hours || 0);
          break;
        case 'difficulty':
          comparison = (b.game.average_difficulty || 0) - (a.game.average_difficulty || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, UserBacklogWithGame[]>();
    filteredAndSortedItems.forEach(item => {
      const releaseYear =
        typeof item.game?.release_year === 'number'
          ? item.game.release_year
          : item.added_at
            ? new Date(item.added_at).getFullYear()
            : null;
      const key = releaseYear ? releaseYear.toString() : 'Unknown';
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });

    const sorted = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === 'Unknown') return 1;
      if (b[0] === 'Unknown') return -1;
      return Number(b[0]) - Number(a[0]);
    });

    return sorted.map(([year, items]) => ({ year, items }));
  }, [filteredAndSortedItems]);

  const handleStatusChangeInline = async (
    id: number,
    newStatus: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped',
  ) => {
    try {
      await dispatch(updateBacklogItem({ id, status: newStatus })).unwrap();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Show skeleton while auth initializes
  if (isAuthLoading) {
    return <Skeleton type="backlog" />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Show access denied if user doesn't have this category enabled
  if (!hasAccessToCategory) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--hb-bg)] px-4 text-center">
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-8 shadow-lg">
          <div className="mb-4 text-6xl">🚫</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--hb-headline)]">
            Δεν έχεις πρόσβαση σε αυτή την κατηγορία
          </h2>
          <p className="mb-6 text-[var(--hb-muted)]">
            Για να δεις το <strong className="text-[var(--hb-headline)]">{categoryParam}</strong> backlog,
            πρέπει πρώτα να ενεργοποιήσεις αυτή την κατηγορία στο προφίλ σου.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push('/pages/profile/edit')}
              className="rounded-full bg-[var(--hb-primary-strong)] px-6 py-2 font-medium text-white transition hover:bg-[var(--hb-primary)]"
            >
              Ρυθμίσεις Προφίλ
            </button>
            <button
              onClick={() => router.push('/pages/hobbies')}
              className="rounded-full border border-[var(--hb-border)] px-6 py-2 font-medium text-[var(--hb-text)] transition hover:bg-white/5"
            >
              Πίσω στο Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mediaCategory) {
    return <CategoryLibrary category={mediaCategory} username={user?.username} />;
  }

  return (
    <div className="min-h-screen bg-[var(--hb-bg)] px-4 py-24 text-[var(--hb-text)]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PageHeader
            align="left"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hb-primary-strong)] shadow-lg shadow-[rgba(229,9,20,0.35)]">
                <ListChecks className="h-6 w-6 text-[var(--hb-bg)]" />
              </div>
            }
            title="Backlog Παιχνιδιών"
            meta={
              <>
                {user?.username ? `${user.username} • ` : ''}
                {stats.totalGames} παιχνίδια • ~{Math.round(stats.totalHours)} ώρες
              </>
            }
            contentClassName="items-start"
            titleClassName="text-4xl font-bold tracking-tight md:text-4xl"
            metaClassName="text-[var(--hb-muted)]"
          />
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlertMessage type="error" message={error} />
          </motion.div>
        )}

        {/* Stats Section */}
        {!isLoading && backlogItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <BacklogStats stats={stats} />
          </motion.div>
        )}

        {/* Status Tabs */}
        {!isLoading && backlogItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex justify-center justify-items-center gap-4 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'all'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Όλα
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {backlogItems.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('to_play')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'to_play'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Backlog
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {statusCounts.to_play || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('playing')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'playing'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Παίζω
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {statusCounts.playing || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'completed'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Ολοκληρώθηκε
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {statusCounts.completed || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('platinumed')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'platinumed'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Πλατίνα
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {statusCounts.platinumed || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('dropped')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'dropped'
                    ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)]'
                    : 'hover:border-[var(--hb-primary-strong)]/60 border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)]'
                }`}
              >
                Παρατημένο
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">
                  {statusCounts.dropped || 0}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Search, Sort, and Add */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-1 gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={value => setSearch(value)}
                placeholder="Αναζήτηση παιχνιδιών..."
                icon={<Search size={18} />}
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="hover:border-[var(--hb-primary-strong)]/60 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-2 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none"
            >
              <option value="priority">Προτεραιότητα</option>
              <option value="added">Ημερομηνία Προσθήκης</option>
              <option value="title">Τίτλος</option>
              <option value="hours">Ώρες</option>
              <option value="difficulty">Δυσκολία</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="hover:border-[var(--hb-primary-strong)]/60 flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-2 text-sm text-[var(--hb-text)] transition"
              title={sortOrder === 'desc' ? 'Φθίνουσα' : 'Αύξουσα'}
            >
              {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-2 py-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-[var(--hb-primary-strong)]/15 text-[var(--hb-headline)]'
                    : 'text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-[var(--hb-primary-strong)]/15 text-[var(--hb-headline)]'
                    : 'text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === 'compact'
                    ? 'bg-[var(--hb-primary-strong)]/15 text-[var(--hb-headline)]'
                    : 'text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === 'timeline'
                    ? 'bg-[var(--hb-primary-strong)]/15 text-[var(--hb-headline)]'
                    : 'text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--hb-primary-strong)] px-6 py-2 font-medium text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)] transition hover:brightness-110"
          >
            <Plus size={18} />
            Προσθήκη Παιχνιδιού
          </button>
        </motion.div>

        {/* Loading State */}
        {isLoading && <Skeleton type="backlog" />}

        {/* Empty State */}
        {!isLoading && backlogItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <EmptyState
              icon={<ListChecks className="h-10 w-10 text-[var(--hb-muted)]" />}
              title="Το backlog σου είναι άδειο"
              description="Πρόσθεσε παιχνίδια που θέλεις να παίξεις και οργάνωσε το backlog σου με προτεραιότητες!"
              action={
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-[var(--hb-primary-strong)] px-6 py-3 font-medium text-[var(--hb-bg)] shadow-md shadow-[rgba(229,9,20,0.35)] transition hover:brightness-110"
                >
                  <Plus size={20} />
                  Πρόσθεσε το πρώτο σου παιχνίδι
                </button>
              }
            />
          </motion.div>
        )}

        {/* Backlog Grid/List */}
        {!isLoading && filteredAndSortedItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {viewMode === 'grid' ? (
              <div className="max-h-[90vh] min-h-[70vh] overflow-y-auto pr-1">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <BacklogItem item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : viewMode === 'timeline' ? (
              <div className="space-y-4 overflow-x-auto pb-2">
                <div className="flex min-w-full gap-4">
                  {timelineGroups.map(group => (
                    <div
                      key={group.year}
                      className="min-w-[240px] rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3 shadow-inner shadow-black/30"
                    >
                      <div className="flex items-center justify-between text-sm text-[var(--hb-text)]">
                        <span className="text-base font-semibold text-[var(--hb-headline)]">
                          {group.year}
                        </span>
                        <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-[var(--hb-muted)]">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.items.map(item => (
                          <Link
                            key={item.id}
                            href={`/pages/guides/${item.game.slug}`}
                            className="hover:border-[var(--hb-primary-strong)]/60 group flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] p-2 text-xs text-[var(--hb-text)] transition"
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[var(--hb-panel)]">
                              <Image
                                src={
                                  item.game.cover_image ||
                                  item.game.background_image ||
                                  '/og-image.png'
                                }
                                alt={item.game.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold group-hover:text-[var(--hb-headline)]">
                                {item.game.title}
                              </p>
                              <p className="truncate text-[11px] text-[var(--hb-muted)]">
                                {item.game.platforms?.slice(0, 2).join(' • ') || 'N/A'}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-h-[80vh] min-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {filteredAndSortedItems.map(item => (
                  <BacklogListRow
                    key={item.id}
                    item={item}
                    compact={viewMode === 'compact'}
                    onStatusChange={status => handleStatusChangeInline(item.id, status)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && backlogItems.length > 0 && filteredAndSortedItems.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <EmptyState
              icon={<Search className="h-12 w-12 text-[var(--hb-muted)]" />}
              title="Δεν βρέθηκαν αποτελέσματα"
              description="Δοκίμασε άλλο όρο αναζήτησης ή φίλτρα"
              size="sm"
            />
          </motion.div>
        )}
      </div>

      {/* Add to Backlog Modal */}
      {showAddModal && <AddToBacklogModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

'use client';

/**
 * Backlog Page
 * PH-31: User Backlog System
 */

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
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
} from '@/store/slices/backlogSlice';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import AlertMessage from '@/app/components/ui/AlertMessage';
import Skeleton from '@/app/components/ui/Skeleton';
import { SearchBar } from '@/app/components/ui/SearchBar';
import BacklogStats from '@/app/components/backlog/BacklogStats';
import BacklogItem from '@/app/components/backlog/BacklogItem';
import AddToBacklogModal from '@/app/components/backlog/AddToBacklogModal';

type SortOption = 'priority' | 'added' | 'title' | 'hours' | 'difficulty';
type StatusTab = 'all' | 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';

export default function BacklogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

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

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);

  // Check authentication - wait for auth to initialize before redirecting
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Fetch backlog on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBacklog());
    }
  }, [isAuthenticated, dispatch]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearBacklogError());
    };
  }, [dispatch]);

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

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Show loading while auth initializes
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="text-slate-400">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-24 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 via-sky-400 to-emerald-400 shadow-lg shadow-blue-500/40">
              <ListChecks className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Το Backlog μου</h1>
              <p className="text-slate-400">
                {user?.username ? `${user.username} • ` : ''}
                {stats.totalGames} παιχνίδια • ~{Math.round(stats.totalHours)} ώρες
              </p>
            </div>
          </div>
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Όλα
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
                  {backlogItems.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('to_play')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'to_play'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Backlog
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
                  {statusCounts.to_play || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('playing')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'playing'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Παίζω
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
                  {statusCounts.playing || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Ολοκληρώθηκε
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
                  {statusCounts.completed || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('platinumed')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'platinumed'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Πλατίνα
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
                  {statusCounts.platinumed || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('dropped')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'dropped'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Παρατημένο
                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs">
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
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="priority">Προτεραιότητα</option>
              <option value="added">Ημερομηνία Προσθήκης</option>
              <option value="title">Τίτλος</option>
              <option value="hours">Ώρες</option>
              <option value="difficulty">Δυσκολία</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
              title={sortOrder === 'desc' ? 'Φθίνουσα' : 'Αύξουσα'}
            >
              {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow-md shadow-blue-500/40 transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Προσθήκη Παιχνιδιού
          </button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && backlogItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/30 py-20 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
              <ListChecks className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-slate-300">
              Το backlog σου είναι άδειο
            </h3>
            <p className="mb-6 max-w-md text-slate-400">
              Πρόσθεσε παιχνίδια που θέλεις να παίξεις και οργάνωσε το backlog σου με
              προτεραιότητες!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-md shadow-blue-500/40 transition hover:bg-blue-500"
            >
              <Plus size={20} />
              Πρόσθεσε το πρώτο σου παιχνίδι
            </button>
          </motion.div>
        )}

        {/* Backlog Grid */}
        {!isLoading && filteredAndSortedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
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
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && backlogItems.length > 0 && filteredAndSortedItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/30 py-16 text-center"
          >
            <Search className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="mb-2 text-xl font-semibold text-slate-300">Δεν βρέθηκαν αποτελέσματα</h3>
            <p className="text-slate-400">Δοκίμασε άλλο όρο αναζήτησης ή φίλτρα</p>
          </motion.div>
        )}
      </div>

      {/* Add to Backlog Modal */}
      {showAddModal && <AddToBacklogModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

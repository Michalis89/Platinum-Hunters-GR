type ExportStatus = 'planned' | 'current' | 'completed' | 'dropped';

type BacklogExportCategory = 'anime' | 'manga' | 'books' | 'movies' | 'tv' | 'games';

type BacklogExportEntry = {
  title: string;
  status: ExportStatus;
  score?: string;
  isFavorite?: boolean;
  tags?: string[];
  selectedPlatform?: string;
  platforms?: string[];
};

type GroupedEntries = Record<ExportStatus, BacklogExportEntry[]>;

type ExportRow = {
  Status: string;
  Title: string;
  Score: string;
  Favorite: string;
  Genres: string;
  Platform: string;
};

const STATUS_LABELS: Record<ExportStatus, string> = {
  planned: 'Backlog',
  current: 'In Progress',
  completed: 'Completed',
  dropped: 'Dropped',
};

const STATUS_ORDER: ExportStatus[] = ['planned', 'current', 'completed', 'dropped'];

const formatDateSegment = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const buildFilename = (category: BacklogExportCategory, extension: string) =>
  `backlog-${category}-${formatDateSegment()}.${extension}`;

const getPlatform = (entry: BacklogExportEntry) => {
  const selected = entry.selectedPlatform?.trim();
  if (selected) {
    return selected;
  }
  const firstPlatform = entry.platforms?.[0]?.trim();
  return firstPlatform || '';
};

const toRow = (entry: BacklogExportEntry): ExportRow => ({
  Status: STATUS_LABELS[entry.status],
  Title: entry.title,
  Score: entry.score?.trim() || '',
  Favorite: entry.isFavorite ? 'Yes' : 'No',
  Genres: entry.tags?.join(', ') || '',
  Platform: getPlatform(entry),
});

const groupByStatus = (entries: BacklogExportEntry[]): GroupedEntries => {
  const grouped: GroupedEntries = {
    planned: [],
    current: [],
    completed: [],
    dropped: [],
  };

  for (const entry of entries) {
    grouped[entry.status].push(entry);
  }

  return grouped;
};

const flattenRows = (grouped: GroupedEntries): ExportRow[] =>
  STATUS_ORDER.flatMap(status => grouped[status].map(toRow));

const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const triggerDownload = (blob: Blob, filename: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function exportBacklogAsCSV(entries: BacklogExportEntry[], category: BacklogExportCategory) {
  const rows = flattenRows(groupByStatus(entries));
  const header = ['Status', 'Title', 'Score', 'Favorite', 'Genres', 'Platform'];
  const csvLines = [
    header.join(','),
    ...rows.map(row =>
      [
        row.Status,
        row.Title,
        row.Score,
        row.Favorite,
        row.Genres,
        row.Platform,
      ]
        .map(escapeCsvValue)
        .join(','),
    ),
  ];

  const csv = csvLines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, buildFilename(category, 'csv'));
}

export async function exportBacklogAsExcel(
  entries: BacklogExportEntry[],
  category: BacklogExportCategory,
) {
  const XLSX = await import('xlsx');
  const rows = flattenRows(groupByStatus(entries));
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Status', 'Title', 'Score', 'Favorite', 'Genres', 'Platform'],
  });

  for (const headerCell of ['A1', 'B1', 'C1', 'D1', 'E1', 'F1']) {
    if (worksheet[headerCell]) {
      worksheet[headerCell].s = { font: { bold: true } };
    }
  }

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 10 },
    { wch: 12 },
    { wch: 28 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Library');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  triggerDownload(blob, buildFilename(category, 'xlsx'));
}

export function exportBacklogAsJSON(
  entries: BacklogExportEntry[],
  category: BacklogExportCategory,
) {
  const grouped = groupByStatus(entries);
  const payload = {
    category,
    exportedAt: new Date().toISOString(),
    data: {
      backlog: grouped.planned.map(entry => ({
        title: entry.title,
        score: entry.score?.trim() || null,
        favorite: Boolean(entry.isFavorite),
        genres: entry.tags ?? [],
        platform: getPlatform(entry) || null,
      })),
      inProgress: grouped.current.map(entry => ({
        title: entry.title,
        score: entry.score?.trim() || null,
        favorite: Boolean(entry.isFavorite),
        genres: entry.tags ?? [],
        platform: getPlatform(entry) || null,
      })),
      completed: grouped.completed.map(entry => ({
        title: entry.title,
        score: entry.score?.trim() || null,
        favorite: Boolean(entry.isFavorite),
        genres: entry.tags ?? [],
        platform: getPlatform(entry) || null,
      })),
      dropped: grouped.dropped.map(entry => ({
        title: entry.title,
        score: entry.score?.trim() || null,
        favorite: Boolean(entry.isFavorite),
        genres: entry.tags ?? [],
        platform: getPlatform(entry) || null,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerDownload(blob, buildFilename(category, 'json'));
}

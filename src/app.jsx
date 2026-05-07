// app.jsx — main app, sidebar/topbar, filtering, sort, keyboard nav

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.textContent = msg;
  const colors = { info: 'var(--accent)', error: '#f87171', success: '#4ade80' };
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${colors[type]||colors.info};color:#001014;padding:10px 18px;border-radius:100px;font-weight:700;font-size:13px;z-index:9999;box-shadow:0 8px 24px var(--accent-glow);font-family:'JetBrains Mono',monospace;white-space:nowrap;`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

const SEARCH_MODES = [
  { id: 'all', label: 'All Fields' },
  { id: 'name', label: 'Game Name' },
  { id: 'id', label: 'Game ID' },
  { id: 'publisher', label: 'Publisher' },
  { id: 'developer', label: 'Developer' },
  { id: 'tags', label: 'Tags' },
];

function searchTextFor(game, mode) {
  const fields = {
    all: [game.Name, game.Profile, game.Platform, game.Emulator, game.Genres.join(' '), game.Publisher, game.Developer, game.Tags.join(' ')],
    name: [game.Name],
    id: [game.Profile],
    publisher: [game.Publisher],
    developer: [game.Developer],
    tags: [game.Tags.join(' ')],
  };
  return (fields[mode] || fields.all).filter(Boolean).join(' ').toLowerCase();
}

function buildSearchSuggestions(games, query, mode) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const names = [];
  const fields = [];
  const seen = new Set();
  const pushUnique = (arr, label, meta) => {
    if (!label) return;
    const key = `${label}|${meta}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    arr.push({ label, meta });
  };
  for (const game of games) {
    if (game.Name?.toLowerCase().includes(q)) pushUnique(names, game.Name, 'Game Name');
    const values = mode === 'all'
      ? [
          [game.Profile, 'Game ID'],
          [game.Publisher, 'Publisher'],
          [game.Developer, 'Developer'],
          ...game.Tags.map(t => [t, 'Tag']),
        ]
      : mode === 'id' ? [[game.Profile, 'Game ID']]
      : mode === 'publisher' ? [[game.Publisher, 'Publisher']]
      : mode === 'developer' ? [[game.Developer, 'Developer']]
      : mode === 'tags' ? game.Tags.map(t => [t, 'Tag'])
      : [];
    for (const [value, meta] of values) {
      if (value?.toLowerCase().includes(q)) pushUnique(fields, value, meta);
    }
  }
  return [...names, ...fields].slice(0, 8);
}

function Topbar({ query, setQuery, searchMode, setSearchMode, games, view, setView, total, filtered, installed, onTweaks, tweaksOn, onLogs, logsOn, onSettings, settingsOn, gpConnected, sidebarOpen, onToggleSidebar, tpRunning, onLaunchTekno }) {
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestDismissedFor, setSuggestDismissedFor] = useState(null);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const activeMode = SEARCH_MODES.find(m => m.id === searchMode) || SEARCH_MODES[0];
  const suggestions = useMemo(() => buildSearchSuggestions(games, query, searchMode), [games, query, searchMode]);
  useEffect(() => {
    setSuggestIndex(-1);
  }, [query, searchMode, suggestions.length]);
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    const closeOnOutside = (e) => {
      if (searchRef.current?.contains(e.target)) return;
      setModeOpen(false);
      setSuggestOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside, true);
    document.addEventListener('touchstart', closeOnOutside, true);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside, true);
      document.removeEventListener('touchstart', closeOnOutside, true);
    };
  }, []);
  return (
    <header className="topbar">
      <div className="brand">
        <img
          src="/ParrotOrganizer/logo/ParrotOrganizer_256.png"
          alt="Parrot Organizer"
          className="brand-logo"
        />
        <span className="brand-tag">v2.0</span>
      </div>
      <div className="search" ref={searchRef}>
        <button
          className="search-mode-btn"
          onClick={() => setModeOpen(o => !o)}
          title={`Search mode: ${activeMode.label}`}
          aria-label="Choose search mode"
        >
          <Icon name="search" size={14}/>
        </button>
        {modeOpen && (
          <div className="search-mode-menu">
            {SEARCH_MODES.map(mode => (
              <button
                key={mode.id}
                className={mode.id === searchMode ? 'active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchMode(mode.id);
                  setModeOpen(false);
                  inputRef.current?.focus();
                }}
              >{mode.label}</button>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          placeholder={`Search ${activeMode.label.toLowerCase()}...`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSuggestDismissedFor(null);
            setSuggestOpen(true);
            setSuggestIndex(-1);
          }}
          onFocus={() => { if (suggestDismissedFor !== query) setSuggestOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setModeOpen(false);
              setSuggestOpen(false);
              setSuggestDismissedFor(query);
              return;
            }
            if (suggestions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault();
              setSuggestOpen(true);
              setSuggestIndex(i => {
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                if (i < 0) return e.key === 'ArrowDown' ? 0 : suggestions.length - 1;
                return (i + delta + suggestions.length) % suggestions.length;
              });
              return;
            }
            if (e.key === 'Enter' && suggestOpen && suggestions[suggestIndex]) {
              e.preventDefault();
              setQuery(suggestions[suggestIndex].label);
              setSuggestOpen(false);
              setSuggestDismissedFor(suggestions[suggestIndex].label);
              return;
            }
            if (e.key === 'Enter' && suggestOpen) {
              setSuggestOpen(false);
              setSuggestDismissedFor(query);
            }
          }}
          onBlur={() => setTimeout(() => { setSuggestOpen(false); setModeOpen(false); }, 120)}
        />
        {suggestOpen && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={`${s.label}-${i}`}
                className={i === suggestIndex ? 'active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(s.label);
                  setSuggestOpen(false);
                  setSuggestDismissedFor(s.label);
                  inputRef.current?.focus();
                }}
                onMouseEnter={() => setSuggestIndex(i)}
              >
                <span>{s.label}</span>
                <small>{s.meta}</small>
              </button>
            ))}
          </div>
        )}
        <kbd>⌘K</kbd>
      </div>
      <div className="stats-pill">
        <span className="stats-item"><span className="num">{total}</span> total</span>
        <span className="stats-sep">·</span>
        <span className="stats-item"><span className="num">{installed}</span> installed</span>
        <span className="stats-sep">·</span>
        <span className="stats-item"><span className="num">{filtered}</span> showing</span>
      </div>
      <div className={'tp-status' + (tpRunning ? ' running' : ' ready')} title={tpRunning ? 'TeknoParrotUI is currently running' : 'Ready to launch games'}>
        <span className="tp-status-dot"/>
        <span className="tp-status-text">{tpRunning ? 'RUNNING' : 'READY'}</span>
      </div>
      <button className="btn-launch-tp" onClick={onLaunchTekno} title="Open TeknoParrotUI">
        <img src="/ParrotOrganizer/logo/ParrotOrganizer_256.png" alt="" className="btn-launch-tp-icon"/>
        Launch TeknoParrot
      </button>
      <div className="topbar-actions">
        <div className="viewmodes">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Grid view"><Icon name="grid" size={14}/></button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="List view"><Icon name="table" size={14}/></button>
        </div>
        <button className={'icon-btn' + (tweaksOn ? ' active' : '')} onClick={onTweaks} title="Tweaks">
          <Icon name="sliders" size={14}/>
        </button>
        <button className={'icon-btn' + (logsOn ? ' active' : '')} onClick={onLogs} title="Debug Log">
          <Icon name="terminal" size={14}/>
        </button>
        <button className={'icon-btn' + (settingsOn ? ' active' : '')} onClick={onSettings} title="App Settings">
          <Icon name="settings" size={14}/>
        </button>
        <span className={'gp-dot' + (gpConnected ? ' on' : '')} title={gpConnected ? 'Gamepad connected' : 'No gamepad detected'}>
          <Icon name="gamepad" size={14}/>
        </span>
      </div>
    </header>
  );
}

function FilterGroup({ title, items, selected, onToggle, max = 8, category, focus, setFocus }) {
  const [open, setOpen]         = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isFocused = focus === category;
  const activeCount = items.filter(it => selected.has(it.label)).length;
  const list = expanded ? items : items.slice(0, max);
  return (
    <>
      <h3 className="h3-collapsible" onClick={() => setOpen(o => !o)}>
        <span className="h3-title">
          {title}
          {activeCount > 0 && <span className="h3-active-badge">{activeCount}</span>}
          {category && (
            <button
              className={'focus-btn' + (isFocused ? ' on' : '')}
              onClick={(e) => { e.stopPropagation(); setFocus(isFocused ? null : category); }}
              title={isFocused ? `Stop coloring by ${title.toLowerCase()}` : `Color cards by ${title.toLowerCase()}`}
              aria-label={isFocused ? `Stop coloring by ${title}` : `Color cards by ${title}`}
            ></button>
          )}
        </span>
        <span className={'h3-arrow' + (open ? ' open' : '')}>›</span>
      </h3>
      {open && (
        <>
          <div className="filter-list">
            {list.map(it => {
              const dot = it.dot || (isFocused ? colorFor(category, it.label, { l: 0.66, c: 0.16 }) : null);
              const isActive = selected.has(it.label);
              const rowStyle = isActive && dot
                ? { background: colorFor(category, it.label, { l: 0.66, c: 0.16, alpha: 0.16 }), color: dot }
                : null;
              const countStyle = isActive && dot ? { color: dot } : null;
              return (
                <div
                  key={it.label}
                  className={'filter-row' + (isActive ? ' active' : '')}
                  style={rowStyle}
                  onClick={() => onToggle(it.label)}
                >
                  <span className="label">
                    {dot && <span className="dot" style={{background: dot}}></span>}
                    {it.label}
                  </span>
                  <span className="count" style={countStyle}>{it.count}</span>
                </div>
              );
            })}
          </div>
          {items.length > max && (
            <button className="filter-more-btn" onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}>
              {expanded ? 'Show less' : `+${items.length - max} more`}
            </button>
          )}
        </>
      )}
    </>
  );
}

function SidebarSection({ title, children, activeCount = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h3 className="h3-collapsible" onClick={() => setOpen(o => !o)}>
        <span className="h3-title">
          {title}
          {activeCount > 0 && <span className="h3-active-badge">{activeCount}</span>}
        </span>
        <span className={'h3-arrow' + (open ? ' open' : '')}>›</span>
      </h3>
      {open && children}
    </>
  );
}

function YearRange({ min, max, value, onChange }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null);
  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const rect = trackRef.current.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const yr = Math.round(min + t * (max - min));
      if (drag === 'lo') onChange([Math.min(yr, value[1]), value[1]]);
      else onChange([value[0], Math.max(yr, value[0])]);
    };
    const up = () => setDrag(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [drag, min, max, value, onChange]);
  const loPct = ((value[0] - min) / (max - min)) * 100;
  const hiPct = ((value[1] - min) / (max - min)) * 100;
  return (
    <>
      <div className="year-range"><span>{value[0]}</span><span>{value[1]}</span></div>
      <div className="year-slider" ref={trackRef}>
        <div className="fill" style={{left: loPct + '%', right: (100 - hiPct) + '%'}}></div>
        <div className="handle" style={{left: loPct + '%'}} onMouseDown={() => setDrag('lo')}></div>
        <div className="handle" style={{left: hiPct + '%'}} onMouseDown={() => setDrag('hi')}></div>
      </div>
    </>
  );
}

function Sidebar({ games, filters, setFilters, yearBounds, focus, setFocus }) {
  const counts = useMemo(() => {
    const groupBy = (key) => {
      const m = new Map();
      for (const g of games) {
        const v = g[key];
        if (!v) continue;
        m.set(v, (m.get(v) || 0) + 1);
      }
      return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };
    const genreMap = new Map();
    for (const g of games) for (const genre of g.Genres) genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    const genreItems = [...genreMap.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    const interfaces = (() => {
      const m = new Map();
      for (const g of games) for (const i of g.Interfaces) m.set(i, (m.get(i)||0)+1);
      return [...m.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count);
    })();
    return {
      genres:     genreItems,
      platforms:  groupBy('Platform'),
      emulators:  groupBy('Emulator'),
      interfaces,
      publishers: groupBy('Publisher'),
      developers: groupBy('Developer'),
      players:    groupBy('Players'),
    };
  }, [games]);

  const toggle = (key, value) => {
    setFilters(prev => {
      const set = new Set(prev[key]);
      if (set.has(value)) set.delete(value); else set.add(value);
      return { ...prev, [key]: set };
    });
  };

  const gpuActive    = (filters.gpuNvidia ? 1 : 0) + (filters.gpuAMD ? 1 : 0) + (filters.gpuIntel ? 1 : 0);
  const quickActive  = (filters.favorites ? 1 : 0) + (filters.installed ? 1 : 0) + (filters.notInstalled ? 1 : 0)
    + (filters.showHidden ? 1 : 0)
    + (filters.subscription !== 'any' ? 1 : 0);
  const yearActive   = (filters.years[0] !== yearBounds[0] || filters.years[1] !== yearBounds[1]) ? 1 : 0;

  const totalActive = filters.genres.size + filters.platforms.size + filters.emulators.size + filters.interfaces.size
    + filters.publishers.size + filters.developers.size + filters.players.size
    + gpuActive + quickActive + yearActive;

  return (
    <aside className="sidebar">
    <div className="sidebar-inner">
      <FilterGroup title="Genre"      category="genres"     focus={focus} setFocus={setFocus} items={counts.genres}     selected={filters.genres}     onToggle={(v) => toggle('genres', v)}     max={10} />
      <FilterGroup title="Platform"   category="platforms"  focus={focus} setFocus={setFocus} items={counts.platforms}  selected={filters.platforms}  onToggle={(v) => toggle('platforms', v)}  max={8}  />
      <FilterGroup title="Emulator"   category="emulators"  focus={focus} setFocus={setFocus} items={counts.emulators}  selected={filters.emulators}  onToggle={(v) => toggle('emulators', v)}  max={6}  />
      <FilterGroup title="Controller" category="interfaces" focus={focus} setFocus={setFocus} items={counts.interfaces} selected={filters.interfaces} onToggle={(v) => toggle('interfaces', v)} max={8}  />
      <FilterGroup title="Publisher"  items={counts.publishers} selected={filters.publishers} onToggle={(v) => toggle('publishers', v)} max={8} />
      <FilterGroup title="Developer"  items={counts.developers} selected={filters.developers} onToggle={(v) => toggle('developers', v)} max={8} />
      <FilterGroup title="Players"    items={counts.players}    selected={filters.players}    onToggle={(v) => toggle('players', v)}    max={8} />

      <SidebarSection title="Year" activeCount={yearActive}>
        <YearRange min={yearBounds[0]} max={yearBounds[1]} value={filters.years} onChange={(v) => setFilters(p => ({...p, years: v}))} />
      </SidebarSection>

      <SidebarSection title="GPU Compatibility" activeCount={gpuActive}>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, gpuNvidia: !p.gpuNvidia}))}>
          <span>Nvidia OK</span>
          <span className={'toggle' + (filters.gpuNvidia ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, gpuAMD: !p.gpuAMD}))}>
          <span>AMD OK</span>
          <span className={'toggle' + (filters.gpuAMD ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, gpuIntel: !p.gpuIntel}))}>
          <span>Intel OK</span>
          <span className={'toggle' + (filters.gpuIntel ? ' on' : '')}></span>
        </div>
      </SidebarSection>

      <SidebarSection title="Quick Filters" activeCount={quickActive}>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, favorites: !p.favorites}))}>
          <span>Favorites only</span>
          <span className={'toggle' + (filters.favorites ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, installed: !p.installed, notInstalled: false}))}>
          <span>Installed only</span>
          <span className={'toggle' + (filters.installed ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, notInstalled: !p.notInstalled, installed: false}))}>
          <span>Not Installed only</span>
          <span className={'toggle' + (filters.notInstalled ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, showHidden: !p.showHidden}))}>
          <span>Show Hidden games</span>
          <span className={'toggle' + (filters.showHidden ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, subscription: p.subscription === 'only' ? 'any' : 'only'}))}>
          <span>Subscription only</span>
          <span className={'toggle' + (filters.subscription === 'only' ? ' on' : '')}></span>
        </div>
        <div className="toggle-row" onClick={() => setFilters(p => ({...p, subscription: p.subscription === 'no' ? 'any' : 'no'}))}>
          <span>Hide subscription games</span>
          <span className={'toggle' + (filters.subscription === 'no' ? ' on' : '')}></span>
        </div>
      </SidebarSection>

      {totalActive > 0 && (
        <button className="clear-all" onClick={() => setFilters(initialFilters(yearBounds))}>
          Clear all ({totalActive})
        </button>
      )}
    </div>
    </aside>
  );
}

function initialFilters(yearBounds) {
  return {
    genres:     new Set(),
    platforms:  new Set(),
    emulators:  new Set(),
    interfaces: new Set(),
    publishers: new Set(),
    developers: new Set(),
    players:    new Set(),
    years: [yearBounds[0], yearBounds[1]],
    favorites: false,
    installed: false,
    subscription: 'any',
    gpuNvidia: false,
    gpuAMD: false,
    gpuIntel: false,
    notInstalled: false,
    showHidden: false,
  };
}

const SORTS = [
  { id: 'name-asc',      label: 'Name (A → Z)' },
  { id: 'name-desc',     label: 'Name (Z → A)' },
  { id: 'year-desc',     label: 'Newest first' },
  { id: 'year-asc',      label: 'Oldest first' },
  { id: 'genre-asc',     label: 'Genre (A → Z)' },
  { id: 'genre-desc',    label: 'Genre (Z → A)' },
  { id: 'platform-asc',  label: 'Platform (A → Z)' },
  { id: 'platform-desc', label: 'Platform (Z → A)' },
  { id: 'emulator-asc',      label: 'Emulator (A → Z)'      },
  { id: 'emulator-desc',     label: 'Emulator (Z → A)'      },
  { id: 'controls-asc',      label: 'Controls (A → Z)'      },
  { id: 'controls-desc',     label: 'Controls (Z → A)'      },
  { id: 'subscription-asc',  label: 'Subscription: free first'  },
  { id: 'subscription-desc', label: 'Subscription: required first' },
  { id: 'installed-asc',     label: 'Installed first'        },
  { id: 'installed-desc',    label: 'Not installed first'    },
  { id: 'favorite-asc',      label: 'Favorites first'        },
  { id: 'favorite-desc',     label: 'Non-favorites first'    },
  { id: 'random',            label: 'Random shuffle'         },
];

const COL_SORT = {
  name:         { asc: 'name-asc',          desc: 'name-desc'          },
  year:         { asc: 'year-asc',          desc: 'year-desc'          },
  genre:        { asc: 'genre-asc',         desc: 'genre-desc'         },
  platform:     { asc: 'platform-asc',      desc: 'platform-desc'      },
  emulator:     { asc: 'emulator-asc',      desc: 'emulator-desc'      },
  controls:     { asc: 'controls-asc',      desc: 'controls-desc'      },
  subscription: { asc: 'subscription-asc',  desc: 'subscription-desc'  },
  installed:    { asc: 'installed-asc',     desc: 'installed-desc'     },
  favorite:     { asc: 'favorite-asc',      desc: 'favorite-desc'      },
};

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('all');
  const [view, setView] = useState(() => localStorage.getItem('po-view') || 'grid');
  const [sort, setSort] = useState(() => localStorage.getItem('po-sort') || 'name-asc');
  const [selected, setSelected] = useState(null);
  // favorites, notes, and hidden come from DB3 (seeded from merged DB on load)
  const [favorites, setFavorites] = useState(new Set());
  const [hidden, setHidden] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [tweaks, setTweaksLocal] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('po-tweaks') || 'null');
      return saved ? { ...window.__TWEAKS__, ...saved } : window.__TWEAKS__;
    } catch { return window.__TWEAKS__; }
  });
  const [tweaksOn, setTweaksOn] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [focus, setFocus] = useState('genres');
  const [installedProfiles, setInstalledProfiles] = useState(new Set());
  const [launchingGame, setLaunchingGame] = useState(null);
  const [settingsGame, setSettingsGame] = useState(null); // game open in settings editor
  const [controlsGame, setControlsGame] = useState(null); // game open in controls editor
  const [logOpen, setLogOpen] = useState(false);
  const [metadataGame, setMetadataGame] = useState(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem('po-sidebar') !== 'closed'; } catch { return true; }
  });
  const [teknoFound, setTeknoFound] = useState(true);
  const [teknoPath, setTeknoPath] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [tpRunning, setTpRunning] = useState(false);

  useEffect(() => { try { localStorage.setItem('po-sort', sort); } catch {} }, [sort]);
  useEffect(() => { try { localStorage.setItem('po-view', view); } catch {} }, [view]);

  // Poll TeknoParrot running status every 5 seconds
  useEffect(() => {
    const poll = () => fetch('/__launchStatus')
      .then(r => r.json())
      .then(d => setTpRunning(!!d.teknoParrotRunning))
      .catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const yearBounds = useMemo(() => {
    if (!games.length) return [1999, 2025];
    const ys = games.map(g => g.Year).filter(Boolean);
    return [Math.min(...ys), Math.max(...ys)];
  }, [games]);

  const [filters, setFilters] = useState(initialFilters([1999, 2025]));

  useEffect(() => {
    if (games.length) setFilters(p => ({ ...p, years: [yearBounds[0], yearBounds[1]] }));
  }, [games.length, yearBounds[0], yearBounds[1]]);

  // Load games (seeding favorites+notes from DB) and installed profiles in parallel
  useEffect(() => {
    const dbLoad = loadGames().then(g => {
      setGames(g);
      setFavorites(new Set(g.filter(x => x.Favorite).map(x => x.Profile)));
      setHidden(new Set(g.filter(x => x.Hidden).map(x => x.Profile)));
      setNotes(Object.fromEntries(g.filter(x => x.Notes).map(x => [x.Profile, x.Notes])));
    });
    const instLoad = fetch('/__userProfiles')
      .then(r => r.json())
      .then(data => { if (data.ok) setInstalledProfiles(new Set(data.profiles)); })
      .catch(() => {});
    const exeCheck = fetch('/__checkTeknoParrotExe')
      .then(r => r.json())
      .then(d => { setTeknoFound(d.exists); if (d.expectedPath) setTeknoPath(d.expectedPath); })
      .catch(() => {}); // server down → keep teknoFound=true, don't block
    Promise.all([dbLoad, instLoad, exeCheck]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.accent  = tweaks.accent;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.dataset.cardSize = tweaks.cardSize;
    document.documentElement.dataset.showMeta = String(tweaks.showMeta);
    document.documentElement.dataset.bg = tweaks.background;
    document.documentElement.dataset.theme = tweaks.theme || 'dark';
  }, [tweaks]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode')   setTweaksOn(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOn(false);
      if (e.data.type === '__edit_mode_dismissed')  setTweaksOn(false); // X button inside panel
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = typeof k === 'object' ? { ...tweaks, ...k } : { ...tweaks, [k]: v };
    setTweaksLocal(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: next}, '*');
    try { localStorage.setItem('po-tweaks', JSON.stringify(next)); } catch {}
  };

  const launchTeknoParrot = useCallback(async () => {
    try {
      await fetch('/__openTeknoParrot', { method: 'POST' });
      setTimeout(() => fetch('/__launchStatus').then(r => r.json()).then(d => setTpRunning(!!d.teknoParrotRunning)).catch(() => {}), 1500);
    } catch {
      showToast('Could not launch TeknoParrotUI', 'error');
    }
  }, []);

  const refreshGames = useCallback(async () => {
    const g = await loadGames();
    setGames(g);
    setFavorites(new Set(g.filter(x => x.Favorite).map(x => x.Profile)));
    setHidden(new Set(g.filter(x => x.Hidden).map(x => x.Profile)));
    setNotes(Object.fromEntries(g.filter(x => x.Notes).map(x => [x.Profile, x.Notes])));
    setSelected(prev => prev ? (g.find(x => x.Profile === prev.Profile) || null) : null);
  }, []);

  // ── Refs so gamepad callbacks always see latest state without restarts ──────
  // Note: these refs are updated in useEffects placed AFTER filtered/view/installedProfiles are defined.
  const filteredRef    = useRef([]);
  const viewRef        = useRef(view);
  const installedRef   = useRef(installedProfiles);

  // ── Gamepad ───────────────────────────────────────────────────────────────
  const gpEnabled = !settingsGame && !controlsGame && !metadataGame && !confirmDialog && !settingsPanelOpen;

  const { connected: gpConnected } = useGamepad({
    enabled: gpEnabled,

    onNavigate: useCallback((dir) => {
      const f    = filteredRef.current;
      const cols = viewRef.current === 'list' ? 1 : 5;
      setSelected(prev => {
        const idx  = f.findIndex(g => g.Profile === prev?.Profile);
        let next   = idx;
        if      (dir === 'right') next = idx < 0 ? 0 : Math.min(f.length - 1, idx + 1);
        else if (dir === 'left')  next = idx < 0 ? 0 : Math.max(0, idx - 1);
        else if (dir === 'down')  next = idx < 0 ? 0 : Math.min(f.length - 1, idx + cols);
        else if (dir === 'up')    next = idx < 0 ? 0 : Math.max(0, idx - cols);
        return f[next] !== undefined ? f[next] : (prev || f[0] || null);
      });
    }, []),

    onAction: useCallback((action) => {
      const f    = filteredRef.current;
      const cols = viewRef.current === 'list' ? 1 : 5;
      switch (action) {
        case 'select':
          setSelected(prev => {
            if (!prev) return f[0] || null;
            if (installedRef.current.has(prev.Profile)) launch(prev);
            return prev;
          });
          break;
        case 'back':     setSelected(null); break;
        case 'favorite': setSelected(prev => { if (prev) toggleFav(prev.Profile); return prev; }); break;
        case 'details':  setSelected(prev => prev || f[0] || null); break;
        case 'pageUp':
          setSelected(prev => {
            const idx = f.findIndex(g => g.Profile === prev?.Profile);
            return f[Math.max(0, (idx < 0 ? 0 : idx) - cols * 3)] || prev || null;
          });
          break;
        case 'pageDown':
          setSelected(prev => {
            const idx = f.findIndex(g => g.Profile === prev?.Profile);
            return f[Math.min(f.length - 1, Math.max(0, idx) + cols * 3)] || prev || null;
          });
          break;
        case 'lb': setFilters(p => {
          if (!p.installed && !p.notInstalled) return {...p, notInstalled: true};
          if (p.notInstalled) return {...p, notInstalled: false, installed: true};
          return {...p, installed: false};
        }); break;
        case 'rb': setFilters(p => {
          if (!p.installed && !p.notInstalled) return {...p, installed: true};
          if (p.installed) return {...p, installed: false, notInstalled: true};
          return {...p, notInstalled: false};
        }); break;
        case 'view':     setView(v => v === 'grid' ? 'list' : 'grid'); break;
        case 'settings': setTweaksOn(o => !o); break;
        case 'home':     setSelected(f[0] || null); break;
      }
    }, [launch, toggleFav]),
  });

  const handleColSort = (col) => {
    const map = COL_SORT[col];
    if (!map) return;
    setSort(sort === map.asc ? map.desc : map.asc);
  };
  const colDir = (col) => {
    const map = COL_SORT[col];
    if (!map) return null;
    if (sort === map.asc) return 'asc';
    if (sort === map.desc) return 'desc';
    return null;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = games.filter(g => {
      if (q) {
        const hay = searchTextFor(g, searchMode);
        if (!hay.includes(q)) return false;
      }
      if (filters.genres.size     && !g.Genres.some(gr => filters.genres.has(gr)))          return false;
      if (filters.platforms.size  && !filters.platforms.has(g.Platform))                    return false;
      if (filters.emulators.size  && !filters.emulators.has(g.Emulator))                    return false;
      if (filters.interfaces.size && !g.Interfaces.some(i => filters.interfaces.has(i)))    return false;
      if (filters.publishers.size && !filters.publishers.has(g.Publisher))                  return false;
      if (filters.developers.size && !filters.developers.has(g.Developer))                  return false;
      if (filters.players.size    && !filters.players.has(g.Players))                       return false;
      if (g.Year !== null) {
        if (g.Year < filters.years[0] || g.Year > filters.years[1]) return false;
      }
      if (!filters.showHidden && hidden.has(g.Profile))                   return false;
      if (filters.favorites && !favorites.has(g.Profile))                 return false;
      if (filters.installed && !installedProfiles.has(g.Profile))         return false;
      if (filters.notInstalled && installedProfiles.has(g.Profile))       return false;
      if (filters.subscription === 'no'   && g.Subscription)             return false;
      if (filters.subscription === 'only' && !g.Subscription)            return false;
      if (filters.gpuNvidia && g.GpuNvidia !== 'OK')                     return false;
      if (filters.gpuAMD    && g.GpuAMD    !== 'OK')                     return false;
      if (filters.gpuIntel  && g.GpuIntel  !== 'OK')                     return false;
      return true;
    });
    arr = [...arr];
    switch (sort) {
      case 'name-asc':  arr.sort((a,b) => a.Name.localeCompare(b.Name)); break;
      case 'name-desc': arr.sort((a,b) => b.Name.localeCompare(a.Name)); break;
      case 'year-desc': arr.sort((a,b) => (b.Year ?? -1) - (a.Year ?? -1)); break;
      case 'year-asc':  arr.sort((a,b) => (a.Year ?? 9999) - (b.Year ?? 9999)); break;
      case 'genre-asc':
      case 'genre':      arr.sort((a,b) => a.GenreNorm.localeCompare(b.GenreNorm) || a.Name.localeCompare(b.Name)); break;
      case 'genre-desc': arr.sort((a,b) => b.GenreNorm.localeCompare(a.GenreNorm) || a.Name.localeCompare(b.Name)); break;
      case 'platform-asc':
      case 'platform':      arr.sort((a,b) => a.Platform.localeCompare(b.Platform)  || a.Name.localeCompare(b.Name)); break;
      case 'platform-desc': arr.sort((a,b) => b.Platform.localeCompare(a.Platform)  || a.Name.localeCompare(b.Name)); break;
      case 'emulator-asc':      arr.sort((a,b) => a.Emulator.localeCompare(b.Emulator) || a.Name.localeCompare(b.Name)); break;
      case 'emulator-desc':     arr.sort((a,b) => b.Emulator.localeCompare(a.Emulator) || a.Name.localeCompare(b.Name)); break;
      case 'controls-asc':      arr.sort((a,b) => (a.Interfaces[0]||'').localeCompare(b.Interfaces[0]||'') || a.Name.localeCompare(b.Name)); break;
      case 'controls-desc':     arr.sort((a,b) => (b.Interfaces[0]||'').localeCompare(a.Interfaces[0]||'') || a.Name.localeCompare(b.Name)); break;
      case 'subscription-asc':  arr.sort((a,b) => (a.Subscription ? 1 : 0) - (b.Subscription ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'subscription-desc': arr.sort((a,b) => (b.Subscription ? 1 : 0) - (a.Subscription ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'installed-asc':     arr.sort((a,b) => (installedProfiles.has(b.Profile) ? 1 : 0) - (installedProfiles.has(a.Profile) ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'installed-desc':    arr.sort((a,b) => (installedProfiles.has(a.Profile) ? 1 : 0) - (installedProfiles.has(b.Profile) ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'favorite-asc':      arr.sort((a,b) => (favorites.has(b.Profile) ? 1 : 0) - (favorites.has(a.Profile) ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'favorite-desc':     arr.sort((a,b) => (favorites.has(a.Profile) ? 1 : 0) - (favorites.has(b.Profile) ? 1 : 0) || a.Name.localeCompare(b.Name)); break;
      case 'random': {
        const seed = shuffleSeed;
        arr.sort((a,b) => {
          const ah = (hashStr(a.Profile) ^ seed) >>> 0;
          const bh = (hashStr(b.Profile) ^ seed) >>> 0;
          return ah - bh;
        });
        break;
      }
    }
    const noFavBump = ['random','favorite-asc','favorite-desc','installed-asc','installed-desc','subscription-asc','subscription-desc'];
    if (tweaks.favoriteFirst && !noFavBump.includes(sort)) {
      arr.sort((a, b) => (favorites.has(a.Profile) ? 0 : 1) - (favorites.has(b.Profile) ? 0 : 1));
    }
    return arr;
  }, [games, query, searchMode, filters, sort, favorites, hidden, shuffleSeed, installedProfiles, tweaks.favoriteFirst]);

  // Keep refs in sync so the stable gamepad rAF loop always reads current values
  useEffect(() => { filteredRef.current  = filtered;          }, [filtered]);
  useEffect(() => { viewRef.current      = view;              }, [view]);
  useEffect(() => { installedRef.current = installedProfiles; }, [installedProfiles]);

  const toggleFav = useCallback((profile) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const nowFav = !next.has(profile);
      nowFav ? next.add(profile) : next.delete(profile);
      // Persist to DB3 asynchronously — UI updates instantly
      saveUserField(profile, { Favorite: nowFav ? 'yes' : '' });
      return next;
    });
  }, []);

  const toggleHide = useCallback((profile) => {
    setHidden(prev => {
      const next = new Set(prev);
      const nowHidden = !next.has(profile);
      nowHidden ? next.add(profile) : next.delete(profile);
      saveUserField(profile, { Hidden: nowHidden ? 'yes' : '' });
      return next;
    });
  }, []);

  // Debounce ref so rapid typing doesn't fire a server write per keystroke
  const noteTimers = useRef({});
  const updateNotes = useCallback((profile, text) => {
    setNotes(prev => ({ ...prev, [profile]: text }));
    clearTimeout(noteTimers.current[profile]);
    noteTimers.current[profile] = setTimeout(() => {
      saveUserField(profile, { Notes: text });
    }, 800);
  }, []);

  const launch = useCallback(async (game) => {
    if (!installedProfiles.has(game.Profile)) {
      showToast(`${game.Name} is not installed`, 'error');
      return;
    }
    setLaunchingGame(game);
    try {
      const res = await fetch(`/__launch?profile=${encodeURIComponent(game.Profile)}`);
      const data = await res.json();
      if (!data.ok) {
        setLaunchingGame(null);
        showToast(`Launch failed: ${data.error || 'Unknown error'}`, 'error');
      }
      // On success: popup auto-dismisses via blur or 3.5s timeout
    } catch {
      // Server not running — popup still shows, dismiss on blur
    }
  }, [installedProfiles]);

  const installGame = useCallback(async (game) => {
    try {
      const res = await fetch(`/__install?profile=${encodeURIComponent(game.Profile)}`);
      const data = await res.json();
      if (data.ok) {
        setInstalledProfiles(prev => new Set([...prev, game.Profile]));
        showToast(`${game.Name} installed`, 'success');
      } else {
        showToast(`Install failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch {
      showToast('Server not available', 'error');
    }
  }, []);

  const uninstallGame = useCallback((game) => {
    setConfirmDialog({
      title: 'Uninstall Game',
      message: `Remove ${game.Name}? This deletes the UserProfile settings.`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/__remove?profile=${encodeURIComponent(game.Profile)}`, { method: 'POST' });
          const data = await res.json();
          if (data.ok) {
            setInstalledProfiles(prev => { const s = new Set(prev); s.delete(game.Profile); return s; });
            showToast(`${game.Name} removed`, 'info');
          } else {
            showToast(`Remove failed: ${data.error || 'Unknown error'}`, 'error');
          }
        } catch {
          showToast('Server not available', 'error');
        }
      },
    });
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (confirmDialog) { if (e.key === 'Escape') setConfirmDialog(null); return; }
      // Global shortcuts — always active
      if (e.key === 'Escape') {
        setSettingsPanelOpen(false);
        setTweaksOn(false);
        setSelected(null);
        setLogOpen(false);
        return;
      }
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        setView(v => v === 'grid' ? 'list' : 'grid'); return;
      }
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        setTweaksOn(o => !o); return;
      }
      if (!filtered.length) return;
      const idx = filtered.findIndex(g => g.Profile === selected?.Profile);
      let next = idx;
      const cols = view === 'list' ? 1 : 5;
      if      (e.key === 'ArrowRight') next = idx < 0 ? 0 : Math.min(filtered.length - 1, idx + 1);
      else if (e.key === 'ArrowLeft')  next = idx < 0 ? 0 : Math.max(0, idx - 1);
      else if (e.key === 'ArrowDown')  next = idx < 0 ? 0 : Math.min(filtered.length - 1, idx + cols);
      else if (e.key === 'ArrowUp')    next = idx < 0 ? 0 : Math.max(0, idx - cols);
      else if (e.key === 'PageDown')   next = Math.min(filtered.length - 1, Math.max(0, idx) + cols * 3);
      else if (e.key === 'PageUp')     next = Math.max(0, Math.max(0, idx) - cols * 3);
      else if (e.key.toLowerCase() === 'h') next = 0;
      else if (e.key === 'Enter' && selected) { launch(selected); return; }
      else if (e.key.toLowerCase() === 'f' && selected) { toggleFav(selected.Profile); return; }
      else return;
      if (next !== idx) {
        e.preventDefault();
        setSelected(filtered[next] || null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selected, view, launch, toggleFav, confirmDialog]);

  // Scroll selected card into view during keyboard nav
  useEffect(() => {
    if (!selected) return;
    const el = document.querySelector(`[data-profile="${CSS.escape(selected.Profile)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  // Active filter chips
  const activeChips = [];
  for (const k of ['genres','platforms','emulators','interfaces','publishers','developers','players']) {
    for (const v of filters[k]) activeChips.push({ k, v });
  }
  if (filters.favorites)               activeChips.push({ k:'favorites',    v:'★ Favorites only',   literal:true });
  if (filters.installed)               activeChips.push({ k:'installed',    v:'Installed only',      literal:true });
  if (filters.subscription === 'no')   activeChips.push({ k:'subscription', v:'Hide subscriptions', literal:true });
  if (filters.subscription === 'only') activeChips.push({ k:'subscription', v:'Subscription only',  literal:true });
  if (filters.gpuNvidia)               activeChips.push({ k:'gpuNvidia',   v:'Nvidia OK',           literal:true });
  if (filters.gpuAMD)                  activeChips.push({ k:'gpuAMD',      v:'AMD OK',              literal:true });
  if (filters.gpuIntel)                activeChips.push({ k:'gpuIntel',    v:'Intel OK',            literal:true });
  if (filters.notInstalled)            activeChips.push({ k:'notInstalled',v:'Not Installed only',  literal:true });
  if (filters.showHidden)              activeChips.push({ k:'showHidden',  v:'Showing Hidden',      literal:true });
  if (filters.years[0] !== yearBounds[0] || filters.years[1] !== yearBounds[1])
    activeChips.push({ k:'years', v:`${filters.years[0]}–${filters.years[1]}`, literal:true });

  const removeChip = (chip) => {
    setFilters(prev => {
      const n = { ...prev };
      if (chip.literal) {
        if (chip.k === 'favorites')    n.favorites    = false;
        else if (chip.k === 'installed')    n.installed    = false;
        else if (chip.k === 'subscription') n.subscription = 'any';
        else if (chip.k === 'gpuNvidia')    n.gpuNvidia    = false;
        else if (chip.k === 'gpuAMD')       n.gpuAMD       = false;
        else if (chip.k === 'gpuIntel')     n.gpuIntel     = false;
        else if (chip.k === 'notInstalled')    n.notInstalled    = false;
        else if (chip.k === 'showHidden')      n.showHidden      = false;
        else if (chip.k === 'years')           n.years           = [yearBounds[0], yearBounds[1]];
      } else {
        const s = new Set(prev[chip.k]); s.delete(chip.v); n[chip.k] = s;
      }
      return n;
    });
  };

  if (loading) {
    return <div style={{display:'grid',placeItems:'center',height:'100vh',color:'var(--text-2)',fontFamily:"'JetBrains Mono',monospace"}}>Loading game database…</div>;
  }

  if (!teknoFound) {
    return <SetupScreen expectedPath={teknoPath} onRetry={(found) => setTeknoFound(found)} />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(o => {
      const next = !o;
      try { localStorage.setItem('po-sidebar', next ? 'open' : 'closed'); } catch {}
      return next;
    });
  };

  return (
    <div className={'app' + (selected ? ' with-detail' : '') + (sidebarOpen ? '' : ' sidebar-collapsed')}>
      <Topbar
        query={query} setQuery={setQuery}
        searchMode={searchMode} setSearchMode={setSearchMode}
        games={games}
        view={view} setView={setView}
        total={games.length} filtered={filtered.length}
        installed={installedProfiles.size}
        onTweaks={() => setTweaksOn(o => !o)}
        tweaksOn={tweaksOn}
        onLogs={() => setLogOpen(o => !o)}
        logsOn={logOpen}
        onSettings={() => setSettingsPanelOpen(o => !o)}
        settingsOn={settingsPanelOpen}
        gpConnected={gpConnected}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        tpRunning={tpRunning}
        onLaunchTekno={launchTeknoParrot}
      />
      <Sidebar games={games} filters={filters} setFilters={setFilters} yearBounds={yearBounds} focus={focus} setFocus={setFocus} />

      <button
        className="sidebar-tab"
        onClick={toggleSidebar}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="sidebar-tab-arrow">{sidebarOpen ? '‹' : '›'}</span>
      </button>

      <main className="main">
        <div className="main-header">
          <div className="main-title">
            <h1>{filters.favorites ? 'Favorites' : 'All Games'}</h1>
            <div className="sub">
              <b>{filtered.length}</b> shown · {favorites.size} favorited · {installedProfiles.size} installed{hidden.size > 0 ? ` · ${hidden.size} hidden` : ''}
            </div>
          </div>
          {view !== 'list' && (
            <div className="sort-select">
              Sort
              <select value={sort} onChange={(e) => { setSort(e.target.value); if (e.target.value === 'random') setShuffleSeed(s => s+1); }}>
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="active-filters">
            {activeChips.map((c, i) => (
              <span key={i} className="chip">
                {!c.literal && <span className="key">{c.k.replace(/s$/,'')}:</span>}
                {c.v}
                <button className="x" onClick={() => removeChip(c)}>×</button>
              </span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="glyph"><Icon name="search" size={28}/></div>
            <h3>No games match your filters</h3>
            <p>Try clearing a few filters or adjusting your search.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid">
            {filtered.map(g => (
              <GameCard
                key={g.Profile}
                game={g}
                focus={focus}
                selected={selected?.Profile === g.Profile}
                isFav={favorites.has(g.Profile)}
                isInstalled={installedProfiles.has(g.Profile)}
                onClick={(game) => setSelected(prev => prev?.Profile === game.Profile ? null : game)}
                onLaunch={launch}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        ) : (
          <div className="list-view">
            <div className="list-header">
              <div></div>
              {[
                { col: 'name',     label: 'Game Name' },
                { col: 'id',       label: 'Game ID',  noSort: true },
                { col: 'year',     label: 'Year' },
                { col: 'genre',    label: 'Genre' },
                { col: 'platform', label: 'Platform' },
                { col: 'emulator', label: 'Emulator' },
              ].map(({ col, label, noSort }) => {
                if (noSort) return <div key={col}>{label}</div>;
                const dir = colDir(col);
                return (
                  <button key={col} className={'col-sort' + (dir ? ' active' : '')} onClick={() => handleColSort(col)}>
                    {label}{dir && <i className="col-sort-arrow">{dir === 'asc' ? ' ↑' : ' ↓'}</i>}
                  </button>
                );
              })}
              {[
                { col: 'controls',     label: 'Controls'      },
                { col: 'subscription', label: 'Subscription'  },
                { col: 'installed',    label: 'Installed'     },
                { col: 'favorite',     label: 'Favorite'      },
              ].map(({ col, label }) => {
                const dir = colDir(col);
                return (
                  <button key={col} className={'col-sort' + (dir ? ' active' : '')} onClick={() => handleColSort(col)}>
                    {label}{dir && <i className="col-sort-arrow">{dir === 'asc' ? ' ↑' : ' ↓'}</i>}
                  </button>
                );
              })}
            </div>
            {filtered.map(g => (
              <ListRow
                key={g.Profile}
                game={g}
                selected={selected?.Profile === g.Profile}
                isFav={favorites.has(g.Profile)}
                isInstalled={installedProfiles.has(g.Profile)}
                onClick={(game) => setSelected(prev => prev?.Profile === game.Profile ? null : game)}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <DetailPanel
          key={selected.Profile}
          game={selected}
          isFav={favorites.has(selected.Profile)}
          isInstalled={installedProfiles.has(selected.Profile)}
          onClose={() => setSelected(null)}
          onToggleFav={toggleFav}
          onLaunch={launch}
          onInstall={installGame}
          onUninstall={uninstallGame}
          onEdit={setMetadataGame}
          onSettings={setSettingsGame}
          onControls={setControlsGame}
          isHidden={hidden.has(selected.Profile)}
          onToggleHide={toggleHide}
          notes={notes[selected.Profile]}
          onNotesChange={updateNotes}
          launching={!!launchingGame}
        />
      )}

      {metadataGame && (
        <MetadataEditor
          game={metadataGame}
          onClose={() => setMetadataGame(null)}
          onSaved={refreshGames}
          autocomplete={{
            genres:     [...new Set(games.map(g => g.GenreNorm).filter(Boolean))].sort(),
            platforms:  [...new Set(games.map(g => g.Platform).filter(Boolean))].sort(),
            interfaces: [...new Set(games.flatMap(g => g.Interfaces))].sort(),
            tags:       [...new Set(games.flatMap(g => g.Tags))].sort(),
          }}
        />
      )}

      {settingsGame && (
        <SettingsEditor game={settingsGame} onClose={() => setSettingsGame(null)} />
      )}

      {controlsGame && (
        <ControlsEditor game={controlsGame} onClose={() => setControlsGame(null)} />
      )}

      {launchingGame && (
        <LaunchPopup game={launchingGame} onDismiss={() => setLaunchingGame(null)} />
      )}

      {logOpen && (
        <DebugLogPanel onClose={() => setLogOpen(false)} />
      )}

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {settingsPanelOpen && (
        <AppSettingsPanel
          onClose={() => setSettingsPanelOpen(false)}
          onRefreshGames={refreshGames}
          setConfirmDialog={setConfirmDialog}
        />
      )}

      {tweaksOn && (
        <TweaksPanel>
          <TweakSection label="Theme" />
          <TweakRadio label="Mode"       value={tweaks.theme}      onChange={(v) => setTweak('theme', v)}      options={['dark','light']} />
          <TweakRadio label="Accent"     value={tweaks.accent}     onChange={(v) => setTweak('accent', v)}     options={['cyan','amber','magenta','lime','violet']} />
          <TweakRadio label="Background" value={tweaks.background} onChange={(v) => setTweak('background', v)} options={['clean','grid','scanlines']} />
          <TweakSection label="Layout" />
          <TweakRadio label="Card size" value={tweaks.cardSize} onChange={(v) => setTweak('cardSize', v)} options={['S','M','L']} />
          <TweakRadio label="Density"   value={tweaks.density}  onChange={(v) => setTweak('density', v)}  options={['comfy','compact']} />
          <TweakToggle label="Show metadata" value={tweaks.showMeta} onChange={(v) => setTweak('showMeta', v)}/>
          <TweakToggle label="Favorites first" value={!!tweaks.favoriteFirst} onChange={(v) => setTweak('favoriteFirst', v)}/>
          <TweakSection label="Shortcuts" />
          <div style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:'var(--text-2)',lineHeight:1.8}}>
            <div><kbd>⌘K</kbd> Search</div>
            <div><kbd>← → ↑ ↓</kbd> Navigate grid</div>
            <div><kbd>PgUp / PgDn</kbd> Jump page</div>
            <div><kbd>H</kbd> First game</div>
            <div><kbd>Enter</kbd> Launch selected</div>
            <div><kbd>F</kbd> Toggle favorite</div>
            <div><kbd>V</kbd> Toggle grid / list</div>
            <div><kbd>S</kbd> Tweaks panel</div>
            <div><kbd>Esc</kbd> Close panels</div>
          </div>
          <TweakSection label="Reset" />
          <div style={{padding:'0 4px 8px'}}>
            <button
              className="dm-btn"
              onClick={() => {
                try {
                  localStorage.removeItem('po-tweaks');
                  localStorage.removeItem('po-sort');
                  localStorage.removeItem('po-view');
                } catch {}
                setTweaksLocal(window.__TWEAKS__);
                setSort('name-asc');
                setView('grid');
                showToast('UI preferences reset', 'info');
              }}
            >Reset UI Preferences</button>
          </div>
        </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

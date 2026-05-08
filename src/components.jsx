// components.jsx — Icon, Card, ListRow, DetailPanel

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── SVG icon primitives ───
function Icon({ name, size = 14 }) {
  const paths = {
    search: <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>,
    star: <path d="M12 2.5l3 6.3 6.5.95-4.7 4.55 1.1 6.6L12 17.7 6.1 20.9l1.1-6.6L2.5 9.75 9 8.8z" fill="currentColor"/>,
    starOutline: <path d="M12 2.5l3 6.3 6.5.95-4.7 4.55 1.1 6.6L12 17.7 6.1 20.9l1.1-6.6L2.5 9.75 9 8.8z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>,
    play: <path d="M7 4v16l13-8z" fill="currentColor"/>,
    grid: <g fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></g>,
    list: <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></g>,
    table: <g stroke="currentColor" strokeWidth="1.4" fill="none"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14h18M9 4v16"/></g>,
    close: <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    chevron: <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    sliders: <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"><path d="M4 6h10M4 12h6M4 18h13"/><circle cx="17" cy="6" r="2" fill="currentColor"/><circle cx="13" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="18" r="2" fill="currentColor"/></g>,
    external: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></g>,
    folder: <g stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g>,
    download: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 20h16"/></g>,
    trash: <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></g>,
    joystick: <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="6" r="2.5"/><path d="M12 8.5v7"/><rect x="5" y="15" width="14" height="5" rx="1.5"/></g>,
    wheel: <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6M4 12h6M14 12h6M12 14v6"/></g>,
    gun: <path d="M3 10h11l3-3v3h3v4h-3l-3 3v-3H7l-2 4-2-1z" fill="none" stroke="currentColor" strokeWidth="1.4"/>,
    flight: <path d="M12 3l1 7 8 4-8 1v5l-1 1-1-1v-5l-8-1 8-4z" fill="currentColor"/>,
    touch: <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11V6a2 2 0 1 1 4 0v8"/><path d="M13 9a2 2 0 0 1 4 0v6a4 4 0 0 1-4 4H10l-4-4 1-1 3 1"/></g>,
    card: <g fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3 10h18"/></g>,
    drum: <g fill="none" stroke="currentColor" strokeWidth="1.4"><ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8a8 3 0 0 0 16 0V8"/></g>,
    guitar: <path d="M14 4l6 6-2 2-2-2-3 3a4 4 0 1 1-2-2l3-3-2-2z" fill="none" stroke="currentColor" strokeWidth="1.4"/>,
    fightstick: <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="13" r="2"/><circle cx="14" cy="13" r="1.5"/><circle cx="17" cy="11" r="1.5"/><circle cx="17" cy="15" r="1.5"/><rect x="3" y="9" width="18" height="9" rx="1.5"/></g>,
    sword: <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M14 4l6 0 0 6-9 9-3-3z"/><path d="M5 19l3 3"/></g>,
    track: <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></g>,
    bike: <g fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 17h18"/><path d="M5 14l3-7h4l3 7"/><circle cx="6" cy="14" r="1"/><circle cx="18" cy="14" r="1"/></g>,
    nvidia: <text x="2" y="17" fontSize="9" fontWeight="700" fill="currentColor" fontFamily="sans-serif">NV</text>,
    amd: <text x="2" y="17" fontSize="9" fontWeight="700" fill="currentColor" fontFamily="sans-serif">AMD</text>,
    intel: <text x="1" y="17" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="sans-serif">INTL</text>,
    terminal: <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 9l3 3-3 3M13 15h4"/></g>,
    settings: <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>,
    upload:   <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 20h16"/></g>,
    refresh:  <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.36 4.36A9 9 0 0 1 3.51 15"/></g>,
    edit:    <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></g>,
    gamepad: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="17" cy="13" r="1.2" fill="currentColor" stroke="none"/></g>,
    sidebarLeft: <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></g>,
    bug: <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6M12 12v4M8 12H4l-1-4h5M16 12h4l1-4h-5M8 6l-2-4M16 6l2-4"/><ellipse cx="12" cy="13" rx="4" ry="5"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block'}}>
      {paths[name] || null}
    </svg>
  );
}

const INTERFACE_ICONS = {
  'Joystick': 'joystick',
  'Steering Wheel': 'wheel',
  'Light Gun': 'gun',
  'Flight Stick': 'flight',
  'Touchscreen': 'touch',
  'Card Reader': 'card',
  'Drums': 'drum',
  'Guitar': 'guitar',
  'Fightstick': 'fightstick',
  'Trackball': 'track',
  'Bike Handlebars': 'bike',
};

// ─── Game icon (real image or gradient placeholder) ───
function GameIcon({ game }) {
  const [imgError, setImgError] = useState(false);
  if (game.IconUrl && !imgError) {
    return <img src={game.IconUrl} alt={game.Name} loading="lazy" onError={() => setImgError(true)} />;
  }
  const style = placeholderStyle(game);
  return (
    <div className="placeholder-icon" style={style}>
      {initials(game.Name)}
    </div>
  );
}

// ─── GPU compat pill ───
function GpuPill({ vendor, status, issues }) {
  if (!status || status === '') return null;
  const colors = GPU_STATUS_COLORS[status] || GPU_STATUS_COLORS['NO_INFO'];
  const label = GPU_STATUS_LABELS[status] || '?';
  return (
    <div
      className="gpu-pill"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
      title={issues ? `${vendor}: ${issues}` : `${vendor}: ${label}`}
    >
      <span className="gpu-vendor">{vendor}</span>
      <span className="gpu-status">{label}</span>
      {issues && <span className="gpu-warn">⚠</span>}
    </div>
  );
}

// ─── Card ───
function GameCard({ game, selected, isFav, isInstalled, onClick, onLaunch, onToggleFav, focus }) {
  const ctrlChips = game.Interfaces.slice(0, 2);

  const pillStyle = (cat, label) => {
    if (focus !== cat || !label) return null;
    return {
      color: colorFor(cat, label, { l: 0.78, c: 0.16 }),
      background: colorFor(cat, label, { l: 0.66, c: 0.16, alpha: 0.16 }),
      borderColor: colorFor(cat, label, { l: 0.66, c: 0.16, alpha: 0.30 }),
    };
  };
  const platformTextStyle = (focus === 'platforms' && game.Platform)
    ? { color: colorFor('platforms', game.Platform, { l: 0.78, c: 0.14 }) }
    : null;

  return (
    <div
      className={'card' + (selected ? ' selected' : '')}
      data-profile={game.Profile}
      onClick={() => onClick(game)}
    >
      <div className="icon-wrap">
        <GameIcon game={game} />
        <div className="play-overlay">
          {isInstalled ? (
            <button
              className="play-btn"
              onClick={(e) => { e.stopPropagation(); onLaunch(game); }}
            >
              <Icon name="play" size={10} /> Launch
            </button>
          ) : (
            <button
              className="play-btn"
              style={{background:'var(--bg-3)', color:'var(--text-0)', boxShadow:'0 8px 16px rgba(0,0,0,.5)'}}
              onClick={(e) => { e.stopPropagation(); onClick(game); }}
            >
              <Icon name="search" size={10} /> Details
            </button>
          )}
        </div>
        <div className="icon-badges">
          <button
            className={'fav-btn' + (isFav ? ' on' : '')}
            onClick={(e) => { e.stopPropagation(); onToggleFav(game.Profile); }}
            aria-label="Toggle favorite"
            title={isFav ? 'Unfavorite' : 'Add to favorites'}
          >
            <Icon name={isFav ? 'star' : 'starOutline'} size={14} />
          </button>
          <span
            className={'install-badge ' + (isInstalled ? 'installed' : 'uninstalled')}
            title={isInstalled ? 'Installed' : 'Not installed'}
          >
            <span className="led"></span>
          </span>
        </div>
      </div>
      <div className="meta">
        <div className="name-row">
          <div className="name" title={game.Name}>{game.Name}</div>
          <div className="year-genre-row">
            <span className="year">
              {game.Year || (game.Release || '—')}
              {game.Subscription && <span className="sub-marker" title="Subscription required"></span>}
            </span>
            <span
              className="genre-tag"
              style={pillStyle('genres', game.GenreNorm)}
              title={`Genre: ${game.GenreNorm}`}
            >{game.GenreNorm}</span>
          </div>
        </div>
        <div className="card-divider"></div>
        <div className="platform-line" title={game.Platform} style={platformTextStyle}>{game.Platform || '—'}</div>
        <div className="chips">
          {game.Emulator && (
            <span className="chip-mini emu" title={`Emulator: ${game.Emulator}`} style={pillStyle('emulators', game.Emulator)}>
              {game.Emulator}
            </span>
          )}
          {ctrlChips.map(intf => (
            <span key={intf} className="chip-mini" title={intf} style={pillStyle('interfaces', intf)}>
              <Icon name={INTERFACE_ICONS[intf] || 'joystick'} size={10}/>
              {intf}
            </span>
          ))}
          {game.Interfaces.length > 2 && (
            <span className="chip-mini" title={game.Interfaces.slice(2).join(', ')}>
              +{game.Interfaces.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List row ───
function ListRow({ game, selected, isFav, isInstalled, onClick, onToggleFav }) {
  const controlsText = game.Interfaces.length
    ? game.Interfaces.slice(0, 2).join(', ') + (game.Interfaces.length > 2 ? ` +${game.Interfaces.length - 2}` : '')
    : '—';

  return (
    <div
      className={'list-row' + (selected ? ' selected' : '')}
      data-profile={game.Profile}
      onClick={() => onClick(game)}
    >
      {/* Icon */}
      <div className="mini-icon">
        {game.IconUrl
          ? <img src={game.IconUrl} alt="" loading="lazy" onError={(e) => { e.target.style.display='none'; }} />
          : <div className="ph" style={placeholderStyle(game)}>{initials(game.Name)}</div>}
      </div>
      {/* Game Name */}
      <div className="name" title={game.Name}>{game.Name}</div>
      {/* Game ID */}
      <div className="lr-id mono" title={game.Profile}>{game.Profile}</div>
      {/* Year */}
      <div className="mono">{game.Year || '—'}</div>
      {/* Genre */}
      <div><span className="pill accent">{game.GenreNorm}</span></div>
      {/* Platform */}
      <div className="mono" title={game.Platform} style={{fontSize:11}}>{game.Platform || '—'}</div>
      {/* Emulator */}
      <div className="mono" title={game.Emulator} style={{fontSize:11}}>{game.Emulator || '—'}</div>
      {/* Controls (words) */}
      <div className="lr-controls mono" title={game.Interfaces.join(', ')}>{controlsText}</div>
      {/* Subscription */}
      <div>{game.Subscription
        ? <span className="pill" style={{background:'rgba(245,158,11,.18)',color:'#f59e0b',fontSize:10,padding:'2px 6px'}}>SUB</span>
        : <span style={{color:'var(--text-3)'}}>—</span>}
      </div>
      {/* Installed dot */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <span className={'install-badge ' + (isInstalled ? 'installed' : 'uninstalled')} title={isInstalled ? 'Installed' : 'Not installed'}>
          <span className="led"></span>
        </span>
      </div>
      {/* Favorite star */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <button
          className={'fav-btn' + (isFav ? ' on' : '')}
          style={{position:'static', opacity: isFav ? 1 : 0.35}}
          onClick={(e) => { e.stopPropagation(); onToggleFav(game.Profile); }}
          title={isFav ? 'Unfavorite' : 'Favorite'}
        >
          <Icon name={isFav ? 'star' : 'starOutline'} size={13}/>
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ───
function DetailPanel({ game, isFav, isInstalled, isHidden, onClose, onToggleFav, onLaunch, onInstall, onUninstall, onSettings, onControls, onEdit, onToggleHide, notes, onNotesChange, launching }) {
  if (!game) return null;
  const [boxErr, setBoxErr]       = useState(false);
  const [wheelErr, setWheelErr]   = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const heroBgStyle = game.IconUrl ? { backgroundImage: `url(${game.IconUrl})` } : null;
  const hasGpuInfo  = game.GpuNvidia !== 'NO_INFO' || game.GpuAMD !== 'NO_INFO' || game.GpuIntel !== 'NO_INFO';

  return (
    <aside className="detail">
      {/* Box art hero — shown when available, otherwise falls back to icon hero */}
      {game.MediaBox && !boxErr ? (
        <div className="detail-hero detail-hero-boxart">
          <img
            src={game.MediaBox}
            alt={game.Name}
            className="detail-boxart"
            onError={() => setBoxErr(true)}
          />
          {game.MediaWheel && !wheelErr && (
            <img src={game.MediaWheel} alt="" className="detail-wheel-overlay" onError={() => setWheelErr(true)}/>
          )}
          <button className="detail-close" onClick={onClose}><Icon name="close" size={14}/></button>
          <button className={'detail-fav' + (isFav ? ' on' : '')} onClick={() => onToggleFav(game.Profile)}>
            <Icon name={isFav ? 'star' : 'starOutline'} size={14}/>
          </button>
        </div>
      ) : (
        <div className="detail-hero">
          {heroBgStyle && <div className="detail-hero-bg" style={heroBgStyle}></div>}
          <div className="detail-hero-img">
            <GameIcon game={game} />
          </div>
          <button className="detail-close" onClick={onClose}><Icon name="close" size={14}/></button>
          <button className={'detail-fav' + (isFav ? ' on' : '')} onClick={() => onToggleFav(game.Profile)}>
            <Icon name={isFav ? 'star' : 'starOutline'} size={14}/>
          </button>
        </div>
      )}
      <div className="detail-body">
        <div className="detail-genre">{game.GenreNorm}{game.Year ? ` · ${game.Year}` : ''}</div>
        <h2 className="detail-title">{game.Name}</h2>
        <div className="detail-subtitle">{game.Profile}</div>
        {game.PrimaryProfile && (
          <div className="detail-alias">Alias of {game.PrimaryProfile}</div>
        )}

        {/* 1 ── Launch / Install / Folder */}
        <div className="launch-row">
          <button
            className="btn-launch"
            onClick={() => isInstalled ? onLaunch(game) : onInstall(game)}
            disabled={isInstalled && launching}
            title={isInstalled ? 'Launch game' : 'Install game'}
          >
            <Icon name={isInstalled ? 'play' : 'download'} size={11}/>
            {isInstalled ? (launching ? 'Launching...' : 'Launch Game') : 'Install Game'}
          </button>
          {isInstalled && (
            <button className="btn-secondary btn-danger" title="Uninstall game" onClick={() => onUninstall(game)}>
              <Icon name="trash" size={14}/>
            </button>
          )}
          {isInstalled && (
            <button
              className="btn-secondary"
              title="Open game folder"
              onClick={() => fetch(`/__openFolder?profile=${encodeURIComponent(game.Profile)}`, {method:'POST'})
                .then(r => r.json())
                .then(d => { if (!d.ok) showToast(d.error || 'Could not open game folder', 'error'); })
                .catch(() => showToast('Could not open game folder', 'error'))}
            >
              <Icon name="folder" size={14}/>
            </button>
          )}
          <button className="btn-secondary" title="Edit game info" onClick={() => onEdit(game)}>
            <Icon name="edit" size={14}/>
          </button>
        </div>

        {/* 2 ── Genre */}
        {game.Genres.length > 0 && !(game.Genres.length === 1 && game.Genres[0] === 'Other') && (
          <div className="detail-section">
            <h4>Genre</h4>
            <div className="tag-row">
              {game.Genres.map((g, i) => (
                <span key={g} className={'tag' + (i === 0 ? ' tag-primary' : '')}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* 3 ── Description */}
        {game.Description && (
          <div className="detail-section">
            <h4>Description</h4>
            <div className={'desc-clamp-wrap' + (descExpanded ? ' expanded' : '')}>
              <p className="desc-text">{game.Description}</p>
              {!descExpanded && <div className="desc-fade"/>}
            </div>
            <button className="desc-toggle" onClick={() => setDescExpanded(e => !e)}>
              {descExpanded ? 'Show less ↑' : 'Read more ↓'}
            </button>
          </div>
        )}

        {/* 4 ── Settings / Controls (installed only) */}
        {isInstalled && (
          <div className="editor-btn-row">
            <button className="btn-editor" onClick={() => onSettings(game)} title="Edit game settings">
              <Icon name="sliders" size={13}/> Settings
            </button>
            <button className="btn-editor" onClick={() => onControls(game)} title="Remap controls">
              <Icon name="joystick" size={13}/> Controls
            </button>
          </div>
        )}

        {/* 5 ── Spec matrix */}
        <div className="spec-grid">
          <div className="spec"><span className="k">Platform</span><span className="v">{game.Platform || '—'}</span></div>
          <div className="spec"><span className="k">Emulator</span><span className="v mono">{game.Emulator || '—'}</span></div>
          <div className="spec"><span className="k">Released</span><span className="v mono">{game.Release || '—'}</span></div>
          <div className="spec"><span className="k">Subscription</span><span className="v">{game.Subscription ? 'Required' : 'No'}</span></div>
          {game.Developer && (
            <div className="spec"><span className="k">Developer</span><span className="v">{game.Developer}</span></div>
          )}
          {game.Publisher && (
            <div className="spec"><span className="k">Publisher</span><span className="v">{game.Publisher}</span></div>
          )}
          {game.Players && (
            <div className="spec"><span className="k">Players</span><span className="v">{game.Players}</span></div>
          )}
          {game.ESRB && (
            <div className="spec"><span className="k">ESRB</span><span className={'v esrb-badge esrb-' + game.ESRB.toLowerCase().replace(/\s+/g,'-')}>{game.ESRB}</span></div>
          )}
          {game.WheelRotation && (
            <div className="spec"><span className="k">Wheel Rotation</span><span className="v mono">{game.WheelRotation}</span></div>
          )}
          {game.SupportedVersions && (
            <div className="spec spec-full"><span className="k">Supported Versions</span><span className="v mono">{game.SupportedVersions}</span></div>
          )}
        </div>

        {/* 6 ── Controls / Input */}
        {game.Interfaces.length > 0 && (
          <div className="detail-section">
            <h4>Controls</h4>
            <div className="tag-row">
              {game.Interfaces.map(intf => (
                <span key={intf} className="tag input-icon">
                  <Icon name={INTERFACE_ICONS[intf] || 'joystick'} size={12}/>
                  {intf}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6b ── Gameplay link */}
        {game.YouTube && (
          <div className="detail-section">
            <h4>Gameplay</h4>
            <a className="youtube-link" href={game.YouTube} target="_blank" rel="noreferrer">
              <span className="icon"></span>
              <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{game.YouTube}</span>
              <Icon name="external" size={12}/>
            </a>
          </div>
        )}

        {/* 6c ── Tags */}
        {game.Tags.length > 0 && (
          <div className="detail-section">
            <h4>Tags</h4>
            <div className="tag-row">
              {game.Tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        )}

        {/* 7 ── GPU Compatibility */}
        {(hasGpuInfo || game.GpuNvidia !== '' || game.GpuAMD !== '' || game.GpuIntel !== '') && (
          <div className="detail-section">
            <h4>GPU Compatibility</h4>
            <div className="gpu-row">
              <GpuPill vendor="Nvidia" status={game.GpuNvidia} issues={game.GpuNvidiaIssues} />
              <GpuPill vendor="AMD"    status={game.GpuAMD}    issues={game.GpuAMDIssues}    />
              <GpuPill vendor="Intel"  status={game.GpuIntel}  issues={game.GpuIntelIssues}  />
            </div>
            {(game.GpuNvidiaIssues || game.GpuAMDIssues || game.GpuIntelIssues) && (
              <div className="gpu-issues-list">
                {game.GpuNvidiaIssues && <div className="gpu-issue-line"><span className="gpu-issue-vendor">Nvidia:</span> {game.GpuNvidiaIssues}</div>}
                {game.GpuAMDIssues    && <div className="gpu-issue-line"><span className="gpu-issue-vendor">AMD:</span> {game.GpuAMDIssues}</div>}
                {game.GpuIntelIssues  && <div className="gpu-issue-line"><span className="gpu-issue-vendor">Intel:</span> {game.GpuIntelIssues}</div>}
              </div>
            )}
          </div>
        )}

        {game.GeneralIssues && (
          <div className="detail-section">
            <h4>Known Issues</h4>
            <p className="issues-text">{game.GeneralIssues}</p>
          </div>
        )}

        {/* 8 ── Notes */}
        <div className="detail-section">
          <h4>Notes</h4>
          <textarea
            className="notes-input"
            placeholder="Add personal notes (loop config, controller setup, fix patches, …)"
            value={notes || ''}
            onChange={(e) => onNotesChange(game.Profile, e.target.value)}
          />
        </div>

        {/* 9 ── Hide game */}
        <button
          className={'btn-hide' + (isHidden ? ' is-hidden' : '')}
          onClick={() => onToggleHide(game.Profile)}
          title={isHidden ? 'Unhide this game' : 'Hide this game from the library'}
        >
          {isHidden ? '⊕ Unhide game' : '⊖ Hide game'}
        </button>

        {/* 10 ── Metadata credit */}
        {game.MetadataFrom && (
          <div className="detail-courtesy">
            Metadata courtesy of {game.MetadataFrom}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Launch popup ───
function LaunchPopup({ game, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    const onBlur = () => onDismiss(); // game took window focus
    window.addEventListener('blur', onBlur);
    return () => { clearTimeout(timer); window.removeEventListener('blur', onBlur); };
  }, [onDismiss]);

  return (
    <div className="launch-popup" onClick={onDismiss}>
      <div className="lp-card" onClick={e => e.stopPropagation()}>
        <button className="lp-close" onClick={onDismiss}><Icon name="close" size={13}/></button>

        <div className="lp-icon-wrap">
          <div className="lp-glow"></div>
          <div className="lp-icon"><GameIcon game={game}/></div>
        </div>

        <div className="lp-name">{game.Name}</div>
        <div className="lp-meta">
          {[game.GenreNorm, game.Year].filter(Boolean).join(' · ')}
        </div>

        <div className="lp-status">
          <span className="lp-dot"></span>
          <span className="lp-dot"></span>
          <span className="lp-dot"></span>
          Launching
        </div>
      </div>
    </div>
  );
}

// ─── Setup screen (shown when TeknoParrotUi.exe not found) ───
function SetupScreen({ expectedPath, onRetry }) {
  const [checking, setChecking] = useState(false);
  const retry = async () => {
    setChecking(true);
    try {
      const r = await fetch('/__checkTeknoParrotExe');
      const d = await r.json();
      onRetry(d.exists === true);
    } catch {
      onRetry(false);
    } finally {
      setChecking(false);
    }
  };
  return (
    <div className="setup-overlay">
      <div className="setup-icon">🦜</div>
      <h2 className="setup-title">TeknoParrotUi.exe Not Found</h2>
      <p className="setup-message">
        Make sure the <strong>ParrotOrganizer</strong> folder is inside your TeknoParrot
        installation folder, then click Retry below.
      </p>
      {expectedPath && <div className="setup-path">Expected: {expectedPath}</div>}
      <button className="setup-btn" onClick={retry} disabled={checking}>
        {checking ? 'Checking…' : 'Retry'}
      </button>
    </div>
  );
}

// ─── Confirm dialog ───
function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, challenge, challengeLabel = 'Type to confirm', challengeError }) {
  const [challengeValue, setChallengeValue] = useState('');
  const [error, setError] = useState('');
  const confirm = () => {
    if (challenge && challengeValue !== challenge) {
      setError(challengeError || 'Confirmation text did not match.');
      return;
    }
    onConfirm();
  };
  return (
    <div className="editor-overlay confirm-overlay" onClick={onCancel}>
      <div className="editor-modal confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <div>
            <div className="editor-title">{title}</div>
            {message && <div className="editor-subtitle">{message}</div>}
          </div>
          <button className="editor-close" onClick={onCancel}><Icon name="close" size={14}/></button>
        </div>
        {challenge && (
          <div className="confirm-challenge">
            <label>{challengeLabel}</label>
            <input
              autoFocus
              value={challengeValue}
              onChange={(e) => { setChallengeValue(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }}
            />
            {error && <div className="editor-error">{error}</div>}
          </div>
        )}
        <div className="editor-footer">
          <button
            className="btn-secondary"
            style={{flex:1, width:'auto', padding:'10px', height:'auto'}}
            onClick={onCancel}
          >Cancel</button>
          <button
            className="btn-launch"
            style={{flex:1, padding:'10px', ...(danger ? {background:'var(--danger)', boxShadow:'none'} : {})}}
            onClick={confirm}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, GameIcon, GpuPill, GameCard, ListRow, DetailPanel, LaunchPopup, INTERFACE_ICONS, SetupScreen, ConfirmDialog });

import React, { useState, useCallback } from 'react';

interface AssetDownloadModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Category {
  name: string;
  emoji: string;
  paths: string[];
  color: string;
}

// Lista de assets gerada com base na estrutura do projeto
// Em produção, o Workbox já cuida do cache estático.
// Este modal faz um pre-cache manual via Cache API para garantir offline total.
const GAME_CATEGORIES: Category[] = [
  {
    name: 'Entidades',
    emoji: '👾',
    color: '#ff6b6b',
    paths: [
      'alce','ananau','anao','aparition','arguili','arinis','bat','bat rei','biliblili',
      'binger','bufao','cacator','captain','cavern creature','centgreen','centon',
      'centongg','centostone','ckraun','creature','creature light','dodo','dog',
      'draertis_chefe','dragis_chefe','drago','drciu','duende','eaierclaf',
      'eirerpetclaf','elementwater','elf','elffire','espantalho','esquilo',
      'fantasn','fera','flare','galinha','gamba','ganguer','garibu','genie',
      'glacis','glob','goblin','golen-magma','golen2','golen_chefe','goty',
      'gruntfei','hiena','ins','jacare','jinha','lacost','lizardman','lizguer',
      'lobisonem','loiu','magmal','magroung','medusa','monkbrut','monkmagin',
      'monkpanterer','monsttrick','multmani','mumia','mummi','mummi2','mummi3',
      'neveman','orc','ovelha','pand','piggi','pirata','plantera','preda',
      'scarnsabre','serpent','sfolo','skedesert','skeleton','soni','stonemonster',
      'tarker','thedeath','tiguersabre','token','triardinguer_chefe','triron',
      'trolol','turtle-dragon','turtou','unbu','vead','what','whitewolf',
      'xen','xenofo','zombie',
    ].flatMap(e => [
      `/assets/entities/${e}/1_1_1_1.png`, `/assets/entities/${e}/1_1_1_2.png`,
      `/assets/entities/${e}/1_1_1_3.png`, `/assets/entities/${e}/1_1_1_4.png`,
      `/assets/entities/${e}/2_1_1_1.png`, `/assets/entities/${e}/2_1_1_2.png`,
      `/assets/entities/${e}/2_1_1_3.png`, `/assets/entities/${e}/2_1_1_4.png`,
      `/assets/entities/${e}/3_1_1_1.png`, `/assets/entities/${e}/3_1_1_2.png`,
      `/assets/entities/${e}/3_1_1_3.png`, `/assets/entities/${e}/3_1_1_4.png`,
      `/assets/entities/${e}/death.png`, `/assets/entities/${e}/death2.png`,
    ]),
  },
  {
    name: 'Itens',
    emoji: '⚔️',
    color: '#ffd700',
    paths: [
      '/assets/itens/swords/gold_sword.webp',
      '/assets/itens/swords/wood_sword.webp',
      '/assets/itens/swords/radiant_sword.webp',
      '/assets/itens/asas/asas angelicais.webp',
      '/assets/itens/garras.png',
      '/assets/itens/basalt.png',
      '/assets/itens/corda.png',
      '/assets/itens/gold.png',
      '/assets/itens/silver.png',
      '/assets/itens/blood/1.png',
      '/assets/itens/blood/2.png',
      '/assets/itens/blood/3.png',
      ...['201420-201423','201424-201427','201428-201431','201432-201435',
          '201436-201439','201443-201446','201447-201450','201451-201454',
          '201457-201460','201461-201464'].map(n => `/assets/itens/aneis/${n}.png`),
    ],
  },
  {
    name: 'Mapas',
    emoji: '🗺️',
    color: '#64b5f6',
    paths: [
      '/map1.tmj',
      '/caverna-zona-1.tmj',
      '/caverna2.tmj',
      '/caverna 3 ilha 4 para ilha 5.tmj',
    ],
  },
  {
    name: 'Efeitos Mágicos',
    emoji: '✨',
    color: '#ce93d8',
    paths: [
      '/assets/magic-effects/pound.svg',
    ],
  },
];

// Filtra apenas assets que existem (404 são ignorados silenciosamente)
async function cacheAsset(cache: Cache, url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (response.ok || response.status === 0) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const AssetDownloadModal: React.FC<AssetDownloadModalProps> = ({ onComplete, onSkip }) => {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [categoryProgress, setCategoryProgress] = useState<Record<string, number>>({});
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);

  const allAssets = GAME_CATEGORIES.flatMap(c => c.paths);
  const totalAssets = allAssets.length;

  const startDownload = useCallback(async () => {
    setDownloading(true);
    let downloaded = 0;
    let failed = 0;

    const cache = await caches.open('game-assets-manual-v1');

    for (const category of GAME_CATEGORIES) {
      let catDone = 0;
      // Baixa em lotes de 8 paralelos
      const BATCH = 8;
      for (let i = 0; i < category.paths.length; i += BATCH) {
        const batch = category.paths.slice(i, i + BATCH);
        setCurrentFile(batch[0].split('/').pop() || '');

        const results = await Promise.all(batch.map(p => cacheAsset(cache, p)));
        const successes = results.filter(Boolean).length;
        downloaded += successes;
        failed += batch.length - successes;
        catDone += batch.length;

        setCategoryProgress(prev => ({ ...prev, [category.name]: catDone / category.paths.length }));
        setTotalDownloaded(downloaded);
        setTotalFailed(failed);
        setProgress(Math.round(((downloaded + failed) / totalAssets) * 100));
      }
    }

    setDownloading(false);
    setDone(true);
    setCurrentFile('');
    setProgress(100);
  }, [totalAssets]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>📦</div>
          <div>
            <h2 style={styles.title}>Download para Offline</h2>
            <p style={styles.subtitle}>Baixe todos os assets para jogar sem internet</p>
          </div>
        </div>

        <div style={styles.divider} />

        {!downloading && !done && (
          <>
            {/* Category list preview */}
            <div style={styles.categoryList}>
              {GAME_CATEGORIES.map(cat => (
                <div key={cat.name} style={styles.categoryRow}>
                  <span style={styles.catEmoji}>{cat.emoji}</span>
                  <div style={styles.catInfo}>
                    <span style={{ ...styles.catName, color: cat.color }}>{cat.name}</span>
                    <span style={styles.catCount}>{cat.paths.length} arquivos</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>💾</span>
              <p style={styles.infoText}>
                <strong>{totalAssets}</strong> arquivos serão salvos no seu dispositivo.
                Recomendado para jogar sem conexão com internet.
              </p>
            </div>

            <div style={styles.buttonGroup}>
              <button id="download-assets-btn" style={styles.downloadBtn} onClick={startDownload}>
                <span>⬇ Baixar Tudo</span>
              </button>
              <button id="skip-download-btn" style={styles.skipBtn} onClick={onSkip}>
                Pular por agora
              </button>
            </div>
          </>
        )}

        {downloading && (
          <>
            {/* Overall progress */}
            <div style={styles.overallProgress}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Progresso total</span>
                <span style={styles.progressPct}>{progress}%</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={styles.progressStats}>
                <span style={styles.statOk}>✓ {totalDownloaded} baixados</span>
                {totalFailed > 0 && <span style={styles.statFail}>✗ {totalFailed} ignorados</span>}
              </div>
            </div>

            {/* Category bars */}
            <div style={styles.categoryBars}>
              {GAME_CATEGORIES.map(cat => {
                const pct = categoryProgress[cat.name] || 0;
                return (
                  <div key={cat.name} style={styles.catBar}>
                    <div style={styles.catBarHeader}>
                      <span style={styles.catBarName}>{cat.emoji} {cat.name}</span>
                      <span style={{ ...styles.catBarPct, color: cat.color }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <div style={styles.catBarTrack}>
                      <div
                        style={{
                          ...styles.catBarFill,
                          width: `${pct * 100}%`,
                          background: cat.color,
                          boxShadow: `0 0 8px ${cat.color}60`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {currentFile && (
              <p style={styles.currentFile}>
                <span style={styles.currentFileDot} />
                {currentFile}
              </p>
            )}
          </>
        )}

        {done && (
          <div style={styles.doneBox}>
            <div style={styles.doneIcon}>🎉</div>
            <h3 style={styles.doneTitle}>Download Completo!</h3>
            <p style={styles.doneText}>
              {totalDownloaded} assets salvos com sucesso.
              {totalFailed > 0 && ` (${totalFailed} arquivos não encontrados foram ignorados)`}
            </p>
            <button id="play-offline-btn" style={styles.playBtn} onClick={onComplete}>
              ⚔️ Jogar Agora!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99998,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: 'min(95vw, 460px)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'linear-gradient(160deg, #1a1a3a 0%, #0e0e22 100%)',
    border: '1px solid rgba(100,181,246,0.3)',
    borderRadius: 16,
    padding: '24px 24px',
    boxShadow: '0 0 60px rgba(100,150,255,0.15)',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    scrollbarWidth: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    color: '#e0e8ff',
    margin: 0,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(160,180,255,0.7)',
    margin: '4px 0 0',
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(100,150,255,0.3), transparent)',
    marginBottom: 16,
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: '8px 12px',
  },
  catEmoji: { fontSize: 20, flexShrink: 0 },
  catInfo: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 13, fontWeight: 700 },
  catCount: { fontSize: 12, color: 'rgba(180,190,255,0.5)' },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(100,181,246,0.08)',
    border: '1px solid rgba(100,181,246,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 20,
  },
  infoIcon: { fontSize: 16, flexShrink: 0 },
  infoText: { fontSize: 12, color: 'rgba(200,220,255,0.8)', margin: 0, lineHeight: 1.5 },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  downloadBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #1565c0, #1976d2)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(100,150,255,0.3)',
    transition: 'all 0.2s',
  },
  skipBtn: {
    padding: '10px',
    background: 'transparent',
    border: '1px solid rgba(150,160,255,0.2)',
    borderRadius: 8,
    color: 'rgba(150,160,255,0.7)',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  overallProgress: { marginBottom: 20 },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: 'rgba(200,210,255,0.8)' },
  progressPct: { fontSize: 13, fontWeight: 700, color: '#90caf9' },
  progressBar: {
    height: 10,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
    borderRadius: 6,
    boxShadow: '0 0 10px rgba(66,165,245,0.5)',
  },
  progressStats: { display: 'flex', gap: 16 },
  statOk: { fontSize: 12, color: '#81c784' },
  statFail: { fontSize: 12, color: '#ef9a9a' },
  categoryBars: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  catBar: {},
  catBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  catBarName: { fontSize: 12, color: 'rgba(200,210,255,0.7)' },
  catBarPct: { fontSize: 12, fontWeight: 700 },
  catBarTrack: {
    height: 5,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 4 },
  currentFile: {
    fontSize: 11,
    color: 'rgba(150,160,200,0.6)',
    textAlign: 'center',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  currentFileDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#42a5f5',
    animation: 'pulse 1s ease-in-out infinite',
    flexShrink: 0,
  },
  doneBox: { textAlign: 'center', padding: '10px 0' },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneTitle: { fontSize: 20, fontWeight: 800, color: '#81c784', margin: '0 0 8px' },
  doneText: { fontSize: 13, color: 'rgba(200,220,200,0.8)', margin: '0 0 20px', lineHeight: 1.6 },
  playBtn: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #2e7d32, #43a047)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(67,160,71,0.4)',
  },
};

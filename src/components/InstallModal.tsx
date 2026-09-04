import React, { useState } from 'react';
import { InstallIcon } from './InstallIcon';

interface InstallModalProps {
  isIOS: boolean;
  canInstall: boolean;
  onInstall: () => Promise<boolean>;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isIOS, canInstall, onInstall }) => {
  const [installing, setInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }
    if (!canInstall) return;
    setInstalling(true);
    const success = await onInstall();
    if (!success) setInstalling(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.particles}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ ...styles.particle, ...getParticleStyle(i) }} />
        ))}
      </div>

      <div style={styles.modal}>
        {/* Header ornament */}
        <div style={styles.ornamentTop}>
          <div style={styles.ornamentLine} />
          <div style={styles.ornamentDiamond} />
          <div style={styles.ornamentLine} />
        </div>

        {/* Icon */}
        <div style={styles.iconWrap}>
          <InstallIcon size={90} animated={!installing} />
        </div>

        {/* Title */}
        <h1 style={styles.title}>Oliver b25l</h1>
        <p style={styles.subtitle}>⚔️ RPG de Aventura Épica ⚔️</p>

        {/* Warning box */}
        <div style={styles.warningBox}>
          <div style={styles.warningIcon}>⚠</div>
          <p style={styles.warningText}>
            {isIOS
              ? 'Para jogar no iPhone ou iPad, adicione o jogo à sua tela inicial.'
              : 'Instale o jogo para jogar! Salve todos os dados offline e tenha acesso completo.'}
          </p>
        </div>

        {/* Features list */}
        <div style={styles.featuresList}>
          {['🗺️ Jogue completamente offline', '⚡ Abre instantâneo como app', '🔄 Atualiza automaticamente', '🎮 Tela cheia em paisagem'].map((feat, i) => (
            <div key={i} style={styles.featureItem}>
              <span style={styles.featureCheck}>✦</span>
              <span style={styles.featureText}>{feat}</span>
            </div>
          ))}
        </div>

        {/* iOS Steps */}
        {showIOSSteps && (
          <div style={styles.iosSteps}>
            <p style={styles.iosTitle}>Como instalar no iOS:</p>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>1</span>
              <span>Toque no ícone <strong style={styles.iosIcon}>□↑</strong> de compartilhar</span>
            </div>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>2</span>
              <span>Role para baixo e toque em <strong style={styles.iosHighlight}>"Adicionar à Tela de Início"</strong></span>
            </div>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>3</span>
              <span>Toque em <strong style={styles.iosHighlight}>"Adicionar"</strong> no canto superior direito</span>
            </div>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>4</span>
              <span>Abra o app da sua tela inicial 🎮</span>
            </div>
          </div>
        )}

        {/* Install Button */}
        {!showIOSSteps ? (
          <button
            id="pwa-install-btn"
            style={{ ...styles.installBtn, ...(installing ? styles.installBtnLoading : {}) }}
            onClick={handleInstall}
            disabled={installing || (!canInstall && !isIOS)}
          >
            {installing ? (
              <span style={styles.btnContent}>
                <span style={styles.spinner} /> Instalando...
              </span>
            ) : (
              <span style={styles.btnContent}>
                <span style={styles.btnIcon}>⬇</span>
                {isIOS ? 'Ver como instalar' : 'Instalar o Jogo'}
              </span>
            )}
          </button>
        ) : (
          <p style={styles.iosWait}>
            Após instalar, abra o app da sua tela inicial para jogar!
          </p>
        )}

        {/* Bottom ornament */}
        <div style={{ ...styles.ornamentTop, marginTop: 20 }}>
          <div style={styles.ornamentLine} />
          <div style={styles.ornamentDiamond} />
          <div style={styles.ornamentLine} />
        </div>
      </div>
    </div>
  );
};

function getParticleStyle(i: number): React.CSSProperties {
  const angle = (i / 20) * 360;
  const radius = 40 + (i % 3) * 15;
  const size = 2 + (i % 4);
  const duration = 3 + (i % 4) * 0.8;
  const delay = (i * 0.3) % 3;
  return {
    left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}vw)`,
    top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}vh)`,
    width: size,
    height: size,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    opacity: 0.3 + (i % 5) * 0.1,
  };
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    background: 'radial-gradient(ellipse at center, #12122a 0%, #06060f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  particles: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    background: '#ffd700',
    borderRadius: '50%',
    animation: 'particleFloat 3s ease-in-out infinite alternate',
  },
  modal: {
    position: 'relative',
    zIndex: 1,
    width: 'min(90vw, 420px)',
    maxHeight: '95vh',
    overflowY: 'auto',
    background: 'linear-gradient(160deg, #1a1a3a 0%, #0e0e24 50%, #12121e 100%)',
    border: '1px solid rgba(200,160,0,0.5)',
    borderRadius: 16,
    padding: '24px 28px',
    boxShadow: '0 0 60px rgba(200,160,0,0.2), 0 0 120px rgba(100,80,200,0.15), inset 0 1px 0 rgba(255,215,0,0.15)',
    textAlign: 'center',
    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    scrollbarWidth: 'none',
  },
  ornamentTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(200,160,0,0.6), transparent)',
  },
  ornamentDiamond: {
    width: 8,
    height: 8,
    background: '#c8a000',
    transform: 'rotate(45deg)',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(200,160,0,0.8)',
  },
  iconWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: '#ffd700',
    margin: '0 0 4px',
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(200,180,255,0.8)',
    margin: '0 0 20px',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(255,160,0,0.08)',
    border: '1px solid rgba(255,160,0,0.3)',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 18,
    textAlign: 'left',
  },
  warningIcon: {
    fontSize: 18,
    color: '#ffb300',
    flexShrink: 0,
    lineHeight: 1.4,
  },
  warningText: {
    fontSize: 13,
    color: 'rgba(255,230,180,0.9)',
    margin: 0,
    lineHeight: 1.5,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 22,
    textAlign: 'left',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    color: '#ffd700',
    fontSize: 10,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(220,210,255,0.85)',
  },
  iosSteps: {
    background: 'rgba(100,80,200,0.1)',
    border: '1px solid rgba(150,120,255,0.3)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 20,
    textAlign: 'left',
  },
  iosTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#c8a0ff',
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iosStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    fontSize: 13,
    color: 'rgba(220,210,255,0.85)',
  },
  iosStepNum: {
    background: 'rgba(150,120,255,0.3)',
    color: '#c8a0ff',
    borderRadius: '50%',
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  },
  iosIcon: {
    background: 'rgba(0,120,255,0.3)',
    borderRadius: 4,
    padding: '0 4px',
    color: '#60a0ff',
  },
  iosHighlight: {
    color: '#ffd700',
    fontWeight: 700,
  },
  iosWait: {
    fontSize: 13,
    color: 'rgba(200,210,255,0.7)',
    lineHeight: 1.6,
    margin: '0 0 10px',
  },
  installBtn: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #c8a000 0%, #e8c000 50%, #c8a000 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#0a0a18',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 0.5,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(200,160,0,0.4), 0 1px 0 rgba(255,255,255,0.2) inset',
    position: 'relative',
    overflow: 'hidden',
  },
  installBtnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnIcon: {
    fontSize: 18,
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '2px solid rgba(10,10,24,0.3)',
    borderTopColor: '#0a0a18',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

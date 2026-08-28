import { useState } from 'react';
import {
  loadAccount,
  createAccount,
  saveSession,
  type PlayerAccount,
} from '../game/playerStore';

interface LoginScreenProps {
  onLogin: (account: PlayerAccount) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) { setError('Digite seu nome de jogador.'); return; }
    const account = loadAccount(trimmed);
    if (!account) { setError('Conta não encontrada. Crie uma conta primeiro.'); return; }
    saveSession(account.name);
    onLogin(account);
  };

  const handleRegister = () => {
    setError(null);
    setSuccess(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('Nome deve ter pelo menos 2 caracteres.'); return; }
    if (trimmed.length > 20) { setError('Nome deve ter no máximo 20 caracteres.'); return; }
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) { setError('Nome inválido. Use letras, números, espaço, _ ou -.'); return; }
    const account = createAccount(trimmed);
    if (!account) { setError('Este nome já está em uso. Tente outro.'); return; }
    saveSession(account.name);
    setSuccess(`Conta "${account.name}" criada! Entrando...`);
    setTimeout(() => onLogin(account), 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      tab === 'login' ? handleLogin() : handleRegister();
    }
  };

  return (
    <div className="login-overlay">
      {/* Animated background particles */}
      <div className="login-bg-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="login-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className="login-container">
        {/* Logo / Title */}
        <div className="login-logo">
          <div className="login-logo-icon">⚔️</div>
          <div>
            <h1 className="login-title">Tibia Tiled</h1>
            <p className="login-subtitle">Explorer RPG</p>
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider" />

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
          >
            Entrar
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); setSuccess(null); }}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <div className="login-form">
          <label className="login-label">
            {tab === 'login' ? '🧙 Nome do Jogador' : '✨ Escolha seu Nome'}
          </label>
          <input
            className="login-input"
            type="text"
            placeholder={tab === 'login' ? 'Digite seu nome...' : 'Nome único (2-20 chars)...'}
            value={name}
            maxLength={20}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
          />

          {error && <div className="login-error">⚠️ {error}</div>}
          {success && <div className="login-success">✅ {success}</div>}

          <button
            className="login-btn-submit"
            onClick={tab === 'login' ? handleLogin : handleRegister}
          >
            {tab === 'login' ? (
              <>
                <span>🗡️</span>
                <span>Entrar no Mundo</span>
              </>
            ) : (
              <>
                <span>🌟</span>
                <span>Criar Aventureiro</span>
              </>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p className="login-hint">
          {tab === 'login'
            ? 'Não tem conta? Clique em "Criar Conta" acima.'
            : 'Já tem conta? Clique em "Entrar" acima.'}
        </p>

        <div className="login-version">v0.1.0 — Dados salvos localmente no seu navegador</div>
      </div>
    </div>
  );
}

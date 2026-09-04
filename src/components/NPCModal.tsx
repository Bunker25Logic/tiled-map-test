import { useState } from 'react';
import type { NPCDef } from '../game/npc';
import { ALL_ITEMS, type ItemDef, getRarityColor } from '../game/items';
import type { PlayerWallet } from '../game/playerStore';
import type { CharacterId } from '../game/characters';
import { getTotalSilverValue, formatGoldNumber } from '../game/currency';
import CoinIcon from './CoinIcon';
import ItemIcon from './ItemIcon';

interface NPCModalProps {
  npc: NPCDef | null;
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  playerCharacterId: CharacterId;
  playerWallet?: PlayerWallet;
  playerInventory: ItemDef[];
  hasBlessing?: boolean;
  onBuyItem: (itemId: string, count?: number) => { success: boolean; message: string };
  onSellItem: (itemIndex: number, count?: number) => { success: boolean; message: string };
  onBuyBlessing: () => { success: boolean; message: string };
}

export default function NPCModal({
  npc,
  isOpen,
  onClose,
  playerLevel,
  playerCharacterId,
  playerWallet = { gold: 0, silver: 0, basalt: 0 },
  playerInventory,
  hasBlessing = false,
  onBuyItem,
  onSellItem,
  onBuyBlessing,
}: NPCModalProps) {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'buy' | 'sell' | 'blessing'>('buy');
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  if (!isOpen || !npc) return null;

  const showToast = (message: string, success: boolean) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPlayerSilver = getTotalSilverValue(playerWallet);

  const handleBuy = (itemId: string) => {
    const res = onBuyItem(itemId, 1);
    showToast(res.message, res.success);
  };

  const handleSell = (index: number) => {
    const res = onSellItem(index, 1);
    showToast(res.message, res.success);
  };

  const handleBlessing = () => {
    const res = onBuyBlessing();
    showToast(res.message, res.success);
  };

  // Avatar path
  const avatarPath = `/assets/npc/${npc.id}/1_1_1_1.png`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="npc-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="npc-modal-header">
          <div className="npc-header-profile">
            <div className="npc-avatar-frame">
              <img src={avatarPath} alt={npc.name} className={`npc-avatar-img npc-${npc.id}`} />
            </div>
            <div className="npc-identity">
              <h2 className="npc-name">{npc.name}</h2>
              <span className="npc-title">{npc.title}</span>
            </div>
          </div>

          <div className="npc-header-wallet">
            <div className="npc-wallet-pill" title="Seu saldo total">
              <CoinIcon type="gold" size={16} />
              <span className="wallet-amount">{formatGoldNumber(playerWallet.gold || 0)}</span>
              <CoinIcon type="silver" size={16} />
              <span className="wallet-amount">{playerWallet.silver || 0}</span>
            </div>
            <button className="btn-modal-close" onClick={onClose} title="Fechar conversa">
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="npc-nav-tabs">
          {npc.shopItems && npc.shopItems.length > 0 && (
            <button
              className={`npc-tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
              onClick={() => setActiveTab('buy')}
            >
              🛒 Comprar Itens
            </button>
          )}

          {npc.shopItems && npc.shopItems.length > 0 && (
            <button
              className={`npc-tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveTab('sell')}
            >
              💰 Vender (Loot)
            </button>
          )}

          {npc.offersBlessing && (
            <button
              className={`npc-tab-btn ${activeTab === 'blessing' ? 'active' : ''}`}
              onClick={() => setActiveTab('blessing')}
            >
              ✨ Bênção do Templo
            </button>
          )}

          <button
            className={`npc-tab-btn ${activeTab === 'dialogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('dialogue')}
          >
            📜 Conversar & Lore
          </button>
        </div>

        {/* Toast alert */}
        {toast && (
          <div className={`npc-toast ${toast.success ? 'toast-success' : 'toast-error'}`}>
            {toast.success ? '✓' : '⚠️'} {toast.message}
          </div>
        )}

        {/* Tab Content */}
        <div className="npc-tab-body">
          {/* ─── ABA COMPRAR ──────────────────────────────────────────────── */}
          {activeTab === 'buy' && npc.shopItems && (
            <div className="npc-shop-grid">
              {npc.shopItems.map((shopItem) => {
                const item = ALL_ITEMS[shopItem.itemId];
                if (!item) return null;

                const priceSilver = shopItem.priceInSilver;
                const priceGold = Math.floor(priceSilver / 100);
                const remainderSilver = priceSilver % 100;
                const canAfford = totalPlayerSilver >= priceSilver;

                const meetsLevel = !item.requiredLevel || playerLevel >= item.requiredLevel;
                const meetsVocation = !item.allowedVocations || item.allowedVocations.includes(playerCharacterId);

                return (
                  <div key={item.id} className={`npc-shop-card rarity-${item.rarity}`}>
                    <div className="shop-card-left">
                      <div className="shop-item-icon-box" style={{ borderColor: getRarityColor(item.rarity) }}>
                        <ItemIcon item={item} size={38} />
                      </div>
                      <div className="shop-item-details">
                        <div className="shop-item-name" style={{ color: getRarityColor(item.rarity) }}>
                          {item.name}
                        </div>
                        <div className="shop-item-desc">{item.description}</div>

                        {/* Stat Badges */}
                        <div className="shop-stats-row">
                          {item.stats?.attack && <span className="badge-stat atk">⚔️ +{item.stats.attack}</span>}
                          {item.stats?.defense && <span className="badge-stat def">🛡️ +{item.stats.defense}</span>}
                          {item.stats?.maxHp && <span className="badge-stat hp">❤️ +{item.stats.maxHp} HP</span>}
                          {item.stats?.maxMp && <span className="badge-stat mp">💧 +{item.stats.maxMp} MP</span>}
                          {item.stats?.speed && <span className="badge-stat spd">⚡ +{item.stats.speed} Spd</span>}
                          {item.effect?.healHp && <span className="badge-stat heal-hp">❤️ Restaura {item.effect.healHp} HP</span>}
                          {item.effect?.healMp && <span className="badge-stat heal-mp">💧 Restaura {item.effect.healMp} MP</span>}
                        </div>

                        {/* Level / Vocation requirements */}
                        <div className="shop-reqs-row">
                          {item.requiredLevel && (
                            <span className={`badge-req ${meetsLevel ? 'req-met' : 'req-unmet'}`}>
                              {meetsLevel ? '✓' : '🔒'} Nv. {item.requiredLevel}
                            </span>
                          )}
                          {item.allowedVocations && !meetsVocation && (
                            <span className="badge-req req-unmet">
                              ⚠️ Classe incompatível
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shop-card-right">
                      <div className="shop-price-tag">
                        {priceGold > 0 && (
                          <span className="price-part gold">
                            <CoinIcon type="gold" size={15} />
                            <strong>{priceGold}</strong> Ouro
                          </span>
                        )}
                        {remainderSilver > 0 && (
                          <span className="price-part silver">
                            <CoinIcon type="silver" size={15} />
                            <strong>{remainderSilver}</strong> Prata
                          </span>
                        )}
                      </div>

                      <button
                        className={`btn-buy-item ${!canAfford ? 'disabled' : ''}`}
                        onClick={() => handleBuy(item.id)}
                        disabled={!canAfford}
                      >
                        {canAfford ? 'Comprar' : 'Sem saldo'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── ABA VENDER ──────────────────────────────────────────────── */}
          {activeTab === 'sell' && (
            <div className="npc-sell-container">
              {playerInventory.length === 0 ? (
                <div className="empty-inventory-note">
                  <span>🎒 Sua mochila está vazia no momento.</span>
                  <p>Derrote monstros e abra baús para recolher itens e vendê-los aqui!</p>
                </div>
              ) : (
                <div className="npc-shop-grid">
                  {playerInventory.map((item, idx) => {
                    const sellPrice = item.sellPriceSilver ?? Math.max(10, Math.floor((item.buyPriceSilver || 100) * 0.35));
                    const sellGold = Math.floor(sellPrice / 100);
                    const remainderSilver = sellPrice % 100;

                    return (
                      <div key={`${item.id}_${idx}`} className="npc-shop-card">
                        <div className="shop-card-left">
                          <div className="shop-item-icon-box" style={{ borderColor: getRarityColor(item.rarity) }}>
                            <ItemIcon item={item} size={36} />
                            {item.quantity && item.quantity > 1 && (
                              <span className="item-qty-tag">x{item.quantity}</span>
                            )}
                          </div>
                          <div className="shop-item-details">
                            <div className="shop-item-name" style={{ color: getRarityColor(item.rarity) }}>
                              {item.name}
                            </div>
                            <div className="shop-item-desc">{item.description}</div>
                          </div>
                        </div>

                        <div className="shop-card-right">
                          <div className="shop-price-tag">
                            <span className="sell-label">Valor de Venda:</span>
                            {sellGold > 0 && (
                              <span className="price-part gold">
                                <CoinIcon type="gold" size={14} />
                                <strong>{sellGold}</strong> Ouro
                              </span>
                            )}
                            {remainderSilver > 0 && (
                              <span className="price-part silver">
                                <CoinIcon type="silver" size={14} />
                                <strong>{remainderSilver}</strong> Prata
                              </span>
                            )}
                          </div>

                          <button className="btn-sell-item" onClick={() => handleSell(idx)}>
                            Vender 1x
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── ABA BÊNÇÃO SAGRADA (JACK) ────────────────────────────────── */}
          {activeTab === 'blessing' && npc.offersBlessing && (
            <div className="npc-blessing-card">
              <div className="blessing-banner">
                <span className="blessing-icon-large">✨</span>
                <h3>Bênção Divina do Templo de Tibia</h3>
                <p>Proteção mística dos Deuses contra a voracidade da Morte</p>
              </div>

              <div className="blessing-perks-list">
                <div className="blessing-perk-item">
                  <span className="perk-check">🛡️</span>
                  <div>
                    <strong>Amortecimento de Morte</strong>
                    <p>Reduz a perda de Experiência ao morrer de <strong>10%</strong> para apenas <strong>2%</strong>!</p>
                  </div>
                </div>
                <div className="blessing-perk-item">
                  <span className="perk-check">🏛️</span>
                  <div>
                    <strong>Proteção de Nível</strong>
                    <p>Evita regressões drásticas de nível caso seu personagem seja derrotado por monstros fortes.</p>
                  </div>
                </div>
                <div className="blessing-perk-item">
                  <span className="perk-check">⏳</span>
                  <div>
                    <strong>Duração Contínua</strong>
                    <p>Permanece ativa até a sua próxima morte, quando é consumida pelos Deuses para salvar sua alma.</p>
                  </div>
                </div>
              </div>

              <div className="blessing-status-box">
                {hasBlessing ? (
                  <div className="status-active">
                    <span className="status-dot green" />
                    <strong>Seu personagem já está abençoado!</strong>
                    <p>Você está sob proteção divina. Caia em batalha e perderá apenas 2% de XP.</p>
                  </div>
                ) : (
                  <div className="status-inactive">
                    <span className="status-dot red" />
                    <strong>Nenhuma bênção ativa no momento.</strong>
                    <p>Se morrer agora, você perderá 10% de toda a sua XP acumulada!</p>
                  </div>
                )}
              </div>

              <div className="blessing-action-footer">
                <div className="blessing-cost">
                  <span>Custo da Bênção:</span>
                  <span className="cost-val">
                    <CoinIcon type="gold" size={18} />
                    <strong>10 Moedas de Ouro</strong>
                  </span>
                </div>

                <button
                  className={`btn-receive-blessing ${hasBlessing ? 'already-blessed' : ''}`}
                  onClick={handleBlessing}
                  disabled={hasBlessing}
                >
                  {hasBlessing ? '✓ Bênção Ativa' : 'Adquirir Bênção (10 Ouros)'}
                </button>
              </div>
            </div>
          )}

          {/* ─── ABA CONVERSAR / DIÁLOGO ──────────────────────────────────── */}
          {activeTab === 'dialogue' && (
            <div className="npc-dialogue-view">
              <div className="npc-speech-bubble">
                <p className="npc-greeting">{npc.greeting}</p>
                <div className="speech-divider" />
                <p className="npc-lore-body">{npc.dialogue}</p>
              </div>

              <div className="npc-lore-tips">
                <h4>💡 Dicas de Sobrevivência em Tibia:</h4>
                <ul>
                  <li>Mantenha sempre pelo menos 5 Poções de Vida na mochila antes de explorar as ilhas do deserto.</li>
                  <li>Chefes como Draertis e Dragis guardam as armas mais raras do continente.</li>
                  <li>Use a Casa de Câmbio perto do templo para otimizar pilhas de moedas de prata em ouro.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

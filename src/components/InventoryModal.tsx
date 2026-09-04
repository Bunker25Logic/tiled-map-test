import { useState } from 'react';
import {
  type ItemDef,
  type EquippedGear,
  ALL_ITEMS,
  getRarityColor,
} from '../game/items';
import { PLAYABLE_CHARACTERS, type CharacterId } from '../game/characters';
import type { PlayerWallet } from '../game/playerStore';
import { formatGoldNumber } from '../game/currency';
import CoinIcon from './CoinIcon';
import ItemIcon from './ItemIcon';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId?: CharacterId;
  playerName?: string;
  playerLevel?: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  inventoryItems: ItemDef[];
  equippedGear: EquippedGear;
  playerWallet?: PlayerWallet;
  onEquipItem: (item: ItemDef) => void;
  onUnequipSlot: (slot: keyof EquippedGear) => void;
  onUsePotion: (item: ItemDef) => void;
  onOpenExchange?: () => void;
}

export default function InventoryModal({
  isOpen,
  onClose,
  characterId,
  playerName = 'Herói',
  playerLevel = 1,
  playerHp,
  playerMaxHp,
  playerMp,
  playerMaxMp,
  inventoryItems,
  equippedGear,
  playerWallet = { gold: 0, silver: 0, basalt: 0 },
  onEquipItem,
  onUnequipSlot,
  onUsePotion,
  onOpenExchange,
}: InventoryModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'wings' | 'gear' | 'potion'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    inventoryItems[0]?.id || 'wing_angelic'
  );
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'warn' | 'info'; icon: string } | null>(null);

  if (!isOpen) return null;

  const charDef = PLAYABLE_CHARACTERS.find((c) => c.id === characterId);

  const showToast = (message: string, type: 'success' | 'warn' | 'info', icon: string) => {
    setFeedbackToast({ message, type, icon });
    setTimeout(() => setFeedbackToast(null), 2000);
  };

  const filteredItems = inventoryItems.filter((item) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'wings') return item.slotType === 'wings';
    if (activeCategory === 'potion') return item.slotType === 'potion';
    if (activeCategory === 'gear') return ['weapon', 'armor', 'shield', 'amulet', 'ring', 'boots'].includes(item.slotType);
    return true;
  });

  const selectedItem = inventoryItems.find((i) => i.id === selectedItemId) || ALL_ITEMS[selectedItemId];

  // Helper to check if an item is equipped
  const isItemEquipped = (item: ItemDef): boolean => {
    if (item.slotType === 'wings') {
      return equippedGear.wings === item.wingType;
    }
    return Object.values(equippedGear).includes(item.id);
  };

  // Helper to get equipped item by slot
  const getEquippedDef = (slot: keyof EquippedGear): ItemDef | null => {
    if (slot === 'wings') {
      if (equippedGear.wings === 'none') return null;
      return Object.values(ALL_ITEMS).find((i) => i.slotType === 'wings' && i.wingType === equippedGear.wings) || null;
    }
    const id = equippedGear[slot];
    if (!id) return null;
    return ALL_ITEMS[id] || null;
  };

  // Calculate total gear stats bonus
  let totalBonusAtk = 0;
  let totalBonusDef = 0;
  let totalBonusHp = 0;
  let totalBonusMp = 0;
  let totalBonusSpd = 0;

  const slotsList: (keyof EquippedGear)[] = ['wings', 'weapon', 'armor', 'shield', 'amulet', 'ring', 'boots'];
  slotsList.forEach((s) => {
    const def = getEquippedDef(s);
    if (def?.stats) {
      if (def.stats.attack) totalBonusAtk += def.stats.attack;
      if (def.stats.defense) totalBonusDef += def.stats.defense;
      if (def.stats.maxHp) totalBonusHp += def.stats.maxHp;
      if (def.stats.maxMp) totalBonusMp += def.stats.maxMp;
      if (def.stats.speed) totalBonusSpd += def.stats.speed;
    }
  });

  const handleEquipClick = (item: ItemDef) => {
    // Check level requirement
    if (item.requiredLevel && playerLevel < item.requiredLevel) {
      showToast(`Nível insuficiente! Requer Nível ${item.requiredLevel}.`, 'warn', '🔒');
      return;
    }
    // Check vocation requirement
    if (characterId && item.allowedVocations && !item.allowedVocations.includes(characterId)) {
      showToast(`Sua classe não pode usar este equipamento!`, 'warn', '⚠️');
      return;
    }
    onEquipItem(item);
    showToast(`${item.name} equipado!`, 'success', item.icon);
  };

  const handleUnequipClick = (slot: keyof EquippedGear) => {
    const def = getEquippedDef(slot);
    onUnequipSlot(slot);
    showToast(def ? `${def.name} desequipado!` : 'Item desequipado!', 'warn', '🗑️');
  };

  const handlePotionClick = (item: ItemDef) => {
    onUsePotion(item);
    showToast(`Poção utilizada!`, 'info', '🧪');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="inventory-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Floating Toast Notification */}
        {feedbackToast && (
          <div className={`inventory-toast-banner toast-${feedbackToast.type}`}>
            <span className="toast-icon">{feedbackToast.icon}</span>
            <span className="toast-text">{feedbackToast.message}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="inventory-header">
          <div className="inventory-title-container">
            <div className="inventory-rune-icon">🎒</div>
            <div className="inventory-title-text">
              <div className="inventory-title-row">
                <h2>Mochila & Equipamentos</h2>
                {charDef && (
                  <span className="inventory-class-pill">
                    {charDef.icon} {charDef.className}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact Currency Wallet Chips */}
          <div
            className="inventory-header-wallet"
            title={`Saldo da Carteira:\nCristal: ${formatGoldNumber(playerWallet.basalt || 0)}\nOuro: ${formatGoldNumber(playerWallet.gold || 0)}\nPrata: ${formatGoldNumber(playerWallet.silver || 0)}`}
          >
            {playerWallet.basalt > 0 && (
              <div className="header-coin-chip" title={`Moedas de Cristal (${formatGoldNumber((playerWallet.basalt || 0) * 500)} Ouro)`}>
                <CoinIcon type="basalt" amount={playerWallet.basalt} size={18} showAmount />
              </div>
            )}
            <div className="header-coin-chip" title={`Moedas de Ouro (${formatGoldNumber((playerWallet.gold || 0) * 100)} Prata)`}>
              <CoinIcon type="gold" amount={playerWallet.gold} size={18} showAmount />
            </div>
            <div className="header-coin-chip" title="Moedas de Prata">
              <CoinIcon type="silver" amount={playerWallet.silver} size={18} showAmount />
            </div>
            {onOpenExchange && (
              <button
                className="btn-header-exchange"
                onClick={onOpenExchange}
                title="Abrir Casa de Câmbio de Moedas"
              >
                ⚖️ Câmbio
              </button>
            )}
          </div>

          <button className="btn-modal-close" onClick={onClose} title="Fechar Mochila">
            ✕
          </button>
        </div>

        {/* Dual Panel Body Layout */}
        <div className="inventory-dual-layout">
          {/* Left Panel: Hero Representation & Equipped Paperdoll */}
          <div className="inventory-hero-panel">
            <div className="hero-profile-card">
              <div className="hero-avatar-circle">
                <span className="hero-avatar-icon">{charDef?.icon || '🧙'}</span>
              </div>
              <div className="hero-info-text">
                <strong className="hero-char-name">{playerName}</strong>
                <span className="hero-level-badge">Nível {playerLevel} • {charDef?.className}</span>
              </div>
            </div>

            {/* Vitals Bars */}
            <div className="hero-vitals-mini">
              <div className="vital-mini-row">
                <span className="vital-mini-label">💖 HP:</span>
                <div className="vital-mini-bar hp-bar">
                  <div
                    className="vital-mini-fill"
                    style={{ width: `${Math.min(100, (playerHp / (playerMaxHp + totalBonusHp)) * 100)}%` }}
                  />
                  <span className="vital-mini-val">
                    {playerHp}/{playerMaxHp + totalBonusHp}
                  </span>
                </div>
              </div>

              <div className="vital-mini-row">
                <span className="vital-mini-label">🔷 MP:</span>
                <div className="vital-mini-bar mp-bar">
                  <div
                    className="vital-mini-fill"
                    style={{ width: `${Math.min(100, (playerMp / (playerMaxMp + totalBonusMp)) * 100)}%` }}
                  />
                  <span className="vital-mini-val">
                    {playerMp}/{playerMaxMp + totalBonusMp}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="hero-stats-grid">
              <div className="stat-box">
                <span className="stat-ico">⚔️</span>
                <span className="stat-name">Ataque</span>
                <strong className="stat-val">{100 + totalBonusAtk}</strong>
              </div>
              <div className="stat-box">
                <span className="stat-ico">🛡️</span>
                <span className="stat-name">Defesa</span>
                <strong className="stat-val">{10 + totalBonusDef}</strong>
              </div>
              <div className="stat-box">
                <span className="stat-ico">⚡</span>
                <span className="stat-name">Velocidade</span>
                <strong className="stat-val">{120 + totalBonusSpd}</strong>
              </div>
            </div>

            {/* Equipped Paperdoll Slots */}
            <span className="section-small-title">EQUIPAMENTOS ATIVOS:</span>
            <div className="paperdoll-slots-grid">
              {/* Wings Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.wings !== 'none' ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('wings');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Asas</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon
                    item={getEquippedDef('wings')}
                    wingType={equippedGear.wings}
                    size={32}
                    fallbackIcon="🪽"
                  />
                </div>
                {equippedGear.wings !== 'none' && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('wings');
                    }}
                    title="Desequipar Asas"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Weapon Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.weapon ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('weapon');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Arma</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('weapon')} size={26} fallbackIcon="🗡️" />
                </div>
                {equippedGear.weapon && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('weapon');
                    }}
                    title="Desequipar Arma"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Armor Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.armor ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('armor');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Peitoral</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('armor')} size={26} fallbackIcon="🦺" />
                </div>
                {equippedGear.armor && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('armor');
                    }}
                    title="Desequipar Armadura"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Shield Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.shield ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('shield');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Escudo</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('shield')} size={26} fallbackIcon="🛡️" />
                </div>
                {equippedGear.shield && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('shield');
                    }}
                    title="Desequipar Escudo"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Amulet Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.amulet ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('amulet');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Amuleto</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('amulet')} size={26} fallbackIcon="📿" />
                </div>
                {equippedGear.amulet && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('amulet');
                    }}
                    title="Desequipar Amuleto"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Ring Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.ring ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('ring');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Anel</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('ring')} size={26} fallbackIcon="💍" />
                </div>
                {equippedGear.ring && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('ring');
                    }}
                    title="Desequipar Anel"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Boots Slot */}
              <div
                className={`paperdoll-slot ${equippedGear.boots ? 'is-filled' : 'is-empty'}`}
                onClick={() => {
                  const def = getEquippedDef('boots');
                  if (def) setSelectedItemId(def.id);
                }}
              >
                <span className="paperdoll-slot-tag">Botas</span>
                <div className="paperdoll-slot-body">
                  <ItemIcon item={getEquippedDef('boots')} size={26} fallbackIcon="👢" />
                </div>
                {equippedGear.boots && (
                  <button
                    className="btn-slot-quick-unequip"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnequipClick('boots');
                    }}
                    title="Desequipar Botas"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Bag Items & Selected Item Inspector */}
          <div className="inventory-bag-panel">
            {/* Filter Tabs */}
            <div className="bag-filters-row">
              <button
                className={`btn-bag-filter ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                🎒 Todos ({inventoryItems.length})
              </button>
              <button
                className={`btn-bag-filter ${activeCategory === 'wings' ? 'active' : ''}`}
                onClick={() => setActiveCategory('wings')}
              >
                🪽 Asas
              </button>
              <button
                className={`btn-bag-filter ${activeCategory === 'gear' ? 'active' : ''}`}
                onClick={() => setActiveCategory('gear')}
              >
                ⚔️ Equipamentos
              </button>
              <button
                className={`btn-bag-filter ${activeCategory === 'potion' ? 'active' : ''}`}
                onClick={() => setActiveCategory('potion')}
              >
                🧪 Poções
              </button>
            </div>

            {/* Bag Grid */}
            <div className="bag-slots-grid">
              {filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isEquipped = isItemEquipped(item);
                const rarityColor = getRarityColor(item.rarity);

                return (
                  <div
                    key={item.id}
                    className={`bag-item-slot ${isSelected ? 'is-selected' : ''} ${isEquipped ? 'is-equipped' : ''}`}
                    style={{ '--item-rarity-color': rarityColor } as React.CSSProperties}
                    onClick={() => setSelectedItemId(item.id)}
                    title={item.name}
                  >
                    <ItemIcon item={item} size={34} />

                    {item.quantity && item.quantity > 1 && (
                      <span className="bag-item-qty">x{item.quantity}</span>
                    )}

                    {isEquipped && (
                      <span className="bag-item-equipped-tag">E</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Item Inspector / Details Box */}
            {selectedItem && (
              <div className="item-inspector-card">
                <div className="inspector-top-row">
                  <div
                    className="inspector-icon-frame"
                    style={{ borderColor: getRarityColor(selectedItem.rarity) }}
                  >
                    <ItemIcon item={selectedItem} size={38} />
                  </div>

                  <div className="inspector-meta">
                    <div className="inspector-title-row">
                      <strong className="inspector-name" style={{ color: getRarityColor(selectedItem.rarity) }}>
                        {selectedItem.name}
                      </strong>
                      <span className="inspector-rarity-badge" style={{ borderColor: getRarityColor(selectedItem.rarity), color: getRarityColor(selectedItem.rarity) }}>
                        {selectedItem.rarity.toUpperCase()}
                      </span>
                    </div>
                    <span className="inspector-type-label">
                      Tipo: <strong>{selectedItem.slotType.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>

                <p className="inspector-description">{selectedItem.description}</p>

                {/* Stats or Effect Chips */}
                <div className="inspector-stats-row">
                  {selectedItem.stats?.attack && (
                    <span className="stat-chip-pill atk">⚔️ +{selectedItem.stats.attack} Ataque</span>
                  )}
                  {selectedItem.stats?.defense && (
                    <span className="stat-chip-pill def">🛡️ +{selectedItem.stats.defense} Defesa</span>
                  )}
                  {selectedItem.stats?.maxHp && (
                    <span className="stat-chip-pill hp">💖 +{selectedItem.stats.maxHp} HP Max</span>
                  )}
                  {selectedItem.stats?.maxMp && (
                    <span className="stat-chip-pill mp">🔷 +{selectedItem.stats.maxMp} MP Max</span>
                  )}
                  {selectedItem.stats?.speed && (
                    <span className="stat-chip-pill spd">⚡ +{selectedItem.stats.speed} Vel.</span>
                  )}
                  {selectedItem.effect?.healHp && (
                    <span className="stat-chip-pill hp">💖 Restaura +{selectedItem.effect.healHp} HP</span>
                  )}
                  {selectedItem.effect?.healMp && (
                    <span className="stat-chip-pill mp">🔷 Restaura +{selectedItem.effect.healMp} MP</span>
                  )}
                </div>

                {/* Level & Vocation Requirements */}
                {(selectedItem.requiredLevel || selectedItem.allowedVocations) && (
                  <div className="inspector-reqs-row">
                    {selectedItem.requiredLevel && (
                      <span className={`req-chip ${playerLevel >= selectedItem.requiredLevel ? 'req-ok' : 'req-fail'}`}>
                        {playerLevel >= selectedItem.requiredLevel ? '✓' : '🔒'} Requer Nível {selectedItem.requiredLevel}
                      </span>
                    )}
                    {selectedItem.allowedVocations && (
                      <span className={`req-chip ${!characterId || selectedItem.allowedVocations.includes(characterId) ? 'req-ok' : 'req-fail'}`}>
                        {!characterId || selectedItem.allowedVocations.includes(characterId) ? '✓' : '⚠️'} Vocação Permitida
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="inspector-actions-row">
                  {selectedItem.slotType === 'potion' ? (
                    <button
                      className="btn-item-action-primary use-potion"
                      onClick={() => handlePotionClick(selectedItem)}
                    >
                      🧪 Usar Poção ({selectedItem.quantity || 1})
                    </button>
                  ) : isItemEquipped(selectedItem) ? (
                    <button
                      className="btn-item-action-primary unequip-item"
                      onClick={() => handleUnequipClick(selectedItem.slotType as keyof EquippedGear)}
                    >
                      ❌ Desequipar
                    </button>
                  ) : (
                    <button
                      className="btn-item-action-primary equip-item"
                      onClick={() => handleEquipClick(selectedItem)}
                    >
                      ⚡ Equipar no Herói
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="inventory-footer">
          <div className="inventory-footer-tip">
            <span>Dica: Equipe <strong>Asas Angelicais</strong> ou <strong>Asas do Trovão</strong> para alterar seu visual no jogo!</span>
          </div>
          <button className="btn-confirm-inventory" onClick={onClose}>
            ✓ Salvar & Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

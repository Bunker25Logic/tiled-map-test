import { useState, useRef, useEffect } from 'react';
import { ALL_SPELLS, type SpellDef } from '../game/magic';
import { PLAYABLE_CHARACTERS, type CharacterId } from '../game/characters';

interface SpellbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedSpellIds: string[];
  onEquipSpell: (slotIndex: number, spellId: string) => void;
  onUnequipSpell?: (slotIndex: number) => void;
  onCastPreview?: (spell: SpellDef) => void;
  characterId?: CharacterId;
}

interface FeedbackToast {
  message: string;
  type: 'success' | 'warn' | 'info';
  icon: string;
}

export default function SpellbookModal({
  isOpen,
  onClose,
  equippedSpellIds,
  onEquipSpell,
  onUnequipSpell,
  onCastPreview,
  characterId,
}: SpellbookModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'elemental' | 'arcane' | 'nature'>('all');
  const [feedbackToast, setFeedbackToast] = useState<FeedbackToast | null>(null);
  const [pulsingSlot, setPulsingSlot] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (message: string, type: 'success' | 'warn' | 'info', icon: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setFeedbackToast({ message, type, icon });
    toastTimeoutRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
    }, 2200);
  };

  const triggerPulse = (slotIdx: number) => {
    setPulsingSlot(slotIdx);
    setTimeout(() => setPulsingSlot(null), 600);
  };

  const charDef = PLAYABLE_CHARACTERS.find((c) => c.id === characterId);

  // Filter only spells available for this character's class
  const classSpells = ALL_SPELLS.filter(
    (spell) => !characterId || !spell.allowedClasses || spell.allowedClasses.includes(characterId)
  );

  const filteredSpells =
    activeCategory === 'all'
      ? classSpells
      : classSpells.filter((spell) => spell.category === activeCategory);

  const activeSlotSpell = ALL_SPELLS.find((s) => s.id === equippedSpellIds[selectedSlot]);

  const elementalCount = classSpells.filter((s) => s.category === 'elemental').length;
  const arcaneCount = classSpells.filter((s) => s.category === 'arcane').length;
  const natureCount = classSpells.filter((s) => s.category === 'nature').length;

  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleEquip = (slotIdx: number, spell: SpellDef, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onEquipSpell(slotIdx, spell.id);
    triggerPulse(slotIdx);
    showToast(`${spell.name} equipado no Slot ${slotIdx + 1}!`, 'success', spell.icon);
  };

  const handleClearSlot = (slotIdx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentId = equippedSpellIds[slotIdx];
    const curSpell = ALL_SPELLS.find((s) => s.id === currentId);
    if (onUnequipSpell) {
      onUnequipSpell(slotIdx);
    } else {
      onEquipSpell(slotIdx, '');
    }
    triggerPulse(slotIdx);
    showToast(
      curSpell ? `${curSpell.name} desequipado do Slot ${slotIdx + 1}!` : `Slot ${slotIdx + 1} limpo!`,
      'warn',
      '🗑️'
    );
  };

  const handlePreview = (spell: SpellDef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCastPreview) {
      onCastPreview(spell);
      showToast(`Testando ${spell.name} no mapa!`, 'info', '⚡');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="spellbook-modal-card spellbook-mobile-optimized" onClick={(e) => e.stopPropagation()}>
        {/* Animated Feedback Toast Floating Banner */}
        {feedbackToast && (
          <div className={`spellbook-toast-banner toast-${feedbackToast.type}`}>
            <span className="toast-icon">{feedbackToast.icon}</span>
            <span className="toast-text">{feedbackToast.message}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="spellbook-header">
          <div className="spellbook-title-container">
            <div className="spellbook-rune-icon">📖</div>
            <div className="spellbook-title-text">
              <div className="spellbook-title-row">
                <h2>Grimório de Magias</h2>
                {charDef && (
                  <span className="spellbook-class-pill">
                    {charDef.icon} {charDef.className}
                  </span>
                )}
              </div>
              <p className="spellbook-sub-desc">
                Selecione o slot e equipe ou desequipe seus 3 feitiços ativos
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Fechar Grimório">
            ✕
          </button>
        </div>

        {/* 3-Slot Active Selector Section */}
        <div className="spellbook-slots-section">
          <div className="slots-section-header">
            <span className="slots-section-title">
              SLOTS ATIVOS (1 A 3) — TOQUE NO SLOT P/ TROCAR OU NO ✕ P/ DESEQUIPAR
            </span>
            <span className="slot-current-focus">
              Slot Selecionado: <strong>Slot {selectedSlot + 1}</strong>
            </span>
          </div>

          <div className="spellbook-slots-row spellbook-slots-3row">
            {equippedSpellIds.slice(0, 3).map((spellId, idx) => {
              const spell = ALL_SPELLS.find((s) => s.id === spellId);
              const isSelected = selectedSlot === idx;
              const isPulsing = pulsingSlot === idx;

              return (
                <div
                  key={idx}
                  className={`spellbook-slot-card ${isSelected ? 'is-selected' : ''} ${
                    !spell ? 'slot-empty' : ''
                  } ${isPulsing ? 'slot-pulsing' : ''}`}
                  onClick={() => setSelectedSlot(idx)}
                >
                  <div className="slot-card-top-bar">
                    <span className="slot-key-tag">Tecla {idx + 1}</span>
                    {isSelected && <span className="slot-editing-pill">ATIVO</span>}
                    {spell && (
                      <button
                        className="slot-unequip-btn"
                        onClick={(e) => handleClearSlot(idx, e)}
                        title="Desequipar este slot"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div
                    className="slot-spell-orb"
                    style={{
                      borderColor: spell?.color || '#334155',
                      boxShadow: isSelected
                        ? `0 0 14px ${spell?.color || '#a855f7'}`
                        : `0 0 6px rgba(0,0,0,0.5)`,
                    }}
                  >
                    <span className="slot-orb-icon">{spell?.icon || '➕'}</span>
                  </div>

                  <span className="slot-spell-label" title={spell?.name || 'Vazio'}>
                    {spell?.name || 'Vazio'}
                  </span>

                  {spell?.manaCost !== undefined ? (
                    <span className="slot-mana-pill">🔷 {spell.manaCost} MP</span>
                  ) : (
                    <span className="slot-empty-pill">Toque p/ Equipar</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Bar with Slider Controls */}
        <div className="spellbook-filter-bar">
          <div className="cat-buttons">
            <button
              className={`btn-cat ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              ✨ Todas ({classSpells.length})
            </button>
            <button
              className={`btn-cat cat-elemental ${activeCategory === 'elemental' ? 'active' : ''}`}
              onClick={() => setActiveCategory('elemental')}
            >
              🔥 Elementais ({elementalCount})
            </button>
            <button
              className={`btn-cat cat-arcane ${activeCategory === 'arcane' ? 'active' : ''}`}
              onClick={() => setActiveCategory('arcane')}
            >
              🔮 Arcanas ({arcaneCount})
            </button>
            <button
              className={`btn-cat cat-nature ${activeCategory === 'nature' ? 'active' : ''}`}
              onClick={() => setActiveCategory('nature')}
            >
              🌿 Natureza ({natureCount})
            </button>
          </div>

          <div className="slider-nav-controls">
            <button
              className="btn-slider-arrow"
              onClick={handleScrollLeft}
              title="Rolar feitiços para a esquerda"
            >
              ◀
            </button>
            <span className="slider-hint-pill">Deslize para navegar 👉</span>
            <button
              className="btn-slider-arrow"
              onClick={handleScrollRight}
              title="Rolar feitiços para a direita"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Horizontal Slider / Carousel for Spells */}
        <div className="spellbook-slider-wrapper">
          <div className="spellbook-spells-slider" ref={sliderRef}>
            {filteredSpells.length === 0 ? (
              <div className="spell-slider-empty">
                <span>Nenhum feitiço encontrado nesta categoria.</span>
              </div>
            ) : (
              filteredSpells.map((spell) => {
                const isEquippedInActiveSlot = equippedSpellIds[selectedSlot] === spell.id;
                const equippedSlotNum = equippedSpellIds.indexOf(spell.id) + 1;
                const isEquippedAnywhere = equippedSlotNum > 0;
                const isClassRestricted = Boolean(
                  spell.classRestriction && characterId && spell.classRestriction !== characterId
                );

                const spellTypeLabel = spell.isHoming
                  ? '🎯 Teleguiado'
                  : spell.attachToCaster
                  ? '🛡️ Escudo'
                  : spell.projectileSpeed
                  ? '⚡ Projétil'
                  : '💥 Área';

                return (
                  <div
                    key={spell.id}
                    className={`spell-catalog-card spell-slider-card ${
                      isEquippedInActiveSlot ? 'equipped-here' : ''
                    } ${isClassRestricted ? 'class-locked' : ''}`}
                    onClick={(e) => {
                      if (!isClassRestricted) {
                        handleEquip(selectedSlot, spell, e);
                      }
                    }}
                  >
                    <div className="spell-card-top">
                      <div
                        className="spell-icon-box"
                        style={{
                          borderColor: spell.color,
                          boxShadow: `0 0 12px ${spell.color}44`,
                        }}
                      >
                        <span className="spell-ico">{spell.icon}</span>
                      </div>

                      <div className="spell-card-meta">
                        <strong className="spell-card-name">{spell.name}</strong>
                        <div className="spell-badges-row">
                          <span
                            className="spell-cat-badge"
                            style={{ color: spell.color, borderColor: spell.color }}
                          >
                            {spell.category.toUpperCase()}
                          </span>
                          {spell.classRestriction && (
                            <span
                              className={`spell-exclusive-badge ${
                                isClassRestricted ? 'locked' : 'unlocked'
                              }`}
                            >
                              {isClassRestricted ? '🔒 EXCLUSIVO' : '✨ EXCLUSIVO'}
                            </span>
                          )}
                        </div>
                      </div>

                      {equippedSlotNum > 0 && (
                        <span
                          className={`slot-assigned-badge ${
                            equippedSlotNum === selectedSlot + 1 ? 'this-slot' : ''
                          }`}
                          title={`Equipado no Slot ${equippedSlotNum}`}
                        >
                          Slot {equippedSlotNum}
                        </span>
                      )}
                    </div>

                    <p className="spell-desc">{spell.description}</p>

                    {/* Stat Chips */}
                    <div className="spell-stat-chips-row">
                      {spell.manaCost !== undefined && (
                        <span className="stat-chip mana-chip">🔷 {spell.manaCost} MP</span>
                      )}
                      {spell.damage !== undefined && (
                        <span className="stat-chip dmg-chip">⚔️ ~{spell.damage}</span>
                      )}
                      <span className="stat-chip type-chip">{spellTypeLabel}</span>
                    </div>

                    {/* Actions Row (Equip / Unequip / Test) */}
                    <div className="spell-card-actions">
                      <button
                        className={`btn-equip-action ${
                          isEquippedInActiveSlot ? 'already-equipped' : ''
                        } ${isClassRestricted ? 'disabled' : ''}`}
                        disabled={isClassRestricted}
                        onClick={(e) => {
                          if (!isClassRestricted) {
                            handleEquip(selectedSlot, spell, e);
                          }
                        }}
                        title={isClassRestricted ? 'Exclusivo para outra classe' : undefined}
                      >
                        {isClassRestricted
                          ? '🔒 Bloqueado'
                          : isEquippedInActiveSlot
                          ? `✓ No Slot ${selectedSlot + 1}`
                          : isEquippedAnywhere
                          ? `Mover p/ Slot ${selectedSlot + 1}`
                          : `⚡ Equipar no Slot ${selectedSlot + 1}`}
                      </button>

                      {isEquippedAnywhere && (
                        <button
                          className="btn-unequip-card-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSlot(equippedSlotNum - 1, e);
                          }}
                          title="Desequipar esta habilidade"
                        >
                          Desequipar
                        </button>
                      )}

                      {onCastPreview && (
                        <button
                          className="btn-test-spell"
                          onClick={(e) => handlePreview(spell, e)}
                          title="Testar animação no mapa"
                        >
                          ▶ Testar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="spellbook-footer">
          <div className="footer-status-text">
            <span className="footer-slot-indicator">Slot {selectedSlot + 1}:</span>
            <span className="footer-spell-name">
              {activeSlotSpell
                ? `${activeSlotSpell.icon} ${activeSlotSpell.name}`
                : 'Vazio (Toque em um feitiço para equipar)'}
            </span>
          </div>

          <div className="footer-actions-group">
            {activeSlotSpell && (
              <button
                className="btn-footer-unequip"
                onClick={(e) => handleClearSlot(selectedSlot, e)}
              >
                ❌ Desequipar Slot {selectedSlot + 1}
              </button>
            )}
            <button className="btn-confirm-spellbook" onClick={onClose}>
              ✓ Pronto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

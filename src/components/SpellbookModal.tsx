import { useState } from 'react';
import { ALL_SPELLS, type SpellDef } from '../game/magic';

interface SpellbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedSpellIds: string[];
  onEquipSpell: (slotIndex: number, spellId: string) => void;
  onCastPreview?: (spell: SpellDef) => void;
}

export default function SpellbookModal({
  isOpen,
  onClose,
  equippedSpellIds,
  onEquipSpell,
  onCastPreview,
}: SpellbookModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tibia' | 'elemental' | 'arcane' | 'nature'>('all');

  if (!isOpen) return null;

  const filteredSpells =
    activeCategory === 'all'
      ? ALL_SPELLS
      : ALL_SPELLS.filter((s) => s.category === activeCategory);

  const activeSlotSpell = ALL_SPELLS.find((s) => s.id === equippedSpellIds[selectedSlot]);

  const tibiaCount = ALL_SPELLS.filter((s) => s.category === 'tibia').length;
  const elementalCount = ALL_SPELLS.filter((s) => s.category === 'elemental').length;
  const arcaneCount = ALL_SPELLS.filter((s) => s.category === 'arcane').length;
  const natureCount = ALL_SPELLS.filter((s) => s.category === 'nature').length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="spellbook-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-header-icon">📖</span>
            <div>
              <h2>Grimório de Magias & Habilidades</h2>
              <p>Configure os 5 slots rápidos da sua barra de ação</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Fechar Grimório">
            ✕
          </button>
        </div>

        {/* 5 Equipped Slots Bar */}
        <div className="spellbook-equipped-section">
          <span className="section-label">Slots Ativos na Barra (1 a 5):</span>
          <div className="equipped-slots-row">
            {equippedSpellIds.map((spellId, idx) => {
              const spell = ALL_SPELLS.find((s) => s.id === spellId);
              const isSelected = selectedSlot === idx;
              return (
                <button
                  key={idx}
                  className={`equipped-slot-card ${isSelected ? 'active-slot' : ''}`}
                  onClick={() => setSelectedSlot(idx)}
                >
                  <span className="slot-key-badge">{idx + 1}</span>
                  {spell ? (
                    <>
                      <span className="slot-spell-icon">{spell.icon}</span>
                      <span className="slot-spell-name">{spell.name}</span>
                    </>
                  ) : (
                    <span className="slot-empty-text">Vazio</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <div className="spellbook-categories">
          <span className="cat-label">Filtrar por Escola:</span>
          <div className="cat-buttons">
            <button
              className={`btn-cat ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              ✨ Todas ({ALL_SPELLS.length})
            </button>
            <button
              className={`btn-cat ${activeCategory === 'tibia' ? 'active' : ''}`}
              onClick={() => setActiveCategory('tibia')}
            >
              ⚔️ Tibia Clássico ({tibiaCount})
            </button>
            <button
              className={`btn-cat ${activeCategory === 'elemental' ? 'active' : ''}`}
              onClick={() => setActiveCategory('elemental')}
            >
              🔥 Elementais ({elementalCount})
            </button>
            <button
              className={`btn-cat ${activeCategory === 'arcane' ? 'active' : ''}`}
              onClick={() => setActiveCategory('arcane')}
            >
              🔮 Arcanas ({arcaneCount})
            </button>
            <button
              className={`btn-cat ${activeCategory === 'nature' ? 'active' : ''}`}
              onClick={() => setActiveCategory('nature')}
            >
              🌿 Natureza ({natureCount})
            </button>
          </div>
        </div>

        {/* Spells Grid for Selection */}
        <div className="spellbook-spells-grid">
          {filteredSpells.map((spell) => {
            const isEquippedInActiveSlot = equippedSpellIds[selectedSlot] === spell.id;
            const equippedSlotNum = equippedSpellIds.indexOf(spell.id) + 1;

            return (
              <div
                key={spell.id}
                className={`spell-catalog-card ${isEquippedInActiveSlot ? 'equipped-here' : ''}`}
                onClick={() => onEquipSpell(selectedSlot, spell.id)}
              >
                <div className="spell-card-top">
                  <div className="spell-icon-box" style={{ borderColor: spell.color }}>
                    <span className="spell-ico">{spell.icon}</span>
                  </div>
                  <div className="spell-card-meta">
                    <strong>{spell.name}</strong>
                    <span className="spell-cat-badge" style={{ color: spell.color }}>
                      {spell.category.toUpperCase()}
                    </span>
                  </div>

                  {equippedSlotNum > 0 && (
                    <span className="slot-assigned-badge" title={`Equipado no Slot ${equippedSlotNum}`}>
                      Slot {equippedSlotNum}
                    </span>
                  )}
                </div>

                <p className="spell-desc">{spell.description}</p>

                <div className="spell-card-actions">
                  <button
                    className={`btn-equip-action ${isEquippedInActiveSlot ? 'already-equipped' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquipSpell(selectedSlot, spell.id);
                    }}
                  >
                    {isEquippedInActiveSlot ? `✓ No Slot ${selectedSlot + 1}` : `Equipar no Slot ${selectedSlot + 1}`}
                  </button>

                  {onCastPreview && (
                    <button
                      className="btn-test-spell"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCastPreview(spell);
                      }}
                      title="Testar conjuração"
                    >
                      ▶ Testar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-status-text">
            <span>Slot Selecionado: <strong>Slot {selectedSlot + 1}</strong> ({activeSlotSpell?.name || 'Vazio'})</span>
          </div>
          <button className="btn-confirm-spellbook" onClick={onClose}>
            ✓ Pronto
          </button>
        </div>
      </div>
    </div>
  );
}

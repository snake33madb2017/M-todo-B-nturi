import { useState } from 'react'
import Tilt from 'react-parallax-tilt'
import { SUITS, FULL_DECK } from '../constants/appData'
import { playBeep } from '../utils/audio'

export default function CardSelectorModal({ selectedCards, onSelect, onClose }) {
  const [activeSuit, setActiveSuit] = useState('O')
  const filtered = FULL_DECK.filter(c => c.suit === activeSuit)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">SELECCIONA LA CARTA FÍSICA</div>

        <div className="suit-tabs">
          {SUITS.map(s => (
            <button
              key={s.key}
              className={`suit-tab${activeSuit === s.key ? ' active' : ''}`}
              onClick={() => setActiveSuit(s.key)}
            >{s.name}</button>
          ))}
        </div>

        <div className="modal-cards-grid">
          {filtered.map(card => {
            const isSelected = selectedCards.some(c => c?.id === card.id)
            return (
              <Tilt key={card.id} tiltMaxAngleX={15} tiltMaxAngleY={15} glareEnable={true} glareMaxOpacity={0.4} glarePosition="all" style={{width:'100%'}}>
                <div
                  className={`modal-card-item${isSelected ? ' disabled' : ''}`}
                  onClick={() => {
                    if (!isSelected) {
                      playBeep(800, 'triangle', 80);
                      onSelect(card);
                    }
                  }}
                >
                  <img src={card.img} alt={card.spanishName} loading="lazy" />
                </div>
              </Tilt>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import React from 'react';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';

export default function AchievementsModal({ isOpen, onClose, t }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('achievements', 'Achievements')}
      {...STANDARD_MODAL_PROPS}
    >
      <div className="text-center py-8 text-[#5d4037]/60 italic font-serif">
        {t('achievements_empty_msg', 'No achievements unlocked at this time.')}
      </div>
    </Modal>
  );
}

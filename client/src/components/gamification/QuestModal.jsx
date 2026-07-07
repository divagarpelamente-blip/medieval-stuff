import React from 'react';
import Modal from '../common/Modal';
import { STANDARD_MODAL_PROPS } from '../../constants/UI_UX';

export default function QuestModal({ isOpen, onClose, t }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('quests_modal_title', 'Quests')}
      {...STANDARD_MODAL_PROPS}
    >
      <div className="text-center py-8 text-[#5d4037]/60 italic font-serif">
        {t('quests_empty_msg', 'No quests registered at this time.')}
      </div>
    </Modal>
  );
}

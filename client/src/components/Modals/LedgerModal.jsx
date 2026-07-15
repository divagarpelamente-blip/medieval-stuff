import React, { useState, useEffect } from 'react';
import Modal from "./Modal";
import TransactionForm from "../Ledger/TransactionForm";
import LedgerTable from "../Ledger/LedgerTable";
import { useKingdomStore } from "../../store/useKingdomStore";

export default function LedgerModal({ isOpen, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const fetchFlatMatrix = useKingdomStore((state) => state.fetchFlatMatrix);
  const fetchTransactions = useKingdomStore((state) => state.fetchTransactions);

  // Load accounting data context when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFlatMatrix();
      fetchTransactions();
    }
  }, [isOpen]);

  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setEditingTransaction(transaction);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTransaction(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="General Ledger Scrolls" emoji="📜">
      <div className="space-y-6 text-stone-200">
        <TransactionForm 
          editingId={editingId} 
          editingTransaction={editingTransaction} 
          onCancelEdit={handleCancelEdit} 
        />
        <LedgerTable 
          onEditClick={handleEditClick} 
        />
      </div>
    </Modal>
  );
}
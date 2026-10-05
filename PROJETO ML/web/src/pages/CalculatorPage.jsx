import React from 'react';
import MarginCalculatorModal from '../components/MarginCalculatorModal';

export default function CalculatorPage() {
  return (
    <div className="py-2">
      <MarginCalculatorModal isStandalone={true} />
    </div>
  );
}

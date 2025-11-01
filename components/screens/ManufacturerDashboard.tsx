
import React, { useState, useEffect } from 'react';
import { getApprovedBatches, purchaseBatch } from '../../services/mockApiService';
import { Batch } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import TraceabilityTimeline from '../ui/TraceabilityTimeline';
import { useAuth } from '../../context/AuthContext';

const ManufacturerDashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { user } = useAuth();

  const loadBatches = () => {
    setLoading(true);
    getApprovedBatches().then(data => {
      setBatches(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleToggleTrace = (batchId: string) => {
      setSelectedBatchId(prev => prev === batchId ? null : batchId);
  }

  const handleBuy = async (batchId: string) => {
    if (!user) return;
    setPurchasingId(batchId);
    try {
      await purchaseBatch(batchId, user.id);
      loadBatches();
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Approved Herb Batches</h2>
      {loading && <p>Loading approved batches...</p>}
      {!loading && batches.length === 0 && <p>No approved batches are available.</p>}
      <div className="space-y-4">
        {batches.map(batch => (
          <Card key={batch.id}>
            <h3 className="text-lg font-semibold">Batch ID: {batch.id}</h3>
            <p className="text-sm text-text-secondary">{batch.herbIds.length} herb type(s)</p>
            <p className="text-xs text-text-secondary mt-1">Approved on: {new Date(batch.pickupDate).toLocaleDateString()}</p>
            {batch.reportURL && <a href={batch.reportURL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block my-2">View Lab Report</a>}
            <Button onClick={() => handleToggleTrace(batch.id)} className="w-auto px-4 mt-2 text-sm py-1">
                {selectedBatchId === batch.id ? 'Hide Trace' : 'View Trace Journey'}
            </Button>
            <Button onClick={() => handleBuy(batch.id)} disabled={purchasingId === batch.id} className="w-auto px-4 mt-2 ml-2 text-sm py-1">
                {purchasingId === batch.id ? 'Buying...' : 'Buy'}
            </Button>
            {selectedBatchId === batch.id && <TraceabilityTimeline batchId={batch.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManufacturerDashboard;


import React, { useEffect, useState } from 'react';
import { Transaction, UserRole, ActionType } from '../../types';
import { getTraceability } from '../../services/mockApiService';
import { Leaf, Truck, Beaker, Factory, AlertCircle } from 'lucide-react';

interface TraceabilityTimelineProps {
  batchId: string;
}

const TraceabilityTimeline: React.FC<TraceabilityTimelineProps> = ({ batchId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrace = async () => {
      setLoading(true);
      const data = await getTraceability(batchId);
      setTransactions(data);
      setLoading(false);
    };
    fetchTrace();
  }, [batchId]);

  if (loading) return <div>Loading timeline...</div>;
  if (transactions.length === 0) return <div>No traceability data found for this batch.</div>;
  
  const getIcon = (actionType: ActionType) => {
    switch(actionType) {
        case ActionType.FARMER_SUBMIT: return <Leaf className="w-5 h-5 text-white" />;
        case ActionType.FARMER_DISPATCH_TO_LAB: return <Truck className="w-5 h-5 text-white" />;
        case ActionType.LAB_TEST: return <Beaker className="w-5 h-5 text-white" />;
        case ActionType.MANUFACTURER_RECEIVE: return <Factory className="w-5 h-5 text-white" />;
        default: return <AlertCircle className="w-5 h-5 text-white" />;
    }
  }

  return (
    <div className="space-y-8 mt-4">
      {transactions.map((tx, index) => (
        <div key={tx.id} className="flex items-start">
          <div className="flex flex-col items-center mr-4">
            <div className="bg-primary rounded-full p-2 z-10">
              {getIcon(tx.actionType)}
            </div>
            {index < transactions.length - 1 && (
                <div className="w-0.5 h-full bg-gray-300 -mt-1"></div>
            )}
          </div>
          <div className="flex-grow pb-8">
            <h4 className="font-bold">{tx.actionType.replace(/_/g, ' ')}</h4>
            <p className="text-xs text-text-secondary">{new Date(tx.timestamp).toLocaleString()}</p>
            <p className="text-sm mt-1">By: {tx.actorRole}</p>
            {tx.details.vehicleNo && <p className="text-sm">Vehicle: {tx.details.vehicleNo}</p>}
            {tx.details.result && <p className="text-sm">Result: <span className={tx.details.result === 'Approved' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{tx.details.result}</span></p>}
            {tx.details.reportURL && <a href={tx.details.reportURL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View Report</a>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TraceabilityTimeline;

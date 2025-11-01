
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBatchesForLab, submitLabResult, farmerDispatchToLab } from '../../services/mockApiService';
import { Batch, HerbRequest, HerbStatus, RequestStatus, User, UserRole } from '../../types';
import { getMyRequests, updateRequestStatusApi, clearIncomingRequestsApi } from '../../services/requestsApi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Tabs, { Tab } from '../ui/Tabs';
import { User as UserIcon, CheckCircle, XCircle } from 'lucide-react';

const LabDashboard: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batches'|'requests'>('batches');

  const fetchBatches = () => {
    if (user) {
      setLoading(true);
      getBatchesForLab(user.id).then(data => {
        setBatches(data);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleResultSubmitted = () => {
    setSelectedBatchId(null);
    fetchBatches();
  }

  const getStatusColor = (status: HerbStatus) => {
    switch (status) {
        case HerbStatus.InLab: return 'bg-purple-100 text-purple-800';
        case HerbStatus.Approved: return 'bg-green-100 text-green-800';
        case HerbStatus.Rejected: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  const tabs: Tab[] = [
    { id: 'batches', label: 'Batches' },
    { id: 'requests', label: 'Requests' },
  ];

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={(t) => setActiveTab(t as 'batches'|'requests')} />
      <div className="mt-4">
        {activeTab === 'batches' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Batches for Testing</h2>
            {loading && <p>Loading batches...</p>}
            {!loading && batches.length === 0 && <p>No batches are currently assigned to your lab.</p>}
            <div className="space-y-4">
              {batches.map(batch => (
                <Card key={batch.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Batch ID: {batch.id}</h3>
                      <p className="text-sm text-text-secondary">{batch.herbIds.length} herb(s)</p>
                      <p className="text-xs text-text-secondary mt-1">Received: {new Date(batch.pickupDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>{batch.status}</span>
                  </div>
                  {batch.status === HerbStatus.InLab && (
                    <Button onClick={() => setSelectedBatchId(batch.id)} className="mt-4 w-auto px-4 text-sm py-1">
                      Submit Results
                    </Button>
                  )}
                  {selectedBatchId === batch.id && <SubmitResultForm batchId={batch.id} onSubmitted={handleResultSubmitted} />}
                </Card>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'requests' && <LabRequestManager onAcceptedBatch={() => { setActiveTab('batches'); fetchBatches(); }} />}
      </div>
    </div>
  );
};

const SubmitResultForm: React.FC<{batchId: string, onSubmitted: () => void}> = ({ batchId, onSubmitted }) => {
    const { user } = useAuth();
    const [result, setResult] = useState<'Approved' | 'Rejected'>('Approved');
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        setSubmitting(true);
        // In a real app, we'd upload the file and get a URL. Here we just mock it.
        const mockReportURL = reportFile ? `/reports/${batchId}-${reportFile.name}` : '';
        await submitLabResult(batchId, user.id, result, mockReportURL);
        setSubmitting(false);
        onSubmitted();
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Submit Test Result</h4>
            <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input type="radio" name="result" value="Approved" checked={result === 'Approved'} onChange={() => setResult('Approved')} className="text-primary focus:ring-primary"/>
                    <span>Approve</span>
                </label>
                 <label className="flex items-center gap-2">
                    <input type="radio" name="result" value="Rejected" checked={result === 'Rejected'} onChange={() => setResult('Rejected')} className="text-red-500 focus:ring-red-500"/>
                    <span>Reject</span>
                </label>
            </div>
            <div className="mb-4">
                 <label htmlFor="report" className="block text-sm font-medium text-text-secondary mb-1">Upload Report (PDF/Image)</label>
                 <input type="file" id="report" onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            </div>
            <Button type="submit" isLoading={submitting}>Confirm Result</Button>
        </form>
    );
}

const LabRequestManager: React.FC<{ onAcceptedBatch: () => void }> = ({ onAcceptedBatch }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HerbRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchRequests = useCallback(() => {
    if (user) {
      setLoading(true);
      getMyRequests().then(setRequests).finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  // Auto-refresh every 5s while mounted
  useEffect(() => {
    const t = setInterval(() => fetchRequests(), 5000);
    return () => clearInterval(t);
  }, [fetchRequests]);

  const handleStatusUpdate = async (requestId: string, status: RequestStatus, req?: HerbRequest) => {
    await updateRequestStatusApi(requestId, status);
    // If lab accepted a FarmerToLab request, create a batch and switch to Batches tab
    if (status === RequestStatus.Accepted && req && user && req.herbIds && req.herbIds.length > 0) {
      try {
        await farmerDispatchToLab(req.herbIds, req.requesterId, user.id, 'N/A');
        onAcceptedBatch();
      } catch {}
    }
    fetchRequests();
  }

  if (loading) return <p>Loading requests...</p>;

  const incoming = requests.filter(r => {
    const byId = r.receiverId === user?.id;
    const byEmail = (r as any).receiverEmail && user?.email && (r as any).receiverEmail.toLowerCase() === user.email.toLowerCase();
    return byId || byEmail;
  });
  const outgoing = requests.filter(r => r.requesterId === user?.id);

  const onClearIncoming = async () => {
    setClearing(true);
    await clearIncomingRequestsApi();
    await fetchRequests();
    setClearing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Requests</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchRequests} className="w-auto text-sm !py-1">Refresh</Button>
          <Button variant="secondary" onClick={onClearIncoming} isLoading={clearing} className="w-auto text-sm !py-1">Clear Incoming</Button>
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-2">Incoming Requests</h3>
      {incoming.length > 0 ? incoming.map(req => (
        <RequestCard
          key={req.id}
          request={req}
          isReceiver
          onStatusUpdate={(id, st) => handleStatusUpdate(id, st, req)}
          onCreateBatch={async () => {
            if (!user || !req.herbIds || req.herbIds.length === 0) return;
            await farmerDispatchToLab(req.herbIds, req.requesterId, user.id, 'N/A');
            onAcceptedBatch();
          }}
        />
        )) : <p className="text-sm text-text-secondary">No incoming requests.</p>}

      <h3 className="font-semibold text-lg mt-6 mb-2">Outgoing Requests</h3>
      {outgoing.length > 0 ? outgoing.map(req => (
        <RequestCard key={req.id} request={req} />
      )) : <p className="text-sm text-text-secondary">No outgoing requests.</p>}
    </div>
  );
}

const RequestCard: React.FC<{ request: HerbRequest; isReceiver?: boolean; onStatusUpdate?: (id: string, status: RequestStatus) => void; onCreateBatch?: () => void }> = ({ request, isReceiver, onStatusUpdate, onCreateBatch }) => {
  const statusStyles = {
    [RequestStatus.Pending]: 'text-yellow-600',
    [RequestStatus.Accepted]: 'text-green-600',
    [RequestStatus.Rejected]: 'text-red-600',
  } as const;
  const otherParty = isReceiver ? request.requesterInfo : request.receiverInfo;

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <UserIcon size={24} className="text-text-secondary" />
          </div>
          <div>
            <p className="font-semibold">{otherParty?.name} <span className="text-xs font-normal text-text-secondary">({otherParty?.role})</span></p>
            <p className="text-sm">{request.herbInfos?.map(h => h.name).join(', ')} - {request.herbInfos?.reduce((sum, h) => sum + (h.quantity || 0), 0)} kg</p>
          </div>
        </div>
        <p className={`font-bold text-sm ${statusStyles[request.status]}`}>{request.status}</p>
      </div>
      {request.message && <p className="text-sm mt-2 p-2 bg-gray-50 rounded-md">"{request.message}"</p>}
      {isReceiver && request.status === RequestStatus.Pending && onStatusUpdate && (
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onStatusUpdate(request.id, RequestStatus.Accepted)} className="text-sm !py-1"><CheckCircle size={16} /> Accept</Button>
          <Button onClick={() => onStatusUpdate(request.id, RequestStatus.Rejected)} variant="secondary" className="text-sm !py-1"><XCircle size={16} /> Reject</Button>
        </div>
      )}
      {isReceiver && request.status === RequestStatus.Accepted && onCreateBatch && (
        <div className="mt-3">
          <Button onClick={onCreateBatch} className="text-sm !py-1">Create Batch</Button>
        </div>
      )}
    </Card>
  );
}

export default LabDashboard;

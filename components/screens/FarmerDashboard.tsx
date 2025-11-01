
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addHerb, getHerbsByFarmer } from '../../services/mockApiService';
import { addHerbApi } from '../../services/herbsApi';
import { getMyHerbsApi } from '../../services/herbsApi';
import { searchLabsApi } from '../../services/usersApi';
import { getMyRequests, sendRequestApi, updateRequestStatusApi, clearIncomingRequestsApi } from '../../services/requestsApi';
import { Herb, HerbStatus, User, HerbRequest, RequestStatus, RequestType, UserRole } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Tabs, { Tab } from '../ui/Tabs';
import { PlusCircle, MapPin, Tag, Search, Send, CheckCircle, XCircle, User as UserIcon, ChevronsRight } from 'lucide-react';

const farmerTabs: Tab[] = [
    { id: 'herbs', label: 'My Herbs' },
    { id: 'requests', label: 'Requests' },
    { id: 'find_labs', label: 'Find Labs' },
];

const FarmerDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('herbs');

    return (
        <div>
            <Tabs tabs={farmerTabs} activeTab={activeTab} onTabClick={setActiveTab} />
            <div className="mt-4">
                {activeTab === 'herbs' && <MyHerbs />}
                {activeTab === 'requests' && <RequestManager />}
                {activeTab === 'find_labs' && <FindLabs />}
            </div>
        </div>
    );
};

const MyHerbs = () => {
    const { user } = useAuth();
    const [herbs, setHerbs] = useState<Herb[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchHerbs = useCallback(() => {
        if(user) {
            setLoading(true);
            // Prefer backend herbs; fall back to mock if needed
            getMyHerbsApi().then(data => {
                setHerbs(data);
                setLoading(false);
            }).catch(() => {
                getHerbsByFarmer(user.id).then(data => {
                    setHerbs(data);
                    setLoading(false);
                });
            });
        }
    }, [user]);

    useEffect(() => {
        fetchHerbs();
    }, [fetchHerbs]);

    const handleAddHerb = (newHerb: Herb) => {
        setHerbs(prev => [newHerb, ...prev]);
        setShowForm(false);
    }

    const getStatusColor = (status: HerbStatus) => {
        const colors = {
            [HerbStatus.Harvested]: 'bg-blue-100 text-blue-800',
            [HerbStatus.AwaitingPickup]: 'bg-orange-100 text-orange-800',
            [HerbStatus.PickedUp]: 'bg-yellow-100 text-yellow-800',
            [HerbStatus.InLab]: 'bg-purple-100 text-purple-800',
            [HerbStatus.Approved]: 'bg-green-100 text-green-800',
            [HerbStatus.Rejected]: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Herbs</h2>
                <Button onClick={() => setShowForm(!showForm)} className="w-auto px-4">
                    <PlusCircle size={16} /> {showForm ? 'Cancel' : 'Add Herb'}
                </Button>
            </div>
            {showForm && <AddHerbForm onAddHerb={handleAddHerb} />}
            {loading && <p>Loading your herbs...</p>}
            {!loading && herbs.length === 0 && <p>You haven't added any herbs yet.</p>}
            <div className="space-y-4">
                {herbs.map(herb => (
                    <Card key={herb.id}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold">{herb.name}</h3>
                                <p className="text-sm text-text-secondary">{herb.quantity} kg</p>
                                <p className="text-xs text-text-secondary mt-1">Harvested: {new Date(herb.harvestDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(herb.status)}`}>{herb.status}</span>
                        </div>
                        {herb.batchId &&
                            <div className="mt-2 text-sm flex items-center gap-1 text-text-secondary">
                                <Tag size={14} /> Batch ID: {herb.batchId}
                            </div>}
                    </Card>
                ))}
            </div>
        </div>
    );
}

const RequestManager = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<HerbRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    const fetchRequests = useCallback(() => {
        if(user){
            setLoading(true);
            getMyRequests().then(setRequests).finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => { fetchRequests() }, [fetchRequests]);

    const handleStatusUpdate = async (requestId: string, status: RequestStatus) => {
        await updateRequestStatusApi(requestId, status);
        fetchRequests();
    }

    if (loading) return <p>Loading requests...</p>;
    
    const incomingRequests = requests.filter(r => {
        const byId = r.receiverId === user?.id;
        const byEmail = (r as any).receiverEmail && user?.email && (r as any).receiverEmail.toLowerCase() === user.email.toLowerCase();
        return byId || byEmail;
    });
    const outgoingRequests = requests.filter(r => r.requesterId === user?.id);

    const clearIncoming = async () => {
        setClearing(true);
        await clearIncomingRequestsApi();
        await fetchRequests();
        setClearing(false);
    };

    return <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Requests</h2>
            <Button variant="secondary" onClick={clearIncoming} isLoading={clearing} className="w-auto text-sm px-3 py-1">Clear Incoming</Button>
        </div>
        <h3 className="font-semibold text-lg mb-2">Incoming Requests</h3>
        {incomingRequests.length > 0 ? incomingRequests.map(req => (
            <RequestCard key={req.id} request={req} onStatusUpdate={handleStatusUpdate} isReceiver={true} />
        )) : <p className="text-sm text-text-secondary">No incoming requests.</p>}
        
        <h3 className="font-semibold text-lg mt-6 mb-2">Outgoing Requests</h3>
        {outgoingRequests.length > 0 ? outgoingRequests.map(req => (
            <RequestCard key={req.id} request={req} />
        )) : <p className="text-sm text-text-secondary">No outgoing requests.</p>}
    </div>
}

const FindLabs = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLab, setSelectedLab] = useState<User | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = await searchLabsApi(query);
        setResults(data);
        setLoading(false);
    }
    
    if (selectedLab) {
        return <SendRequestToLabForm lab={selectedLab} onBack={() => setSelectedLab(null)} user={user} />
    }

    return <div>
        <h2 className="text-2xl font-bold mb-4">Find a Lab</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input label="Lab Name" id="lab-search" value={query} onChange={e => setQuery(e.target.value)} className="flex-grow !mb-0"/>
            <Button type="submit" isLoading={loading} className="w-auto !mt-auto"><Search size={18}/></Button>
        </form>
        <div className="space-y-2">
            {results.map(l => (
                <Card key={l.id} className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{l.name}</p>
                        <p className="text-sm text-text-secondary">{l.phone}</p>
                    </div>
                    <Button onClick={() => setSelectedLab(l)} className="w-auto !py-1 px-3 text-sm">Send Request</Button>
                </Card>
            ))}
        </div>
    </div>
}

const SendRequestToLabForm: React.FC<{ lab: User, onBack: () => void, user: User | null }> = ({ lab, onBack, user }) => {
    const [myHerbs, setMyHerbs] = useState<Herb[]>([]);
    const [selectedHerbIds, setSelectedHerbIds] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { data: geo } = useGeolocation();
    const [quickName, setQuickName] = useState('');
    const [quickQty, setQuickQty] = useState('');
    const [addingQuick, setAddingQuick] = useState(false);

    useEffect(() => {
        if(user) {
            // Try backend first, then mock fallback
            getMyHerbsApi().then(herbs => {
                setMyHerbs(herbs.filter(h => h.status === HerbStatus.Harvested));
            }).catch(() => {
                getHerbsByFarmer(user.id).then(herbs => {
                    setMyHerbs(herbs.filter(h => h.status === HerbStatus.Harvested));
                });
            });
        }
    }, [user]);

    const handleSelectHerb = (herbId: string) => {
        setSelectedHerbIds(prev => prev.includes(herbId) ? prev.filter(id => id !== herbId) : [...prev, herbId]);
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user || selectedHerbIds.length === 0) return;
        setSubmitting(true);
        const receiverEmail = lab.email;
        await sendRequestApi({
            type: RequestType.FarmerToLab,
            receiverEmail,
            receiverId: lab.id,
            herbIds: selectedHerbIds,
            message,
        });
        setSubmitting(false);
        alert('Request sent!');
        onBack();
    }

    return <Card>
        <h3 className="text-xl font-bold mb-2">Request Testing/Dispatch to {lab.name}</h3>
        <p className="text-sm text-text-secondary mb-4">Select herbs you want to dispatch for testing.</p>
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label htmlFor="herb-select" className="block text-sm font-medium text-text-secondary mb-1">Select harvested herbs</label>
                {myHerbs.length > 0 ? (
                    <select
                        id="herb-select"
                        multiple
                        value={selectedHerbIds}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const opts = Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
                            setSelectedHerbIds(opts);
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        size={Math.min(6, Math.max(3, myHerbs.length))}
                    >
                        {myHerbs.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.quantity} kg)</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-sm">
                        <p className="mb-2">You have no harvested herbs available.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input label="Herb Name" id="quickHerbName" value={quickName} onChange={e => setQuickName(e.target.value)} />
                            <Input label="Quantity (kg)" id="quickQty" type="number" value={quickQty} onChange={e => setQuickQty(e.target.value)} />
                            <div className="flex items-end">
                                <Button
                                  onClick={async () => {
                                    if (!user || !quickName || !quickQty) return;
                                    setAddingQuick(true);
                                    try {
                                      const added = await addHerbApi({
                                        name: quickName,
                                        quantity: parseFloat(quickQty),
                                        farmerId: user.id,
                                        location: geo ? { latitude: geo.latitude, longitude: geo.longitude } : { latitude: 0, longitude: 0 },
                                        harvestDate: new Date().toISOString(),
                                      });
                                      setMyHerbs(prev => [added, ...prev]);
                                      setSelectedHerbIds(prev => [added.id, ...prev]);
                                      setQuickName('');
                                      setQuickQty('');
                                    } finally {
                                      setAddingQuick(false);
                                    }
                                  }}
                                  isLoading={addingQuick}
                                  className="w-full"
                                >Add</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Input label="Message (optional)" id="message" value={message} onChange={e => setMessage(e.target.value)} />
            {selectedHerbIds.length === 0 && <p className="text-xs text-red-600 mb-2">Select at least one herb to send a request.</p>}
            <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onBack} className="w-1/3">Back</Button>
                <Button type="submit" isLoading={submitting} disabled={selectedHerbIds.length === 0} className="w-2/3">Send Request</Button>
            </div>
        </form>
    </Card>
}


const AddHerbForm: React.FC<{onAddHerb: (herb: Herb) => void}> = ({ onAddHerb }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const {data: location, loading: locationLoading, error: locationError } = useGeolocation();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !quantity || !location || !user) return;
        setSubmitting(true);
        const newHerbData = { name, quantity: parseFloat(quantity), farmerId: user.id, location, harvestDate: new Date().toISOString() };
        try {
            const addedHerb = await addHerbApi(newHerbData);
            onAddHerb(addedHerb);
        } catch {
            const addedHerb = await addHerb(newHerbData);
            onAddHerb(addedHerb);
        }
        setSubmitting(false);
    };

    return (
        <Card className="mb-6 bg-gray-50">
            <h3 className="text-xl font-semibold mb-4">Add New Herb</h3>
            <form onSubmit={handleSubmit}>
                <Input label="Herb Name" id="herbName" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="Quantity (kg)" id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                <div className="mb-4 p-2 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium text-text-secondary mb-1">GPS Location</p>
                    {locationLoading && <p className="text-sm">Fetching location...</p>}
                    {locationError && <p className="text-sm text-red-500">{locationError}</p>}
                    {location && <p className="text-sm flex items-center gap-1"><MapPin size={14} /> Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}</p>}
                </div>
                <Button type="submit" isLoading={submitting} disabled={!location || locationLoading}>Submit Herb</Button>
            </form>
        </Card>
    )
}

const RequestCard: React.FC<{ request: HerbRequest; isReceiver?: boolean; onStatusUpdate?: (id: string, status: RequestStatus) => void }> = ({ request, isReceiver, onStatusUpdate }) => {
    const statusStyles = {
        [RequestStatus.Pending]: 'text-yellow-600',
        [RequestStatus.Accepted]: 'text-green-600',
        [RequestStatus.Rejected]: 'text-red-600',
    };
    const otherParty = isReceiver ? request.requesterInfo : request.receiverInfo;

    const qty = (request.herbInfos || []).reduce((sum, h) => sum + (h.quantity || 0), 0);
    const herbNames = (request.herbInfos || []).map(h => h.name).join(', ');
    return <Card>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <UserIcon size={24} className="text-text-secondary"/>
                </div>
                <div>
                     <p className="font-semibold">{otherParty?.name} <span className="text-xs font-normal text-text-secondary">({otherParty?.role})</span></p>
                     {herbNames && qty > 0 && <p className="text-sm">{herbNames} - {qty} kg</p>}
                </div>
            </div>
            <p className={`font-bold text-sm ${statusStyles[request.status]}`}>{request.status}</p>
        </div>
        {request.message && <p className="text-sm mt-2 p-2 bg-gray-50 rounded-md">{request.message}</p>}
        {isReceiver && request.status === RequestStatus.Pending && onStatusUpdate &&
            <div className="flex gap-2 mt-4">
                <Button onClick={() => onStatusUpdate(request.id, RequestStatus.Accepted)} className="text-sm !py-1"><CheckCircle size={16} /> Accept</Button>
                <Button onClick={() => onStatusUpdate(request.id, RequestStatus.Rejected)} variant="secondary" className="text-sm !py-1"><XCircle size={16} /> Reject</Button>
            </div>
        }
    </Card>
}


export default FarmerDashboard;

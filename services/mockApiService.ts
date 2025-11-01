import { User, UserRole, Herb, Batch, Transaction, HerbStatus, ActionType, HerbRequest, RequestStatus } from '../types';

// --- LOCALSTORAGE DATABASE HELPERS ---
const DB_KEYS = {
    USERS: 'ayu_users',
    HERBS: 'ayu_herbs',
    BATCHES: 'ayu_batches',
    TRANSACTIONS: 'ayu_transactions',
    REQUESTS: 'ayu_requests',
};

const readFromDb = <T>(key: string): T | null => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return null;
    }
};

const writeToDb = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// --- SEED DATA (Used only on first load) ---
const seedUsers: User[] = [
    { id: 'farmer1', name: 'Ram Singh', email: 'ram@farm.com', role: UserRole.Farmer, location: { latitude: 28.6139, longitude: 77.2090 }, phone: '9876543210', address: '123 Kisan Ganj, Delhi', aadhar: '1234 5678 9012' },
    { id: 'lab1', name: 'Agri Labs', email: 'kumar@lab.com', role: UserRole.Lab, phone: '9876543212', labRegId: 'LAB-AG-543' },
    { id: 'manufacturer1', name: 'AyuWell Inc.', email: 'contact@ayuwell.com', role: UserRole.Manufacturer, phone: '9876543213', gstin: '07ABCDE1234F1Z5', manufacturerId: 'MFG-AYU-001' },
];

// --- INITIALIZE IN-MEMORY CACHE FROM LOCALSTORAGE ---
let users: User[] = readFromDb<User[]>(DB_KEYS.USERS) || [];
let herbs: Herb[] = readFromDb<Herb[]>(DB_KEYS.HERBS) || [];
let batches: Batch[] = readFromDb<Batch[]>(DB_KEYS.BATCHES) || [];
let transactions: Transaction[] = readFromDb<Transaction[]>(DB_KEYS.TRANSACTIONS) || [];
let requests: HerbRequest[] = readFromDb<HerbRequest[]>(DB_KEYS.REQUESTS) || [];

// --- SEED DATABASE IF EMPTY ---
const seedDatabase = () => {
    if (users.length === 0) {
        users = seedUsers;
        writeToDb(DB_KEYS.USERS, users);
    }
    if (herbs.length === 0) writeToDb(DB_KEYS.HERBS, []);
    if (batches.length === 0) writeToDb(DB_KEYS.BATCHES, []);
    if (transactions.length === 0) writeToDb(DB_KEYS.TRANSACTIONS, []);
    if (requests.length === 0) writeToDb(DB_KEYS.REQUESTS, []);
};
seedDatabase();

// --- DATA HYGIENE: Remove legacy Collector users and invalid roles ---
const allowedRoles = new Set([UserRole.Farmer, UserRole.Lab, UserRole.Manufacturer]);
const hadLegacyCollectors = users.some(u => !allowedRoles.has(u.role));
if (hadLegacyCollectors) {
    users = users.filter(u => allowedRoles.has(u.role));
    writeToDb(DB_KEYS.USERS, users);
}


const apiDelay = 500;

// --- AUTH ---
export const mockLogin = (email: string, pass: string, role: UserRole): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = users.find(u => u.email === email && u.role === role);
            if (user && pass === 'password') { // Simple password check
                resolve(user);
            } else {
                reject(new Error('Invalid credentials or role mismatch.'));
            }
        }, apiDelay);
    });
};

export const mockRegister = (userData: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const userExists = users.some(u => u.email === userData.email && u.role === userData.role);
            if (userExists) {
                reject(new Error('A user with this email already exists for the selected role.'));
                return;
            }
            const newUser: User = { ...userData, id: `${userData.role.toLowerCase().replace(/\s/g, '')}${users.length + 1}` };
            users.push(newUser);
            writeToDb(DB_KEYS.USERS, users);
            resolve(newUser);
        }, apiDelay);
    });
};

// --- DATA GETTERS ---
export const getUserById = (userId: string): Promise<User | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(users.find(u => u.id === userId)), 50));
}

export const getHerbById = (herbId: string): Promise<Herb | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(herbs.find(h => h.id === herbId)), 50));
}

// --- FARMER ---
export const addHerb = (herb: Omit<Herb, 'id' | 'status'>): Promise<Herb> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newHerb: Herb = { ...herb, id: `herb${herbs.length + 1}`, status: HerbStatus.Harvested, };
            herbs.push(newHerb);
            writeToDb(DB_KEYS.HERBS, herbs);
            resolve(newHerb);
        }, apiDelay);
    });
};

export const getHerbsByFarmer = (farmerId: string): Promise<Herb[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(herbs.filter(h => h.farmerId === farmerId).sort((a,b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()));
        }, apiDelay);
    });
}

export const searchLabs = (query: string): Promise<User[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            resolve(users.filter(u => u.role === UserRole.Lab && u.name.toLowerCase().includes(lowerQuery)));
        }, apiDelay)
    })
}

// --- DISPATCH (FARMER TO LAB) ---
export const searchHerbs = (query: string): Promise<Herb[]> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            const lowerQuery = query.toLowerCase();
            const availableHerbs = herbs.filter(h => h.status === HerbStatus.Harvested && h.name.toLowerCase().includes(lowerQuery));
            resolve(availableHerbs);
        }, apiDelay);
    });
};

export const getHerbsReadyForDispatch = (farmerId: string): Promise<Herb[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const ready = herbs.filter(h => h.farmerId === farmerId && (h.status === HerbStatus.Harvested || h.status === HerbStatus.AwaitingPickup));
            resolve(ready);
        }, apiDelay);
    })
}

export const farmerDispatchToLab = (herbIds: string[], farmerId: string, labId: string, vehicleNo: string): Promise<Batch> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newBatch: Batch = {
                id: `batch${batches.length + 1}`,
                herbIds,
                labId,
                status: HerbStatus.InLab,
                pickupDate: new Date().toISOString(),
                vehicleNo,
            };
            batches.push(newBatch);
            writeToDb(DB_KEYS.BATCHES, batches);

            herbIds.forEach(herbId => {
                const herb = herbs.find(h => h.id === herbId);
                if (herb) {
                    herb.status = HerbStatus.InLab;
                    herb.batchId = newBatch.id;
                }
            });
            writeToDb(DB_KEYS.HERBS, herbs);

            transactions.push({ id: `t${transactions.length+1}`, batchId: newBatch.id, actorId: farmerId, actorRole: UserRole.Farmer, actionType: ActionType.FARMER_DISPATCH_TO_LAB, timestamp: new Date().toISOString(), details: { vehicleNo, labId } });
            writeToDb(DB_KEYS.TRANSACTIONS, transactions);

            resolve(newBatch);
        }, apiDelay);
    });
}

// --- LAB ---
export const getBatchesForLab = (labId: string): Promise<Batch[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(batches.filter(b => b.labId === labId));
        }, apiDelay)
    });
}

export const submitLabResult = (batchId: string, labId: string, result: 'Approved' | 'Rejected', reportURL: string): Promise<Batch> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const batch = batches.find(b => b.id === batchId);
            if (batch) {
                batch.status = result === 'Approved' ? HerbStatus.Approved : HerbStatus.Rejected;
                batch.reportURL = reportURL;
                batch.herbIds.forEach(herbId => {
                    const herb = herbs.find(h => h.id === herbId);
                    if (herb) herb.status = batch.status;
                });
                writeToDb(DB_KEYS.BATCHES, batches);
                writeToDb(DB_KEYS.HERBS, herbs);

                transactions.push({ id: `t${transactions.length+1}`, batchId: batch.id, actorId: labId, actorRole: UserRole.Lab, actionType: ActionType.LAB_TEST, timestamp: new Date().toISOString(), details: { result, reportURL } });
                writeToDb(DB_KEYS.TRANSACTIONS, transactions);

                resolve(batch);
            } else {
                reject(new Error("Batch not found"));
            }
        }, apiDelay);
    })
}

// --- MANUFACTURER ---
export const getApprovedBatches = (): Promise<Batch[]> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve(batches.filter(b => b.status === HerbStatus.Approved));
        }, apiDelay)
    });
}

export const purchaseBatch = (batchId: string, manufacturerId: string): Promise<Batch> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const batch = batches.find(b => b.id === batchId);
            if (!batch) {
                return reject(new Error('Batch not found'));
            }
            if (batch.status !== HerbStatus.Approved) {
                return reject(new Error('Only approved batches can be purchased'));
            }
            batch.manufacturerId = manufacturerId;
            batch.status = HerbStatus.ReceivedByManufacturer;

            batch.herbIds.forEach(herbId => {
                const herb = herbs.find(h => h.id === herbId);
                if (herb) {
                    herb.status = HerbStatus.ReceivedByManufacturer;
                }
            });

            writeToDb(DB_KEYS.BATCHES, batches);
            writeToDb(DB_KEYS.HERBS, herbs);

            transactions.push({
                id: `t${transactions.length + 1}`,
                batchId: batch.id,
                actorId: manufacturerId,
                actorRole: UserRole.Manufacturer,
                actionType: ActionType.MANUFACTURER_RECEIVE,
                timestamp: new Date().toISOString(),
                details: { manufacturerId }
            });
            writeToDb(DB_KEYS.TRANSACTIONS, transactions);

            resolve(batch);
        }, apiDelay);
    });
}

export const getTraceability = (batchId: string): Promise<Transaction[]> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve(transactions.filter(t => t.batchId === batchId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        }, apiDelay)
    });
}


// --- REQUESTS ---
export const sendRequest = (reqData: Omit<HerbRequest, 'id' | 'status' | 'createdAt'>): Promise<HerbRequest> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newRequest: HerbRequest = {
                ...reqData,
                id: `req${requests.length + 1}`,
                status: RequestStatus.Pending,
                createdAt: new Date().toISOString(),
            };
            requests.push(newRequest);
            writeToDb(DB_KEYS.REQUESTS, requests);
            resolve(newRequest);
        }, apiDelay);
    });
}

export const getRequestsForUser = (userId: string): Promise<HerbRequest[]> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            const userRequests = requests
                .filter(r => r.requesterId === userId || r.receiverId === userId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const populatedRequests = await Promise.all(
                userRequests.map(async (req) => {
                    const [requesterInfo, receiverInfo, herbInfos] = await Promise.all([
                        getUserById(req.requesterId),
                        getUserById(req.receiverId),
                        Promise.all((req.herbIds || []).map(id => getHerbById(id)))
                    ]);
                    return { ...req, requesterInfo, receiverInfo, herbInfos: herbInfos.filter(h => h) as Herb[] };
                })
            );
            resolve(populatedRequests);
        }, apiDelay);
    });
}

export const updateRequestStatus = (requestId: string, status: RequestStatus): Promise<HerbRequest> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const request = requests.find(r => r.id === requestId);
            if (!request) {
                return reject(new Error('Request not found.'));
            }
            request.status = status;
            
            if (status === RequestStatus.Accepted) {
                request.herbIds.forEach(herbId => {
                    const herb = herbs.find(h => h.id === herbId);
                    if (herb) {
                        herb.status = HerbStatus.AwaitingPickup;
                    }
                });
                writeToDb(DB_KEYS.HERBS, herbs);
            }
            
            writeToDb(DB_KEYS.REQUESTS, requests);
            resolve(request);
        }, apiDelay);
    });
}
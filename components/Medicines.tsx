import React, { useState, useMemo, useCallback } from 'react';
import { Medicine, MedicineStatus } from '../types';
import { PlusIcon, TrashIcon, CalendarIcon, PillIcon, ChevronDownIcon } from './Icons';

const getStatus = (expiryDate: string): MedicineStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'About to Expire';
  return 'Safe';
};

const StatusBadge: React.FC<{ status: MedicineStatus }> = ({ status }) => {
  const styles = {
    Safe: 'bg-green-500/20 text-green-400',
    'About to Expire': 'bg-yellow-500/20 text-yellow-400',
    Expired: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
};

const MedicineCard: React.FC<{ medicine: Medicine; onDelete: (id: string) => void }> = ({ medicine, onDelete }) => {
    const status = getStatus(medicine.expiryDate);
    const formattedDate = new Date(medicine.expiryDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    return (
        <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between transition-transform hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center gap-4">
                <div className="bg-slate-700 p-2 rounded-full">
                    <PillIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="font-bold text-lg text-white">{medicine.name}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> Expires: {formattedDate}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <StatusBadge status={status} />
                <button onClick={() => onDelete(medicine.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


const MedicineCategory: React.FC<{ title: string; medicines: Medicine[]; count: number; onDelete: (id: string) => void }> = ({ title, medicines, count, onDelete }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (count === 0) return null;

    return (
        <div className="mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-xl font-bold text-slate-300 mb-4">
                <span>{title} ({count})</span>
                <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="grid gap-4">
                    {medicines.map(med => <MedicineCard key={med.id} medicine={med} onDelete={onDelete} />)}
                </div>
            )}
        </div>
    );
};


const Medicines: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([
    {id: '1', name: 'Paracetamol 500mg', expiryDate: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0]},
    {id: '2', name: 'Amoxicillin 250mg', expiryDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0]},
    {id: '3', name: 'Ibuprofen 200mg', expiryDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0]},
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedExpiry, setNewMedExpiry] = useState('');

  const addMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMedName && newMedExpiry) {
      const newMedicine: Medicine = {
        id: Date.now().toString(),
        name: newMedName,
        expiryDate: newMedExpiry,
      };
      setMedicines([...medicines, newMedicine].sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()));
      setNewMedName('');
      setNewMedExpiry('');
    }
  };

  const deleteMedicine = useCallback((id: string) => {
    setMedicines(prevMeds => prevMeds.filter(med => med.id !== id));
  }, []);

  const categorizedMeds = useMemo(() => {
    const safe: Medicine[] = [];
    const expiring: Medicine[] = [];
    const expired: Medicine[] = [];

    medicines.forEach(med => {
      const status = getStatus(med.expiryDate);
      if (status === 'Safe') safe.push(med);
      else if (status === 'About to Expire') expiring.push(med);
      else expired.push(med);
    });
    return { safe, expiring, expired };
  }, [medicines]);

  return (
    <div className="space-y-8">
      <form onSubmit={addMedicine} className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow w-full">
            <label htmlFor="med-name" className="block text-sm font-medium text-slate-300 mb-1">Medicine Name</label>
            <input
                id="med-name"
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g., Aspirin 81mg"
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
        </div>
        <div className="w-full md:w-auto">
            <label htmlFor="med-expiry" className="block text-sm font-medium text-slate-300 mb-1">Expiry Date</label>
            <input
                id="med-expiry"
                type="date"
                value={newMedExpiry}
                onChange={(e) => setNewMedExpiry(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
        </div>
        <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors">
            <PlusIcon className="w-5 h-5" />
            Add Medicine
        </button>
      </form>
      
      <div>
        <MedicineCategory title="Expired" medicines={categorizedMeds.expired} count={categorizedMeds.expired.length} onDelete={deleteMedicine} />
        <MedicineCategory title="About to Expire" medicines={categorizedMeds.expiring} count={categorizedMeds.expiring.length} onDelete={deleteMedicine} />
        <MedicineCategory title="Safe" medicines={categorizedMeds.safe} count={categorizedMeds.safe.length} onDelete={deleteMedicine} />

        {medicines.length === 0 && (
          <div className="text-center py-12 bg-slate-800 rounded-lg">
            <PillIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">No Medicines Yet</h3>
            <p className="text-slate-400 mt-2">Add your first medicine using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;

import React, { useState, useCallback, useRef } from 'react';
import { Patient, MedicalRecord } from '../types';
import { extractPatientNameFromImage } from '../services/geminiService';
import { UploadIcon, FileTextIcon, UserPlusIcon, TrashIcon, SpinnerIcon, XIcon, DownloadIcon, PlusIcon } from './Icons';
import Modal from './Modal';
import { jsPDF } from 'jspdf';


const RecordCard: React.FC<{ record: MedicalRecord; onDelete: () => void; onDownload: (record: MedicalRecord) => void; }> = ({ record, onDelete, onDownload }) => {
    return (
        <div className="bg-slate-700 rounded-lg p-3 flex items-center justify-between transition-colors hover:bg-slate-600/50">
            <div className="flex items-center gap-3 min-w-0">
                <FileTextIcon className="w-5 h-5 text-blue-300 flex-shrink-0" />
                <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-200 truncate hover:underline" title={record.fileName}>
                    {record.fileName}
                </a>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                 <button onClick={() => onDownload(record)} className="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Download record">
                    <DownloadIcon className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="text-slate-400 hover:text-red-400 transition-colors" aria-label="Delete record">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const MedicalRecords: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetPatientId, setTargetPatientId] = useState<string | null>(null);


    const addRecordToPatient = (patientName: string, file: File) => {
        const newRecord: MedicalRecord = {
            id: Date.now().toString() + file.name,
            fileName: file.name,
            fileType: file.type,
            fileUrl: URL.createObjectURL(file),
        };

        const existingPatientIndex = patients.findIndex(p => p.name.toLowerCase() === patientName.toLowerCase());

        if (existingPatientIndex > -1) {
            setPatients(prev => {
                const newPatients = [...prev];
                newPatients[existingPatientIndex].records.push(newRecord);
                return newPatients;
            });
        } else {
            const newPatient: Patient = {
                id: Date.now().toString(),
                name: patientName,
                records: [newRecord],
            };
            setPatients(prev => [...prev, newPatient]);
        }
    };

    const addRecordToExistingPatientById = (patientId: string, file: File) => {
        const newRecord: MedicalRecord = {
            id: Date.now().toString() + file.name,
            fileName: file.name,
            fileType: file.type,
            fileUrl: URL.createObjectURL(file),
        };
    
        setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
                return { ...p, records: [...p.records, newRecord] };
            }
            return p;
        }));
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            if (targetPatientId) setTargetPatientId(null);
            return;
        }

        if (targetPatientId) {
            addRecordToExistingPatientById(targetPatientId, file);
            setTargetPatientId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const patientName = await extractPatientNameFromImage(file);
            if (patientName === 'Unknown' || !patientName) {
                setPendingFile(file);
                setIsModalOpen(true);
            } else {
                addRecordToPatient(patientName, file);
            }
        } catch (err) {
            setError('Failed to process the document. Please enter the patient name manually.');
            setPendingFile(file);
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const triggerAddRecord = (patientId: string) => {
        setTargetPatientId(patientId);
        fileInputRef.current?.click();
    };

    const handleManualPatientSubmit = (patientName: string) => {
        if (patientName && pendingFile) {
            addRecordToPatient(patientName, pendingFile);
        }
        setIsModalOpen(false);
        setPendingFile(null);
    };
    
    const handleDownload = async (record: MedicalRecord) => {
        const isImage = record.fileType.startsWith('image/');

        if (record.fileType === 'application/pdf' || isImage) {
            if (isImage) {
                const pdf = new jsPDF();
                const img = new Image();
                img.src = record.fileUrl;
                img.onload = () => {
                    const pageInfo = pdf.internal.pageSize;
                    const pageWidth = pageInfo.getWidth();
                    const pageHeight = pageInfo.getHeight();
                    
                    const imgProps = pdf.getImageProperties(img);
                    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
                    
                    const w = imgProps.width * ratio;
                    const h = imgProps.height * ratio;
                    
                    pdf.addImage(img, 'JPEG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
                    pdf.save(`${record.fileName.split('.').slice(0, -1).join('.')}.pdf`);
                }
                img.onerror = () => {
                    alert("Could not load image to create PDF.");
                }
            } else {
                const a = document.createElement('a');
                a.href = record.fileUrl;
                a.download = record.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } else {
            alert("Sorry, download is only supported for PDF and image files, which will be converted to PDF.");
        }
    };


    const deletePatient = useCallback((patientId: string) => {
        setPatients(prev => prev.filter(p => p.id !== patientId));
    }, []);

    const deleteRecord = useCallback((patientId: string, recordId: string) => {
        setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
                const newRecords = p.records.filter(r => r.id !== recordId);
                if (newRecords.length === 0) {
                    return null;
                }
                return { ...p, records: newRecords };
            }
            return p;
        }).filter((p): p is Patient => p !== null));
    }, []);

    return (
        <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    className="hidden"
                    disabled={isLoading}
                />
                <button
                    onClick={() => { setTargetPatientId(null); fileInputRef.current?.click()}}
                    disabled={isLoading}
                    className="w-full h-full flex flex-col items-center justify-center p-6 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="w-8 h-8 text-blue-400 mb-2"/>
                            <h3 className="text-xl font-semibold text-slate-200">Analyzing Document...</h3>
                            <p className="text-slate-400 mt-1">Please wait while we extract patient details.</p>
                        </>
                    ) : (
                        <>
                            <UploadIcon className="w-8 h-8 text-blue-400 mb-2"/>
                            <h3 className="text-xl font-semibold text-slate-200">Upload New Medical Record</h3>
                            <p className="text-slate-400 mt-1">Click to upload (PDF, PNG, JPG)</p>
                        </>
                    )}
                </button>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>

            <div className="space-y-6">
                {patients.map(patient => (
                    <div key={patient.id} className="bg-slate-800/50 rounded-lg p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-blue-300">{patient.name}</h3>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => triggerAddRecord(patient.id)}
                                    className="flex items-center gap-2 text-sm bg-blue-600/50 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Record
                                </button>
                                <button onClick={() => deletePatient(patient.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-slate-700">
                                    <TrashIcon className="w-5 h-5" />
                                    <span className="sr-only">Delete Patient</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {patient.records.map(record => (
                                <RecordCard key={record.id} record={record} onDelete={() => deleteRecord(patient.id, record.id)} onDownload={handleDownload} />
                            ))}
                        </div>
                    </div>
                ))}

                {patients.length === 0 && !isLoading && (
                     <div className="text-center py-12 bg-slate-800 rounded-lg">
                        <FileTextIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">No Medical Records</h3>
                        <p className="text-slate-400 mt-2">Upload a document to get started.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ManualPatientForm onSubmit={handleManualPatientSubmit} existingPatients={patients.map(p => p.name)} onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};


interface ManualPatientFormProps {
    onSubmit: (patientName: string) => void;
    onClose: () => void;
    existingPatients: string[];
}
const ManualPatientForm: React.FC<ManualPatientFormProps> = ({ onSubmit, onClose, existingPatients }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(name);
    }
    return (
        <form onSubmit={handleSubmit} className="p-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Assign Record to Patient</h2>
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            <p className="text-slate-300 mb-4">We couldn't automatically detect the patient's name. Please select an existing patient or enter a new one.</p>
            
            <label htmlFor="patient-name" className="block text-sm font-medium text-slate-300 mb-1">Patient Name</label>
            <input
                id="patient-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                list="existing-patients"
                placeholder="Enter or select patient name"
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
            <datalist id="existing-patients">
                {existingPatients.map(pName => <option key={pName} value={pName} />)}
            </datalist>

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-slate-300 bg-slate-600 hover:bg-slate-500 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5" />
                    Assign Patient
                </button>
            </div>
        </form>
    )
}


export default MedicalRecords;
export type Tab = 'medicines' | 'records';

export type MedicineStatus = 'Safe' | 'About to Expire' | 'Expired';

export interface Medicine {
  id: string;
  name: string;
  expiryDate: string;
}

export interface MedicalRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface Patient {
  id: string;
  name:string;
  records: MedicalRecord[];
}

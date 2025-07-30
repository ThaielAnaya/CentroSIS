// src/types/student.ts
export interface Student {
  id: number;
  DNI: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  cuil: string;
  contact: string;
  enrolled_classes: string[];
  has_family: boolean;
  is_paid: boolean;
  is_late: boolean;
  amount_due: number;
  active: boolean;
  credit_balance: number;
  debt: number;
};
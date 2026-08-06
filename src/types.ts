export type UserStatus = 'aktiv' | 'inaktiv';
export type EintragTyp = 'Angebot' | 'Gesuch';

export interface Schueler {
  id: number;
  nachname: string;
  email: string;
  token: string;
  status: UserStatus;
  created_at: string;
}

export interface Eintrag {
  id: number;
  titel: string;
  nachricht: string;
  typ: EintragTyp;
  sitzplaetze?: number | null;
  schueler_id: number;
  erstellungsdatum: string;
  // Joined fields for admin / contact display
  nachname?: string;
  email?: string;
  schueler_status?: UserStatus;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalEntries: number;
  angeboteCount: number;
  gesucheCount: number;
  totalSeatsOffered: number;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = "CLIENT" | "STAFF" | "ADMIN";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  category: string | null;
  photoUrl: string | null;
  isActive: boolean;
}

export interface StaffDTO {
  id: string;
  bio: string | null;
  specialties: string[];
  instagramUrl: string | null;
  acceptsOnlineBooking: boolean;
  user: {
    name: string;
    image: string | null;
  };
}

export interface AvailableSlot {
  start: string;
  end: string;
}

export interface AppointmentDTO {
  id: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  depositAmount: number | null;
  depositPaid: boolean;
  notes: string | null;
  createdAt: string;
  service?: ServiceDTO;
  staff?: {
    user: { name: string; image: string | null };
  };
}

export interface ReviewDTO {
  id: string;
  appointmentId: string;
  clientId: string;
  staffId: string;
  rating: number;
  comment: string | null;
  photos: string[];
  isVisible: boolean;
  createdAt: string;
  client?: { name: string; image: string | null };
}

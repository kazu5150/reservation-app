export interface Reservation {
  id: string;
  queue_number: number;
  name: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReservationWithWaitTime extends Reservation {
  estimated_wait_minutes: number;
}

export interface WaitInfo {
  queue_number: number;
  position: number;
  estimated_wait_minutes: number;
  current_status: string;
}

export interface ReservationCreate {
  name: string;
}

export interface Seat {
  seat_name: string;
  name: string;
  remaining_minutes: number;
  queue_number: number;
}

export interface OvertimeSeat {
  seat_name: string;
  name: string;
  overtime_minutes: number;
  queue_number: number;
}

export interface Stats {
  waiting_count: number;
  in_progress_count: number;
  completed_count: number;
  today_completed_count: number;
  estimated_wait_minutes: number;
  seats: Seat[];
  overtime_seats: OvertimeSeat[];
}

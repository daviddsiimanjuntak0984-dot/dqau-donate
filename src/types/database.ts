export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

export type DonationStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export interface DonationTransaction {
  id: string;
  creator_id: string;
  supporter_name: string;
  supporter_email: string | null;
  message: string;
  amount_idr: number;
  currency: "IDR";
  status: DonationStatus;
  provider: "midtrans";
  provider_order_id: string;
  provider_transaction_id: string | null;
  payment_type: string | null;
  checkout_url: string | null;
  idempotency_key: string;
  refunded_amount_idr: number;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface CreatorGoal {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  target_amount_idr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OverlayCredential {
  id: string;
  creator_id: string;
  overlay_token: string;
  is_active: boolean;
  created_at: string;
  last_rotated_at: string;
}

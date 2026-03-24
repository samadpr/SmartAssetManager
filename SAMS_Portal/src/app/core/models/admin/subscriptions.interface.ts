import { EntityBase } from "../interfaces/EntityBase.interface";

export interface SubscriptionsRequest {
  id?: number;
  name: string;
  planAmount: number;
  durationDays: number;
  assetLimit: number;
  systemUserLimit: number;
  totalUserLimit: number;
  isPlanActive: boolean;

  // ── NEW FIELDS — update your backend model with these ──
  subscriptionDate?: string;
  subscriptionExpiryDate?: string;
}
export interface Subscriptions extends EntityBase{
  id?: number;
  name: string;
  planAmount: number;
  durationDays: number;
  assetLimit: number;
  systemUserLimit: number;
  totalUserLimit: number;
  isPlanActive: boolean;
}

export interface Subscription {
  id?: number;
  name: string;
  planAmount: number;
  durationDays: number;
  assetLimit: number;
  systemUserLimit: number;
  totalUserLimit: number;
  isPlanActive: boolean;

  // ── NEW FIELDS — update your backend model with these ──
  cardColor: string;          // Primary hex color  e.g. '#7c3aed'
  cardColorSecondary: string; // Secondary hex color e.g. '#a855f7'
  badgeLabel?: string;        // Optional badge text e.g. 'Most Popular'
  badgeIcon?: string;         // Optional Material icon name e.g. 'star'
  description?: string;       // Optional short description shown on card
  sortOrder?: number;         // Optional display ordering
}

export interface PlanColorTheme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
}

export const PLAN_COLOR_THEMES: PlanColorTheme[] = [
  { id: 'violet',  label: 'Violet',  primary: '#7c3aed', secondary: '#a855f7' },
  { id: 'ocean',   label: 'Ocean',   primary: '#0369a1', secondary: '#0ea5e9' },
  { id: 'emerald', label: 'Emerald', primary: '#047857', secondary: '#10b981' },
  { id: 'sunset',  label: 'Sunset',  primary: '#dc2626', secondary: '#f97316' },
  { id: 'rose',    label: 'Rose',    primary: '#be185d', secondary: '#ec4899' },
  { id: 'amber',   label: 'Amber',   primary: '#b45309', secondary: '#f59e0b' },
  { id: 'teal',    label: 'Teal',    primary: '#0f766e', secondary: '#14b8a6' },
  { id: 'indigo',  label: 'Indigo',  primary: '#3730a3', secondary: '#6366f1' },
  { id: 'slate',   label: 'Slate',   primary: '#334155', secondary: '#64748b' },
  { id: 'fuchsia', label: 'Fuchsia', primary: '#86198f', secondary: '#d946ef' },
];

export const BADGE_OPTIONS = [
  { label: 'Most Popular', icon: 'local_fire_department' },
  { label: 'Best Value',   icon: 'thumb_up'             },
  { label: 'New',          icon: 'new_releases'         },
  { label: 'Recommended',  icon: 'star'                 },
  { label: 'Limited',      icon: 'bolt'                 },
  { label: 'Enterprise',   icon: 'business'             },
  { label: 'Pro',          icon: 'workspace_premium'    },
];
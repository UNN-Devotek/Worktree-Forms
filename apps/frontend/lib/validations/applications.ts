import { z } from 'zod';

export const membershipApplicationSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  birthday: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid date format'
    ),
  reference: z
    .string()
    .max(200, 'Reference cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  age_18_plus: z
    .boolean()
    .refine((val) => val === true, 'You must be 18 or older to apply'),
  rules_agreement: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the rules'),
  community_agreement: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the community guidelines'),
  confidentiality_agreement: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the confidentiality agreement'),
  games_applied_for: z
    .array(z.string())
    .min(1, 'You must select at least one game or community option'),
});

export const staffApplicationSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  positions_applied_for: z
    .string()
    .min(1, 'Positions applied for is required')
    .min(5, 'Please provide more detail about positions'),
  games_supported: z
    .array(z.string())
    .min(1, 'You must select at least one supported game'),
  reason_for_applying: z
    .string()
    .min(1, 'Reason for applying is required')
    .min(20, 'Please provide a more detailed reason (at least 20 characters)'),
  ability_to_fulfill: z
    .string()
    .min(1, 'Ability to fulfill is required')
    .min(20, 'Please provide more detail (at least 20 characters)'),
  previous_experience: z
    .string()
    .min(1, 'Previous experience is required')
    .min(20, 'Please provide more detail about your experience (at least 20 characters)'),
  time_agreement: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the time commitment'),
  confidentiality_agreement: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the confidentiality agreement'),
});

export type MembershipApplicationFormValues = z.infer<typeof membershipApplicationSchema>;
export type StaffApplicationFormValues = z.infer<typeof staffApplicationSchema>;
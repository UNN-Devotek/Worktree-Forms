import { describe, it, expect } from 'vitest';
import { membershipApplicationSchema, staffApplicationSchema } from './applications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validMembership = {
  full_name: 'Alice Smith',
  email: 'alice@example.com',
  birthday: '1990-01-15',
  reference: 'Referred by Bob',
  age_18_plus: true,
  rules_agreement: true,
  community_agreement: true,
  confidentiality_agreement: true,
  games_applied_for: ['game-1'],
};

const validStaff = {
  full_name: 'Bob Jones',
  email: 'bob@example.com',
  positions_applied_for: 'Server admin, events coordinator',
  games_supported: ['game-1', 'game-2'],
  reason_for_applying: 'I want to contribute to the community and help new members.',
  ability_to_fulfill: 'I have 10+ hours per week available and reliable internet.',
  previous_experience: 'I moderated a 5,000-member Discord server for 2 years.',
  time_agreement: true,
  confidentiality_agreement: true,
};

// ---------------------------------------------------------------------------
// membershipApplicationSchema
// ---------------------------------------------------------------------------

describe('membershipApplicationSchema', () => {
  it('[P0] accepts a fully valid submission', () => {
    expect(membershipApplicationSchema.safeParse(validMembership).success).toBe(true);
  });

  it('[P0] requires full_name', () => {
    const result = membershipApplicationSchema.safeParse({ ...validMembership, full_name: '' });
    expect(result.success).toBe(false);
  });

  it('[P0] requires full_name to be at least 2 characters', () => {
    const result = membershipApplicationSchema.safeParse({ ...validMembership, full_name: 'A' });
    expect(result.success).toBe(false);
  });

  it('[P0] full_name must not exceed 100 characters', () => {
    const result = membershipApplicationSchema.safeParse({
      ...validMembership,
      full_name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('[P0] requires valid email', () => {
    const result = membershipApplicationSchema.safeParse({ ...validMembership, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('[P0] requires age_18_plus to be true', () => {
    const result = membershipApplicationSchema.safeParse({ ...validMembership, age_18_plus: false });
    expect(result.success).toBe(false);
  });

  it('[P0] requires all agreement flags to be true', () => {
    expect(
      membershipApplicationSchema.safeParse({ ...validMembership, rules_agreement: false }).success
    ).toBe(false);
    expect(
      membershipApplicationSchema.safeParse({ ...validMembership, community_agreement: false }).success
    ).toBe(false);
    expect(
      membershipApplicationSchema.safeParse({ ...validMembership, confidentiality_agreement: false }).success
    ).toBe(false);
  });

  it('[P0] requires at least one game selected', () => {
    const result = membershipApplicationSchema.safeParse({ ...validMembership, games_applied_for: [] });
    expect(result.success).toBe(false);
  });

  it('[P1] birthday is optional', () => {
    const { birthday: _b, ...withoutBirthday } = validMembership;
    expect(membershipApplicationSchema.safeParse(withoutBirthday).success).toBe(true);
  });

  it('[P1] birthday must be a parseable date when provided', () => {
    const result = membershipApplicationSchema.safeParse({
      ...validMembership,
      birthday: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('[P1] reference is optional and allows empty string', () => {
    expect(
      membershipApplicationSchema.safeParse({ ...validMembership, reference: '' }).success
    ).toBe(true);
    expect(
      membershipApplicationSchema.safeParse({ ...validMembership, reference: undefined }).success
    ).toBe(true);
  });

  it('[P1] reference must not exceed 200 characters', () => {
    const result = membershipApplicationSchema.safeParse({
      ...validMembership,
      reference: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('[P1] multiple games can be selected', () => {
    const result = membershipApplicationSchema.safeParse({
      ...validMembership,
      games_applied_for: ['game-1', 'game-2', 'game-3'],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// staffApplicationSchema
// ---------------------------------------------------------------------------

describe('staffApplicationSchema', () => {
  it('[P0] accepts a fully valid staff application', () => {
    expect(staffApplicationSchema.safeParse(validStaff).success).toBe(true);
  });

  it('[P0] requires full_name of at least 2 characters', () => {
    expect(staffApplicationSchema.safeParse({ ...validStaff, full_name: 'A' }).success).toBe(false);
  });

  it('[P0] requires valid email', () => {
    expect(staffApplicationSchema.safeParse({ ...validStaff, email: 'bad' }).success).toBe(false);
  });

  it('[P0] positions_applied_for must be at least 5 characters', () => {
    expect(staffApplicationSchema.safeParse({ ...validStaff, positions_applied_for: 'hi' }).success).toBe(false);
  });

  it('[P0] requires at least one game supported', () => {
    expect(staffApplicationSchema.safeParse({ ...validStaff, games_supported: [] }).success).toBe(false);
  });

  it('[P0] reason_for_applying must be at least 20 characters', () => {
    expect(
      staffApplicationSchema.safeParse({ ...validStaff, reason_for_applying: 'Too short' }).success
    ).toBe(false);
  });

  it('[P0] ability_to_fulfill must be at least 20 characters', () => {
    expect(
      staffApplicationSchema.safeParse({ ...validStaff, ability_to_fulfill: 'Short' }).success
    ).toBe(false);
  });

  it('[P0] previous_experience must be at least 20 characters', () => {
    expect(
      staffApplicationSchema.safeParse({ ...validStaff, previous_experience: 'None' }).success
    ).toBe(false);
  });

  it('[P0] time_agreement must be true', () => {
    expect(staffApplicationSchema.safeParse({ ...validStaff, time_agreement: false }).success).toBe(false);
  });

  it('[P0] confidentiality_agreement must be true', () => {
    expect(
      staffApplicationSchema.safeParse({ ...validStaff, confidentiality_agreement: false }).success
    ).toBe(false);
  });

  it('[P1] full_name max 100 characters', () => {
    expect(
      staffApplicationSchema.safeParse({ ...validStaff, full_name: 'B'.repeat(101) }).success
    ).toBe(false);
  });
});

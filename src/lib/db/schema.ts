import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  date,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { AdapterAccountType } from 'next-auth/adapters'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const categoryEnum = pgEnum('category', [
  'career',
  'financial',
  'relationship',
  'health',
  'education',
  'housing',
  'business',
  'personal_growth',
  'other',
])

export const coachingStyleEnum = pgEnum('coaching_style', [
  'advisor',
  'supporter',
  'critic',
])

export const intervalTypeEnum = pgEnum('interval_type', [
  'standard',
  'custom',
])

export const intervalLabelEnum = pgEnum('interval_label', [
  '1mo',
  '3mo',
  '6mo',
  '9mo',
  '12mo',
  '18mo',
  '24mo',
  '36mo',
])

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  email:               text('email').notNull().unique(),
  emailVerified:       timestamp('email_verified', { mode: 'date' }),
  name:                text('name'),
  image:               text('image'),
  initials:            text('initials'),
  role:                text('role'),
  decisionContext:     text('decision_context'),
  profileAnswers:      jsonb('profile_answers').$type<Record<string, unknown>>(),
  onboardingCompleted: timestamp('onboarding_completed_at'),
  calibration:         integer('calibration').notNull().default(0),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
  updatedAt:           timestamp('updated_at').notNull().defaultNow(),
})

// ── Auth.js adapter tables ─────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  userId:            uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').$type<AdapterAccountType>().notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })])

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })])

// ── Decisions ─────────────────────────────────────────────────────────────────

export const decisions = pgTable('decisions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  summary:            text('summary'),
  category:           categoryEnum('category').notNull(),
  interrogationCount: integer('interrogation_count').notNull().default(0),
  // chosen_option_id deferred — set after options are inserted
  chosenOptionId:     uuid('chosen_option_id'),
  reasoning:          text('reasoning'),
  lockedAt:           timestamp('locked_at'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
})

// ── Decision Options ──────────────────────────────────────────────────────────

export const decisionOptions = pgTable('decision_options', {
  id:         uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  label:      text('label').notNull(),
  pros:       jsonb('pros').notNull().default([]),
  cons:       jsonb('cons').notNull().default([]),
  position:   integer('position').notNull().default(0),
})

// ── Interrogation Sessions ────────────────────────────────────────────────────

export const interrogationSessions = pgTable('interrogation_sessions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  decisionId:      uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  coachingStyle:   coachingStyleEnum('coaching_style').notNull(),
  // What the user said was missing from the previous recommendation (null on first session)
  appealNote:      text('appeal_note'),
  // Snapshot of user's profile_answers at session start
  profileSnapshot: jsonb('profile_snapshot').$type<Record<string, unknown>>(),
  // Full turn array persisted when user saves the session
  turns:           jsonb('turns').$type<{ role: string; content: string; id: string }[]>(),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})

// ── Recommendations ───────────────────────────────────────────────────────────

export const recommendations = pgTable('recommendations', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  decisionId:             uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  interrogationSessionId: uuid('interrogation_session_id').notNull().references(() => interrogationSessions.id, { onDelete: 'cascade' }),
  answer:                 text('answer').notNull(),
  rationale:              text('rationale').notNull(),
  // Array of { pattern: string, finding: string }
  evidence:               jsonb('evidence').notNull().default([]),
  acceptedAt:             timestamp('accepted_at').notNull().defaultNow(),
  createdAt:              timestamp('created_at').notNull().defaultNow(),
})

// ── Pattern Types (system-seeded) ─────────────────────────────────────────────

export const patternTypes = pgTable('pattern_types', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  slug:               text('slug').notNull().unique(),
  title:              text('title').notNull(),
  description:        text('description').notNull(),
  detectionThreshold: integer('detection_threshold').notNull().default(3),
})

// ── Pattern Alerts ────────────────────────────────────────────────────────────

export const patternAlerts = pgTable('pattern_alerts', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  patternTypeId: uuid('pattern_type_id').notNull().references(() => patternTypes.id),
  detectedAt:    timestamp('detected_at').notNull().defaultNow(),
  dismissedAt:   timestamp('dismissed_at'),
})

// ── Pattern Alert ↔ Decisions (junction) ──────────────────────────────────────

export const patternAlertDecisions = pgTable(
  'pattern_alert_decisions',
  {
    patternAlertId: uuid('pattern_alert_id').notNull().references(() => patternAlerts.id, { onDelete: 'cascade' }),
    decisionId:     uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.patternAlertId, t.decisionId] })],
)

// ── Reflections ───────────────────────────────────────────────────────────────

export const reflections = pgTable('reflections', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  decisionId:          uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  scheduledFor:        date('scheduled_for').notNull(),
  intervalType:        intervalTypeEnum('interval_type').notNull(),
  intervalLabel:       intervalLabelEnum('interval_label'),
  customIntervalDays:  integer('custom_interval_days'),
  completedAt:         timestamp('completed_at'),
  content:             text('content'),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
})

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts:      many(accounts),
  decisions:     many(decisions),
  patternAlerts: many(patternAlerts),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const decisionsRelations = relations(decisions, ({ one, many }) => ({
  user:                   one(users, { fields: [decisions.userId], references: [users.id] }),
  options:                many(decisionOptions),
  chosenOption:           one(decisionOptions, { fields: [decisions.chosenOptionId], references: [decisionOptions.id], relationName: 'chosenOption' }),
  interrogationSessions:  many(interrogationSessions),
  recommendations:        many(recommendations),
  reflections:            many(reflections),
  patternAlertDecisions:  many(patternAlertDecisions),
}))

export const decisionOptionsRelations = relations(decisionOptions, ({ one }) => ({
  decision: one(decisions, { fields: [decisionOptions.decisionId], references: [decisions.id] }),
}))

export const interrogationSessionsRelations = relations(interrogationSessions, ({ one }) => ({
  decision:       one(decisions, { fields: [interrogationSessions.decisionId], references: [decisions.id] }),
  recommendation: one(recommendations),
}))

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  decision:             one(decisions, { fields: [recommendations.decisionId], references: [decisions.id] }),
  interrogationSession: one(interrogationSessions, { fields: [recommendations.interrogationSessionId], references: [interrogationSessions.id] }),
}))

export const patternTypesRelations = relations(patternTypes, ({ many }) => ({
  alerts: many(patternAlerts),
}))

export const patternAlertsRelations = relations(patternAlerts, ({ one, many }) => ({
  user:        one(users, { fields: [patternAlerts.userId], references: [users.id] }),
  patternType: one(patternTypes, { fields: [patternAlerts.patternTypeId], references: [patternTypes.id] }),
  decisions:   many(patternAlertDecisions),
}))

export const patternAlertDecisionsRelations = relations(patternAlertDecisions, ({ one }) => ({
  patternAlert: one(patternAlerts, { fields: [patternAlertDecisions.patternAlertId], references: [patternAlerts.id] }),
  decision:     one(decisions, { fields: [patternAlertDecisions.decisionId], references: [decisions.id] }),
}))

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  decision: one(decisions, { fields: [reflections.decisionId], references: [decisions.id] }),
}))

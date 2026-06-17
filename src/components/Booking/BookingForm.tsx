"use client";

import React, { useMemo, useState } from "react";
import {
  bookingDateBounds,
  validateBooking,
  isValid,
  type FieldErrors,
} from "@/lib/booking/validation";
import { submitBooking, BookingError } from "@/lib/booking/client";
import {
  GUEST_LABELS,
  MEAL_LABELS,
  OCCASION_LABELS,
  type BookingInput,
  type BookingResult,
  type GuestRange,
  type MealType,
  type Occasion,
} from "@/lib/booking/types";
import { TurnstileBox } from "./Turnstile";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

/* ---- inline icons (no icon dependency — keeps the module portable) ---- */
const I = {
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
  phone:
    "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1Z",
  mail: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 3v.4l8 5 8-5V7l-8 5Z",
  calendar:
    "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10V6h-2v8h6v-2h-4Z",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v3m0 14v3m10-10h-3M5 12H2m15.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  cake: "M12 6a1.5 1.5 0 0 0 1.5-1.5C13.5 3.5 12 2 12 2s-1.5 1.5-1.5 2.5A1.5 1.5 0 0 0 12 6Zm6 5v-1a2 2 0 0 0-2-2h-3V7h-2v1H8a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v8h16v-8a2 2 0 0 0-2-2Z",
  heart:
    "M12 21s-7-4.6-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5C19 16.4 12 21 12 21Z",
  spark: "M12 2l1.8 5.6L19 9.4l-4.6 3.3L16 18l-4-3-4 3 1.6-5.3L5 9.4l5.2-1.8L12 2Z",
  users:
    "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-5 1.3-5 3.5V19h7v-2.5c0-.9.4-1.7 1-2.3A7 7 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .3.9.7 1.5 1.6 1.5 2.7V19h7v-2.5c0-2.2-3.8-3.5-6.5-3.5Z",
  dot: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  pencil: "M3 17.2V21h3.8L17.8 10 14 6.2 3 17.2ZM20.7 7.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L15 5l3.8 3.8 1.9-1.5Z",
  shield: "M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M20 12H4M10 6 4 12 10 18",
};

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const GUESTS: GuestRange[] = ["1-2", "3-4", "5-6", "7+"];
const MEALS: { value: MealType; icon: string }[] = [
  { value: "breakfast", icon: I.sun },
  { value: "lunch", icon: I.sun },
  { value: "dinner", icon: I.moon },
];
const OCCASIONS: { value: Occasion; icon: string }[] = [
  { value: "birthday", icon: I.cake },
  { value: "anniversary", icon: I.heart },
  { value: "date-night", icon: I.users },
  { value: "family-gathering", icon: I.users },
  { value: "other", icon: I.dot },
];

// Step 1 collects these; the rest live on step 2. Final submit still validates all.
const STEP1_FIELDS: (keyof BookingInput)[] = [
  "name", "email", "phone", "guests", "booking_date", "booking_time",
];

interface Props {
  onSuccess: (result: BookingResult) => void;
}

export default function BookingForm({ onSuccess }: Props) {
  const { min, max } = useMemo(() => bookingDateBounds(), []);

  const [form, setForm] = useState<Partial<BookingInput>>({
    guests: "1-2",
    meal_type: "dinner",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);

  const set = <K extends keyof BookingInput>(key: K, value: BookingInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Gate step 1 → step 2 using the SAME validation rules (UI only).
  const goNext = () => {
    const all = validateBooking(form);
    const step1Errors = Object.fromEntries(
      Object.entries(all).filter(([k]) => STEP1_FIELDS.includes(k as keyof BookingInput))
    ) as FieldErrors;
    setErrors(step1Errors);
    if (Object.keys(step1Errors).length === 0) setStep(2);
  };
  const goBack = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Step 1: advance instead of submitting (Continue button / Enter key).
    if (step === 1) {
      goNext();
      return;
    }
    setFormError(null);
    const found = validateBooking(form);
    setErrors(found);
    if (!isValid(found)) {
      // Surface any step-1 error by returning to that step.
      if (Object.keys(found).some((k) => STEP1_FIELDS.includes(k as keyof BookingInput))) setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBooking({
        ...(form as BookingInput),
        special_request: form.special_request?.trim() || null,
        turnstile_token: turnstileToken,
      });
      onSuccess(result);
    } catch (err) {
      if (err instanceof BookingError) {
        setFormError(err.message);
        if (err.fieldErrors) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="bk-form" onSubmit={handleSubmit} noValidate>
      <p className="bk-eyebrow">
        <span className="bk-eyebrow-mark">❖</span> Reserve Your Table{" "}
        <span className="bk-eyebrow-mark">❖</span>
      </p>
      <h2 className="bk-title">Book Your Table</h2>
      <p className="bk-subtitle">Good food, great vibes and memorable moments await you.</p>

      {/* Step progress */}
      <div className="bk-steps">
        <div className={`bk-step-dot ${step >= 1 ? "is-active" : ""}`}>
          <span>1</span> Reservation Details
        </div>
        <div className="bk-step-line">
          <i style={{ transform: `scaleX(${step >= 2 ? 1 : 0})` }} />
        </div>
        <div className={`bk-step-dot ${step >= 2 ? "is-active" : ""}`}>
          <span>2</span> Preferences
        </div>
      </div>

      {step === 1 && (
        <div className="bk-step" key="step1">
          <div className="bk-grid">
        {/* Name */}
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-name">Your Name</label>
          <div className={`bk-input ${errors.name ? "is-error" : ""}`}>
            <Icon d={I.user} className="bk-input-icon" />
            <input id="bk-name" type="text" placeholder="Enter your name" autoComplete="name"
              value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          {errors.name && <span className="bk-error">{errors.name}</span>}
        </div>

        {/* Phone */}
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-phone">Mobile Number</label>
          <div className={`bk-input ${errors.phone ? "is-error" : ""}`}>
            <Icon d={I.phone} className="bk-input-icon" />
            <input id="bk-phone" type="tel" placeholder="Enter mobile number" autoComplete="tel"
              value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          {errors.phone && <span className="bk-error">{errors.phone}</span>}
        </div>

        {/* Email */}
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-email">Email Address</label>
          <div className={`bk-input ${errors.email ? "is-error" : ""}`}>
            <Icon d={I.mail} className="bk-input-icon" />
            <input id="bk-email" type="email" placeholder="Enter email address" autoComplete="email"
              value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          {errors.email && <span className="bk-error">{errors.email}</span>}
        </div>

        {/* Guests */}
        <div className="bk-field">
          <span className="bk-label">Number of Guests</span>
          <div className="bk-chips bk-chips-guests" role="group" aria-label="Number of guests">
            {GUESTS.map((g) => (
              <button key={g} type="button"
                className={`bk-chip ${form.guests === g ? "is-active" : ""}`}
                aria-pressed={form.guests === g} onClick={() => set("guests", g)}>
                {GUEST_LABELS[g]}
              </button>
            ))}
          </div>
          {errors.guests && <span className="bk-error">{errors.guests}</span>}
        </div>

        {/* Date — custom premium calendar */}
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-date">Booking Date</label>
          <DatePicker
            id="bk-date"
            value={form.booking_date || ""}
            min={min}
            max={max}
            error={!!errors.booking_date}
            onChange={(v) => set("booking_date", v)}
          />
          {errors.booking_date
            ? <span className="bk-error">{errors.booking_date}</span>
            : <span className="bk-hint">Today to next 10 days only</span>}
        </div>

        {/* Time — custom grouped time picker */}
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-time">Booking Time</label>
          <TimePicker
            id="bk-time"
            value={form.booking_time || ""}
            error={!!errors.booking_time}
            onChange={(v) => set("booking_time", v)}
          />
          {errors.booking_time && <span className="bk-error">{errors.booking_time}</span>}
        </div>
          </div>

          <div className="bk-step-actions">
            <button type="button" className="bk-submit bk-next" onClick={goNext}>
              Continue <Icon d={I.arrow} className="bk-submit-arrow" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bk-step" key="step2">
          <button type="button" className="bk-back" onClick={goBack}>
            <Icon d={I.back} /> Back
          </button>

      {/* Meal type */}
      <div className="bk-field bk-field-wide">
        <span className="bk-label">Meal Type</span>
        <div className="bk-chips" role="group" aria-label="Meal type">
          {MEALS.map((m) => (
            <button key={m.value} type="button"
              className={`bk-chip bk-chip-icon ${form.meal_type === m.value ? "is-active" : ""}`}
              aria-pressed={form.meal_type === m.value} onClick={() => set("meal_type", m.value)}>
              <Icon d={m.icon} className="bk-chip-ic" /> {MEAL_LABELS[m.value]}
            </button>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div className="bk-field bk-field-wide">
        <span className="bk-label">Occasion <span className="bk-optional">(Optional)</span></span>
        <div className="bk-chips bk-chips-wrap" role="group" aria-label="Occasion">
          {OCCASIONS.map((o) => (
            <button key={o.value} type="button"
              className={`bk-chip bk-chip-icon bk-chip-outline ${form.occasion === o.value ? "is-active" : ""}`}
              aria-pressed={form.occasion === o.value}
              onClick={() => set("occasion", form.occasion === o.value ? (null as unknown as Occasion) : o.value)}>
              <Icon d={o.icon} className="bk-chip-ic" /> {OCCASION_LABELS[o.value]}
            </button>
          ))}
        </div>
      </div>

      {/* Special request */}
      <div className="bk-field bk-field-wide">
        <label className="bk-label" htmlFor="bk-note">Special Request <span className="bk-optional">(Optional)</span></label>
        <div className={`bk-input bk-textarea ${errors.special_request ? "is-error" : ""}`}>
          <Icon d={I.pencil} className="bk-input-icon" />
          <textarea id="bk-note" rows={2} maxLength={500}
            placeholder="Tell us anything we should know to make your experience special…"
            value={form.special_request || ""} onChange={(e) => set("special_request", e.target.value)} />
        </div>
        {errors.special_request && <span className="bk-error">{errors.special_request}</span>}
      </div>

      {/* Footer: security + turnstile + submit */}
      <div className="bk-footer">
        <div className="bk-secure">
          <Icon d={I.shield} className="bk-secure-ic" />
          <span>Your information is secure<br />and protected.</span>
        </div>
        <TurnstileBox onVerify={setTurnstileToken} />
        <button type="submit" className="bk-submit" disabled={submitting}>
          {submitting ? (
            <><span className="bk-spinner" /> Reserving…</>
          ) : (
            <><Icon d={I.calendar} className="bk-submit-ic" /> Reserve Table <Icon d={I.arrow} className="bk-submit-arrow" /></>
          )}
        </button>
      </div>
        </div>
      )}

      {formError && <p className="bk-form-error" role="alert">{formError}</p>}

      {/* Reassurance strip */}
      <div className="bk-features">
        <div className="bk-feature"><Icon d={I.calendar} className="bk-feature-ic" /><div><strong>Instant Confirmation</strong><span>Get booking details instantly</span></div></div>
        <div className="bk-feature"><Icon d={I.mail} className="bk-feature-ic" /><div><strong>Email Reminder</strong><span>We&apos;ll remind you before 2 hours</span></div></div>
        <div className="bk-feature"><Icon d={I.pencil} className="bk-feature-ic" /><div><strong>Manage Anytime</strong><span>Reschedule or cancel anytime</span></div></div>
      </div>
    </form>
  );
}

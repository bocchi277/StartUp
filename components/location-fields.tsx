"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, Select } from "@/components/ui";
import { INDIA_LOCATIONS, INDIAN_STATES } from "@/lib/india";

export function LocationFields({
  defaultState, defaultCity, defaultPincode, showPincode = true, required = true,
}: {
  defaultState?: string | null;
  defaultCity?: string | null;
  defaultPincode?: string | null;
  showPincode?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("location");
  const [state, setState] = useState(defaultState ?? "");
  const listId = useId();
  const cities = INDIA_LOCATIONS[state] ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={t("state")} htmlFor={`${listId}-state`} required={required}>
        <Select
          id={`${listId}-state`}
          name="state"
          required={required}
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">{t("chooseState")}</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("city")} htmlFor={`${listId}-city`} required={required}>
        <Input
          id={`${listId}-city`}
          name="city"
          list={listId}
          required={required}
          minLength={2}
          maxLength={80}
          defaultValue={defaultCity ?? ""}
          placeholder={t("cityPlaceholder")}
          autoComplete="address-level2"
        />
        <datalist id={listId}>
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      {showPincode && (
        <Field label={t("pincode")} htmlFor={`${listId}-pin`}>
          <Input
            id={`${listId}-pin`}
            name="pincode"
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            defaultValue={defaultPincode ?? ""}
            autoComplete="postal-code"
          />
        </Field>
      )}
    </div>
  );
}

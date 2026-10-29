"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { INDIA_LOCATIONS, INDIAN_STATES } from "@/lib/india";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import type { Tables } from "@/types/database";

export type JobFilterValues = {
  state?: string; city?: string; role?: string; cuisine?: string; salary?: string;
  type?: string; meals?: string; stay?: string;
};

// Plain GET form so filters live in the URL and links can be shared on WhatsApp.
export function JobFilters({
  values, roles, cuisines, action,
}: {
  values: JobFilterValues;
  roles: Tables<"job_roles">[];
  cuisines: Tables<"cuisines">[];
  action: string;
}) {
  const t = useTranslations("filters");
  const te = useTranslations("enums.employment_type");
  const locale = useLocale();
  const name = (i: { name_en: string; name_hi: string }) => (locale === "hi" ? i.name_hi : i.name_en);
  const [state, setState] = useState(values.state ?? "");

  return (
    <form action={action} method="get" className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label={t("state")} htmlFor="f-state">
        <Select id="f-state" name="state" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">{t("anyState")}</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label={t("city")} htmlFor="f-city">
        <Input id="f-city" name="city" list="f-city-list" defaultValue={values.city ?? ""} placeholder={t("anyCity")} />
        <datalist id="f-city-list">
          {(INDIA_LOCATIONS[state] ?? []).map((c) => <option key={c} value={c} />)}
        </datalist>
      </Field>
      <Field label={t("role")} htmlFor="f-role">
        <Select id="f-role" name="role" defaultValue={values.role ?? ""}>
          <option value="">{t("anyRole")}</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{name(r)}</option>)}
        </Select>
      </Field>
      <Field label={t("cuisine")} htmlFor="f-cuisine">
        <Select id="f-cuisine" name="cuisine" defaultValue={values.cuisine ?? ""}>
          <option value="">{t("anyCuisine")}</option>
          {cuisines.map((c) => <option key={c.id} value={c.id}>{name(c)}</option>)}
        </Select>
      </Field>
      <Field label={t("minSalary")} htmlFor="f-salary">
        <Input id="f-salary" name="salary" type="number" min={0} step={1000} inputMode="numeric" defaultValue={values.salary ?? ""} />
      </Field>
      <Field label={t("employmentType")} htmlFor="f-type">
        <Select id="f-type" name="type" defaultValue={values.type ?? ""}>
          <option value="">{t("anyType")}</option>
          {EMPLOYMENT_TYPES.map((e) => <option key={e} value={e}>{te(e)}</option>)}
        </Select>
      </Field>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="meals" value="1" defaultChecked={values.meals === "1"} className="size-4 accent-orange-600" />
          {t("mealsProvided")}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="stay" value="1" defaultChecked={values.stay === "1"} className="size-4 accent-orange-600" />
          {t("accommodationProvided")}
        </label>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">{t("search")}</Button>
        <a href={action} className="px-2 py-2.5 text-sm text-stone-600 underline">{t("clear")}</a>
      </div>
    </form>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { LocationFields } from "@/components/location-fields";
import { saveBusiness } from "@/lib/actions/employer";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import type { Tables } from "@/types/database";

export function BusinessForm({ business }: { business: Tables<"businesses"> | null }) {
  const t = useTranslations("businessForm");
  const te = useTranslations("enums.business_category");

  return (
    <ActionForm action={saveBusiness} className="space-y-5">
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("name")} htmlFor="name" required>
            <Input id="name" name="name" required minLength={2} maxLength={120} defaultValue={business?.name ?? ""} placeholder={t("namePlaceholder")} />
          </Field>
          <Field label={t("category")} htmlFor="category" required>
            <Select id="category" name="category" required defaultValue={business?.category ?? ""}>
              <option value="" disabled>{t("chooseCategory")}</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{te(c)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t("address")} htmlFor="address" required>
          <Input id="address" name="address" required minLength={5} maxLength={300} defaultValue={business?.address ?? ""} autoComplete="street-address" />
        </Field>
        <LocationFields defaultState={business?.state} defaultCity={business?.city} defaultPincode={business?.pincode} />
        <Field label={t("phone")} htmlFor="phone" required hint={t("phoneHint")}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" required pattern="\+?[0-9\s\-]{10,16}" defaultValue={business?.phone ?? ""} autoComplete="tel" />
        </Field>
        <Field label={t("description")} htmlFor="description" hint={t("descriptionHint")}>
          <Textarea id="description" name="description" maxLength={1500} defaultValue={business?.description ?? ""} />
        </Field>
      </Card>
      <SubmitButton className="w-full sm:w-auto">{business ? t("save") : t("create")}</SubmitButton>
    </ActionForm>
  );
}

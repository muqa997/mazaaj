"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type CouponValidationResult =
  | { valid: true; code: string; discountType: "fixed" | "percentage"; discountValue: number }
  | { valid: false };

export async function validateCoupon(rawCode: string): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code || !supabaseAdmin) return { valid: false };

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("code, discount_type, discount_value")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { valid: false };

  return {
    valid: true,
    code: data.code,
    discountType: data.discount_type,
    discountValue: data.discount_value,
  };
}

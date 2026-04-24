import { serpapiFetch } from "./client";

export type AccountInfo = {
  account_email?: string;
  plan_name?: string;
  searches_per_month?: number;
  this_month_usage?: number;
  total_searches_left?: number;
  plan_searches_left?: number;
};

export async function getAccount(): Promise<AccountInfo> {
  return serpapiFetch<AccountInfo>("/account.json");
}

export async function getRemaining(): Promise<number> {
  const acc = await getAccount();
  return (
    acc.total_searches_left ??
    acc.plan_searches_left ??
    Math.max(
      0,
      (acc.searches_per_month ?? 0) - (acc.this_month_usage ?? 0),
    )
  );
}

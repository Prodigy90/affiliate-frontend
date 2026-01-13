import { apiGet } from "@/lib/api/client";

export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

interface BanksResponse {
  banks: Bank[];
}

export async function getBanks(): Promise<Bank[]> {
  const response = await apiGet<BanksResponse>("/banks");
  return response.banks;
}

export interface ResolvedAccount {
  account_number: string;
  account_name: string;
}

interface ResolveAccountResponse {
  account_number: string;
  account_name: string;
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<ResolvedAccount> {
  const response = await apiGet<ResolveAccountResponse>(
    `/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return response;
}

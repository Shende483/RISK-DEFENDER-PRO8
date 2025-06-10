export interface MarketTypeDetails {
  id: number;
  name: string;
  status?: string;
}

export interface MarketTypeList {
  _id: string;
  name: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

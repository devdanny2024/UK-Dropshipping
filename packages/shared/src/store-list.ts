import partnerCategories from './store-list.json';

export type StoreSegment = {
  label: string;
  stores: string[];
};

export type PartnerCategory = {
  name: string;
  segments: StoreSegment[];
};

export const partnerStoreCategories = partnerCategories as PartnerCategory[];

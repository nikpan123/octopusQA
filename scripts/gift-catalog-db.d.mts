export type GiftCatalogRow = {
  id: number;
  title: string;
  businessCode: string;
  promotionCode: string;
  weight: number;
  isDel: boolean;
  subjects: string;
  classes: string;
};
export function readGiftCatalogDatabase(giftId?: number): Promise<GiftCatalogRow[]>;

/** Product shape the server page passes into the 3D store. */
export type StoreProduct = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  color: string;
  imageUrl: string | null;
  shelf: number;
  shelfSlot: number;
  category: string;
};

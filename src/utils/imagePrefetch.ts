import { Image } from 'react-native';
import { BASE_URL } from '../constants/api';
import { Category } from '../services/api/category';
import { Offer } from '../services/api/offer';
import { Department } from '../services/api/department';

/**
 * Normalizes an image path to a full URI.
 */
export const getFullImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

/**
 * Prefetches an array of remote image URLs into native disk/memory cache.
 */
export const prefetchImageUrls = async (
  imageUrls: (string | null | undefined)[],
): Promise<void> => {
  const validUrls = imageUrls
    .map(url => getFullImageUrl(url))
    .filter((url): url is string => Boolean(url));

  if (validUrls.length === 0) return;

  await Promise.allSettled(
    validUrls.map(url => Image.prefetch(url)),
  );
};

/**
 * Prefetches all banner images from category items.
 */
export const prefetchCategoriesImages = (categories: Category[]): void => {
  if (!categories || categories.length === 0) return;
  const urls = categories.map(c => c.image).filter(Boolean);
  prefetchImageUrls(urls).catch(() => {});
};

/**
 * Prefetches all banner images from offer items.
 */
export const prefetchOffersImages = (offers: Offer[]): void => {
  if (!offers || offers.length === 0) return;
  const urls: string[] = [];
  offers.forEach(o => {
    if (o.image_en) urls.push(o.image_en);
    if (o.image_ar) urls.push(o.image_ar);
  });
  prefetchImageUrls(urls).catch(() => {});
};

/**
 * Prefetches all department images.
 */
export const prefetchDepartmentsImages = (departments: Department[]): void => {
  if (!departments || departments.length === 0) return;
  const urls = departments.map(d => d.image).filter(Boolean);
  prefetchImageUrls(urls).catch(() => {});
};

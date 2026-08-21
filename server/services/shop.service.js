import { Shop } from '../models/Shop.js';
import { ShopStatus } from '../utils/constants.js';
import mongoose from 'mongoose';

const formatCity = (cityName) => {
  if (!cityName) return '';
  return cityName
    .trim()
    .split(/\s+/)
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
};

export const createShop = async (ownerId, data, files) => {
  const existingShop = await Shop.findOne({ ownerId });
  
  if (existingShop && existingShop.status !== ShopStatus.REJECTED) {
    const error = new Error('You already have an active or pending shop registered');
    error.statusCode = 400;
    throw error;
  }

  let establishmentCertUrl, addressProofUrl, shopPhotoUrl, gstinUrl, shopProofUrl;

  const getUrl = (fileArr) => {
    if (!fileArr || !fileArr[0]) return undefined;
    const f = fileArr[0];
    return f.path || `data:${f.mimetype};base64,${f.buffer?.toString('base64')}`;
  };

  if (files) {
    establishmentCertUrl = getUrl(files.establishmentCert);
    addressProofUrl = getUrl(files.addressProof);
    shopPhotoUrl = getUrl(files.shopPhoto);
    gstinUrl = getUrl(files.gstin);
    shopProofUrl = getUrl(files.shopProof);
  }

  const formattedCity = data.city ? formatCity(data.city) : data.city;

  // If previous registration was REJECTED, update existing shop & reset status to PENDING
  if (existingShop && existingShop.status === ShopStatus.REJECTED) {
    existingShop.name = data.name || existingShop.name;
    existingShop.description = data.description || existingShop.description;
    existingShop.phone = data.phone || existingShop.phone;
    existingShop.address = data.address || existingShop.address;
    existingShop.city = formattedCity || existingShop.city;
    
    existingShop.documents = {
      establishmentCert: establishmentCertUrl || existingShop.documents?.establishmentCert,
      addressProof: addressProofUrl || existingShop.documents?.addressProof,
      shopPhoto: shopPhotoUrl || existingShop.documents?.shopPhoto,
      gstin: gstinUrl || existingShop.documents?.gstin,
      shopProof: shopProofUrl || existingShop.documents?.shopProof,
    };

    const frontPhoto = shopPhotoUrl || existingShop.documents?.shopPhoto;
    if (frontPhoto) {
      existingShop.photos = [frontPhoto, ...(existingShop.photos || []).filter(p => p !== frontPhoto)].slice(0, 5);
    }
    
    existingShop.status = ShopStatus.PENDING;
    await existingShop.save();
    return existingShop;
  }

  const initialPhotos = shopPhotoUrl ? [shopPhotoUrl] : [];

  const shop = await Shop.create({
    ...data,
    city: formattedCity || data.city,
    ownerId,
    photos: initialPhotos,
    documents: {
      establishmentCert: establishmentCertUrl,
      addressProof: addressProofUrl,
      shopPhoto: shopPhotoUrl,
      gstin: gstinUrl,
      shopProof: shopProofUrl,
    },
    status: ShopStatus.PENDING,
  });

  return shop;
};

export const getApprovedShops = async (city, search) => {
  // Exclude shops that have been deactivated by Admin (isActive: false)
  const query = { status: ShopStatus.APPROVED, isActive: { $ne: false } };
  
  if (city && city.trim() && city.trim().toLowerCase() !== 'all cities') {
    query.city = { $regex: new RegExp(city.trim(), 'i') };
  }
  
  if (search && search.trim()) {
    const s = search.trim();
    const searchRegex = { $regex: s, $options: 'i' };
    const searchConditions = [
      { name: searchRegex },
      { city: searchRegex },
      { address: searchRegex },
      { description: searchRegex }
    ];

    if (query.city) {
      const cityCondition = { city: query.city };
      delete query.city;
      query.$and = [
        cityCondition,
        { $or: searchConditions }
      ];
    } else {
      query.$or = searchConditions;
    }
  }

  return Shop.find(query).select('-documents').populate('ownerId', 'name email');
};

export const getShopById = async (shopId) => {
  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    const error = new Error('Invalid shop ID');
    error.statusCode = 400;
    throw error;
  }

  const shop = await Shop.findById(shopId).populate('ownerId', 'name email phone');
  if (!shop || shop.isActive === false) {
    const error = new Error('Shop not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  // If photos is empty but documents.shopPhoto exists, include it as default front photo
  if (shop.documents?.shopPhoto && (!shop.photos || shop.photos.length === 0)) {
    shop.photos = [shop.documents.shopPhoto];
  }

  return shop;
};

export const getOwnerShop = async (ownerId) => {
  const shop = await Shop.findOne({ ownerId }).populate('ownerId', 'name email phone');
  if (shop && shop.documents?.shopPhoto) {
    if (!shop.photos || shop.photos.length === 0) {
      shop.photos = [shop.documents.shopPhoto];
      await shop.save();
    }
  }
  return shop;
};

export const updateShop = async (shopId, ownerId, data) => {
  const shop = await Shop.findOne({ _id: shopId, ownerId });
  if (!shop) {
    const error = new Error('Shop not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (shop.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. All operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  if (data.city) {
    data.city = formatCity(data.city);
  }

  Object.assign(shop, data);
  await shop.save();

  return shop;
};

export const uploadShopPhotos = async (ownerId, files) => {
  const shop = await Shop.findOne({ ownerId });
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  if (!files || files.length === 0) {
    const error = new Error('No photos provided');
    error.statusCode = 400;
    throw error;
  }

  const getUrl = (f) => {
    return f.path || `data:${f.mimetype};base64,${f.buffer?.toString('base64')}`;
  };

  const newPhotoUrls = files.map(getUrl);
  const currentPhotos = shop.photos || [];

  // Limit total photos to max 5
  const updatedPhotos = [...currentPhotos, ...newPhotoUrls].slice(0, 5);
  shop.photos = updatedPhotos;
  await shop.save();

  return shop;
};

export const deleteShopPhoto = async (ownerId, photoUrl) => {
  const shop = await Shop.findOne({ ownerId });
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  shop.photos = (shop.photos || []).filter((url) => url !== photoUrl);
  await shop.save();

  return shop;
};

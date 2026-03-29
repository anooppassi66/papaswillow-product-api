import Joi from 'joi';
import type {
  couponsCredentials,
  ProductAttrCredentials,
  productBrandsCredentials,
  ProductCollectionCredentials,
  ProductLabelCredentials,
  ProductTagsCredentials,
  ProductTaxesCredentials,
  storeCredentials
} from '../types/types';

export const productLabelSchema = {
  body: Joi.object<ProductLabelCredentials>().keys({
    productLabelName: Joi.string().required().min(6),
    productLabelStatus: Joi.string().required().min(2)
  })
};

export const productAttrSchema = {
  body: Joi.object<ProductAttrCredentials>().keys({
    attributeName: Joi.string().required(),
    attributeDesc: Joi.string().required(),
    attributeStatus: Joi.string().required(),
    attributeContent: Joi.array().required()
  })
};

export const productCollectionSchema = {
  body: Joi.object<ProductCollectionCredentials>().keys({
    productCollectionName: Joi.string().required().min(6),
    productCollectionStatus: Joi.string().required().min(2)
  })
};

export const productTaxesSchema = {
  body: Joi.object<ProductTaxesCredentials>().keys({
    title: Joi.string().required(),
    percentage: Joi.number().required(),
    taxStatus: Joi.string().required()
  })
};

export const productTagsSchema = {
  body: Joi.object<ProductTagsCredentials>().keys({
    productTagsName: Joi.string().required(),
    description: Joi.string().required(),
    productTagsStatus: Joi.string().required(),
    productPermalink: Joi.string().required()
  })
};

export const storeCollectorData = {
  body: Joi.object<storeCredentials>().keys({
    storeName: Joi.string().required().min(6),
    storeUrl: Joi.string().required().min(6),
    storeEmail: Joi.string().required().email(),
    storePhone: Joi.string().required()
  })
};

export const couponsSchema = {
  body: Joi.object<couponsCredentials>().keys({
    couponCode: Joi.string().required(),
    couponDesc: Joi.string().required(),
    couponStartDate: Joi.string().required(),
    couponEndDate: Joi.string().required(),
    couponType: Joi.string().required(),
    couponOptions: Joi.string().required(),
    couponValue: Joi.any().required(),
    isNeverExpired: Joi.string().required()
  })
};

export const productBrandsSchema = {
  body: Joi.object<productBrandsCredentials>().keys({
    brandName: Joi.string().required(),
    brandDesc: Joi.string().required(),
    brandWebsite: Joi.string().required(),
    brandStatus: Joi.string().required()
  })
};

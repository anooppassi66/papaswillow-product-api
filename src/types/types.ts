import type { NextFunction, Request, Response } from 'express';
import type { DeepPartial } from 'utility-types';
import type { IFilterXSSOptions } from 'xss';

// See this for the following types
// https://stackoverflow.com/questions/34508081/how-to-add-typescript-definitions-to-express-req-res
// https://stackoverflow.com/questions/61132262/typescript-deep-partial

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// More strictly typed Express.Request type
export type TypedRequest<
  ReqBody = Record<string, unknown>,
  QueryString = Record<string, unknown>
> = Request<
  Record<string, unknown>,
  Record<string, unknown>,
  DeepPartial<ReqBody>,
  DeepPartial<QueryString>
>;

// More strictly typed express middleware type
export type ExpressMiddleware<
  ReqBody = Record<string, unknown>,
  Res = Record<string, unknown>,
  QueryString = Record<string, unknown>
> = (
  req: TypedRequest<ReqBody, QueryString>,
  res: Response<Res>,
  next: NextFunction
) => Promise<void> | void;

// Example usage from Stackoverflow:
// type Req = { email: string; password: string };

// type Res = { message: string };

// export const signupUser: ExpressMiddleware<Req, Res> = async (req, res) => {
//   /* strongly typed `req.body`. yay autocomplete 🎉 */
//   res.json({ message: 'you have signed up' }) // strongly typed response obj
// };
export interface UserSignUpCredentials {
  username: string;
  email: string;
  password: string;
}

export type UserLoginCredentials = Omit<UserSignUpCredentials, 'username'>;

export interface EmailRequestBody {
  email: string;
}

export interface ResetPasswordRequestBodyType {
  newPassword: string;
}

/*
 *  Product Realted types Start
 */
enum DefaultProductStatus {
  active = 'active',
  inactive = 'inactive',
  pending = 'pending',
  delete = 'delete'
}

export interface ProductLabelCredentials {
  productLabelName: string;
  description: string;
  productLabelStatus: DefaultProductStatus;
  createdBy: string;
  updateBy?: string;
  id?: number;
}

export interface ProductAttrCredentials {
  attributeName: string;
  attributeDesc: string;
  attributeStatus: DefaultProductStatus;
  attributeContent: string;
  createdBy: string;
  updateBy?: string;
  id?: number;
}

enum DefaultProductCollection {
  active = 'active',
  inactive = 'inactive',
  pending = 'pending',
  delete = 'delete'
}

enum DefaultCoupons {
  Y = 'Y',
  N = 'N'
}

export interface ProductTaxesCredentials {
  title: string;
  percentage: number;
  taxStatus: DefaultProductCollection;
  createdBy: string;
  updateBy?: string;
  priority?: number;
  id?: number;
}

export interface ProductCollectionCredentials {
  productCollectionName: string;
  description: string;
  productCollectionStatus: DefaultProductCollection;
  createdBy: string;
  updateBy?: string;
  id?: number;
}

export interface ProductTagsCredentials {
  productTagsName: string;
  description: string;
  productPermalink: string;
  productTagsStatus: DefaultProductCollection;
  createdBy: string;
  updateBy?: string;
  id?: number;
}

export interface storeCredentials {
  storeName: string;
  storeUrl: string;
  storeEmail: string;
  storePhone: string;
}

export interface couponsCredentials {
  couponCode: string;
  couponDesc: string;
  couponStartDate: string;
  couponEndDate: string;
  couponType: string;
  couponOptions: string;
  couponValue: string;
  isNeverExpired: DefaultCoupons;
  couponStatus: DefaultProductCollection;
  createdBy: string;
  updateBy?: string;
  id?: number;
}

export interface productBrandsCredentials {
  id?: number;
  brandName: string;
  brandDesc: string;
  brandWebsite: string;
  brandStatus: DefaultProductCollection;
  brandOrder: number;
  brandImage: string;
  createdBy: string;
  updateBy?: string;
}

/*
 *  Product Realted types End
 */

export type Sanitized<T> = T extends (...args: unknown[]) => unknown
  ? T // if T is a function, return it as is
  : T extends object
  ? {
      readonly [K in keyof T]: Sanitized<T[K]>;
    }
  : T;

export type SanitizeOptions = IFilterXSSOptions & {
  whiteList?: IFilterXSSOptions['whiteList'];
};

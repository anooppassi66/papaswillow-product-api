import { Router } from 'express';
import validate from '../../middleware/validate';
import {
  couponsSchema,
  productAttrSchema,
  // productBrandsSchema,
  productCollectionSchema,
  productLabelSchema,
  productTagsSchema,
  productTaxesSchema
} from '../../validations/product.validation';
import * as productController from '../../controller/product.controller';

const adminProductRouter = Router();

/*
 * ** **
 * Product Label Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/productlabel',
  productController.handleProductLabelData
);
adminProductRouter.get(
  '/productlabel/list',
  productController.handleProductLabelList
);
adminProductRouter.post(
  '/productlabel/add',
  validate(productLabelSchema),
  productController.handleProductLabelAdd
);
adminProductRouter.get(
  '/productlabel/:id',
  productController.handleProductLabelById
);
adminProductRouter.post(
  '/productlabel/update',
  validate(productLabelSchema),
  productController.handleProductLabelUpdate
);
/*
 * ** **
 * Product Label Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Collection Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/productcollection',
  productController.handleProductCollectionData
);
adminProductRouter.get(
  '/productcollection/list',
  productController.handleProductCollectionList
);
adminProductRouter.post(
  '/productcollection/add',
  validate(productCollectionSchema),
  productController.handleProductCollectionAdd
);
adminProductRouter.get(
  '/productcollection/:id',
  productController.handleProductCollectionById
);
adminProductRouter.post(
  '/productcollection/update',
  validate(productCollectionSchema),
  productController.handleProductCollectionUpdate
);
/*
 * ** **
 * Product Label Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Collection Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/producttags', productController.handleProductTagsData);
adminProductRouter.get(
  '/producttags/list',
  productController.handleProductTagsList
);
adminProductRouter.post(
  '/producttags/add',
  validate(productTagsSchema),
  productController.handleProductTagsAdd
);
adminProductRouter.get(
  '/producttags/:id',
  productController.handleProductTagsById
);
adminProductRouter.post(
  '/producttags/update',
  validate(productTagsSchema),
  productController.handleProductTagsUpdate
);
/*
 * ** **
 * Product Collection Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Attributes Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/productattributes',
  productController.handleProductAttrData
);
adminProductRouter.get(
  '/productattributes/list',
  productController.handleProductAttrList
);
adminProductRouter.post(
  '/productattributes/add',
  validate(productAttrSchema),
  productController.handleProductAttrAdd
);
adminProductRouter.get(
  '/productattributes/:id',
  productController.handleProductAttrById
);
adminProductRouter.post(
  '/productattributes/update',
  validate(productAttrSchema),
  productController.handleProductAttrUpdate
);
/*
 * ** **
 * Product Attributes Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Store Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/store', productController.handleStoresData);
adminProductRouter.get('/store/list', productController.handleStoresList);
adminProductRouter.post('/store/add', productController.handleStoreAdd);
adminProductRouter.get('/store/:id', productController.handleStoreById);
adminProductRouter.post('/store/update', productController.handleStoreUpdate);

/*
 * ** **
 * Product Store Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Coupon Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/coupons', productController.handleCouponsData);
adminProductRouter.get('/coupons/list', productController.handleCouponsList);
adminProductRouter.post(
  '/coupons/add',
  validate(couponsSchema),
  productController.handleCouponsAdd
);
adminProductRouter.get('/coupons/:id', productController.handleCouponsById);
adminProductRouter.post(
  '/coupons/update',
  validate(couponsSchema),
  productController.handleCouponsUpdate
);
/*
 * ** **
 * Coupon Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Realted Operations Route Start
 * ** **
 */

/*
 * Tags Base Search start
 */
adminProductRouter.get(
  '/feproduct/search',
  productController.handleProductSearch
);
/*
 * Tags Base Search end
 */

/*
 * Category Base Search products start
 */
adminProductRouter.get(
  '/categoryproduct/search',
  productController.getProductsByCategoryName
);
/*
 * Category Base Search products end
 */

/*
 * Category Filters Base Search products start
 */

adminProductRouter.post(
  '/categoryproduct/search',
  productController.getProductsByCategoryNameFilters
);

/*
 * Category Filters Base Search products end
 */

/*
 *  product related Filters Display start
 */

adminProductRouter.get(
  '/productfilters/filters',
  productController.getProductsByCategoryFilters
);
/*
 * product related Filters Display end
 */

/*
 * Hotdeals and feature products based search start
 */

adminProductRouter.get(
  '/homeproducts',
  productController.getProductsHotDealsFeatured
);
/*
 * Hotdeals and feature products based search start
 */

adminProductRouter.get('/products', productController.handleProducts);
adminProductRouter.get(
  '/products/list',
  productController.handleSearchProductList
);
// adminProductRouter.get(
//   '/products/searchlist',
//   productController.handleSearchProductList
// );
adminProductRouter.post('/products/add', productController.handleProductAdd);
adminProductRouter.get('/products/:id', productController.handleProductById);
adminProductRouter.post(
  '/products/update',
  productController.handleProductUpdate
);
adminProductRouter.delete(
  '/product/:id',
  productController.handleStockDeleteProductById
);
adminProductRouter.get(
  '/product/details/:name',
  productController.handleProductDetails
);
adminProductRouter.get(
  '/products/variations/:productId/:id',
  productController.handleProductAtrributes
);

adminProductRouter.post(
  '/products/variations/add',
  productController.handleProductVariations
);
adminProductRouter.post(
  '/products/variations/delete',
  productController.handleProductVariationsDelete
);
adminProductRouter.post(
  '/products/variations/update',
  productController.handleProductVariationsUpdate
);
adminProductRouter.get('/taxes', productController.handleTaxes);
/*
 * ** **
 * Product Realted Operations Route End
 * ** **
 */

/*
 * ** **
 * Favourite Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/wishlist', productController.handleFavByUserId);
adminProductRouter.post('/wishlist', productController.handleFavUserAdd);
adminProductRouter.delete(
  '/wishlist/item/:name',
  productController.handleFavUserDelete
);
/*
 * ** **
 * Favourite Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Brands Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/productbrands',
  productController.handleProductBrandsData
);
adminProductRouter.get(
  '/productbrands/list',
  productController.handleProductBrandsList
);
adminProductRouter.post(
  '/productbrands/add',
  productController.handleProductBrandsAdd
);
adminProductRouter.get(
  '/productbrands/:id',
  productController.handleProductBrandsById
);
adminProductRouter.post(
  '/productbrands/update',
  productController.handleProductBrandsUpdate
);
/*
 * ** **
 * Product Brands Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Categories Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/productcategories',
  productController.handleProductCategoryData
);
adminProductRouter.get('/menucategories', productController.handleMenuCategory);
adminProductRouter.get(
  '/productcategories/list',
  productController.handleProductCategoryList
);
adminProductRouter.post(
  '/productcategories/add',
  productController.handleProductCategoryAdd
);
adminProductRouter.get(
  '/productcategories/:id',
  productController.handleProductCategoryById
);
adminProductRouter.post(
  '/productcategories/update',
  productController.handleProductCategoryUpdate
);
/*
 * ** **
 * Product Categories Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Reviews Realted Crud Operations Route Start
 * ** **
 */
// Reviews List for backend
adminProductRouter.get(
  '/productreviews/list',
  productController.handleProductReviewsList
);
// Get Review info to FrontEnd
adminProductRouter.get(
  '/productreviews/:name',
  productController.handleProductReviewsByProduct
);
// Add Review info to FrontEnd
adminProductRouter.post(
  '/productreviews',
  productController.handleProductReviews
);
// Add Review info to Backend
adminProductRouter.post(
  '/productreviews/add',
  productController.handleProductReviewsAdd
);

adminProductRouter.get(
  '/productreviews/info/:id',
  productController.handleProductReviewsById
);
adminProductRouter.post(
  '/productreviews/update',
  productController.handleProductReviewsUpdate
);
/*
 * ** **
 * Product Reviews Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Financial Year Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/financialyear', productController.handleFYData);
adminProductRouter.get('/financialyear/list', productController.handleFYList);
adminProductRouter.post('/financialyear/add', productController.handleFYAdd);
adminProductRouter.get('/financialyear/:id', productController.handleFYById);
adminProductRouter.post(
  '/financialyear/update',
  productController.handleFYUpdate
);
/*
 * ** **
 * Financial Year Categories Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Stock Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get('/stock', productController.handleStockData);
adminProductRouter.get('/stock/list', productController.handleStockList);
// adminProductRouter.post('/stock/add', productController.handleStockAdd);
adminProductRouter.post(
  '/stock/addinventory',
  productController.handleStockInventoryAdd
);
adminProductRouter.get('/stock/:id', productController.handleStockById);
adminProductRouter.post('/stock/update', productController.handleStockUpdate);
/*
 * ** **
 * Stock Categories Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Product Collection Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/producttaxes',
  productController.handleProductTaxesData
);
adminProductRouter.get(
  '/producttaxes/list',
  productController.handleProductTaxesList
);
adminProductRouter.post(
  '/producttaxes/add',
  validate(productTaxesSchema),
  productController.handleProductTaxesAdd
);
adminProductRouter.get(
  '/producttaxes/:id',
  productController.handleProductTaxesById
);
adminProductRouter.post(
  '/producttaxes/update',
  validate(productTaxesSchema),
  productController.handleProductTaxesUpdate
);
/*
 * ** **
 * Product Label Realted Crud Operations Route End
 * ** **
 */

/*
 * ** **
 * Inventory Realted Crud Operations Route Start
 * ** **
 */
adminProductRouter.get(
  '/inventory/:status',
  productController.handleInventoryData
);
adminProductRouter.get(
  '/listinventory/:id',
  productController.handleInventoryById
);
adminProductRouter.post(
  '/inventory/update',
  productController.handleInventoryUpdate
);

/*
 * ** **
 * Product Label Realted Crud Operations Route End
 * ** **
 */

export default adminProductRouter;

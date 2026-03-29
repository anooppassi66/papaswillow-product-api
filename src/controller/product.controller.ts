import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import prismaClient from '../config/prisma';
import config from '../config/config';
import {
  type couponsCredentials,
  type ProductAttrCredentials,
  type ProductCollectionCredentials,
  type ProductLabelCredentials,
  type ProductTagsCredentials,
  type ProductTaxesCredentials,
  type TypedRequest
} from './../types/types';
import AWS from 'aws-sdk';
import multer from 'multer';
import { Prisma } from '@prisma/client';

const upload = multer();

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  accessKeyId: 'DO801WRHVZ3LGJZLAQ7W',
  secretAccessKey: 'CoBcUm9oPsw/LFlabNU1ZohpB/LBBGz9aGUb1U6ZJP4',
  region: '',
  endpoint: spacesEndpoint.href
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const { verify } = jwt;

/**
 * Handles ProductCollection Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductLabelData = async (_req: Request, res: Response) => {
  try {
    const pLabelCount = await prismaClient.productLabel.count();
    if (pLabelCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Label List', data: emptyOutput });
    }
    const pLabelData = await prismaClient.productLabel.findMany({
      select: {
        id: true,
        productLabelName: true
      }
    });
    const formatOutput = {
      data: pLabelData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Label List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Label:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Label'
    });
  }
};

/**
 * Handles Product Labels List
 * @param req
 * @param res
 * @returns
 */
export const handleProductLabelList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const pLabelCount = await prismaClient.productLabel.count();
    if (pLabelCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: pLabelCount,
        total_pages: Math.ceil(pLabelCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Labels List', data: emptyOutput });
    }

    const pLabelData = await prismaClient.productLabel.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: pLabelCount,
      total_pages: Math.ceil(pLabelCount / perPage),
      data: pLabelData
    };
    return res
      .status(httpStatus.OK)
      .json({ message: 'Product Labels List', data: formatOutput });
  } catch (error) {
    console.error('Error deleting label:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while deleting the label' });
  }
};

/**
 * Handles Add Procduct Label
 * @param req
 * @param res
 * @returns
 */
export const handleProductLabelAdd = async (
  req: TypedRequest<ProductLabelCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { productLabelName, description, productLabelStatus } = req.body;

  if (!productLabelName || !description || !productLabelStatus) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Name, Description and Status are required!'
    });
  }

  const checkproductLabelName = await prismaClient.productLabel.findFirst({
    where: {
      productLabelName
    }
  });

  if (checkproductLabelName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Product Label already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newUser = await prismaClient.productLabel.create({
          data: {
            productLabelName,
            description,
            createdBy: user?.userName,
            productLabelStatus
          }
        });
        console.log(newUser);
        res
          .status(httpStatus.CREATED)
          .json({ status: 200, message: 'Product Label created' });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Procduct Label Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductLabelById = async (req: Request, res: Response) => {
  const pLabelId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const pLabel = await prismaClient.productLabel.findUnique({
      where: {
        id: pLabelId
      }
    });
    if (!pLabel) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Label Info Not Found' });
    }
    return res.json({ status: 200, data: pLabel });
  } catch (err) {
    console.error('Error while fetching Product Label:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Label' });
  }
};

/**
 * Handles Product Label Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductLabelUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { id, productLabelName, description, productLabelStatus } = req.body;

    if (!id || !productLabelName || !description || !productLabelStatus) {
      console.error('Missing required fields:', {
        id,
        productLabelName,
        description,
        productLabelStatus
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the productLabel exists in the database
    const checkProductLabelExists = await prismaClient.productLabel.findUnique({
      where: { id }
    });

    if (!checkProductLabelExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Label not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the productLabel data in the database
        const updatedProductLabel = await prismaClient.productLabel.update({
          where: { id },
          data: {
            productLabelName,
            description,
            productLabelStatus,
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Product Label updated successfully',
          data: updatedProductLabel
        });
      }
    );
  } catch (error) {
    console.error('Error updating Product Label:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while updating the Product Label' });
  }
};

/**
 * Handles ProductCollection Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductCollectionData = async (
  _req: Request,
  res: Response
) => {
  try {
    const pCollectionCount = await prismaClient.productCollection.count();
    if (pCollectionCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Collection List', data: emptyOutput });
    }
    const pCollectionData = await prismaClient.productCollection.findMany({
      select: {
        id: true,
        productCollectionName: true
      }
    });
    const formatOutput = {
      data: pCollectionData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Collection List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Collection:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Collection'
    });
  }
};

/**
 * Handles Product Collection List
 * @param req
 * @param res
 * @returns
 */
export const handleProductCollectionList = async (
  req: Request,
  res: Response
) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const pCollectionCount = await prismaClient.productCollection.count();
    if (pCollectionCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: pCollectionCount,
        total_pages: Math.ceil(pCollectionCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Collection List', data: emptyOutput });
    }

    const pCollectionData = await prismaClient.productCollection.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: pCollectionCount,
      total_pages: Math.ceil(pCollectionCount / perPage),
      data: pCollectionData
    };
    return res
      .status(httpStatus.OK)
      .json({ message: 'Product Collection List', data: formatOutput });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while deleting the collection' });
  }
};

/**
 * Handles Add Procduct Collection
 * @param req
 * @param res
 * @returns
 */
export const handleProductCollectionAdd = async (
  req: TypedRequest<ProductCollectionCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { productCollectionName, description, productCollectionStatus } =
    req.body;

  if (!productCollectionName || !description || !productCollectionStatus) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Name, Description and Status are required!'
    });
  }

  const checkproductCollectionName =
    await prismaClient.productCollection.findFirst({
      where: {
        productCollectionName
      }
    });

  if (checkproductCollectionName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Product Collection already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newUser = await prismaClient.productCollection.create({
          data: {
            productCollectionName,
            description,
            createdBy: user?.userName,
            productCollectionStatus
          }
        });
        console.log(newUser);
        res
          .status(httpStatus.CREATED)
          .json({ status: 200, message: 'Product Collection created' });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Procduct Collection Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductCollectionById = async (
  req: Request,
  res: Response
) => {
  const pCollectionId: number = req.params['id']
    ? parseInt(req.params['id'])
    : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const pCollection = await prismaClient.productCollection.findUnique({
      where: {
        id: pCollectionId
      }
    });
    if (!pCollection) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Collection Info Not Found' });
    }
    return res.json({ status: 200, data: pCollection });
  } catch (err) {
    console.error('Error while fetching Product Collection:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Collection' });
  }
};

/**
 * Handles Product Collection Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductCollectionUpdate = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { id, productCollectionName, description, productCollectionStatus } =
      req.body;

    if (
      !id ||
      !productCollectionName ||
      !description ||
      !productCollectionStatus
    ) {
      console.error('Missing required fields:', {
        id,
        productCollectionName,
        description,
        productCollectionStatus
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Collection exists in the database
    const checkProductCollectionExists =
      await prismaClient.productCollection.findUnique({
        where: { id }
      });

    if (!checkProductCollectionExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Collection not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Prodcut's Collection data in the database
        const updatedProductCollection =
          await prismaClient.productCollection.update({
            where: { id },
            data: {
              productCollectionName,
              description,
              productCollectionStatus,
              updateAt: new Date(),
              updateBy: user?.userName
            }
          });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Product Collection updated successfully',
          data: updatedProductCollection
        });
      }
    );
  } catch (error) {
    console.error('Error updating Product Collection:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Product Collection'
    });
  }
};

/**
 * Handles Add Store
 * @param req
 * @param res
 * @returns
 */
export const handleStoreAdd = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 10 }
    ])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const logo = files['logo'] ? files['logo'][0] : null;
      const coverImages = files['coverImage'] ?? [];

      if (!logo && coverImages.length === 0) {
        return res
          .status(400)
          .json({ error: true, message: 'No files uploaded' });
      }

      const bucketName = 'papaswillow';
      const folderPath = 'papaswillowimages';

      const uploadFileToS3 = async (file: Express.Multer.File) => {
        const params = {
          Bucket: `${bucketName}/${folderPath}`,
          Key: file.originalname,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype
        };
        return await s3.upload(params).promise();
      };

      try {
        const {
          storeName,
          storeUrl,
          storeEmail,
          storePhone,
          storeDesc,
          storeContent,
          storeCountry,
          storeState,
          storeCity,
          storeAddress,
          storeCompany,
          storeStatus,
          storeOwner
        } = req.body;

        if (
          !storeName ||
          !storeUrl ||
          !storeEmail ||
          !storePhone ||
          !storeDesc ||
          !storeContent ||
          !storeCountry ||
          !storeState ||
          !storeCity ||
          !storeAddress ||
          !storeCompany ||
          !storeStatus ||
          !storeOwner
        ) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: 'Missing required fields' });
        }

        // Check if the Store Name exists in the database
        const checkStoreNameExists = await prismaClient.stores.findFirst({
          where: {
            storeName
          }
        });

        if (checkStoreNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Store Name already exists'
          });
        }

        const uploadLogoPromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        if (logo) uploadLogoPromises.push(uploadFileToS3(logo));
        const uploadLogoResults = await Promise.all(uploadLogoPromises);
        // Extract Logo
        const logoLoc = uploadLogoResults.map((file) => file.Location);

        // Convert the Logo array to JSON string
        const logoJson = logoLoc[0];

        const uploadImagePromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        coverImages.forEach((image) =>
          uploadImagePromises.push(uploadFileToS3(image))
        );
        // Extract Cover Image
        const imageLoc = (await Promise.all(uploadImagePromises)).map(
          (file) => file.Location
        );
        // Convert the Cover Image array to JSON string
        const imageJson = JSON.stringify(imageLoc);

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: {
                id: payload.userID
              }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const newStore = await prismaClient.stores.create({
                data: {
                  storeName,
                  storeUrl,
                  storeEmail,
                  storePhone,
                  storeDesc,
                  storeContent,
                  storeCountry,
                  storeState,
                  storeCity,
                  storeAddress,
                  storeCompany,
                  storeStatus,
                  storeOwner,
                  storeLogo: logoJson ?? null,
                  storeImages: imageJson,
                  createdAt: new Date(),
                  createdBy: user?.userName
                }
              });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Store created successfully',
                data: newStore
              });
            } catch (createError) {
              console.error('Error creating store:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Stores List
 * @param req
 * @param res
 * @returns
 */
export const handleStoresList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const storeCount = await prismaClient.stores.count();
    if (storeCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: storeCount,
        total_pages: Math.ceil(storeCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Store List', data: emptyOutput });
    }

    const storeData = await prismaClient.stores.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: storeCount,
      total_pages: Math.ceil(storeCount / perPage),
      data: storeData
    };
    return res
      .status(httpStatus.OK)
      .json({ message: 'Store List', data: formatOutput });
  } catch (error) {
    console.error('Error fetching stores list:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching stores list' });
  }
};

/**
 * Handles Get Store Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleStoreById = async (req: Request, res: Response) => {
  const storeId: number = req.params['id'] ? parseInt(req.params['id']) : 0;

  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  // evaluate jwt
  try {
    const storeData = await prismaClient.stores.findUnique({
      where: {
        id: storeId
      }
    });
    if (!storeId) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Store Info Not Found' });
    }
    return res.json({ status: 200, data: storeData });
  } catch (err) {
    console.error('Error while fetching Store data:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Store data' });
  }
};

/**
 * Handles Store Update
 * @param req
 * @param res
 * @returns
 */
export const handleStoreUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 10 }
    ])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      try {
        const {
          id,
          storeName,
          storeUrl,
          storeEmail,
          storePhone,
          storeDesc,
          storeContent,
          storeCountry,
          storeState,
          storeCity,
          storeAddress,
          storeCompany,
          storeStatus,
          storeOwner,
          deletCoverImages
        } = req.body;

        if (
          !id ||
          !storeName ||
          !storeUrl ||
          !storeEmail ||
          !storePhone ||
          !storeDesc ||
          !storeContent ||
          !storeCountry ||
          !storeState ||
          !storeCity ||
          !storeAddress ||
          !storeCompany ||
          !storeStatus ||
          !storeOwner
        ) {
          console.error('Missing required fields:', {
            id,
            storeName,
            storeUrl,
            storeEmail,
            storePhone,
            storeDesc,
            storeContent,
            storeCountry,
            storeState,
            storeCity,
            storeAddress,
            storeCompany,
            storeStatus,
            storeOwner
          });
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'Missing required fields' });
        }

        const checkStoreNameExists = await prismaClient.stores.findUnique({
          where: { id: parseInt(id) }
        });

        if (!checkStoreNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Store Info Not found'
          });
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const logo = files['logo'] ? files['logo'][0] : null;
        const coverImages = files['coverImage'] ?? [];

        const bucketName = 'papaswillow';
        const folderPath = 'papaswillowimages';

        const uploadFileToS3 = async (file: Express.Multer.File) => {
          const params = {
            Bucket: `${bucketName}/${folderPath}`,
            Key: file.originalname,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype
          };
          return await s3.upload(params).promise();
        };

        const storeInfo = await prismaClient.stores.findUnique({
          where: { id: parseInt(id) }
        });

        let logoJson: string | undefined;
        if (logo) {
          const uploadLogoPromises = [uploadFileToS3(logo)];
          const uploadLogoResults = await Promise.all(uploadLogoPromises);
          logoJson = uploadLogoResults[0]?.Location;
        }

        let imageJson: string | undefined;
        let imageFinalJson: string | undefined;

        if (coverImages.length > 0) {
          const uploadImagePromises = coverImages.map(uploadFileToS3);
          const imageLoc = (await Promise.all(uploadImagePromises)).map(
            (file) => file.Location
          );
          imageJson = JSON.stringify(imageLoc);
          if (storeInfo?.storeImages) {
            const images = JSON.parse(storeInfo?.storeImages ?? '');
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...images];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          } else {
            imageFinalJson = imageJson;
          }
        }

        if (deletCoverImages) {
          if (typeof deletCoverImages !== 'string') {
            return res.status(400).json({
              error: 'deletCoverImages should be a comma-separated string'
            });
          }
          const deletCoverImagesArray = deletCoverImages.split(',');
          const images = JSON.parse(storeInfo?.storeImages ?? '');
          const filteredImages = images.filter(
            (image: string) => !deletCoverImagesArray.includes(image)
          );
          imageFinalJson = JSON.stringify(filteredImages);
          if (imageJson) {
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...filteredImages];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          }
        }

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: { id: payload.userID }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const updateStore = await prismaClient.stores.update({
                where: { id: parseInt(id) },
                data: {
                  storeName,
                  storeUrl,
                  storeEmail,
                  storePhone,
                  storeDesc,
                  storeContent,
                  storeCountry,
                  storeState,
                  storeCity,
                  storeAddress,
                  storeCompany,
                  storeStatus,
                  storeOwner,
                  storeLogo: logoJson ?? storeInfo?.storeLogo ?? '',
                  storeImages: imageFinalJson ?? storeInfo?.storeImages ?? '',
                  updateAt: new Date(),
                  updateBy: user?.userName
                }
              });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Store updated successfully',
                data: updateStore
              });
            } catch (createError) {
              console.error('Error creating store:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3 - 5:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3 - 6' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles ProductTags List
 * @param req
 * @param res
 * @returns
 */
export const handleProductTagsList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const pTagsCount = await prismaClient.productTags.count();
    if (pTagsCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: pTagsCount,
        total_pages: Math.ceil(pTagsCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'ProductTags List', data: emptyOutput });
    }

    const pTagsData = await prismaClient.productTags.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: pTagsCount,
      total_pages: Math.ceil(pTagsCount / perPage),
      data: pTagsData
    };
    return res
      .status(httpStatus.OK)
      .json({ status: 200, message: 'ProductTags List', data: formatOutput });
  } catch (error) {
    console.error('Error fetching ProductTags:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the ProductTags' });
  }
};

/**
 * Handles Add ProductTags
 * @param req
 * @param res
 * @returns
 */
export const handleProductTagsAdd = async (
  req: TypedRequest<ProductTagsCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { productTagsName, description, productPermalink, productTagsStatus } =
    req.body;

  if (
    !productTagsName ||
    !description ||
    !productPermalink ||
    !productTagsStatus
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Name, Description and Status are required!'
    });
  }

  const checkproductTagsName = await prismaClient.productTags.findFirst({
    where: {
      productTagsName
    }
  });

  if (checkproductTagsName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'ProductTags already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newUser = await prismaClient.productTags.create({
          data: {
            productTagsName,
            description,
            productPermalink,
            productTagsStatus,
            createdBy: user?.userName
          }
        });
        console.log(newUser);
        res
          .status(httpStatus.CREATED)
          .json({ status: 200, message: 'ProductTags created' });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get ProductTags Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductTagsById = async (req: Request, res: Response) => {
  const pTagsId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const pTags = await prismaClient.productTags.findUnique({
      where: {
        id: pTagsId
      }
    });
    if (!pTags) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'ProductTags Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'ProductTags Data',
      data: pTags
    });
  } catch (err) {
    console.error('Error while fetching ProductTags:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching ProductTags' });
  }
};

/**
 * Handles ProductTags Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductTagsUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const {
      id,
      productTagsName,
      description,
      productPermalink,
      productTagsStatus
    } = req.body;

    if (
      !id ||
      !productTagsName ||
      !description ||
      !productPermalink ||
      !productTagsStatus
    ) {
      console.error('Missing required fields:', {
        id,
        productTagsName,
        description,
        productPermalink,
        productTagsStatus
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Collection exists in the database
    const checkProductTagsExists = await prismaClient.productTags.findUnique({
      where: { id }
    });

    if (!checkProductTagsExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'ProductTags not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Prodcut's Tags data in the database
        const updatedProductTags = await prismaClient.productTags.update({
          where: { id },
          data: {
            productTagsName,
            description,
            productPermalink,
            productTagsStatus,
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'ProductTags updated successfully',
          data: updatedProductTags
        });
      }
    );
  } catch (error) {
    console.error('Error updating ProductTags:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the ProductTags'
    });
  }
};

/**
 * Handles ProductTags Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductTagsData = async (_req: Request, res: Response) => {
  try {
    const tagsCount = await prismaClient.productTags.count();
    if (tagsCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'ProductTagsList', data: emptyOutput });
    }
    const tagsData = await prismaClient.productTags.findMany({
      select: {
        id: true,
        productTagsName: true
      }
    });
    const formatOutput = {
      data: tagsData
    };
    return res
      .status(httpStatus.OK)
      .json({ status: 200, message: 'ProductTagsList', data: formatOutput });
  } catch (error) {
    console.error('Error fetching ProductTags:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the ProductTags' });
  }
};

/**
 * Handles Store Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleStoresData = async (_req: Request, res: Response) => {
  try {
    const storesCount = await prismaClient.stores.count();
    if (storesCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'StoresList', data: emptyOutput });
    }
    const storesData = await prismaClient.stores.findMany({
      select: {
        id: true,
        storeName: true
      }
    });
    const formatOutput = {
      data: storesData
    };
    return res
      .status(httpStatus.OK)
      .json({ status: 200, message: 'StoresList', data: formatOutput });
  } catch (error) {
    console.error('Error fetching StoresList:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the StoresList' });
  }
};

/**
 * Handles Coupons Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleCouponsData = async (_req: Request, res: Response) => {
  try {
    const couponsCount = await prismaClient.coupons.count();
    if (couponsCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'CouponsList', data: emptyOutput });
    }
    const couponsData = await prismaClient.coupons.findMany({
      select: {
        id: true,
        couponCode: true
      }
    });
    const formatOutput = {
      data: couponsData
    };
    return res
      .status(httpStatus.OK)
      .json({ status: 200, message: 'CouponsList', data: formatOutput });
  } catch (error) {
    console.error('Error fetching Coupons:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the Coupon' });
  }
};

/**
 * Handles Coupons List
 * @param req
 * @param res
 * @returns
 */
export const handleCouponsList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const couponsCount = await prismaClient.coupons.count();
    if (couponsCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: couponsCount,
        total_pages: Math.ceil(couponsCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Coupons List', data: emptyOutput });
    }

    const couponsData = await prismaClient.coupons.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: couponsCount,
      total_pages: Math.ceil(couponsCount / perPage),
      data: couponsData
    };
    return res
      .status(httpStatus.OK)
      .json({ status: 200, message: 'Coupons List', data: formatOutput });
  } catch (error) {
    console.error('Error fetching Coupons:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the Coupons' });
  }
};

/**
 * Handles Add Coupons
 * @param req
 * @param res
 * @returns
 */
export const handleCouponsAdd = async (
  req: TypedRequest<couponsCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const {
    couponCode,
    couponDesc,
    couponStartDate,
    couponEndDate,
    couponType,
    couponOptions,
    couponValue,
    isNeverExpired,
    couponStatus
  } = req.body;

  if (
    !couponCode ||
    !couponDesc ||
    !couponStartDate ||
    !couponEndDate ||
    !couponType ||
    !couponOptions ||
    !couponValue ||
    !isNeverExpired ||
    !couponStatus
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message:
        'Code, Description, Dates , Type , Options and Status are required!'
    });
  }

  const checkCouponCode = await prismaClient.coupons.findFirst({
    where: {
      couponCode
    }
  });

  if (checkCouponCode) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Coupon Code already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newCoupons = await prismaClient.coupons.create({
          data: {
            couponCode,
            couponDesc,
            couponStartDate,
            couponEndDate,
            couponType,
            couponOptions,
            couponValue,
            isNeverExpired,
            couponStatus,
            createdBy: user?.userName
          }
        });
        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Coupon Code created',
          data: newCoupons
        });
      } catch (err) {
        console.log(err, 'err');
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Coupons Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleCouponsById = async (req: Request, res: Response) => {
  const couponId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const couponData = await prismaClient.coupons.findUnique({
      where: {
        id: couponId
      }
    });
    if (!couponData) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Coupon Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Coupon Data',
      data: couponData
    });
  } catch (err) {
    console.error('Error while fetching coupon:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Coupon' });
  }
};

/**
 * Handles Coupon Update
 * @param req
 * @param res
 * @returns
 */
export const handleCouponsUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const {
      id,
      couponCode,
      couponDesc,
      couponStartDate,
      couponEndDate,
      couponType,
      couponOptions,
      couponValue,
      isNeverExpired,
      couponStatus
    } = req.body;

    if (
      !id ||
      !couponCode ||
      !couponDesc ||
      !couponStartDate ||
      !couponEndDate ||
      !couponType ||
      !couponOptions ||
      !couponValue ||
      !isNeverExpired ||
      !couponStatus
    ) {
      console.error('Missing required fields:', {
        id,
        couponCode,
        couponDesc,
        couponStartDate,
        couponEndDate,
        couponType,
        couponOptions,
        couponValue,
        isNeverExpired,
        couponStatus
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Coupon exists in the database
    const checkCouponExists = await prismaClient.coupons.findUnique({
      where: { id }
    });

    if (!checkCouponExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Coupon Info not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Coupon data in the database
        const updatedCoupon = await prismaClient.coupons.update({
          where: { id },
          data: {
            couponCode,
            couponDesc,
            couponStartDate,
            couponEndDate,
            couponType,
            couponOptions,
            couponValue,
            isNeverExpired,
            couponStatus,
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Coupons updated successfully',
          data: updatedCoupon
        });
      }
    );
  } catch (error) {
    console.error('Error updating Coupons:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Coupons'
    });
  }
};

/**
 * Handles Get Favourite By User
 * @param req
 * @param res
 * @returns
 */
export const handleFavByUserId = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'User Info Not Found' });
      }

      try {
        const favInfo = await prismaClient.favourite.findFirst({
          where: {
            userId: payload.userID
          },
          select: {
            id: false, // Select only the `id` from the `cart` table
            favitems: {
              select: {
                quantity: true,
                Product: {
                  select: {
                    name: true,
                    images: true,
                    image: true,
                    price: true,
                    salePrice: true,
                    content: true
                  }
                }
              }
            }
          }
        });
        if (!favInfo) {
          return res.status(httpStatus.OK).json({ status: 200, data: [] });
        }
        return res.json({ status: 200, data: favInfo });
      } catch (err) {
        console.error('Error fetching Favourite:', err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'An error occurred while fetching the Favourite'
        });
      }
    }
  );
};

/**
 * Handles Favourite Add User
 * @param req
 * @param res
 * @returns
 */
export const handleFavUserAdd = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { name } = req.body;

  if (!name) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'product Name is required!'
    });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'User Info Not Found' });
      }

      try {
        let fav = await prismaClient.favourite.findFirst({
          where: { userId: payload.userID }
        });

        if (!fav) {
          fav = await prismaClient.favourite.create({
            data: { userId: payload.userID }
          });
        }

        const product = await prismaClient.product.findFirst({
          where: { name }
        });
        if (!product) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ status: 400, error: 'Product Info Not Found' });
        }

        const favItemInfo = await prismaClient.favouriteItem.findFirst({
          where: {
            favId: fav.id,
            productId: product.id
          }
        });

        if (favItemInfo) {
          try {
            const updatefavItem = await prismaClient.favouriteItem.update({
              where: {
                id: favItemInfo.id,
                favId: fav.id,
                productId: product.id
              },
              data: {
                quantity: 1,
                unitPrice: 0
              }
            });
            const favItemsData = await prismaClient.favouriteItem.findMany({
              where: {
                favId: fav.id
              },
              select: {
                quantity: false,
                Product: {
                  select: {
                    name: true,
                    images: true,
                    image: true,
                    price: true,
                    salePrice: true,
                    content: true
                  }
                }
              }
            });
            if (updatefavItem) {
              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'item Updated',
                data: favItemsData
              });
            }
          } catch (err) {
            console.log(err, 'errerrerrerr');
            res.status(httpStatus.INTERNAL_SERVER_ERROR);
          }
        } else {
          const favItem = await prismaClient.favouriteItem.create({
            data: {
              favId: fav?.id,
              productId: product.id,
              quantity: 1,
              unitPrice: 0
            }
          });
          const favItemsData = await prismaClient.favouriteItem.findMany({
            where: {
              favId: fav?.id
            },
            select: {
              quantity: false,
              Product: {
                select: {
                  name: true,
                  images: true,
                  image: true,
                  price: true,
                  salePrice: true,
                  content: true
                }
              }
            }
          });
          if (favItem) {
            res.status(httpStatus.CREATED).json({
              status: 200,
              message: 'item Updated',
              data: favItemsData
            });
          }
        }
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Fav's Item Delete
 * @param req
 * @param res
 * @returns
 */
export const handleFavUserDelete = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { name } = req.params;
  if (!name) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Product is required!'
    });
  }

  const product = await prismaClient.product.findFirst({
    where: { name },
    select: {
      name: true,
      id: true
    }
  });

  if (!product) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ error: 'Product Info Not Found' });
  }

  if (product) {
    const fav = await prismaClient.favouriteItem.findFirst({
      where: { productId: product.id }
    });

    if (!fav) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: 400, error: 'Fav item not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, payload);
        try {
          const favItem = await prismaClient.favouriteItem.delete({
            where: { id: fav.id, productId: product.id }
          });
          console.log(favItem);

          // Fetch the remaining items in the fav
          const remainingFavItems = await prismaClient.favouriteItem.findMany({
            where: {
              favId: fav.favId
            },
            include: {
              Product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  image: true,
                  price: true,
                  salePrice: true,
                  content: true
                }
              }
            }
          });
          res.status(httpStatus.CREATED).json({
            status: 200,
            message: 'item deleted',
            data: remainingFavItems
          });
        } catch (err) {
          res.status(httpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    );
  }
};

/**
 * Handles Product Attributes Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductAttrData = async (_req: Request, res: Response) => {
  try {
    const attrCount = await prismaClient.productAttributes.count();
    if (attrCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Attribute List', data: emptyOutput });
    }
    const attrData = await prismaClient.productAttributes.findMany({
      select: {
        id: true,
        attributeName: true,
        attributeContent: true
      }
    });
    const formatOutput = {
      data: attrData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Attribute List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Attribute List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Attribute List'
    });
  }
};

/**
 * Handles Product Attributes List
 * @param req
 * @param res
 * @returns
 */
export const handleProductAttrList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const attrCount = await prismaClient.productAttributes.count();
    if (attrCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: attrCount,
        total_pages: Math.ceil(attrCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Attributes List', data: emptyOutput });
    }

    const attrData = await prismaClient.productAttributes.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: attrCount,
      total_pages: Math.ceil(attrCount / perPage),
      data: attrData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Attributes List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Attributes List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Attributes List'
    });
  }
};

/**
 * Handles Add Product Attributes
 * @param req
 * @param res
 * @returns
 */
export const handleProductAttrAdd = async (
  req: TypedRequest<ProductAttrCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { attributeName, attributeDesc, attributeStatus, attributeContent } =
    req.body;

  if (
    !attributeName ||
    !attributeDesc ||
    !attributeStatus ||
    !attributeContent
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Name, Description and Status are required!'
    });
  }

  const checkproductAttrName = await prismaClient.productAttributes.findFirst({
    where: {
      attributeName
    }
  });

  if (checkproductAttrName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Product Attributes already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newAttr = await prismaClient.productAttributes.create({
          data: {
            attributeName,
            attributeDesc,
            attributeStatus,
            attributeContent: JSON.stringify(attributeContent),
            createdAt: new Date(),
            createdBy: user?.userName
          }
        });
        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Product Attributes created',
          data: newAttr
        });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Product Attributes Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductAttrById = async (req: Request, res: Response) => {
  const attrId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const attrTags = await prismaClient.productAttributes.findUnique({
      where: {
        id: attrId
      }
    });
    if (!attrTags) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Attributes Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Product Attributes Data',
      data: attrTags
    });
  } catch (err) {
    console.error('Error while fetching Product Attributes:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Attributes' });
  }
};

/**
 * Handles Product Attributes Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductAttrUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const {
      id,
      attributeName,
      attributeDesc,
      attributeStatus,
      attributeContent
    } = req.body;

    if (
      !id ||
      !attributeName ||
      !attributeDesc ||
      !attributeContent ||
      !attributeStatus
    ) {
      console.error('Missing required fields:', {
        id,
        attributeName,
        attributeDesc,
        attributeStatus,
        attributeContent
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Collection exists in the database
    const checkProductTagsExists =
      await prismaClient.productAttributes.findUnique({
        where: { id }
      });

    if (!checkProductTagsExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Attributes not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Prodcut's Tags data in the database
        const updatedProductTags = await prismaClient.productAttributes.update({
          where: { id },
          data: {
            attributeName,
            attributeDesc,
            attributeStatus,
            attributeContent: JSON.stringify(attributeContent),
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Product Attributes updated successfully',
          data: updatedProductTags
        });
      }
    );
  } catch (error) {
    console.error('Error updating Product Attributes:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Product Attributes'
    });
  }
};

/**
 * Handles Product Brands Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductBrandsData = async (_req: Request, res: Response) => {
  try {
    const brandsCount = await prismaClient.productBrands.count();
    if (brandsCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Brands List', data: emptyOutput });
    }
    const brandsData = await prismaClient.productBrands.findMany({
      where: { brandStatus: 'active' },
      select: {
        id: true,
        brandName: true,
        brandImage: true,
        brandWebsite: true
      }
    });
    const formatOutput = {
      data: brandsData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Brands List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Brands List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Brands List'
    });
  }
};

/**
 * Handles Product Brands List
 * @param req
 * @param res
 * @returns
 */
export const handleProductBrandsList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const brandsCount = await prismaClient.productBrands.count();
    if (brandsCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: brandsCount,
        total_pages: Math.ceil(brandsCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Brands List', data: emptyOutput });
    }

    const brandsData = await prismaClient.productBrands.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: brandsCount,
      total_pages: Math.ceil(brandsCount / perPage),
      data: brandsData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Brands List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Brands List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Brands List'
    });
  }
};

/**
 * Handles Add Brands
 * @param req
 * @param res
 * @returns
 */

export const handleProductBrandsAdd = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([{ name: 'logo', maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const logo = files['logo'] ? files['logo'][0] : null;

      if (!logo) {
        return res
          .status(400)
          .json({ error: true, message: 'No files uploaded' });
      }
      const bucketName = 'papaswillow';
      const folderPath = 'papaswillowimages';

      const uploadFileToS3 = async (file: Express.Multer.File) => {
        const params = {
          Bucket: `${bucketName}/${folderPath}`,
          Key: file.originalname,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype
        };
        return await s3.upload(params).promise();
      };

      try {
        const { brandName, brandDesc, brandWebsite, brandStatus, brandOrder } =
          req.body;

        if (
          !brandName ||
          !brandDesc ||
          !brandWebsite ||
          !brandStatus ||
          !brandOrder
        ) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: 'Missing required fields' });
        }

        // Check if the Brand Name exists in the database
        const checkBrandNameExists = await prismaClient.productBrands.findFirst(
          {
            where: {
              brandName
            }
          }
        );

        if (checkBrandNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Brand Name already exists'
          });
        }

        const uploadLogoPromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        if (logo) uploadLogoPromises.push(uploadFileToS3(logo));
        const uploadLogoResults = await Promise.all(uploadLogoPromises);
        // Extract Logo
        const logoLoc = uploadLogoResults.map((file) => file.Location);

        // Convert the Logo array to JSON string
        const logoJson = logoLoc[0];

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: {
                id: payload.userID
              }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const newBrand = await prismaClient.productBrands.create({
                data: {
                  brandName,
                  brandDesc,
                  brandWebsite,
                  brandStatus,
                  brandOrder: parseInt(brandOrder),
                  brandImage: logoJson ?? '',
                  createdAt: new Date(),
                  createdBy: user?.userName
                }
              });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Brand created successfully',
                data: newBrand
              });
            } catch (createError) {
              console.error('Error creating Brand:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Get Product Brands Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductBrandsById = async (req: Request, res: Response) => {
  const brandId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const productBrands = await prismaClient.productBrands.findUnique({
      where: {
        id: brandId
      }
    });
    if (!productBrands) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Brands Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Product Brands Data',
      data: productBrands
    });
  } catch (err) {
    console.error('Error while fetching Product Brands:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Brands' });
  }
};

/**
 * Handles Brand Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductBrandsUpdate = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([{ name: 'logo', maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      try {
        const {
          id,
          brandName,
          brandDesc,
          brandWebsite,
          brandStatus,
          brandOrder
        } = req.body;

        if (
          !id ||
          !brandName ||
          !brandDesc ||
          !brandWebsite ||
          !brandStatus ||
          !brandOrder
        ) {
          console.error('Missing required fields:', {
            id,
            brandName,
            brandDesc,
            brandWebsite,
            brandStatus,
            brandOrder
          });
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'Missing required fields' });
        }

        const checkBrandNameExists =
          await prismaClient.productBrands.findUnique({
            where: { id: parseInt(id) }
          });

        if (!checkBrandNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Brand Info Not found'
          });
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const logo = files['logo'] ? files['logo'][0] : null;

        const bucketName = 'papaswillow';
        const folderPath = 'papaswillowimages';

        const uploadFileToS3 = async (file: Express.Multer.File) => {
          const params = {
            Bucket: `${bucketName}/${folderPath}`,
            Key: file.originalname,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype
          };
          return await s3.upload(params).promise();
        };

        const brandsInfo = await prismaClient.productBrands.findUnique({
          where: { id: parseInt(id) }
        });

        let logoJson: string | undefined;
        if (logo) {
          const uploadLogoPromises = [uploadFileToS3(logo)];
          const uploadLogoResults = await Promise.all(uploadLogoPromises);
          logoJson = uploadLogoResults[0]?.Location;
        }

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: { id: payload.userID }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const updateStore = await prismaClient.productBrands.update({
                where: { id: parseInt(id) },
                data: {
                  brandName,
                  brandDesc,
                  brandWebsite,
                  brandStatus,
                  brandOrder: parseInt(brandOrder),
                  brandImage: logoJson ?? brandsInfo?.brandImage ?? '',
                  updateAt: new Date(),
                  updateBy: user?.userName
                }
              });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Brand updated successfully',
                data: updateStore
              });
            } catch (createError) {
              console.error('Error creating Brand:', createError);
              res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                error: true,
                message: 'Internal server error while updating Brand'
              });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3 - 5:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3 - 6' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Product Categories Full Data for Frontend Menu
 * @param _req
 * @param res
 * @returns
 */
export const handleMenuCategory = async (_req: Request, res: Response) => {
  try {
    const cateCount = await prismaClient.productCategories.count();
    if (cateCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Categories List', data: emptyOutput });
    }
    const categoryData = await prismaClient.productCategories.findMany({
      where: { menuDisplay: 'Y' },
      select: {
        id: true,
        categoryName: true,
        categoryDisplayName: true,
        parentId: true,
        menuDisplay: true,
        categoryOrder: true,
        categoryImage: true
      }
    });
    const formatOutput = {
      data: categoryData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Categories List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Categories List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Categories List'
    });
  }
};

/**
 * Handles Product Categories Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductCategoryData = async (_req: Request, res: Response) => {
  try {
    // Count categories where id > 0
    const cateCount = await prismaClient.productCategories.count({
      where: {
        id: { gt: 0 }
      }
    });

    if (cateCount === 0) {
      return res.status(httpStatus.OK).json({
        message: 'Product Categories List',
        data: []
      });
    }

    // Fetch category data
    const categoryData = await prismaClient.productCategories.findMany({
      where: {
        id: { gt: 0 }
      },
      select: {
        id: true,
        categoryName: true,
        parentId: true
      }
    });

    return res.status(httpStatus.OK).json({
      status: httpStatus.OK,
      message: 'Product Categories List',
      data: categoryData
    });
  } catch (error) {
    console.error('Error fetching Product Categories List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Categories List'
    });
  }
};

/**
 * Handles Product Categories List
 * @param req
 * @param res
 * @returns
 */
export const handleProductCategoryList = async (
  req: Request,
  res: Response
) => {
  const categoryName: any = req.query['name'];
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const categoryCount = await prismaClient.productCategories.count({
      where: {
        id: {
          gt: 0,  // Correct way to filter id > 0
        },
        categoryName: {
          contains: categoryName
        }
      }
    });
    if (categoryCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: categoryCount,
        total_pages: Math.ceil(categoryCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Category List', data: emptyOutput });
    }

    const categoryData = await prismaClient.productCategories.findMany({
      where: {
        id: {
          gt: 0,  // Correct way to filter id > 0
        },
        categoryName: {
          contains: categoryName
        }
      },
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    // console.log(categoryData,'categoryData-categoryData');

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: categoryCount,
      total_pages: Math.ceil(categoryCount / perPage),
      data: categoryData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Category List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Category List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Category List'
    });
  }
};

/**
 * Handles Add Product Categories
 * @param req
 * @param res
 * @returns
 */
export const handleProductCategoryAdd = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([{ name: 'logo', maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const logo = files['logo'] ? files['logo'][0] : null;

      if (!logo) {
        return res
          .status(400)
          .json({ error: true, message: 'No files uploaded' });
      }
      const bucketName = 'papaswillow';
      const folderPath = 'papaswillowimages';

      const uploadFileToS3 = async (file: Express.Multer.File) => {
        const params = {
          Bucket: `${bucketName}/${folderPath}`,
          Key: file.originalname,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype
        };
        return await s3.upload(params).promise();
      };

      try {
        const {
          categoryName,
          categoryDisplayName,
          parentId,
          categoryDesc,
          categoryStatus,
          menuDisplay
        } = req.body;

        if (
          !categoryName ||
          !parentId ||
          !categoryDesc ||
          !categoryStatus ||
          !menuDisplay
        ) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: 'Missing required fields' });
        }

        // Check if the Category Name exists in the database
        const checkCategoryNameExists =
          await prismaClient.productCategories.findFirst({
            where: {
              categoryName
            }
          });

        if (checkCategoryNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Category Name already exists'
          });
        }

        const uploadLogoPromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        if (logo) uploadLogoPromises.push(uploadFileToS3(logo));
        const uploadLogoResults = await Promise.all(uploadLogoPromises);
        // Extract Logo
        const logoLoc = uploadLogoResults.map((file) => file.Location);

        // Convert the Logo array to JSON string
        const logoJson = logoLoc[0];

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: {
                id: payload.userID
              }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const newBrand = await prismaClient.productCategories.create({
                data: {
                  categoryName,
                  categoryDisplayName,
                  parentId: parseInt(parentId),
                  categoryDesc,
                  categoryStatus,
                  menuDisplay,
                  categoryOrder: 0,
                  categoryImage: logoJson ?? '',
                  createdAt: new Date(),
                  createdBy: user?.userName
                }
              });

              if (newBrand) {
                const updateCategory =
                  await prismaClient.productCategories.update({
                    where: { id: newBrand.id },
                    data: {
                      categoryOrder: newBrand.id
                    }
                  });
                console.log(updateCategory);
              }

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Category created successfully',
                data: newBrand
              });
            } catch (createError) {
              console.error('Error creating Brand:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Get Product Category Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductCategoryById = async (
  req: Request,
  res: Response
) => {
  const catId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const productCat = await prismaClient.productCategories.findUnique({
      where: {
        id: catId
      }
    });
    if (!productCat) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Category Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Product Category Data shafi',
      data: productCat
    });
  } catch (err) {
    console.error('Error while fetching Product Category:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Category' });
  }
};

/**
 * Handles Product Category Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductCategoryUpdate = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([{ name: 'logo', maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      try {
        const {
          id,
          categoryName,
          parentId,
          categoryDesc,
          categoryStatus,
          categoryOrder,
          menuDisplay
        } = req.body;

        if (
          !id ||
          !categoryName ||
          !parentId ||
          !categoryDesc ||
          !categoryStatus ||
          !categoryOrder ||
          !menuDisplay
        ) {
          console.error('Missing required fields:', {
            id,
            categoryName,
            parentId,
            categoryDesc,
            categoryStatus,
            categoryOrder,
            menuDisplay
          });
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'Missing required fields' });
        }

        const checkCategoryNameExists =
          await prismaClient.productCategories.findUnique({
            where: { id: parseInt(id) }
          });

        if (!checkCategoryNameExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Category Info Not found'
          });
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const logo = files['logo'] ? files['logo'][0] : null;

        const bucketName = 'papaswillow';
        const folderPath = 'papaswillowimages';

        const uploadFileToS3 = async (file: Express.Multer.File) => {
          const params = {
            Bucket: `${bucketName}/${folderPath}`,
            Key: file.originalname,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype
          };
          return await s3.upload(params).promise();
        };

        const categoryInfo = await prismaClient.productCategories.findUnique({
          where: { id: parseInt(id) }
        });

        let logoJson: string | undefined;
        if (logo) {
          const uploadLogoPromises = [uploadFileToS3(logo)];
          const uploadLogoResults = await Promise.all(uploadLogoPromises);
          logoJson = uploadLogoResults[0]?.Location;
        }

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: { id: payload.userID }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const updateStore = await prismaClient.productCategories.update({
                where: { id: parseInt(id) },
                data: {
                  categoryName,
                  parentId: parseInt(parentId),
                  categoryDesc,
                  categoryStatus,
                  categoryOrder: parseInt(categoryOrder),
                  menuDisplay,
                  categoryImage: logoJson ?? categoryInfo?.categoryImage ?? '',
                  updateAt: new Date(),
                  updateBy: user?.userName
                }
              });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Category updated successfully',
                data: updateStore
              });
            } catch (createError) {
              console.error('Error creating Brand:', createError);
              res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                error: true,
                message: 'Internal server error while updating Brand'
              });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3 - 5:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3 - 6' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 *
 * Handles Get All Product
 * @param req
 * @param res
 * @returns
 */
export const handleProducts = async (_req: TypedRequest, res: Response) => {
  try {
    const products = await prismaClient.product.findMany({
      where: {
        status: 'active' // Filter condition
      },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        image: true,
        images: true,
        order: true,
        quantity: true,
        saleType: true,
        price: true,
        salePrice: true,
        startDate: true,
        endDate: true,
        length: true,
        wide: true,
        height: true,
        weight: true,
        stockStatus: true,
        productType: true,
        costPerItem: true,
        minimumOrderQuantity: true,
        maximumOrderQuantity: true
      }
    });
    return res
      .status(httpStatus.OK)
      .json({ message: 'Product List', data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetchin the products' });
  }
};

/**
 * Handles Get Product By Name
 * @param req
 * @param res
 * @returns
 */
export const handleProductDetails = async (
  req: TypedRequest,
  res: Response
) => {
  const productName = req.params['name'];
  if (!productName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Name is required!' });
  }

  try {
    // Fetch product details
    const product = await prismaClient.product.findFirst({
      where: {
        name: productName,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        image: true,
        images: true,
        order: true,
        quantity: true,
        saleType: true,
        price: true,
        salePrice: true,
        startDate: true,
        endDate: true,
        length: true,
        wide: true,
        height: true,
        weight: true,
        stockStatus: true,
        productType: true,
        costPerItem: true,
        minimumOrderQuantity: true,
        maximumOrderQuantity: true,
        addons: true,
        discountName: true,
        attributesData: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            attributeContent: true,
            images: true,
            attributePrice: true,
            attributeSalePrice: true,
            attributeQuantity: true,
            isDefault: true
          }
        },
        lableOptions: {
          where: {
            status: 'active'
          },
          select: {
            labelId: true,
            productId: true
          }
        },
        categories: {
          where: {
            status: 'active'
          },
          select: {
            categoryId: true,
            productId: true
          }
        },
        collections: {
          where: {
            status: 'active'
          },
          select: {
            collectionId: true,
            productId: true
          }
        },
        tagsData: {
          where: {
            status: 'active'
          },
          select: {
            tagId: true,
            productId: true
          }
        }
      }
    });

    if (!product) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Product not found!' });
    }

    // Update attribute quantities based on stock information
    if (product.attributesData.length > 0) {
      for (const attribute of product.attributesData) {
        const stockInfo = await prismaClient.stockRecord.findFirst({
          where: {
            productId: product.id,
            productAttrId: attribute.id
          }
        });

        attribute.attributeQuantity = stockInfo
          ? stockInfo.received + stockInfo.returned - stockInfo.issued
          : 0;
      }
    }
    // Fetch addon details
    const addonsArray = product.addons
      ? product.addons.split(',').map((id) => parseInt(id, 10))
      : [];

    const addonsDetails = await prismaClient.product.findMany({
      where: {
        id: { in: addonsArray }
      },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        salePrice: true,
        quantity: true
      }
    });

    // Fetch and calculate average product rating
    const productReviews = await prismaClient.productReviews.findMany({
      where: {
        reviewStatus: 'publish',
        productId: product.id.toString()
      }
    });

    const averageRating =
      productReviews.length > 0
        ? parseFloat(
            (
              productReviews.reduce(
                (total, review) => total + parseInt(review.rating),
                0
              ) / productReviews.length
            ).toFixed(2)
          )
        : 0;

    // Return the final product details with additional information
    return res.status(httpStatus.OK).json({
      message: 'Product Details',
      data: {
        ...product,
        addOnProducts: addonsDetails,
        productRating: averageRating
      }
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching the product details' });
  }
};

/**
 * Deletes stock records and their details for a given product ID.
 * @param req - The request object
 * @param res - The response object
 * @returns A JSON response with the status of the operation
 */
// export const handleStockDeleteProductById = async (
//   req: TypedRequest,
//   res: Response
// ) => {
//   const productId: any = req.params['id'] ? req.params['id'] : 0;

//   try {
//     // Check if the product exists
//     const product = await prismaClient.product.findUnique({
//       where: { id: productId },
//       select: { id: true, name: true }
//     });

//     if (!product) {
//       return res
//         .status(httpStatus.NOT_FOUND)
//         .json({ error: 'Product not found' });
//     }

//     // Delete related StockDetail records
//     await prismaClient.stockDetail.deleteMany({
//       where: {
//         stockRecordId: {
//           in: prismaClient.stockRecord
//             .findMany({
//               where: { productId },
//               select: { id: true }
//             })
//             .then((records) => records.map((r) => r.id))
//         }
//       }
//     });

//     // Delete StockRecord records
//     const deletedStockRecords = await prismaClient.stockRecord.deleteMany({
//       where: { productId }
//     });

//     if (deletedStockRecords.count === 0) {
//       return res.status(httpStatus.NOT_FOUND).json({
//         error: `No stock records found for productId ${productId}`
//       });
//     }

//     // Return success response
//     return res.status(httpStatus.OK).json({
//       message: `Successfully deleted stock records and details for productId ${productId}`,
//       deletedRecords: deletedStockRecords.count
//     });
//   } catch (err) {
//     console.error('Error while deleting stock records:', err);
//     return res
//       .status(httpStatus.INTERNAL_SERVER_ERROR)
//       .json({ error: 'An error occurred while deleting stock records' });
//   }
// };

export const handleStockDeleteProductById = async (
  req: TypedRequest,
  res: Response
) => {
  const productId: any = req.params['id'] ? req.params['id'] : 0;

  try {
    // Check if the product exists
    const product = await prismaClient.product.findUnique({
      where: { id: parseInt(productId) },
      select: { id: true, name: true }
    });

    if (!product) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product not found' });
    }

    // Fetch stockRecord IDs
    const stockRecordIds = await prismaClient.stockRecord.findMany({
      where: { productId: parseInt(productId) },
      select: { id: true }
    });

    const stockRecordIdArray = stockRecordIds.map((record) => record.id);

    // Delete related StockDetail records
    await prismaClient.stockDetail.deleteMany({
      where: {
        stockRecordId: {
          in: stockRecordIdArray
        }
      }
    });

    // Delete StockRecord records
    const deletedStockRecords = await prismaClient.stockRecord.deleteMany({
      where: { productId: parseInt(productId) }
    });

    if (deletedStockRecords.count === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: `No stock records found for productId ${productId}`
      });
    }

    // Return success response
    return res.status(httpStatus.OK).json({
      message: `Successfully deleted stock records and details for productId ${productId}`,
      deletedRecords: deletedStockRecords.count
    });
  } catch (err) {
    console.error('Error while deleting stock records:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while deleting stock records' });
  }
};

/**
 *
 * Handles Get Product By Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductById = async (req: TypedRequest, res: Response) => {
  const productId: any = req.params['id'] ? req.params['id'] : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  // evaluate jwt
  try {
    const products = await prismaClient.product.findUnique({
      where: {
        id: parseInt(productId)
      },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        status: true,
        images: true,
        sku: true,
        order: true,
        quantity: true,
        allowCheckoutWhenOutOfStock: true,
        withStorehouseManagement: true,
        isFeatured: true,
        brandId: true,
        isVariation: true,
        saleType: true,
        price: true,
        salePrice: true,
        startDate: true,
        endDate: true,
        length: true,
        wide: true,
        height: true,
        weight: true,
        taxId: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        stockStatus: true,
        storeId: true,
        createdById: true,
        createdByType: true,
        approvedBy: true,
        image: true,
        productType: true,
        barcode: true,
        costPerItem: true,
        generateLicenseCode: true,
        minimumOrderQuantity: true,
        maximumOrderQuantity: true,
        addons: true,
        discountName: true,
        attributesData: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            attributeContent: true,
            images: true,
            attributePrice: true,
            attributeSalePrice: true,
            attributeQuantity: true,
            isDefault: true
          }
        },
        lableOptions: {
          where: {
            status: 'active'
          },
          select: {
            labelId: true,
            productId: true
          }
        },
        categories: {
          where: {
            status: 'active'
          },
          select: {
            categoryId: true,
            productId: true
          }
        },
        collections: {
          where: {
            status: 'active'
          },
          select: {
            collectionId: true,
            productId: true
          }
        },
        tagsData: {
          where: {
            status: 'active'
          },
          select: {
            tagId: true,
            productId: true
          }
        }
      }
    });

    // Get Quantity from Stock Table Start
    if (products && products.attributesData.length > 0) {
      // Loop through each attribute in attributesData
      for (const product of products.attributesData) {
        const { id, attributePrice, attributeSalePrice } = product;

        console.log(
          productId, // Assuming this is defined somewhere outside this loop
          id,
          attributePrice,
          attributeSalePrice
        );

        // Fetch stock information for the current product attribute
        const stInfo = await prismaClient.stockRecord.findFirst({
          where: {
            productId: parseInt(productId),
            productAttrId: id // Assuming 'id' refers to 'productAttrId'
          }
        });

        // Log the stock information
        console.log(stInfo, 'stInfo-shafi');

        // Update attributeQuantity based on stock info
        if (stInfo) {
          product.attributeQuantity =
            stInfo.received + stInfo.returned - stInfo.issued ?? 0;
        } else {
          product.attributeQuantity = 0; // Default value if no stock info found
        }
      }

      // After the loop, 'products.attributesData' will have updated 'attributeQuantity'
      console.log(products.attributesData, 'Updated attributesData');
    }

    // Get Quantity from Stock Table End
    if (!products) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Products Info Not Found' });
    }
    return res.json({ status: 200, data: products });
  } catch (err) {
    console.error('Error while fetching Product data:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product data' });
  }
};

export const handleProductAdd = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }
      const files = req.files as Record<string, Express.Multer.File[]>;
      const image = files['image'] ? files['image'][0] : null;
      const images = files['images'] ?? [];

      if (!image && images.length === 0) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: true, message: 'No files uploaded' });
      }

      // Restrict file size to 1 MB
      const maxFileSize = 1 * 1024 * 1024; // 1 MB in bytes

      const allFiles = [image, ...images].filter(Boolean);
      for (const file of allFiles) {
        if (file && file.size > maxFileSize) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'One of the image files exceeds the 1 MB limit'
          });
        }
      }

      const bucketName = 'papaswillow';
      const folderPath = 'papaswillowimages';

      const processFileName = (originalName: string): string => {
        const timestamp = new Date()
          .toISOString()
          .replace(/[-:T]/g, '')
          .split('.')[0]; // Format the timestamp as yyyyMMddHHmmss

        // Split the file name into name and extension
        const fileParts = originalName.split('.');
        if (fileParts.length > 1) {
          const extension = fileParts.pop(); // Get the file extension
          const baseName = fileParts.join('.'); // Get the base file name
          return `${baseName.replace(/\s+/g, '_')}_${timestamp}.${extension}`; // Concatenate with the timestamp
        } else {
          // If no extension, just append the timestamp
          return `${originalName.replace(/\s+/g, '_')}_${timestamp}`;
        }
      };

      const uploadFileToS3 = async (file: Express.Multer.File) => {
        const fileName = processFileName(file.originalname);
        const params = {
          Bucket: `${bucketName}/${folderPath}`,
          Key: fileName,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype
        };
        return await s3.upload(params).promise();
      };

      try {
        const {
          name,
          description,
          status,
          content,
          order,
          quantity,
          brandId,
          price,
          salePrice,
          weight,
          length,
          storeId,
          costPerItem,
          barcode,
          wide,
          height,
          withStorehouseManagement,
          allowCheckoutWhenOutOfStock,
          stockStatus,
          minimumOrderQuantity,
          maximumOrderQuantity,
          lableOptions,
          categories,
          collections,
          tagsData,
          taxId,
          addons,
          discountName
        } = req.body;

        if (
          !name ||
          !description ||
          !status ||
          !order ||
          !brandId ||
          !price ||
          !storeId
        ) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: 'Missing required fields' });
        }

        // Check if the Product Name exists in the database
        const checkProductExists = await prismaClient.product.findFirst({
          where: {
            name
          }
        });

        if (checkProductExists) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Product Name already exists'
          });
        }

        const uploadLogoPromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        if (image) uploadLogoPromises.push(uploadFileToS3(image));
        const uploadLogoResults = await Promise.all(uploadLogoPromises);
        const logoLoc = uploadLogoResults.map((file) => file.Location);
        const logoJson = logoLoc[0];

        const uploadImagePromises: Array<
          Promise<AWS.S3.ManagedUpload.SendData>
        > = [];
        images.forEach((image) =>
          uploadImagePromises.push(uploadFileToS3(image))
        );
        const imageLoc = (await Promise.all(uploadImagePromises)).map(
          (file) => file.Location
        );
        const imageJson = JSON.stringify(imageLoc);

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: {
                id: payload.userID
              }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              await prismaClient.$transaction(async (prisma) => {
                const newProduct = await prisma.product.create({
                  data: {
                    name,
                    description,
                    status,
                    content,
                    sku: `SKU-${name.substring(0, 5)}-${brandId}-${storeId}`,
                    order: parseInt(order),
                    quantity: parseInt(quantity) ?? 0,
                    brandId: parseInt(brandId),
                    price: parseFloat(price),
                    salePrice: parseFloat(salePrice),
                    weight: parseFloat(weight),
                    length: parseFloat(length),
                    storeId: parseInt(storeId),
                    costPerItem: parseFloat(costPerItem),
                    barcode,
                    taxId: parseInt(taxId),
                    wide: parseFloat(wide),
                    height: parseFloat(height),
                    addons,
                    discountName,
                    withStorehouseManagement:
                      withStorehouseManagement === 'true' ? 1 : 0,
                    allowCheckoutWhenOutOfStock:
                      allowCheckoutWhenOutOfStock === 'true' ? 1 : 0,
                    stockStatus,
                    minimumOrderQuantity: parseInt(minimumOrderQuantity),
                    maximumOrderQuantity: parseInt(maximumOrderQuantity),
                    image: logoJson ?? null,
                    images: imageJson,
                    createdAt: new Date(),
                    createdByType: user?.userName
                  }
                });

                if (lableOptions && JSON.parse(lableOptions).length > 0) {
                  const parsedData = JSON.parse(lableOptions);
                  if (Array.isArray(parsedData) && parsedData.length > 0) {
                    await prisma.productWithLabel.updateMany({
                      where: {
                        productId: newProduct.id
                      },
                      data: {
                        status: 'delete',
                        updateAt: new Date(),
                        updateBy: user?.userName
                      }
                    });

                    const attrInfoPromises = parsedData.map(
                      async (item: any) =>
                        await prisma.productWithLabel.create({
                          data: {
                            labelId: parseInt(item.labelId),
                            productId: newProduct.id,
                            status: 'active',
                            createdAt: new Date(),
                            createdBy: user?.userName
                          }
                        })
                    );

                    await Promise.all(attrInfoPromises);
                  } else {
                    throw new Error('parsedData is not an array or is empty');
                  }
                }

                if (categories && JSON.parse(categories).length > 0) {
                  const parsedData = JSON.parse(categories);
                  if (Array.isArray(parsedData) && parsedData.length > 0) {
                    await prisma.productWithCategory.updateMany({
                      where: {
                        productId: newProduct.id
                      },
                      data: {
                        status: 'delete',
                        updateAt: new Date(),
                        updateBy: user?.userName
                      }
                    });

                    const attrInfoPromises = parsedData.map(
                      async (item: any) =>
                        await prisma.productWithCategory.create({
                          data: {
                            categoryId: parseInt(item.categoryId),
                            productId: newProduct.id,
                            status: 'active',
                            createdAt: new Date(),
                            createdBy: user?.userName
                          }
                        })
                    );

                    await Promise.all(attrInfoPromises);
                  } else {
                    throw new Error('parsedData is not an array or is empty');
                  }
                }

                if (collections && JSON.parse(collections).length > 0) {
                  const parsedData = JSON.parse(collections);
                  if (Array.isArray(parsedData) && parsedData.length > 0) {
                    await prisma.productWithCollection.updateMany({
                      where: {
                        productId: newProduct.id
                      },
                      data: {
                        status: 'delete',
                        updateAt: new Date(),
                        updateBy: user?.userName
                      }
                    });

                    const attrInfoPromises = parsedData.map(
                      async (item: any) =>
                        await prisma.productWithCollection.create({
                          data: {
                            collectionId: parseInt(item.collectionId),
                            productId: newProduct.id,
                            status: 'active',
                            createdAt: new Date(),
                            createdBy: user?.userName
                          }
                        })
                    );

                    await Promise.all(attrInfoPromises);
                  } else {
                    throw new Error('parsedData is not an array or is empty');
                  }
                }

                if (tagsData && JSON.parse(tagsData).length > 0) {
                  const parsedData = JSON.parse(tagsData);
                  if (Array.isArray(parsedData) && parsedData.length > 0) {
                    await prisma.productWithTags.updateMany({
                      where: {
                        productId: newProduct.id
                      },
                      data: {
                        status: 'delete',
                        updateAt: new Date(),
                        updateBy: user?.userName
                      }
                    });

                    const attrInfoPromises = parsedData.map(
                      async (item: any) =>
                        await prisma.productWithTags.create({
                          data: {
                            tagId: parseInt(item.tagId),
                            productId: newProduct.id,
                            status: 'active',
                            createdAt: new Date(),
                            createdBy: user?.userName
                          }
                        })
                    );

                    await Promise.all(attrInfoPromises);
                  } else {
                    throw new Error('parsedData is not an array or is empty');
                  }
                }

                const updateSku = await prisma.product.update({
                  where: { id: newProduct.id },
                  data: {
                    sku: `SKU-${newProduct.id}-${newProduct.name.substring(
                      0,
                      5
                    )}-${newProduct.brandId}-${newProduct.storeId}`
                  }
                });
                console.log(updateSku);

                res.status(httpStatus.CREATED).json({
                  status: 200,
                  message: 'Product added successfully',
                  product: newProduct
                });
              });
            } catch (error) {
              console.error('Transaction failed:', error);
              res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: 500,
                error: 'An error occurred during the transaction'
              });
            }
          }
        );
      } catch (error) {
        console.error('Error during product creation:', error);
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: true, message: 'Error adding product' });
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Products List
 * @param req
 * @param res
 * @returns
 */
export const handleProductList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const productCount = await prismaClient.product.count();
    if (productCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: productCount,
        total_pages: Math.ceil(productCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Products List', data: emptyOutput });
    }

    const productData = await prismaClient.product.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: productCount,
      total_pages: Math.ceil(productCount / perPage),
      data: productData
    };
    return res
      .status(httpStatus.OK)
      .json({ message: 'Product List', data: formatOutput });
  } catch (error) {
    console.error('Error fetching Product list:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product list' });
  }
};

/**
 * Handles Products List
 * @param req
 * @param res
 * @returns
 */
export const handleSearchProductList = async (req: Request, res: Response) => {
  const productName: any = req.query['name'];
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 1;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 10;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Count the products based on the where condition
    const productCount = await prismaClient.product.count({
      where: {
        name: {
          contains: productName
        }
      }
    });

    if (productCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: productCount,
        total_pages: Math.ceil(productCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Products List', data: emptyOutput });
    }

    // Fetch the products based on the where condition and pagination
    const productData = await prismaClient.product.findMany({
      where: {
        name: {
          contains: productName
        }
      },
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: productCount,
      total_pages: Math.ceil(productCount / perPage),
      data: productData
    };

    return res
      .status(httpStatus.OK)
      .json({ message: 'Product List', data: formatOutput });
  } catch (error) {
    console.error('Error fetching Product list:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product list' });
  }
};

/**
 * Handles Product Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      // console.log(req.body, 'req.body-shafi');

      try {
        const {
          id,
          name,
          description,
          status,
          sku,
          order,
          quantity,
          brandId,
          price,
          salePrice,
          weight,
          length,
          storeId,
          costPerItem,
          barcode,
          wide,
          height,
          withStorehouseManagement,
          allowCheckoutWhenOutOfStock,
          stockStatus,
          minimumOrderQuantity,
          maximumOrderQuantity,
          deletCoverImages,
          isFeatured,
          lableOptions,
          categories,
          collections,
          tagsData,
          taxId,
          content,
          addons,
          discountName
        } = req.body;

        if (
          !id ||
          !name ||
          !description ||
          !status ||
          !sku ||
          !order ||
          !brandId ||
          !price ||
          !salePrice ||
          !storeId ||
          !costPerItem
        ) {
          console.error('Missing required fields:', {
            id,
            name,
            description,
            status,
            sku,
            order,
            quantity,
            brandId,
            price,
            salePrice,
            storeId,
            costPerItem
          });
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'Missing required fields' });
        }

        const productInfo = await prismaClient.product.findUnique({
          where: { id: parseInt(id) }
        });

        if (!productInfo) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Product Info Not found'
          });
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const image = files['image'] ? files['image'][0] : null;
        const images = files['images'] ?? [];

        const maxFileSize = 1 * 1024 * 1024; // 1 MB in bytes

        const validateFileSize = (file: Express.Multer.File) => {
          return file.size <= maxFileSize;
        };

        // Validate file size for the image
        if (image && !validateFileSize(image)) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'File size must be less than 1 MB'
          });
        }

        // Validate file size for each of the images
        for (const img of images) {
          if (!validateFileSize(img)) {
            return res.status(httpStatus.BAD_REQUEST).json({
              status: 400,
              error: 'One of the image files exceeds the 1 MB limit'
            });
          }
        }

        const bucketName = 'papaswillow';
        const folderPath = 'papaswillowimages';

        const processFileName = (originalName: string): string => {
          const timestamp = new Date()
            .toISOString()
            .replace(/[-:T]/g, '')
            .split('.')[0]; // Format the timestamp as yyyyMMddHHmmss

          // Split the file name into name and extension
          const fileParts = originalName.split('.');
          if (fileParts.length > 1) {
            const extension = fileParts.pop(); // Get the file extension
            const baseName = fileParts.join('.'); // Get the base file name
            return `${baseName.replace(/\s+/g, '_')}_${timestamp}.${extension}`; // Concatenate with the timestamp
          } else {
            // If no extension, just append the timestamp
            return `${originalName.replace(/\s+/g, '_')}_${timestamp}`;
          }
        };

        const uploadFileToS3 = async (file: Express.Multer.File) => {
          const fileName = processFileName(file.originalname);
          const params = {
            Bucket: `${bucketName}/${folderPath}`,
            Key: fileName,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype
          };
          return await s3.upload(params).promise();
        };

        // const uploadFileToS3 = async (file: Express.Multer.File) => {
        //   const params = {
        //     Bucket: `${bucketName}/${folderPath}`,
        //     Key: file.originalname,
        //     Body: file.buffer,
        //     ACL: 'public-read',
        //     ContentType: file.mimetype
        //   };
        //   return await s3.upload(params).promise();
        // };

        let logoJson: string | undefined;
        if (image) {
          const uploadLogoPromises = [uploadFileToS3(image)];
          const uploadLogoResults = await Promise.all(uploadLogoPromises);
          logoJson = uploadLogoResults[0]?.Location;
        }

        let imageJson: string | undefined;
        let imageFinalJson: string | undefined;

        if (images.length > 0) {
          const uploadImagePromises = images.map(uploadFileToS3);
          const imageLoc = (await Promise.all(uploadImagePromises)).map(
            (file) => file.Location
          );
          imageJson = JSON.stringify(imageLoc);
          if (productInfo?.images) {
            const images = JSON.parse(productInfo?.images ?? '');
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...images];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          } else {
            imageFinalJson = imageJson;
          }
        }

        if (deletCoverImages) {
          if (typeof deletCoverImages !== 'string') {
            return res.status(400).json({
              error: 'deletCoverImages should be a comma-separated string'
            });
          }
          const deletCoverImagesArray = deletCoverImages.split(',');
          const images = JSON.parse(productInfo?.images ?? '');
          const filteredImages = images.filter(
            (image: string) => !deletCoverImagesArray.includes(image)
          );
          imageFinalJson = JSON.stringify(filteredImages);
          if (imageJson) {
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...filteredImages];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          }
        }

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: { id: payload.userID }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const updateProduct = await prismaClient.product.update({
                where: { id: parseInt(id) },
                data: {
                  name,
                  description,
                  status,
                  sku,
                  isFeatured: isFeatured === 'true' ? 1 : 0,
                  taxId: parseInt(taxId),
                  content,
                  order: parseInt(order),
                  quantity: parseInt(quantity) ?? 0,
                  brandId: parseInt(brandId),
                  price: parseFloat(price),
                  salePrice: parseFloat(salePrice),
                  weight: parseFloat(weight),
                  length: parseFloat(length),
                  storeId: parseInt(storeId),
                  costPerItem: parseFloat(costPerItem),
                  barcode,
                  addons,
                  discountName,
                  wide: parseFloat(wide),
                  height: parseFloat(height),
                  withStorehouseManagement:
                    withStorehouseManagement === 'true' ? 1 : 0,
                  allowCheckoutWhenOutOfStock:
                    allowCheckoutWhenOutOfStock === 'true' ? 1 : 0,
                  stockStatus,
                  minimumOrderQuantity: parseInt(minimumOrderQuantity),
                  maximumOrderQuantity: parseInt(maximumOrderQuantity),
                  image: logoJson ?? productInfo?.image ?? '',
                  images: imageFinalJson ?? productInfo?.images ?? '',
                  updatedAt: new Date()
                  // updateBy: user?.userName
                }
              });

              if (updateProduct) {
                if (lableOptions && JSON.parse(lableOptions).length > 0) {
                  try {
                    const parsedData = JSON.parse(lableOptions);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                      const attrInfoPromises = parsedData.map(
                        async (item: any) => {
                          // Update existing records with productId to set status to "delete"
                          await prismaClient.productWithLabel.updateMany({
                            where: {
                              productId: parseInt(id)
                            },
                            data: {
                              status: 'delete',
                              updateAt: new Date(),
                              updateBy: user?.userName
                            }
                          });

                          // Create new records
                          const newRecord =
                            await prismaClient.productWithLabel.create({
                              data: {
                                labelId: parseInt(item.labelId),
                                productId: parseInt(id),
                                status: 'active',
                                createdAt: new Date(),
                                createdBy: user?.userName
                              }
                            });
                          console.log(newRecord);
                        }
                      );

                      // Wait for all promises to resolve
                      await Promise.all(attrInfoPromises);
                    } else {
                      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        error: true,
                        message: 'parsedData is not an array or is empty'
                      });
                    }
                  } catch (error) {
                    console.error('Error parsing lableOptions:', error);
                    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                      error: true,
                      message: 'Error parsing lableOptions'
                    });
                  }
                }

                if (categories && JSON.parse(categories).length > 0) {
                  try {
                    const parsedData = JSON.parse(categories);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                      const attrInfoPromises = parsedData.map(
                        async (item: any) => {
                          // Update existing records with productId to set status to "delete"
                          await prismaClient.productWithCategory.updateMany({
                            where: {
                              productId: parseInt(id)
                            },
                            data: {
                              status: 'delete',
                              updateAt: new Date(),
                              updateBy: user?.userName
                            }
                          });

                          // Create new records
                          const newRecord =
                            await prismaClient.productWithCategory.create({
                              data: {
                                categoryId: parseInt(item.categoryId),
                                productId: parseInt(id),
                                status: 'active',
                                createdAt: new Date(),
                                createdBy: user?.userName
                              }
                            });
                          console.log(newRecord);
                        }
                      );

                      // Wait for all promises to resolve
                      await Promise.all(attrInfoPromises);
                    } else {
                      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        error: true,
                        message: 'parsedData is not an array or is empty'
                      });
                    }
                  } catch (error) {
                    console.error('Error parsing categories:', error);
                    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                      error: true,
                      message: 'Error parsing categories'
                    });
                  }
                }

                if (collections && JSON.parse(collections).length > 0) {
                  try {
                    const parsedData = JSON.parse(collections);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                      const attrInfoPromises = parsedData.map(
                        async (item: any) => {
                          // Update existing records with productId to set status to "delete"
                          await prismaClient.productWithCollection.updateMany({
                            where: {
                              productId: parseInt(id)
                            },
                            data: {
                              status: 'delete',
                              updateAt: new Date(),
                              updateBy: user?.userName
                            }
                          });

                          // Create new records
                          const newRecord =
                            await prismaClient.productWithCollection.create({
                              data: {
                                collectionId: parseInt(item.collectionId),
                                productId: parseInt(id),
                                status: 'active',
                                createdAt: new Date(),
                                createdBy: user?.userName
                              }
                            });
                          console.log(newRecord);
                        }
                      );

                      // Wait for all promises to resolve
                      await Promise.all(attrInfoPromises);
                    } else {
                      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        error: true,
                        message: 'parsedData is not an array or is empty'
                      });
                    }
                  } catch (error) {
                    console.error('Error parsing collectionOptions:', error);
                    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                      error: true,
                      message: 'Error parsing collectionOptions'
                    });
                  }
                }

                if (tagsData && JSON.parse(tagsData).length > 0) {
                  try {
                    const parsedData = JSON.parse(tagsData);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                      const attrInfoPromises = parsedData.map(
                        async (item: any) => {
                          // Update existing records with productId to set status to "delete"
                          await prismaClient.productWithTags.updateMany({
                            where: {
                              productId: parseInt(id)
                            },
                            data: {
                              status: 'delete',
                              updateAt: new Date(),
                              updateBy: user?.userName
                            }
                          });

                          // Create new records
                          const newRecord =
                            await prismaClient.productWithTags.create({
                              data: {
                                tagId: parseInt(item.tagId),
                                productId: parseInt(id),
                                status: 'active',
                                createdAt: new Date(),
                                createdBy: user?.userName
                              }
                            });
                          console.log(newRecord);
                        }
                      );

                      // Wait for all promises to resolve
                      await Promise.all(attrInfoPromises);
                    } else {
                      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        error: true,
                        message: 'parsedData is not an array or is empty'
                      });
                    }
                  } catch (error) {
                    console.error('Error parsing Tag options:', error);
                    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                      error: true,
                      message: 'Error parsing Tag options'
                    });
                  }
                }
              }

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Product updated successfully',
                data: updateProduct
              });
            } catch (createError) {
              console.error('Error updating Product:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3 - 5:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3 - 6' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 *
 * Handles Get Product By Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductAtrributes = async (
  req: TypedRequest,
  res: Response
) => {
  const attrId: any = req.params['id'] ? req.params['id'] : 0;
  const pId: any = req.params['productId'] ? req.params['productId'] : 0;

  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  // evaluate jwt
  try {
    const products = await prismaClient.productWithAttribute.findUnique({
      where: {
        id: parseInt(attrId),
        productId: parseInt(pId)
      }
    });

    // Get Quantity from Stock Table Start
    if (products) {
      const stInfo = await prismaClient.stockRecord.findFirst({
        where: {
          productId: parseInt(pId),
          productAttrId: parseInt(attrId)
        }
      });
      console.log(stInfo?.received, 'stInfo');
      if (stInfo) {
        products.attributeQuantity =
          stInfo.received + stInfo.returned - stInfo.issued ?? 0;
      } else products.attributeQuantity = 0;
    }
    // Get Quantity from Stock Table End

    if (!products) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Products Attributes Info Not Found' });
    }
    return res.json({ status: 200, data: products });
  } catch (err) {
    console.error('Error while fetching Products Attributes  data:', err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching Products Attributes  data'
    });
  }
};

/**
 * Handles Product Variation add
 * @param req
 * @param res
 * @returns
 */

const getAttributeValues = async (x: any, y: any) => {
  try {
    const productAttr = await prismaClient.productAttributes.findUnique({
      where: { id: parseInt(x) }
    });

    if (!productAttr) {
      return { attributeName: null, attributeValueName: null };
    }

    // Parse the attributeContent JSON string
    const attributeContent = JSON.parse(productAttr.attributeContent);

    // Find the object with the matching id
    const matchingObject = attributeContent.find(
      (item: any) => parseInt(item.id) === parseInt(y)
    );

    // Check if the object was found
    if (!matchingObject) {
      return `No item found with id ${y}`;
    }

    return {
      attributeName: productAttr.attributeName,
      attributeValueName: matchingObject.title
    };
  } catch (error) {
    console.error(
      'Error parsing attributeContent or extracting values:',
      error
    );
    return null;
  }
};

export const handleProductVariations = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { productId, attributesData } = req.body;

    if (!productId || attributesData.length === 0) {
      console.error('Missing required fields:', { productId, attributesData });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const productInfo = await prismaClient.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!productInfo) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 400,
        error: 'Product Info Not found'
      });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      async (err: unknown, payload: any) => {
        if (err) {
          return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ error: 'Unauthorized' });
        }

        const user = await prismaClient.user.findUnique({
          where: { id: payload.userID }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'Logged User Info Not Found' });
        }

        try {
          if (attributesData.length > 0) {
            try {
              const parsedData = attributesData;
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                const attrInfoPromises = parsedData.map(async (item: any) => {
                  const attrValues = await Promise.all(
                    item.rows.map(async (itm: any) => {
                      const attributeValues: any = await getAttributeValues(
                        itm.attributeId,
                        itm.attributeValue
                      );
                      if (attributeValues) {
                        return {
                          ...itm,
                          attributeName: attributeValues.attributeName,
                          attributeValueName: attributeValues.attributeValueName
                        };
                      }
                      return itm;
                    })
                  );

                  if (productInfo) {
                    const newRecord =
                      await prismaClient.productWithAttribute.create({
                        data: {
                          attributeContent: JSON.stringify(attrValues),
                          productId: parseInt(productId, 10),
                          isDefault: item.isDefault,
                          attributePrice:
                            parseFloat(item.attributePrice) ??
                            productInfo.price ??
                            0,
                          attributeSalePrice:
                            parseFloat(item.attributePrice) ??
                            productInfo.salePrice ??
                            0,
                          attributeQuantity:
                            parseFloat(item.attributeQuantity) ??
                            productInfo.quantity ??
                            0,
                          attributeCostPerItem: productInfo.costPerItem ?? 0,
                          attributeSku: productInfo.sku ?? '',
                          attributebarcode: productInfo.barcode ?? '',
                          attributeheight: productInfo.height ?? 0,
                          attributelength: productInfo.length ?? 0,
                          attributeweight: productInfo.weight ?? 0,
                          attributewide: productInfo.wide ?? 0,
                          createdAt: new Date(),
                          createdBy: user?.userName
                        }
                      });
                    console.log(newRecord);
                  }
                });

                // Wait for all promises to resolve
                await Promise.all(attrInfoPromises);
              } else {
                res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                  error: true,
                  message: 'parsedData is not an array or is empty'
                });
              }
            } catch (error) {
              console.error('Error parsing attributesData:', error);
              res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                error: true,
                message: 'Error parsing attributesData'
              });
            }
          }

          // Complete Attribute Data Product related
          const remainingFavItems =
            await prismaClient.productWithAttribute.findMany({
              where: {
                productId: parseInt(productId)
              },
              select: {
                id: true,
                attributeContent: true,
                attributePrice: true,
                attributeSalePrice: true,
                attributeQuantity: true
              }
            });

          res.status(httpStatus.CREATED).json({
            status: 200,
            message: 'Variation updated successfully',
            data: remainingFavItems
          });
        } catch (createError) {
          console.error('Error updating Variation:', createError);
          res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ error: true, message: 'Internal server error' });
        }
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error - 1' });
  }
};

/**
 * Handles Product Search related code start
 * @param req
 * @param res
 * @returns
 */
export const getProductsByCategoryName = async (
  req: Request,
  res: Response
) => {
  try {
    const queryParam = req.query['category'];

    // Type guard to ensure queryParam is a string
    const category = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    if (typeof category !== 'string') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Query parameter must be a string' });
    }

    // Convert the category string into an array and lowercase each element
    const categoryNames = category
      .split(',')
      .map((name) => name.trim().toLowerCase());

    if (!categoryNames || categoryNames.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: 'No category names provided' });
    }

    // Fetch category IDs based on category names using "contains" for partial matching
    const categories = await prismaClient.productCategories.findMany({
      where: {
        OR: categoryNames.map((name) => ({
          categoryName: {
            contains: name
          }
        }))
      },
      select: {
        id: true
      }
    });

    if (!categories || categories.length === 0) {
      res.status(200).json({
        status: 200,
        message: 'Categories not found',
        data: []
      });
    }

    const categoryIds = categories.map((category) => category.id);

    // Fetch products associated with these categories, selecting only id, name, and description
    const products = await prismaClient.product.findMany({
      where: {
        categories: {
          some: {
            categoryId: {
              in: categoryIds
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
        salePrice: true,
        content: true,
        attributesData: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            attributeContent: true,
            images: true,
            attributePrice: true,
            attributeSalePrice: true,
            attributeQuantity: true,
            isDefault: true
          }
        }
      }
    });

    /**
     * Filter include in same service start
     * **/

    // // Fetch products associated with these categories through ProductWithCategory
    // const productIds = await prismaClient.productWithCategory.findMany({
    //   where: {
    //     categoryId: {
    //       in: categoryIds
    //     }
    //   },
    //   select: {
    //     productId: true
    //   }
    // });

    // if (productIds.length === 0) {
    //   return res
    //     .status(httpStatus.NOT_FOUND)
    //     .json({ error: true, message: 'No products found for this category' });
    // }

    // const uniqueProductIds = productIds.map((p) => p.productId);

    // // Fetch product details including attributes and brand details based on the product IDs
    // const products1 = await prismaClient.product.findMany({
    //   where: {
    //     id: {
    //       in: uniqueProductIds
    //     }
    //   },
    //   select: {
    //     attributesData: {
    //       select: {
    //         attributeContent: true
    //       }
    //     },
    //     brandId: true // Fetch the brandId for each product
    //   }
    // });

    // // Fetch the brand details using brandId
    // const brandIds = products1.map((product) => product.brandId);
    // const brands = await prismaClient.productBrands.findMany({
    //   where: {
    //     id: {
    //       in: brandIds
    //     }
    //   },
    //   select: {
    //     id: true,
    //     brandName: true,
    //     brandDesc: true,
    //     brandWebsite: true
    //   }
    // });

    // // Extract and aggregate filter attributes
    // const attributeMap = new Map<string, Set<string>>();

    // products1.forEach((product) => {
    //   product.attributesData.forEach((attribute) => {
    //     if (attribute.attributeContent) {
    //       try {
    //         const attributes = JSON.parse(attribute.attributeContent);

    //         for (const [key, value] of Object.entries(attributes)) {
    //           if (!attributeMap.has(key)) {
    //             attributeMap.set(key, new Set<string>());
    //           }
    //           (attributeMap.get(key) as Set<string>).add(value as string);
    //         }
    //       } catch (error) {
    //         console.error('Error parsing attributeContent:', error);
    //       }
    //     }
    //   });
    // });

    // const priceRanges = [
    //   { min: 0, max: 1000 },
    //   { min: 1000, max: 5000 },
    //   { min: 5000, max: 10000 },
    //   { min: 10000, max: 50000 }
    // ];

    // const filters = Array.from(attributeMap.entries()).map(([key, values]) => ({
    //   attribute: key,
    //   values: Array.from(values)
    // }));

    /**
     * Filter include in same service end
     * **/

    res.status(200).json({
      status: 200,
      message: 'Products fetched successfully - 123',
      // data: { products, filters, brands, priceRanges }
      data: products
    });
  } catch (error) {
    console.error('Error fetching products by category name:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

export const getProductsByCategoryNameFilters = async (
  req: Request,
  res: Response
) => {
  try {
    const queryParam = req.body.category;
    const filters: { [key: string]: string[] } = req.body.filters || {};

    // Type guard to ensure queryParam is a string
    const category = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    if (typeof category !== 'string') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Query parameter must be a string' });
    }

    // Convert the category string into an array and lowercase each element
    const categoryNames = category
      .split(',')
      .map((name) => name.trim().toLowerCase());

    if (!categoryNames || categoryNames.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: 'No category names provided' });
    }

    // Fetch category IDs based on category names using "contains" for partial matching
    const categories = await prismaClient.productCategories.findMany({
      where: {
        OR: categoryNames.map((name) => ({
          categoryName: {
            equals: name
          }
        }))
      },
      select: {
        id: true
      }
    });

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        status: 200,
        message: 'Categories not found',
        data: []
      });
    }

    const categoryIds = categories.map((category) => category.id);

    // Create a base query for products based on category
    const productWhereClause: any = {
      status: 'active',
      categories: {
        some: {
          status: 'active',
          categoryId: {
            in: categoryIds
          }
        }
      }
    };

    // Handle filtering by tags such as size, weight, color, and boxes
    const tagConditions = [];
    for (const [key, values] of Object.entries(filters)) {
      if (
        key !== 'Brands' &&
        values &&
        Array.isArray(values) &&
        values.length > 0
      ) {
        tagConditions.push({
          productTagsName: {
            in: values
          }
        });
      }
    }

    if (tagConditions.length > 0) {
      // Fetch tag IDs based on the tag names from the payload
      const tags = await prismaClient.productTags.findMany({
        where: {
          OR: tagConditions
        },
        select: {
          id: true
        }
      });

      if (tags.length > 0) {
        const tagIds = tags.map((tag) => tag.id);

        // Add tag filtering to the where clause
        productWhereClause.tagsData = {
          some: {
            status: 'active',
            tagId: {
              in: tagIds
            }
          }
        };
      }
    }

    // Handle filtering by brands
    const brandFilter = filters['Brands'] ?? [];
    if (brandFilter.length > 0) {
      const brandIds = await prismaClient.productBrands
        .findMany({
          where: {
            brandName: {
              in: brandFilter
            }
          },
          select: {
            id: true
          }
        })
        .then((brands) => brands.map((brand) => brand.id));

      if (brandIds.length > 0) {
        productWhereClause.brandId = {
          in: brandIds
        };
      }
    }

    console.log(productWhereClause.brandId, 'productWhereClause-brandId-shafi');

    // Handle filtering by Weight and Size
    const weightFilter = filters['Weight'] ?? [];
    const sizeFilter = filters['Sizes'] ?? [];
    const colorFilter = filters['Color'] ?? [];

    if (
      weightFilter.length > 0 ||
      sizeFilter.length > 0 ||
      colorFilter.length > 0
    ) {
      // Find product IDs where attributeContent contains weight or size
      const matchingProducts = await prismaClient.productWithAttribute.findMany(
        {
          where: {
            status: 'active',
            OR: [
              ...weightFilter.map((value) => ({
                attributeContent: {
                  contains: `"attributeValueName":"${value}"`
                }
              })),
              ...sizeFilter.map((value) => ({
                attributeContent: {
                  contains: `"attributeValueName":"${value}"`
                }
              })),
              ...colorFilter.map((value) => ({
                attributeContent: {
                  contains: `"attributeValueName":"${value}"`
                }
              }))
            ]
          },
          select: {
            productId: true
          }
        }
      );

      const matchingProductIds = matchingProducts.map((p) => p.productId);

      if (matchingProductIds.length > 0) {
        productWhereClause.id = {
          in: matchingProductIds
        };
      }
    }

    console.log(productWhereClause, 'productWhere-shafi');

    // Fetch products based on the constructed query
    const products = await prismaClient.product.findMany({
      where: productWhereClause,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
        content: true,
        salePrice: true,
        isFeatured: true,
        attributesData: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            attributeContent: true,
            images: true,
            attributePrice: true,
            attributeSalePrice: true,
            attributeQuantity: true,
            isDefault: true
          }
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: 'Products fetched successfully - 345',
      data: products
    });
  } catch (error) {
    console.error(
      'Error fetching products by category name and filters:',
      error
    );
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

export const getProductsByCategoryFilters = async (
  req: Request,
  res: Response
) => {
  try {
    const queryParam = req.query['category'];

    // Type guard to ensure queryParam is a string
    const categoryName = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    if (typeof categoryName !== 'string') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Query parameter must be a string' });
    }

    // Fetch category IDs based on category name
    const categories = await prismaClient.productCategories.findMany({
      where: {
        categoryName: {
          equals: categoryName.toLowerCase()
        }
      },
      select: {
        id: true
      }
    });

    if (!categories || categories.length === 0) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: true, message: 'Categories not found' });
    }

    const categoryIds = categories.map((cat) => cat.id);

    // Fetch products associated with these categories through ProductWithCategory
    const productIds = await prismaClient.productWithCategory.findMany({
      where: {
        categoryId: {
          in: categoryIds
        },
        status: 'active'
      },
      select: {
        productId: true
      }
    });

    if (productIds.length === 0) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: true, message: 'No products found for this category' });
    }

    const uniqueProductIds = productIds.map((p) => p.productId);

    // Fetch product details including attributes and brand details based on the product IDs
    const products = await prismaClient.product.findMany({
      where: {
        id: {
          in: uniqueProductIds
        },
        status: 'active'
      },
      select: {
        attributesData: {
          select: {
            attributeContent: true
          }
        },
        brandId: true // Fetch the brandId for each product
      }
    });

    // Fetch the brand details using brandId
    const brandIds = products.map((product) => product.brandId);
    const brands = await prismaClient.productBrands.findMany({
      where: {
        id: {
          in: brandIds
        }
      },
      select: {
        id: true,
        brandName: true,
        brandDesc: true,
        brandWebsite: true
      }
    });

    // Extract and aggregate filter attributes
    const attributeMap = new Map<string, Set<string>>();

    products.forEach((product) => {
      product.attributesData.forEach((attribute) => {
        if (attribute.attributeContent) {
          try {
            const attributes = JSON.parse(attribute.attributeContent);

            for (const [key, value] of Object.entries(attributes)) {
              if (!attributeMap.has(key)) {
                attributeMap.set(key, new Set<string>());
              }
              (attributeMap.get(key) as Set<string>).add(value as string);
            }
          } catch (error) {
            console.error('Error parsing attributeContent:', error);
          }
        }
      });
    });

    const priceRanges = [
      { min: 0, max: 1000 },
      { min: 1000, max: 5000 },
      { min: 5000, max: 10000 },
      { min: 10000, max: 50000 }
    ];

    const filters = Array.from(attributeMap.entries()).map(([key, values]) => ({
      attribute: key,
      values: Array.from(values)
    }));

    res.status(httpStatus.OK).json({
      status: 200,
      message: 'Filter attributes and brand details fetched successfully',
      data: { filters, brands, priceRanges }
    });
  } catch (error) {
    console.error('Error fetching filter attributes by category name:', error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Product Search related code start
 * @param req
 * @param res
 * @returns
 */

export const getProductsHotDealsFeatured = async (
  _req: Request,
  res: Response
) => {
  try {
    const queryParam = 'Hot Deals,Featured Products,Discount Products';

    // Type guard to ensure queryParam is a string
    const category = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    if (typeof category !== 'string') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Query parameter must be a string' });
    }

    // Convert the category string into an array and lowercase each element
    const categoryNames = category
      .split(',')
      .map((name) => name.trim().toLowerCase());

    if (!categoryNames || categoryNames.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: 'No category names provided' });
    }

    // Fetch category IDs and names based on category names using "contains" for partial matching
    const categories = await prismaClient.productCategories.findMany({
      where: {
        OR: categoryNames.map((name) => ({
          categoryName: {
            contains: name
          }
        }))
      },
      select: {
        id: true,
        categoryName: true
      }
    });

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        status: 200,
        message: 'Categories not found',
        data: []
      });
    }

    const categoryIds = categories.map((category) => category.id);

    // Fetch products associated with these categories
    const products = await prismaClient.product.findMany({
      where: {
        status: 'active',
        categories: {
          some: {
            status: 'active',
            categoryId: {
              in: categoryIds
            }
          }
        }
      },
      select: {
        id: true,
        status: true,
        name: true,
        description: true,
        image: true,
        price: true,
        content: true,
        salePrice: true,
        discountName: true,
        isFeatured: true,
        attributesData: {
          where: {
            status: 'active'
          },
          select: {
            id: true,
            attributeContent: true,
            images: true,
            attributePrice: true,
            attributeSalePrice: true,
            attributeQuantity: true,
            isDefault: true
          }
        },
        categories: {
          where: {
            status: 'active' // Ensure only active categories are selected
          },
          select: {
            id: true,
            categoryId: true,
            status: true
          }
        }
      }
    });

    // Group products by category
    const productsByCategory = categories.map((category) => ({
      categoryName: category.categoryName,
      products: products
        .filter((product) =>
          product.categories.some((cat) => cat.categoryId === category.id)
        )
        .map(({ categories, ...productData }) => productData)
    }));

    res.status(200).json({
      status: 200,
      message: 'Products fetched successfully - 678',
      data: productsByCategory
    });
  } catch (error) {
    console.error('Error fetching products by category name:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Product Search related code start
 * @param req
 * @param res
 * @returns
 */

/**
 * Handles Variation Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductVariationsUpdate = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    upload.fields([{ name: 'images', maxCount: 10 }])(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res
          .status(500)
          .json({ error: true, message: 'Error uploading files' });
      }

      try {
        const {
          id,
          productId,
          attributeSku,
          attributePrice,
          attributeSalePrice,
          attributeCostPerItem,
          attributebarcode,
          withStorehouseManagement,
          attributeQuantity,
          allowCheckoutWhenOutOfStock,
          attributeweight,
          attributeheight,
          attributelength,
          attributewide,
          couponEndDate,
          couponStartDate,
          deletCoverImages
        } = req.body;

        if (!id || !productId) {
          console.error('Missing required fields:', {
            id,
            productId
          });
          return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'Missing required fields' });
        }

        const attributeInfo =
          await prismaClient.productWithAttribute.findUnique({
            where: { id: parseInt(id) }
          });

        if (!attributeInfo) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: 400,
            error: 'Product Attribute Info Not found'
          });
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const images = files['images'] ?? [];

        const bucketName = 'papaswillow';
        const folderPath = 'papaswillowimages';

        const uploadFileToS3 = async (file: Express.Multer.File) => {
          const params = {
            Bucket: `${bucketName}/${folderPath}`,
            Key: file.originalname,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype
          };
          return await s3.upload(params).promise();
        };

        let imageJson: string | undefined;
        let imageFinalJson: string | undefined;

        if (images.length > 0) {
          const uploadImagePromises = images.map(uploadFileToS3);
          const imageLoc = (await Promise.all(uploadImagePromises)).map(
            (file) => file.Location
          );
          imageJson = JSON.stringify(imageLoc);
          if (attributeInfo?.images) {
            const images = JSON.parse(attributeInfo?.images ?? '');
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...images];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          } else {
            imageFinalJson = imageJson;
          }
        }

        if (deletCoverImages) {
          if (typeof deletCoverImages !== 'string') {
            return res.status(400).json({
              error: 'deletCoverImages should be a comma-separated string'
            });
          }
          const deletCoverImagesArray = deletCoverImages.split(',');
          const images = JSON.parse(attributeInfo?.images ?? '');
          const filteredImages = images.filter(
            (image: string) => !deletCoverImagesArray.includes(image)
          );
          imageFinalJson = JSON.stringify(filteredImages);
          if (imageJson) {
            const imgArr = JSON.parse(imageJson);
            const combinedArray = [...imgArr, ...filteredImages];
            imageFinalJson = JSON.stringify([...new Set(combinedArray)]);
          }
        }

        verify(
          token,
          config.jwt.refresh_token.secret,
          async (err: unknown, payload: any) => {
            if (err) {
              return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ error: 'Unauthorized' });
            }

            const user = await prismaClient.user.findUnique({
              where: { id: payload.userID }
            });

            if (!user) {
              return res
                .status(httpStatus.NOT_FOUND)
                .json({ error: 'Logged User Info Not Found' });
            }

            try {
              const updateStore =
                await prismaClient.productWithAttribute.update({
                  where: { id: parseInt(id) },
                  data: {
                    attributePrice: parseFloat(attributePrice),
                    attributeSalePrice: parseFloat(attributeSalePrice),
                    attributeQuantity: parseInt(attributeQuantity),
                    attributeCostPerItem: parseFloat(attributeCostPerItem),
                    attributeSku,
                    attributebarcode,
                    attributeheight: parseFloat(attributeheight),
                    attributelength: parseFloat(attributelength),
                    attributeweight: parseFloat(attributeweight),
                    attributewide: parseFloat(attributewide),
                    couponStartDate,
                    couponEndDate,
                    withStorehouseManagement:
                      withStorehouseManagement === 'true' ? 1 : 0,
                    allowCheckoutWhenOutOfStock:
                      allowCheckoutWhenOutOfStock === 'true' ? 1 : 0,
                    images: imageFinalJson ?? attributeInfo?.images ?? '',
                    updateAt: new Date(),
                    updateBy: user?.userName
                  }
                });

              res.status(httpStatus.CREATED).json({
                status: 200,
                message: 'Atrribute updated successfully',
                data: updateStore
              });
            } catch (createError) {
              console.error('Error creating store:', createError);
              res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ error: true, message: 'Internal server error' });
            }
          }
        );
      } catch (uploadError) {
        console.error('Error uploading files to S3 - 5:', uploadError);
        res
          .status(500)
          .json({ error: true, message: 'Error uploading files to S3 - 6' });
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Handles Product Atrribute Item Delete
 * @param req
 * @param res
 * @returns
 */
export const handleProductVariationsDelete = async (
  req: Request,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  console.log(req.body, 'req.body');
  const { id, productId } = req.body;
  console.log(id, productId);

  if (id === undefined) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Varation Id is required' });
  }

  if (!id && id === undefined && !productId) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Product Atrribute is required!'
    });
  }

  const productWithAttr = await prismaClient.productWithAttribute.findFirst({
    where: { id: parseInt(id) }
  });

  if (!productWithAttr) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ error: 'Product Atttribute Info Not Found' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'User Info Not Found' });
      }

      try {
        const attrItem = await prismaClient.productWithAttribute.delete({
          where: { id: parseInt(id) }
        });
        console.log(attrItem);

        // Fetch the remaining items in the Attribute
        const remainingAttrItems =
          await prismaClient.productWithAttribute.findMany({
            where: { productId: parseInt(productId) }
          });

        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'item deleted',
          data: remainingAttrItems
        });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Product Search
 * @param req
 * @param res
 * @returns
 */
export const handleProductSearch = async (req: Request, res: Response) => {
  try {
    const queryParam = req.query['query'];

    // Type guard to ensure queryParam is a string
    const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;

    if (typeof query !== 'string') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Query parameter must be a string' });
    }

    try {
      const lowerCaseQuery = query.toLowerCase();

      const results = await prismaClient.product.findMany({
        where: {
          status: 'active',
          OR: [
            { name: { contains: lowerCaseQuery } },
            { description: { contains: lowerCaseQuery } },
            {
              tagsData: {
                some: {
                  status: 'active', // Ensure only active relationships are included
                  tag: {
                    productTagsName: {
                      contains: lowerCaseQuery
                    },
                    productTagsStatus: 'active' // Filter to include only active tags
                  }
                }
              }
            }
          ]
        },
        include: {
          tagsData: {
            where: {
              status: 'active', // Ensure only active relationships are included
              tag: {
                productTagsStatus: 'active' // Filter to include only active tags
              }
            },
            include: {
              tag: true
            }
          }
        }
      });

      // Format the results to include only necessary fields
      const formattedResults = results.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image, // Ensure this field exists in your schema if you want to include it
        tags: product.tagsData
          .filter(
            (tagRelation) => tagRelation.tag.productTagsStatus === 'active'
          ) // Ensure only active tags are included
          .map((tagRelation) => tagRelation.tag.productTagsName)
      }));

      // Collect all tags from formatted results
      const allTags = formattedResults.flatMap((product) => product.tags);

      // Remove duplicates by creating a Set
      const uniqueTags = [...new Set(allTags)];

      // Create tagInfo with unique tags
      const tagInfo = uniqueTags.map((tag) => tag);

      res.status(httpStatus.OK).json({
        status: 200,
        message: 'Search List',
        data: formattedResults,
        tagInfo
      });
    } catch (createError) {
      console.error('Error updating Variation:', createError);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: true, message: 'Internal server error' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: true, message: 'Internal server error - 1' });
  }
};

/**
 *
 * Handles Get All Taxes
 * @param req
 * @param res
 * @returns
 */
export const handleTaxes = async (_req: TypedRequest, res: Response) => {
  try {
    const products = await prismaClient.taxes.findMany({
      select: {
        id: true,
        title: true,
        percentage: true,
        priority: true
      }
    });
    return res
      .status(httpStatus.OK)
      .json({ message: 'Taxes List', data: products });
  } catch (error) {
    console.error('Error fetching Taxes:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetchin the Taxes' });
  }
};

/**
 * Handles Product Review Based on Product
 * @param _req
 * @param res
 * @returns
 */
export const handleProductReviewsByProduct = async (
  req: Request,
  res: Response
) => {
  const productName = req.params['name'];
  if (!productName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Name is required!' });
  }

  const products = await prismaClient.product.findFirst({
    where: {
      name: productName
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!products) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Product info not found' });
  }

  try {
    const productReviewsCount = await prismaClient.productReviews.count({
      where: {
        productId: products.id.toString(),
        reviewStatus: 'publish'
      }
    });
    const productReviews = await prismaClient.productReviews.findMany({
      where: {
        productId: products.id.toString(),
        reviewStatus: 'publish'
      }
    });
    if (productReviewsCount === 0) {
      res.status(httpStatus.CREATED).json({
        status: 200,
        message: 'Product Reviews List',
        data: []
      });
    } else {
      res.status(httpStatus.CREATED).json({
        status: 200,
        message: 'Product Review List',
        data: productReviews
      });
    }
  } catch (err) {
    console.log(err, 'eeeeee');
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Add Review info to FrontEnd
 * @param req
 * @param res
 * @returns
 */
export const handleProductReviews = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { rating, description, productName } = req.body;

  if (!rating || !description || !productName) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Rating , Product and Description are required!'
    });
  }

  const products = await prismaClient.product.findFirst({
    where: {
      name: productName
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!products) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Product Info not found'
    });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newReview = await prismaClient.productReviews.create({
          data: {
            reviewer: user?.userName ?? 'test user',
            userId: payload.userID,
            productId: products.id.toString(),
            rating: rating.toString(),
            description,
            createdBy: user?.userName,
            createdAt: new Date()
          }
        });
        // remaing Data of reviews

        const productsReviewInfo = await prismaClient.productReviews.findMany({
          where: {
            productId: products.id.toString(),
            reviewStatus: 'publish'
          }
        });

        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Product Review created',
          data: newReview,
          reviewData: productsReviewInfo
        });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Add Review info to Backend
 * @param req
 * @param res
 * @returns
 */
export const handleProductReviewsAdd = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { reviewer, rating, description, productId } = req.body;

  if (!reviewer || !rating || !description || !productId) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'User, Rating, Product and Description are required!'
    });
  }

  const products = await prismaClient.product.findFirst({
    where: {
      id: parseInt(productId)
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!products) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Product Info not found'
    });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newReview = await prismaClient.productReviews.create({
          data: {
            reviewer,
            userId: payload.userID,
            productId: productId.toString(),
            rating: rating.toString(),
            description,
            createdBy: user?.userName,
            createdAt: new Date()
          }
        });

        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Product Review created',
          data: newReview
        });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Product Reviews List
 * @param req
 * @param res
 * @returns
 */
export const handleProductReviewsList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const prCount = await prismaClient.productReviews.count();
    if (prCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: prCount,
        total_pages: Math.ceil(prCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Reviews List', data: emptyOutput });
    }

    const prData = await prismaClient.productReviews.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: prCount,
      total_pages: Math.ceil(prCount / perPage),
      data: prData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Reviews List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Reviews List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Reviews List'
    });
  }
};

/**
 * Handles Get Product Reviews Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductReviewsById = async (req: Request, res: Response) => {
  const reviewId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const pReviews = await prismaClient.productReviews.findUnique({
      where: {
        id: reviewId
      }
    });
    if (!pReviews) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Reviews Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Product Reviews Data',
      data: pReviews
    });
  } catch (err) {
    console.error('Error while fetching Product Reviews:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Reviews' });
  }
};

/**
 * Handles Product Reviews Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductReviewsUpdate = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { id, reviewer, reviewStatus, rating, description, productId } =
      req.body;

    if (!id || !reviewStatus || !description || !rating || !productId) {
      console.error('Missing required fields:', {
        id,
        reviewStatus,
        description,
        rating
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Review exists in the database
    const checkProductReviewExists =
      await prismaClient.productReviews.findUnique({
        where: { id }
      });

    if (!checkProductReviewExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Review Info not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Prodcut's Tags data in the database
        const updatedProductReview = await prismaClient.productReviews.update({
          where: { id },
          data: {
            reviewStatus,
            reviewer,
            rating: rating.toString(),
            description,
            productId: productId.toString(),
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Product Review updated successfully',
          data: updatedProductReview
        });
      }
    );
  } catch (error) {
    console.error('Error updating Review:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Review'
    });
  }
};

/**
 * Handles Financial Year Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleFYData = async (_req: Request, res: Response) => {
  try {
    const fyCount = await prismaClient.financialYear.count();
    if (fyCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Financial Year List', data: emptyOutput });
    }
    const fyData = await prismaClient.financialYear.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        financialYear: true
      }
    });
    const formatOutput = {
      data: fyData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Financial Year List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Financial Year List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Financial Year List'
    });
  }
};

/**
 * Handles Financial Year List
 * @param req
 * @param res
 * @returns
 */
export const handleFYList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const fyCount = await prismaClient.financialYear.count();
    if (fyCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: fyCount,
        total_pages: Math.ceil(fyCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Financial Year List', data: emptyOutput });
    }

    const fyData = await prismaClient.financialYear.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: fyCount,
      total_pages: Math.ceil(fyCount / perPage),
      data: fyData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Financial Year List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Financial Year List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Financial Year List'
    });
  }
};

/**
 * Handles Add Financial Year
 * @param req
 * @param res
 * @returns
 */
export const handleFYAdd = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { financialYear, status, isDefault } = req.body;

  if (!financialYear || !status || !isDefault) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Financial year, Status are required!'
    });
  }

  const fyInfo = await prismaClient.financialYear.findFirst({
    where: {
      financialYear: financialYear.trim()
    }
  });
  if (fyInfo) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Financial Year already exists'
    });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newRecord = await prismaClient.financialYear.create({
          data: {
            financialYear,
            status,
            isDefault,
            createdBy: user?.userName,
            createdAt: new Date()
          }
        });

        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Financial Year created',
          data: newRecord
        });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Financial Year Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleFYById = async (req: Request, res: Response) => {
  const fyId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const fyInfo = await prismaClient.financialYear.findUnique({
      where: {
        id: fyId
      }
    });
    if (!fyInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Financial Year Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Financial Year Data',
      data: fyInfo
    });
  } catch (err) {
    console.error('Error while fetching Financial Year:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Financial Year' });
  }
};

/**
 * Handles Financial Year Update
 * @param req
 * @param res
 * @returns
 */
export const handleFYUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { id, financialYear, status, isDefault } = req.body;

    if (!id || !financialYear || !status || !isDefault) {
      console.error('Missing required fields:', {
        id,
        financialYear,
        status,
        isDefault
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the financial year exists in the database
    const checkFYExists = await prismaClient.financialYear.findUnique({
      where: { id }
    });

    if (!checkFYExists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Financial Year Info not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Financial Year data in the database
        const updatedFY = await prismaClient.financialYear.update({
          where: { id },
          data: {
            financialYear,
            status,
            isDefault,
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Financial Year updated successfully',
          data: updatedFY
        });
      }
    );
  } catch (error) {
    console.error('Error updating Financial Year:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Financial Year'
    });
  }
};

/**
 * Handles Stock Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleStockData = async (_req: Request, res: Response) => {
  try {
    const stCount = await prismaClient.stockRecord.count();
    if (stCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Stock List', data: emptyOutput });
    }
    const stData = await prismaClient.stockRecord.findMany();
    const formatOutput = {
      data: stData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Stock List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Stock List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Stock List'
    });
  }
};

/**
 * Handles Stock List
 * @param req
 * @param res
 * @returns
 */
export const handleStockList = async (req: Request, res: Response) => {
  try {
    const productName = req.query['name'] as string | undefined;
    console.log(productName);

    const pageNumber = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 1; // Default to page 1
    const perPage = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 10; // Default to 10 items per page

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', { perPage, pageNumber });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Create the where condition dynamically
    const whereCondition: Prisma.StockRecordWhereInput = productName
      ? {
          product: {
            name: {
              contains: productName
            }
          }
        }
      : {};

    // Count total matching records
    const stCount = await prismaClient.stockRecord.count({
      where: whereCondition
    });

    if (stCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: stCount,
        total_pages: Math.ceil(stCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Stock List', data: emptyOutput });
    }

    // Fetch paginated stock records
    const stData = await prismaClient.stockRecord.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage,
      where: whereCondition,
      include: {
        stockDetails: true,
        product: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            storeName: true
          }
        }
      }
    });

    // Format the response
    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: stCount,
      total_pages: Math.ceil(stCount / perPage),
      data: stData
    };

    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Stock List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Stock List:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Stock List'
    });
  }
};

/**
 * Handles Get Stock Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleStockById = async (req: Request, res: Response) => {
  const stId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const stInfo = await prismaClient.stockRecord.findUnique({
      where: {
        id: stId
      },
      include: {
        stockDetails: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!stInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Stock Info Not Found' });
    }
    return res.json({
      status: 200,
      message: 'Stock Data',
      data: stInfo
    });
  } catch (err) {
    console.error('Error while fetching Stock:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Stock' });
  }
};

/**
 * Handles Stock Update
 * @param req
 * @param res
 * @returns
 */
export const handleStockUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const {
      id,
      financialYear,
      productId,
      storeId,
      openingstock,
      stock,
      stockType,
      status,
      stockDate,
      vendorName
    } = req.body;

    if (
      !id ||
      !financialYear ||
      !productId ||
      !storeId ||
      !stock ||
      !stockType
    ) {
      console.error('Missing required fields:', {
        id,
        financialYear,
        productId,
        storeId,
        openingstock,
        stock,
        stockType,
        status
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the financial year exists in the database
    const stockInfo = await prismaClient.stockRecord.findUnique({
      where: { id }
    });

    if (!stockInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Stock Info not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }
        console.log(stockInfo.received + parseInt(stock), 'stockInfo');
        // Update the Financial Year data in the database
        const updatedFY = await prismaClient.stockRecord.update({
          where: { id },
          data: {
            financialYear,
            storeId: parseInt(storeId),
            productId,
            openingstock:
              parseInt(openingstock) > 0
                ? stockInfo.openingstock + parseInt(openingstock)
                : 0,
            received:
              stockType === 'received'
                ? stockInfo.received + parseInt(stock)
                : stockInfo.received,
            returned:
              stockType === 'returned'
                ? stockInfo.returned + parseInt(stock)
                : stockInfo.returned,
            issued:
              stockType === 'issued'
                ? stockInfo.issued + parseInt(stock)
                : stockInfo.issued,
            status,
            updateAt: new Date(),
            updateBy: user?.userName
          }
        });

        if (updatedFY) {
          // console.log(newRecord, 'newRecord-shafi-ahamed');
          const newDetailRecord = await prismaClient.stockDetail.create({
            data: {
              stockRecordId: id,
              productId,
              vendorName,
              storeId: parseInt(storeId),
              productAttrId: 0,
              financialYear,
              inventoryId: 1,
              received: stockType === 'received' ? parseInt(stock) : 0,
              receivedDate: stockType === 'received' ? stockDate : null,

              returned: stockType === 'returned' ? parseInt(stock) : 0,
              returnedDate: stockType === 'returned' ? stockDate : null,

              issued: stockType === 'issued' ? parseInt(stock) : 0,
              issuedDate: stockType === 'returned' ? stockDate : null,

              status,
              createdBy: user?.userName,
              createdAt: new Date()
            }
          });
          console.log(newDetailRecord);
        }

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Stock updated successfully',
          data: updatedFY
        });
      }
    );
  } catch (error) {
    console.error('Error updating Stock:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Stock'
    });
  }
};

/**
 * Handles Product Taxes Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleProductTaxesData = async (_req: Request, res: Response) => {
  try {
    const taxesCount = await prismaClient.taxes.count({
      where: {
        taxStatus: 'active'
      }
    });
    if (taxesCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Taxes List', data: emptyOutput });
    }
    const taxData = await prismaClient.taxes.findMany({
      where: {
        taxStatus: 'active'
      },
      select: {
        id: true,
        title: true,
        percentage: true,
        priority: true
      }
    });
    const formatOutput = {
      data: taxData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Product Taxes List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Taxes:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Taxes'
    });
  }
};

/**
 * Handles Product Taxes List
 * @param req
 * @param res
 * @returns
 */
export const handleProductTaxesList = async (req: Request, res: Response) => {
  try {
    const pageNumber: number = req.query['page']
      ? parseInt(req.query['page'] as string, 10)
      : 0;
    const perPage: number = req.query['per_page']
      ? parseInt(req.query['per_page'] as string, 10)
      : 0;

    if (!pageNumber || !perPage) {
      console.error('Missing required fields:', {
        perPage,
        pageNumber
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    const taxesCount = await prismaClient.taxes.count();
    if (taxesCount === 0) {
      const emptyOutput = {
        page: pageNumber,
        per_page: perPage,
        total: taxesCount,
        total_pages: Math.ceil(taxesCount / perPage),
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Product Taxes List', data: emptyOutput });
    }

    const taxesData = await prismaClient.taxes.findMany({
      skip: perPage * (pageNumber - 1),
      take: perPage
    });

    const formatOutput = {
      page: pageNumber,
      per_page: perPage,
      total: taxesCount,
      total_pages: Math.ceil(taxesCount / perPage),
      data: taxesData
    };
    return res
      .status(httpStatus.OK)
      .json({ message: 'Product Taxes List', data: formatOutput });
  } catch (error) {
    console.error('Error deleting Taxes:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while deleting the Taxes' });
  }
};

/**
 * Handles Add Procduct Taxes
 * @param req
 * @param res
 * @returns
 */
export const handleProductTaxesAdd = async (
  req: TypedRequest<ProductTaxesCredentials>,
  res: Response
) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const { title, percentage, priority, taxStatus } = req.body;

  if (!title || !percentage || !priority || !taxStatus) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Name, Percentage and Status are required!'
    });
  }

  const checkTaxName = await prismaClient.taxes.findFirst({
    where: {
      title
    }
  });

  if (checkTaxName) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ status: 400, error: 'Tax Name already exists' });
  }

  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      console.log(err, 'err');
      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        const newTax = await prismaClient.taxes.create({
          data: {
            title,
            percentage,
            priority,
            taxStatus,
            createdAt: new Date(),
            createdBy: user?.userName
          }
        });
        res
          .status(httpStatus.CREATED)
          .json({ status: 200, message: 'taxes created', data: newTax });
      } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  );
};

/**
 * Handles Get Procduct Taxes Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleProductTaxesById = async (req: Request, res: Response) => {
  const taxId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const taxInfo = await prismaClient.taxes.findUnique({
      where: {
        id: taxId
      }
    });
    if (!taxInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Product Taxes Info Not Found' });
    }
    return res.json({ status: 200, data: taxInfo });
  } catch (err) {
    console.error('Error while fetching Product Taxes:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Product Taxes' });
  }
};

/**
 * Handles Product Taxes Update
 * @param req
 * @param res
 * @returns
 */
export const handleProductTaxesUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const { id, title, percentage, priority, taxStatus } = req.body;

    if (!id || !title || !percentage || !taxStatus || !priority) {
      console.error('Missing required fields:', {
        id,
        title,
        percentage,
        priority,
        taxStatus
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    // Check if the Tax exists in the database
    const checkTaxExists = await prismaClient.taxes.findUnique({
      where: { id }
    });

    if (!checkTaxExists) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'Tax not found' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Update the Prodcut's Taxes data in the database
        const updateTax = await prismaClient.taxes.update({
          where: { id },
          data: {
            title,
            percentage,
            priority,
            taxStatus,
            updatedAt: new Date(),
            updateBy: user?.userName
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Taxes updated successfully',
          data: updateTax
        });
      }
    );
  } catch (error) {
    console.error('Error updating Product Taxes:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Product Taxes'
    });
  }
};

/**
 * Handles Add Stock Inventory
 * @param req
 * @param res
 * @returns
 */
export const handleStockInventoryAdd = async (req: Request, res: Response) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  const {
    financialYear,
    invoiceDate,
    invoiceNumber,
    invoiceAmount,
    customCharges,
    shippingCharges,
    otherCharges,
    storeId,
    vendorName,
    productDetails
  } = req.body;

  if (
    !financialYear ||
    !invoiceDate ||
    !invoiceNumber ||
    !invoiceAmount ||
    !storeId ||
    !vendorName ||
    !productDetails ||
    productDetails.length === 0
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message:
        'Financial year, Invoice Date, Store, Invoice Number, Details and Status are required!'
    });
  }

  // Verify JWT token
  verify(
    token,
    config.jwt.refresh_token.secret,
    // eslint-disable-next-line n/handle-callback-err
    async (err: unknown, payload: JwtPayload) => {
      if (err) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ error: 'Invalid token' });
      }

      const user = await prismaClient.user.findUnique({
        where: {
          id: payload.userID
        }
      });

      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: 'Logged User Info Not Found' });
      }

      try {
        await prismaClient.$transaction(async (prisma) => {
          // Insert Inventory record
          const inventoryRecord = await prisma.inventory.create({
            data: {
              invoiceDate: new Date(invoiceDate),
              invoiceNumber,
              inventoryAmount: parseFloat(invoiceAmount),
              customCharges: parseFloat(customCharges) || 0,
              shippingCharges: parseFloat(shippingCharges) || 0,
              otherCharges: parseFloat(otherCharges) || 0,
              status: 'pending', // Assuming status is pending initially
              createdBy: user?.userName,
              createdAt: new Date()
            }
          });

          for (const product of productDetails) {
            const {
              productId,
              productVariation,
              quantity,
              amount,
              attributePrice,
              attributeSalePrice,
              variationName
            } = product;

            // Use upsert for stock record with composite keys
            const upsertedRecord = await prisma.stockRecord.upsert({
              where: {
                productId_storeId_financialYear_productAttrId: {
                  productId,
                  storeId: parseInt(storeId),
                  financialYear,
                  productAttrId:
                    productVariation === '' ? 0 : parseInt(productVariation)
                }
              },
              update: {
                received: { increment: parseInt(quantity) },
                updateBy: user?.userName,
                updateAt: new Date()
              },
              create: {
                financialYear,
                invoiceDate,
                invoiceNumber,
                storeId: parseInt(storeId),
                productId,
                productAttrId:
                  productVariation === '' ? 0 : parseInt(productVariation),
                received: parseInt(quantity),
                createdBy: user?.userName,
                createdAt: new Date()
              }
            });

            // Insert stock detail record
            const newDetailRecord = await prisma.stockDetail.create({
              data: {
                stockRecordId: upsertedRecord.id,
                vendorName,
                variationName,
                productId,
                storeId: parseInt(storeId),
                productAttrId:
                  productVariation === '' ? 0 : parseInt(productVariation),
                financialYear,
                amount: parseFloat(amount),
                attributePrice: parseFloat(attributePrice),
                attributeSalePrice: parseFloat(attributeSalePrice),
                received: parseInt(quantity),
                receivedDate: new Date(invoiceDate),
                createdBy: user?.userName,
                createdAt: new Date(),
                inventoryId: inventoryRecord.id // Insert inventory ID
              }
            });

            // Update attributePrice and sale price in ProductWithAttribute table
            if (
              parseFloat(attributePrice) > 0 ||
              parseFloat(attributeSalePrice) > 0
            ) {
              if (productVariation > 0) {
                console.log('Inside----');

                const productsAttr =
                  await prisma.productWithAttribute.findUnique({
                    where: {
                      productId,
                      id:
                        productVariation === '' ? 0 : parseInt(productVariation)
                    }
                  });
                // console.log(productsAttr, 'productsAttr');
                if (productsAttr) {
                  await prisma.productWithAttribute.updateMany({
                    where: {
                      productId,
                      id:
                        productVariation === '' ? 0 : parseInt(productVariation)
                    },
                    data: {
                      attributeQuantity:
                        (productsAttr.attributeQuantity
                          ? productsAttr.attributeQuantity
                          : 0) + parseInt(quantity),

                      attributePrice:
                        parseFloat(attributePrice) > 0
                          ? parseFloat(attributePrice)
                          : 0,
                      attributeSalePrice:
                        parseFloat(attributeSalePrice) > 0
                          ? parseFloat(attributeSalePrice)
                          : 0
                    }
                  });
                }
              } else {
                const products = await prisma.product.findUnique({
                  where: {
                    id: parseInt(productId)
                  }
                });
                // console.log(products, 'products');
                if (products) {
                  await prisma.product.update({
                    where: { id: productId },
                    data: {
                      quantity:
                        (products.quantity ? products.quantity : 0) +
                        parseInt(quantity),
                      price:
                        parseFloat(attributePrice) > 0
                          ? parseFloat(attributePrice)
                          : 0,
                      salePrice:
                        parseFloat(attributeSalePrice) > 0
                          ? parseFloat(attributeSalePrice)
                          : 0
                    }
                  });
                }
              }
            }

            // Insert InventoryDetails record
            // await prisma.inventoryDetails.create({
            //   data: {
            //     inventoryId: inventoryRecord.id,
            //     storeId: parseInt(storeId),
            //     financialYear,
            //     vendorName,
            //     variationName,
            //     productId,
            //     productAttrId:
            //       productVariation === '' ? 0 : parseInt(productVariation),
            //     partialAmount: parseFloat(amount),
            //     invoiceDate: new Date(invoiceDate),
            //     createdBy: user?.userName,
            //     createdAt: new Date()
            //   }
            // });

            console.log(
              'Stock and inventory detail processed:',
              newDetailRecord
            );
          }
        });

        res.status(httpStatus.CREATED).json({
          status: 200,
          message: 'Stock and inventory records successfully processed'
        });
      } catch (err) {
        console.log(err, 'Error while processing stock records');
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: 'Internal server error' });
      }
    }
  );
};

/**
 * Handles Inventory Full Data
 * @param _req
 * @param res
 * @returns
 */
export const handleInventoryData = async (req: Request, res: Response) => {
  try {
    enum Inventory_status {
      pending = 'pending',
      closed = 'closed'
    }

    // Validate if the string is a valid enum value
    const inventoryStatus =
      req.params['status'] === 'pending' || req.params['status'] === 'closed'
        ? (req.params['status'] as Inventory_status)
        : undefined;

    // Use inventoryStatus in your Prisma query
    const invCount = await prismaClient.inventory.count({
      where: {
        ...(inventoryStatus ? { status: inventoryStatus } : {}) // Conditionally include 'status'
      }
    });

    if (invCount === 0) {
      const emptyOutput = {
        data: []
      };
      return res
        .status(httpStatus.OK)
        .json({ message: 'Inventory List', data: emptyOutput });
    }
    const invData = await prismaClient.inventory.findMany({
      where: {
        status: 'pending'
      }
    });
    const formatOutput = {
      data: invData
    };
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Inventory List',
      data: formatOutput
    });
  } catch (error) {
    console.error('Error fetching Product Taxes:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while fetching the Product Taxes'
    });
  }
};

/**
 * Handles Get Procduct Taxes Info Based on Id
 * @param req
 * @param res
 * @returns
 */
export const handleInventoryById = async (req: Request, res: Response) => {
  const invId: number = req.params['id'] ? parseInt(req.params['id']) : 0;
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);
  // evaluate jwt
  try {
    const taxInfo = await prismaClient.inventory.findUnique({
      where: {
        id: invId
      },
      include: {
        inventoryDetails: true
      }
    });
    if (!taxInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Inventory Not Found' });
    }
    return res.json({ status: 200, data: taxInfo });
  } catch (err) {
    console.error('Error while fetching Inventory:', err);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching Inventory' });
  }
};

/**
 * Handles Inventory Update
 * @param req
 * @param res
 * @returns
 */
export const handleInventoryUpdate = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    const token: string | undefined = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

    const {
      id,
      invoiceDate,
      invoiceNumber,
      inventoryAmount,
      customCharges,
      shippingCharges,
      otherCharges,
      status,
      inventoryId,
      partialAmount,
      inrAmount,
      usdAmount
    } = req.body;

    if (
      !id ||
      !invoiceDate ||
      !invoiceNumber ||
      !inventoryAmount ||
      !status ||
      !inventoryId ||
      !partialAmount
    ) {
      console.error('Missing required fields:', {
        id,
        invoiceDate,
        invoiceNumber,
        inventoryAmount,
        status,
        inventoryId,
        partialAmount,
        inrAmount,
        usdAmount,
        customCharges,
        shippingCharges,
        otherCharges
      });
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'Missing required fields' });
    }

    verify(
      token,
      config.jwt.refresh_token.secret,
      // eslint-disable-next-line n/handle-callback-err
      async (err: unknown, payload: JwtPayload) => {
        console.log(err, 'err');
        const user = await prismaClient.user.findUnique({
          where: {
            id: payload.userID
          }
        });

        if (!user) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json({ error: 'User Info Not Found' });
        }

        // Insert InventoryDetails record
        const updateInventory = await prismaClient.inventoryDetails.create({
          data: {
            inventoryId,
            partialAmount: parseFloat(partialAmount),
            inrAmount: parseFloat(inrAmount) ?? 0,
            usdAmount: parseFloat(usdAmount) ?? 0,
            invoiceDate: new Date(invoiceDate),
            createdBy: user?.userName,
            createdAt: new Date()
          }
        });

        // Return a success message
        return res.status(httpStatus.OK).json({
          status: 200,
          message: 'Inventory updated successfully',
          data: updateInventory
        });
      }
    );
  } catch (error) {
    console.error('Error updating Product Taxes:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while updating the Product Taxes'
    });
  }
};

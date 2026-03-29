import express, { type Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import compressFilter from './utils/compressFilter.util';
import { adminproductRouter } from './routes/v1';
import isAuth from './middleware/isAuth';
import { errorHandler } from './middleware/errorHandler';
import config from './config/config';
import authLimiter from './middleware/authLimiter';
import { xssMiddleware } from './middleware/xssMiddleware';
import helmet from 'helmet';
import bodyParser from 'body-parser';
// import multer from 'multer';
import path from 'path';
const app: Express = express();
// Helmet is used to secure this app by configuring the http-header
app.use(helmet());

// Increase the payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Increase the payload size limit for body-parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(xssMiddleware());

app.use(cookieParser());

// Compression is used to reduce the size of the response body
app.use(compression({ filter: compressFilter }));

app.use(
  cors({
    // origin is given a array if we want to have multiple origins later
    origin:
      config.cors.cors_origin === '*'
        ? '*'
        : String(config.cors.cors_origin).split('|'),
    credentials: true
  })
);

if (config.node_env === 'production') {
  app.use('/api/v1/auth', authLimiter);
}
app.use('/api/v1/adminproduct', adminproductRouter);
app.use('/api/v1/', adminproductRouter);

app.get('/secret', isAuth, (_req, res) => {
  res.json({
    message: 'You can see me'
  });
});

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

app.use(errorHandler);

export default app;

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger.js';
import { vectorStoreService } from './services/vectorStore.service.js';
import documentRoutes from './routes/document.routes.js';
import queryRoutes from './routes/query.routes.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', documentRoutes);
app.use('/api', queryRoutes);

app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
  await vectorStoreService.initialize();
});
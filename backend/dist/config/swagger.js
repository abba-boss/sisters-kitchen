"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sisters Kitchen API',
            version: '1.0.0',
            description: 'Multi-vendor food marketplace REST API with real-time features',
            contact: {
                name: 'Sisters Kitchen Support',
                email: 'support@sisterskitchen.ng',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000/api',
                description: 'Development server',
            },
            {
                url: 'https://api.sisterskitchen.ng/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['customer', 'vendor', 'admin'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        discountPrice: { type: 'number' },
                        stock: { type: 'integer' },
                        images: { type: 'array', items: { type: 'string' } },
                        isAvailable: { type: 'boolean' },
                        isFeatured: { type: 'boolean' },
                        isFreshToday: { type: 'boolean' },
                        rating: { type: 'number' },
                        totalOrders: { type: 'integer' },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        orderNumber: { type: 'string' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
                        },
                        subtotal: { type: 'number' },
                        deliveryFee: { type: 'number' },
                        total: { type: 'number' },
                        deliveryAddress: { type: 'string' },
                        fulfillmentType: { type: 'string', enum: ['delivery', 'pickup'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Unauthorized - Please log in' },
                        },
                    },
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Forbidden - Access denied' },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Resource not found' },
                        },
                    },
                },
                ValidationError: {
                    description: 'Invalid request data',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Validation failed' },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Authentication', description: 'User authentication and registration' },
            { name: 'Products', description: 'Product management and browsing' },
            { name: 'Orders', description: 'Order creation and management' },
            { name: 'Payments', description: 'Payment processing with Paystack' },
            { name: 'Vendors', description: 'Vendor profiles and management' },
            { name: 'Reviews', description: 'Product and vendor reviews' },
            { name: 'Notifications', description: 'Real-time notifications' },
            { name: 'Analytics', description: 'Business analytics and reports' },
            { name: 'Admin', description: 'Administrative operations' },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map
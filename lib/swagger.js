import swaggerJSDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Roadmap Project API",
            version: "1.0.0",
            description: "API documentation for Roadmap Project",
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Local server",
            },
            {
                url: "https://roadmap-project-api-production.up.railway.app/",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: "apiKey",
                    in: "query",
                    name: "key",
                },
                CookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                },
            },
        },
        security: [
            { ApiKeyAuth: [] },
            { CookieAuth: [] },
        ],
    },
    apis: [
        "./controllers/*.js",
        "./routes/*.js",
    ],
};

export const swaggerSpec = swaggerJSDoc(options);

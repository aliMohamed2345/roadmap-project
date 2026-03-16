import swaggerJSDoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                url:
                    process.env.NODE_ENV === "production"
                        ? "https://roadmap-project-chi.vercel.app/"
                        : `http://localhost:${process.env.PORT || 3000}/`,
                description: "Server",
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
        security: [{ ApiKeyAuth: [] }, { CookieAuth: [] }],
    },

    apis: [
        path.resolve(__dirname, "../controllers/*.js"),
        path.resolve(__dirname, "../routes/*.js"),
    ],
};

export const swaggerSpec = swaggerJSDoc(options);

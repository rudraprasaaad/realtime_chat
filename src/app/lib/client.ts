import { treaty } from "@elysiajs/eden";
import { App } from "../api/[[...slugs]]/route";

export const client = treaty<App>("localhost:3000").api;

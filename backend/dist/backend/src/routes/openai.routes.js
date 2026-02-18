"use strict";
// ─── OpenAI Routes ─────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_controller_1 = require("../controllers/openai.controller");
const router = (0, express_1.Router)();
router.get('/billing', openai_controller_1.getOpenAiBilling);
exports.default = router;

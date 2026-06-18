"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveProvider = getActiveProvider;
exports.getActiveProviderName = getActiveProviderName;
const OllamaProvider_1 = __importDefault(require("./OllamaProvider"));
const GeminiProvider_1 = __importDefault(require("./GeminiProvider"));
function selectProvider() {
    const configured = (process.env.AI_PROVIDER || '').toLowerCase();
    if (configured === 'ollama')
        return OllamaProvider_1.default;
    if (configured === 'gemini')
        return GeminiProvider_1.default;
    return process.env.GEMINI_API_KEY ? GeminiProvider_1.default : OllamaProvider_1.default;
}
function getActiveProvider() {
    return selectProvider();
}
function getActiveProviderName() {
    return selectProvider() === GeminiProvider_1.default ? 'gemini' : 'ollama';
}
//# sourceMappingURL=ProviderFactory.js.map
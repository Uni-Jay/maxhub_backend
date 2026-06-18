"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveProvider = getActiveProvider;
exports.getActiveProviderName = getActiveProviderName;
const GeminiProvider_1 = __importDefault(require("./GeminiProvider"));
function getActiveProvider() {
    return GeminiProvider_1.default;
}
function getActiveProviderName() {
    return 'gemini';
}
//# sourceMappingURL=ProviderFactory.js.map
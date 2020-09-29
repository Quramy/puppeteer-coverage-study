"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function add(a, b) {
    return __awaiter(this, void 0, void 0, function* () {
        return a + b;
    });
}
function sub(a, b) {
    return a - b;
}
console.log(add(1, 2));
setTimeout(() => console.log(add(2, 3)), 10);
//# sourceMappingURL=script.js.map
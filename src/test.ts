import { KeyringController } from "./controllers/WalletController";

import { LocalStorage } from 'node-localstorage';

// 在测试文件顶部设置全局 localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = new LocalStorage('./scratch'); // 数据存储在 ./scratch 目录
}


const keyringController = new KeyringController();
keyringController.createNew();
keyringController.setPassword('123456');
keyringController.persistVault();
keyringController.restoreVault();
const keyrings = keyringController.getKeyrings();
console.log(keyrings);
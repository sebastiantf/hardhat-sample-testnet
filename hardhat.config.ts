import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  networks: {
    'arbitrum-goerli': {
      url: `https://arb-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId: 421613,
      accounts: {
        count: 10,
        mnemonic: process.env.MNEMONIC,
        path: "m/44'/60'/0'/0",
      },
    },
  },
};

export default config;

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("hardhat-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 30000000000, // 30 Gwei
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
    //覆盖率配置
    coverage: {
      enabled: true,
        exclude: [
            "node_modules",
            "coverage",
            "**/*d.ts"
        ]
    }
};

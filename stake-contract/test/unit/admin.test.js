const {expect} = require('chai');
const {deployWithPoolsFixture, deployContractsFixture} = require("../fixtures/deployment");
const {ethers, upgrades} = require("hardhat");

describe("管理员功能", function() {
   describe("池子管理", function() {
       it("应该正确添加ETH池", async function () {
           const {metaNodeStake, admin, constants} = await deployContractsFixture();
           const tx = await metaNodeStake.connect(admin).addPool(
               ethers.ZeroAddress,
               100,
               constants.MIN_DEPOSIT,
               constants.UNSTAKE_LOCKED_BLOCKS,
               false
           );

           const receipt = await tx.wait();
           console.log(receipt.logs[0].fragment.name);
           expect(receipt.logs[0].fragment.name).to.equal("AddPool")
       })
   });

   describe("参数配置", function() {

   });

   describe("暂停控制", function() {

   })
});
const {expect} = require('chai');
const {deployWithPoolsFixture, deployContractsFixture} = require("../fixtures/deployment");
const {ethers, upgrades} = require("hardhat");

describe("合约初始化", function (){
   it("应该正确初始化合约参数", async function() {
       const {metaNodeStake, metaNodeToken, constants} = await deployContractsFixture();
        expect(await metaNodeStake.startBlock()).to.equal(constants.START_BLOCK);
        expect(await metaNodeStake.endBlock()).to.equal(constants.END_BLOCK);
        expect(await metaNodeStake.MetaNodePerBlock()).to.equal(constants.META_NODE_PER_BLOCK);

        expect(await metaNodeStake.MetaNode()).to.equal(await metaNodeToken.getAddress());
   });

   it("应该设置正确的角色权限层级", async function() {
       const {metaNodeStake, owner, admin} = await deployContractsFixture();
       expect(await metaNodeStake.hasRole(await metaNodeStake.ADMIN_ROLE(), owner.address)).to.be.true;
       expect(await metaNodeStake.hasRole(await metaNodeStake.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
       expect(await metaNodeStake.hasRole(await metaNodeStake.UPGRADE_ROLE(), owner.address)).to.be.true;

       expect(await metaNodeStake.hasRole(await metaNodeStake.ADMIN_ROLE(), admin.address)).to.be.true;
       expect(await metaNodeStake.hasRole(await metaNodeStake.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.false;
       expect(await metaNodeStake.hasRole(await metaNodeStake.UPGRADE_ROLE(), admin.address)).to.be.false;
   })

    it("应该拒绝重复初始化", async function() {
        const {metaNodeStake, metaNodeToken, constants } = await deployContractsFixture();

        try {
            await metaNodeStake.initialize(
                await metaNodeToken.getAddress(),
                constants.START_BLOCK,
                constants.END_BLOCK,
                constants.META_NODE_PER_BLOCK
            );
            expect.fail("expected revert");
        }catch (error) {
            console.error("hello");
            console.log(error.message);
            expect(error.message).to.include("reverted with custom error 'InvalidInitialization()'");
        }
    })
});
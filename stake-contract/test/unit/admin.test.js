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
        it("应该更新池子权重", async function () {
            const {metaNodeStake, admin} = await deployWithPoolsFixture();
            const tx = await metaNodeStake.connect(admin).setPoolWeight(1, 300, false);

            const receipt = await tx.wait();
            console.log(receipt.logs[0].fragment.name);
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === "SetPoolWeight");
            //console.log(event);  args: Result(3) [ 1n, 300n, 400n ]
            expect(event.args.poolId).to.equal(1n);
            expect(event.args.poolWeight).to.equal(300n);
            const pool = await metaNodeStake.pool(1);
            expect(pool.poolWeight).to.equal(300n);
        })

       it("应该更新奖励参数", async function () {
            const {metaNodeStake, admin} = await deployContractsFixture();

            const newStartBlock = 200;
            const newEndBlock = 2000;
            const newPerBlock = ethers.parseEther("2");

            await metaNodeStake.connect(admin).setStartBlock(newStartBlock);
            await metaNodeStake.connect(admin).setEndBlock(newEndBlock);
            await metaNodeStake.connect(admin).setMetaNodePerBlock(newPerBlock);

            expect(await metaNodeStake.startBlock()).to.equal(newStartBlock);
            expect(await metaNodeStake.endBlock()).to.equal(newEndBlock);
            expect(await metaNodeStake.MetaNodePerBlock()).to.equal(newPerBlock);
       })
   });

   describe("暂停控制", function() {
        it("应该正确暂停和恢复提现", async function () {
            const {metaNodeStake, admin} = await deployContractsFixture();

            await metaNodeStake.connect(admin).pauseWithdraw();
            expect(await metaNodeStake.withdrawPaused()).to.be.true;

            await metaNodeStake.connect(admin).unpauseWithdraw();
            expect(await metaNodeStake.withdrawPaused()).to.be.false;
        });

        it("应该正确暂停和恢复领取奖励", async function () {
            const {metaNodeStake, admin} = await deployContractsFixture();

            await metaNodeStake.connect(admin).pauseClaim();
            expect(await metaNodeStake.claimPaused()).to.be.true;

            await metaNodeStake.connect(admin).unpauseClaim();
            expect(await metaNodeStake.claimPaused()).to.be.false;
        });
   })
});
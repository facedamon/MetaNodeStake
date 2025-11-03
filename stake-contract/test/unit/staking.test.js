const {expect} = require('chai');
const {deployWithPoolsFixture, deployContractsFixture} = require("../fixtures/deployment");
const {ethers, upgrades} = require("hardhat");

describe("质押功能", function() {
    describe("ETH质押", function() {
        it("应该允许质押ETH", async function() {
            const {metaNodeStake, user1 } = await deployWithPoolsFixture();

            const depositAmount = ethers.parseEther("1");
            const tx = await metaNodeStake.connect(user1).depositETH({
                value: depositAmount,
            });
            const receipt  = await tx.wait();

            const event = receipt.logs.find(log => log.fragment && log.fragment.name === "Deposit");
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.poolId).to.equal(0n);
            expect(event.args.amount).to.equal(depositAmount);
        })
    });

    describe("ERC20质押", function() {
        it("应该允许质押ERC20", async function() {
            const {metaNodeStake, user1 } = await deployWithPoolsFixture();

            const depositAmount = ethers.parseEther("100");
            const tx = await metaNodeStake.connect(user1).deposit(1, depositAmount);

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === "Deposit");
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.poolId).to.equal(1n);
            expect(event.args.amount).to.equal(depositAmount);

            const userInfo = await metaNodeStake.user(1, user1.address);
            console.log(userInfo);
            expect(userInfo.stAmount).to.equal(depositAmount);

        })

        it("应该拒绝未授权的ERC20质押", async function() {
            const {metaNodeStake, user4 } = await deployWithPoolsFixture();

            const depositAmount = ethers.parseEther("100");
            try {
                await metaNodeStake.connect(user4).deposit(1, depositAmount);
                expect.fail("expected revert")
            }catch (error) {
                console.error(error.message);
                expect(error.message).to.include("ERC20InsufficientAllowance");
            }
        })
    });

    describe("多用户质押", function() {
        it("应该正确处理多用户质押", async function() {
            const {metaNodeStake, user1, user2 } = await deployWithPoolsFixture();

            const amount1 = ethers.parseEther("100");
            const amount2 = ethers.parseEther("200");

            await metaNodeStake.connect(user1).deposit(1, amount1);
            await metaNodeStake.connect(user2).deposit(1, amount2);

            const pool = await metaNodeStake.pool(1);
            expect(pool.stTokenAmount).to.equal(amount1 + amount2);

            const userInfo1 = await metaNodeStake.user(1, user1.address);
            const userInfo2 = await metaNodeStake.user(1, user2.address);
            expect(userInfo1.stAmount).to.equal(amount1);
            expect(userInfo2.stAmount).to.equal(amount2);
        });
    })
})
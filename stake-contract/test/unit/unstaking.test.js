const { expect } = require("chai");
const { setupWithRewardsFixture } = require("../fixtures/pools");

describe("解除质押和提取", function () {
    describe("解除质押", function () {
        it("应该允许部分解除质押", async function () {
            const { metaNodeStake, user1 } = await setupWithRewardsFixture();

            const unstakeAmount = ethers.parseEther("50");

            const tx = await metaNodeStake.connect(user1).unstake(1, unstakeAmount);

            const receipt = await tx.wait();
            const event = receipt.logs.find(log =>
                log.fragment && log.fragment.name === "RequestUnstake"
            );
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.poolId).to.equal(1n);
            expect(event.args.amount).to.equal(unstakeAmount);

            const userInfo = await metaNodeStake.user(1, user1.address);
            expect(userInfo.stAmount).to.equal(ethers.parseEther("50")); // 100 - 50
        });

        it("应该拒绝过度解除质押", async function () {
            const { metaNodeStake, user1 } = await setupWithRewardsFixture();

            const excessiveAmount = ethers.parseEther("150");

            try {
                await metaNodeStake.connect(user1).unstake(1, excessiveAmount);
                expect.fail("Expected revert");
            } catch (error) {
                expect(error.message).to.include("Not enough staking token balance");
            }
        });
    });

    describe("提取代币", function () {
        it("应该允许提取已解锁代币", async function () {
            const { metaNodeStake, user1, testToken, constants } = await setupWithRewardsFixture();

            const unstakeAmount = ethers.parseEther("30");
            await metaNodeStake.connect(user1).unstake(1, unstakeAmount);

            // 推进区块直到解锁
            for (let i = 0; i < constants.UNSTAKE_LOCKED_BLOCKS + 1; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            const userBalanceBefore = await testToken.balanceOf(user1.address);
            const tx = await metaNodeStake.connect(user1).withdraw(1);

            const receipt = await tx.wait();
            const event = receipt.logs.find(log =>
                log.fragment && log.fragment.name === "Withdraw"
            );
            expect(event.args.amount).to.equal(unstakeAmount);

            const userBalanceAfter = await testToken.balanceOf(user1.address);
            expect(userBalanceAfter - userBalanceBefore).to.equal(unstakeAmount);
        });

        it("应该处理多个解锁请求", async function () {
            const { metaNodeStake, user1, testToken, constants } = await setupWithRewardsFixture();

            // 创建多个解除质押请求
            await metaNodeStake.connect(user1).unstake(1, ethers.parseEther("10"));

            // 推进一些区块
            for (let i = 0; i < 50; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            await metaNodeStake.connect(user1).unstake(1, ethers.parseEther("20"));

            // 推进到第一个请求解锁
            const blocksToAdvance = constants.UNSTAKE_LOCKED_BLOCKS - 50 + 1;
            for (let i = 0; i < blocksToAdvance; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            const [totalRequested, pendingWithdraw] = await metaNodeStake.withdrawAmount(1, user1.address);
            expect(pendingWithdraw).to.equal(ethers.parseEther("10")); // 只有第一个请求解锁

            // 提取
            await metaNodeStake.connect(user1).withdraw(1);

            const [remainingRequested, remainingPending] = await metaNodeStake.withdrawAmount(1, user1.address);
            expect(remainingRequested).to.equal(ethers.parseEther("20")); // 第二个请求还在锁定中
        });

        it("暂停时应该阻止提取", async function () {
            const { metaNodeStake, user1, admin, constants } = await setupWithRewardsFixture();

            await metaNodeStake.connect(user1).unstake(1, ethers.parseEther("10"));

            // 推进到解锁
            for (let i = 0; i < constants.UNSTAKE_LOCKED_BLOCKS + 1; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            await metaNodeStake.connect(admin).pauseWithdraw();

            try {
                await metaNodeStake.connect(user1).withdraw(1);
                expect.fail("Expected revert");
            } catch (error) {
                expect(error.message).to.include("withdraw is paused");
            }
        });
    });
});
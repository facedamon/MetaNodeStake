const {expect} = require('chai');
const {ethers, upgrades} = require("hardhat");
const { setupWithRewardsFixture } = require("../fixtures/pools");

describe("奖励计算", function() {
    it("应该正确计算待领取奖励", async function() {
        const {metaNodeStake, user1, user2} = await setupWithRewardsFixture();

        const pendingUser1 = await metaNodeStake.pendingMetaNode(1, user1.address);
        const pendingUser2 = await metaNodeStake.pendingMetaNode(1, user2.address);

        const currentBlock = await ethers.provider.getBlockNumber();
        //200
        console.log(currentBlock);

        const pool_ = await metaNodeStake.pool(1);
        //console.log("pool_=", pool_);
        console.log("pool[1].lastRewardBlock=", pool_.lastRewardBlock);

        const userInfo1 = await metaNodeStake.user(1, user1.address);
        console.log("userInfo1.stAmount[at pool1]=",userInfo1.stAmount);
        console.log("userInfo1.finishedMetaNode[at pool1]=",userInfo1.finishedMetaNode);
        console.log("userInfo1.pendingMetaNode[at pool1]=",userInfo1.pendingMetaNode);

        //计算过程
        //用户1:
        //multiplier = getMultiplier(pool_.lastRewardBlock, _blockNumber)
        //           = getMultiplier(100, 200)
        //           = (200-100)*0.1=10
        //MetaNodeForPool = multiplier * pool_.poolWeight / totalPoolWeight
        //                = 10*100/(100+100)
        //                = 5
        //accMetaNodePerST = accMetaNodePerST + MetaNodeForPool * (1 ether) / stSupply
        //                 = 0 + 5 / (100+200)
        //                 = 0.0166666666666667
        //user_.stAmount * accMetaNodePerST / (1 ether) - user_.finishedMetaNode + user_.pendingMetaNode
        //=100*0.0166666666666667-0+0=166666666666667

        console.log(pendingUser1, pendingUser2);
        expect(pendingUser2).to.be.gt(pendingUser1);
    })
})
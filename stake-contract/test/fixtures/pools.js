const {deployWithPoolsFixture} = require("./deployment");
const {ethers, upgrades} = require("hardhat");

//多用户质押固件
async function setupStakeUsersFixture() {
    const base = await deployWithPoolsFixture();

    const { metaNodeStake, user1, user2 } = base;

    //用户1质押到俩个池子
    await metaNodeStake.connect(user1).depositETH({
        value: ethers.parseEther("1")
    });
    await metaNodeStake.connect(user1).deposit(1, ethers.parseEther("100"));

    //用户2质押到ERC20池子
    await metaNodeStake.connect(user2).deposit(1, ethers.parseEther("200"));

    return base;
}

//演示奖励
async function setupWithRewardsFixture() {
    const base = await setupStakeUsersFixture();

    //推进到开始区块并积累奖励
    const currentBlock = await ethers.provider.getBlockNumber();
    if (currentBlock < base.constants.START_BLOCK) {
        const blocksToAdvance = base.constants.START_BLOCK - currentBlock;
        for (let i = 0; i < blocksToAdvance; i++) {
            //hardhat立即挖出新的区块
            await ethers.provider.send("evm_mine", []);
        }
    }

    //继续挖矿 累计一些奖励
    for (let i = 0; i < 100; i++) {
        await ethers.provider.send("evm_mine", []);
        //console.log("挖出第"+(i+1)+"个块");
    }
    return base;
}

module.exports = {
    setupStakeUsersFixture,
    setupWithRewardsFixture
};